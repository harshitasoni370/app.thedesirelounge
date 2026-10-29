import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { readLocal, writeLocal } from "@/utils/storage";
import { addCartItem, getCartItems, removeCartItem, updateCartQuantity } from "@/api/cart.api";
import { useSession } from "@/context/SessionContext";
import type { CartItem } from "@/types/cart.types";
import type { MenuItem } from "@/types/menu.types";

const CART_KEY = "ff_cart_v1";
const CART_ID_KEY = "ff_cart_id_v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  cartId: string | null;
  addToCart: (product: MenuItem, qty?: number) => void;
  rebuildServerCart: () => Promise<string | null>;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getTenantCartKey(companyId: string, branchId: string): string {
  return `${CART_KEY}:${encodeURIComponent(companyId)}:${encodeURIComponent(branchId)}`;
}

/**
 * The cart is optimistic-local-first: every action updates `items`
 * immediately so the UI never waits on the network, then mirrors the
 * change to the server via the Cart API in the background. If the
 * server call fails, the local copy is what the guest keeps seeing —
 * there's no rollback, since silently reverting a guest's own tap is
 * worse UX than occasionally being out of sync with the backend.
 *
 * `cartId` is created by the first successful `AddCart` call and
 * persisted; every later add/remove/update reuses it. It resets on
 * `clearCart()` (e.g. after an order is placed) so the next add starts
 * a fresh cart.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { session, websiteConfig, websiteConfigStatus } = useSession();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const hasQrContext =
    params.has("type") ||
    params.has("tableCode") ||
    (Boolean(params.get("companyId") || params.get("companyID") || params.get("uidCompanyId")) &&
      Boolean(params.get("branchId") || params.get("branchID") || params.get("uidBranchId")) &&
      Boolean(
        params.get("tableId") || params.get("tableID") || params.get("uidTableId") ||
        params.get("sessionId") || params.get("tableSessionId") || params.get("Table-Session-Id")
      ));
  const tenantCompanyId = hasQrContext
    ? session.source === "qr" ? session.companyId : null
    : websiteConfigStatus === "succeeded" ? websiteConfig?.companyId : null;
  const tenantBranchId = hasQrContext
    ? session.source === "qr" ? session.branchId : null
    : websiteConfigStatus === "succeeded" ? websiteConfig?.branchId : null;
  const storageKey =
    tenantCompanyId && tenantBranchId
      ? getTenantCartKey(tenantCompanyId, tenantBranchId)
      : null;
  const cartIdKey = storageKey ? `${storageKey}:${CART_ID_KEY}` : null;
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const cartIdByStorageKeyRef = useRef(new Map<string, string | null>());
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;
  const addQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!storageKey || !cartIdKey) {
      setItems([]);
      setCartId(null);
      setLoadedStorageKey(null);
      return;
    }

    const savedItems = readLocal(storageKey, [] as CartItem[]);
    const savedCartId = readLocal(cartIdKey, null as string | null);
    cartIdByStorageKeyRef.current.set(storageKey, savedCartId);
    setItems(savedItems);
    setCartId(savedCartId);
    setLoadedStorageKey(storageKey);
  }, [cartIdKey, storageKey]);

  useEffect(() => {
    if (!storageKey || loadedStorageKey !== storageKey) return;
    const urlCartId = new URLSearchParams(location.search).get("cartId");
    if (urlCartId && urlCartId !== cartId) {
      persistItems([], storageKey);
      persistCartId(urlCartId, storageKey);
    }
  }, [cartId, loadedStorageKey, location.search, storageKey]);

  const persistItems = (next: CartItem[], key = storageKey) => {
    if (!key) return;
    writeLocal(key, next);
    if (storageKeyRef.current === key) setItems(next);
  };

  const persistCartId = (next: string | null, key = storageKey) => {
    if (!key) return;
    cartIdByStorageKeyRef.current.set(key, next);
    writeLocal(`${key}:${CART_ID_KEY}`, next);
    if (storageKeyRef.current === key) {
      setCartId(next);
    }
  };

  // Re-hydrate from the server once, whenever we have a cartId but the
  // local copy is empty (e.g. returning to the site after closing the tab).
  useEffect(() => {
    if (!storageKey || loadedStorageKey !== storageKey || !cartId || items.length > 0) return;
    let cancelled = false;
    getCartItems(cartId, session.sessionId)
      .then((serverItems) => {
        if (!cancelled && serverItems.length > 0) persistItems(serverItems, storageKey);
      })
      .catch((err) => console.error("Could not load saved cart", err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, items.length, loadedStorageKey, session.sessionId, storageKey]);

  const addToCart = (product: MenuItem, qty = 1) => {
    if (!storageKey || loadedStorageKey !== storageKey) return;
    const activeItems = items;
    const existing = activeItems.find((i) => i.id === product.id);
    const next: CartItem[] = existing
      ? activeItems.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
      : [
          ...activeItems,
          {
            id: product.id,
            menuItemId: product.menuItemId || product.id,
            variant: product.variant,
            name: product.name,
            price: product.price,
            image: product.image,
            description: product.description || "",
            veg: product.veg,
            qty,
          },
        ];
    persistItems(next, storageKey);

    if (!session.companyId || !session.branchId) {
      console.warn("No session yet — item added locally only, not synced to server.");
      return;
    }

    const syncCartItem = async () => {
      const { cartId: newCartId, cartItemId } = await addCartItem({
        companyId: session.companyId!,
        branchId: session.branchId!,
        cartId: cartIdByStorageKeyRef.current.get(storageKey) ?? null,
        menuItemId: product.menuItemId || product.id,
        quantity: existing ? existing.qty + qty : qty,
        ...(product.variant ? { price: product.price } : {}),
      });
      if (newCartId && newCartId !== cartIdByStorageKeyRef.current.get(storageKey)) {
        persistCartId(newCartId, storageKey);
      }
      if (cartItemId) {
        setItems((prev) => {
          if (storageKeyRef.current !== storageKey) return prev;
          const updated = prev.map((i) => (i.id === product.id ? { ...i, cartItemId } : i));
          writeLocal(storageKey, updated);
          return updated;
        });
      }
    };

    addQueueRef.current = addQueueRef.current.then(syncCartItem).catch((err) => {
      console.error("Could not sync cart item", err);
    });
  };

  const rebuildServerCart = async (): Promise<string | null> => {
    if (!storageKey || loadedStorageKey !== storageKey) return null;
    let rebuiltCartId: string | null = null;
    const rebuildTask = addQueueRef.current.then(async () => {
      if (!session.companyId || !session.branchId || items.length === 0) return;

      persistCartId(null, storageKey);
      let rebuiltItems: CartItem[] = items.map((item) => ({ ...item, cartItemId: undefined }));
      persistItems(rebuiltItems, storageKey);

      for (let index = 0; index < rebuiltItems.length; index += 1) {
        const item = rebuiltItems[index];
        const result = await addCartItem({
          companyId: session.companyId!,
          branchId: session.branchId!,
          cartId: cartIdByStorageKeyRef.current.get(storageKey) ?? null,
          menuItemId: item.menuItemId || item.id,
          quantity: item.qty,
          ...(item.variant ? { price: item.price } : {}),
        });
        if (!result.cartId) throw new Error("Cart API did not return a cart ID");

        rebuiltCartId = result.cartId;
        persistCartId(result.cartId, storageKey);
        rebuiltItems = rebuiltItems.map((current, itemIndex) =>
          itemIndex === index ? { ...current, cartItemId: result.cartItemId || undefined } : current
        );
        persistItems(rebuiltItems, storageKey);
      }
    });

    addQueueRef.current = rebuildTask.then(() => undefined).catch((error) => {
      console.error("Could not rebuild server cart", error);
    });
    await rebuildTask;
    return rebuiltCartId;
  };

  const setQty = (productId: string, qty: number) => {
    if (!storageKey || loadedStorageKey !== storageKey) return;
    const item = items.find((i) => i.id === productId);
    const next = qty <= 0 ? items.filter((i) => i.id !== productId) : items.map((i) => (i.id === productId ? { ...i, qty } : i));
    persistItems(next, storageKey);

    if (!cartIdByStorageKeyRef.current.get(storageKey) || !item?.cartItemId) return;
    const activeCartId = cartIdByStorageKeyRef.current.get(storageKey)!;
    const call =
      qty <= 0 ? removeCartItem(activeCartId, item.cartItemId) : updateCartQuantity(activeCartId, item.cartItemId, qty);
    call.catch((err) => console.error("Could not sync quantity change", err));
  };

  const removeFromCart = (productId: string) => {
    if (!storageKey || loadedStorageKey !== storageKey) return;
    const item = items.find((i) => i.id === productId);
    persistItems(items.filter((i) => i.id !== productId), storageKey);

    const activeCartId = cartIdByStorageKeyRef.current.get(storageKey);
    if (!activeCartId || !item?.cartItemId) return;
    removeCartItem(activeCartId, item.cartItemId).catch((err) => console.error("Could not sync item removal", err));
  };

  const clearCart = () => {
    if (!storageKey || loadedStorageKey !== storageKey) return;
    persistItems([], storageKey);
    persistCartId(null, storageKey);
  };

  const activeItems = loadedStorageKey === storageKey ? items : [];
  const activeCartId = loadedStorageKey === storageKey ? cartId : null;
  const count = useMemo(() => activeItems.reduce((sum, i) => sum + i.qty, 0), [activeItems]);
  const total = useMemo(() => activeItems.reduce((sum, i) => sum + i.price * i.qty, 0), [activeItems]);

  const value: CartContextValue = {
    items: activeItems,
    count,
    total,
    cartId: activeCartId,
    addToCart,
    rebuildServerCart,
    setQty,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
