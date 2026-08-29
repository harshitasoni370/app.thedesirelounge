import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

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
  const { session } = useSession();
  const [items, setItems] = useState<CartItem[]>(() => readLocal(CART_KEY, [] as CartItem[]));
  const [cartId, setCartId] = useState<string | null>(() => readLocal(CART_ID_KEY, null as string | null));

  const persistItems = (next: CartItem[]) => {
    setItems(next);
    writeLocal(CART_KEY, next);
  };

  const persistCartId = (next: string | null) => {
    setCartId(next);
    writeLocal(CART_ID_KEY, next);
  };

  // Re-hydrate from the server once, whenever we have a cartId but the
  // local copy is empty (e.g. returning to the site after closing the tab).
  useEffect(() => {
    if (!cartId || items.length > 0) return;
    let cancelled = false;
    getCartItems(cartId)
      .then((serverItems) => {
        if (!cancelled && serverItems.length > 0) persistItems(serverItems);
      })
      .catch((err) => console.error("Could not load saved cart", err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  const addToCart = (product: MenuItem, qty = 1) => {
    const existing = items.find((i) => i.id === product.id);
    const next: CartItem[] = existing
      ? items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
      : [
          ...items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            description: product.description || "",
            veg: product.veg,
            qty,
          },
        ];
    persistItems(next);

    if (!session.companyId || !session.branchId) {
      console.warn("No session yet — item added locally only, not synced to server.");
      return;
    }

    addCartItem({
      companyId: session.companyId,
      branchId: session.branchId,
      menuItemId: product.id,
      quantity: existing ? existing.qty + qty : qty,
    })
      .then(({ cartId: newCartId, cartItemId }) => {
        if (newCartId && newCartId !== cartId) persistCartId(newCartId);
        if (cartItemId) {
          setItems((prev) => {
            const updated = prev.map((i) => (i.id === product.id ? { ...i, cartItemId } : i));
            writeLocal(CART_KEY, updated);
            return updated;
          });
        }
      })
      .catch((err) => console.error("Could not sync cart item", err));
  };

  const setQty = (productId: string, qty: number) => {
    const item = items.find((i) => i.id === productId);
    const next = qty <= 0 ? items.filter((i) => i.id !== productId) : items.map((i) => (i.id === productId ? { ...i, qty } : i));
    persistItems(next);

    if (!cartId || !item?.cartItemId) return;
    const call =
      qty <= 0 ? removeCartItem(cartId, item.cartItemId) : updateCartQuantity(cartId, item.cartItemId, qty);
    call.catch((err) => console.error("Could not sync quantity change", err));
  };

  const removeFromCart = (productId: string) => {
    const item = items.find((i) => i.id === productId);
    persistItems(items.filter((i) => i.id !== productId));

    if (!cartId || !item?.cartItemId) return;
    removeCartItem(cartId, item.cartItemId).catch((err) => console.error("Could not sync item removal", err));
  };

  const clearCart = () => {
    persistItems([]);
    persistCartId(null);
  };

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  const value: CartContextValue = { items, count, total, cartId, addToCart, setQty, removeFromCart, clearCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
