import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCustomerByMobile } from "@/api/customer.api";
import { getCustomerOrders, type CustomerOrder } from "@/api/order.api";
import { Header } from "@/components/layout/Header";
import { Loader } from "@/components/ui/StatusStates";
import { useSession } from "@/context/SessionContext";
import { useAppSelector } from "@/store/hooks";
import { selectCheckDeviceStatus, selectReturningCustomer } from "@/store/slices/qrContextSlice";
import type { PlacedOrder } from "@/types/cart.types";
import { formatAED, formatOrderTime, formatTable } from "@/utils/format";
import { readLocal } from "@/utils/storage";

const ORDER_KEY = "ff_last_order_v1";

export function OrdersPage() {
  const location = useLocation();
  const { session, websiteConfig } = useSession();
  const returningCustomer = useAppSelector(selectReturningCustomer);
  const deviceStatus = useAppSelector(selectCheckDeviceStatus);
  const [storedOrder] = useState<PlacedOrder | null>(() => readLocal<PlacedOrder | null>(ORDER_KEY, null));
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(Date.now());
  const resolvedCustomerId = useRef<string | null>(null);
  const refreshing = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const all = new URLSearchParams(location.search).get("all") === "true";
  const companyId = session.companyId || websiteConfig?.companyId || "";
  const customerId =
    returningCustomer?.customerId ||
    storedOrder?.customerId ||
    resolvedCustomerId.current ||
    "";
  const mobile = returningCustomer?.mobile || storedOrder?.customer.phone || "";
  const countryCode = returningCustomer?.countryCode || storedOrder?.customer.countryCode || "+971";

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      if (refreshing.current) return;
      refreshing.current = true;
      setLoading(true);
      setError(null);

      if (!companyId) {
        setError("Restaurant details are not available. Please reopen the menu and try again.");
        setLoading(false);
        refreshing.current = false;
        return;
      }

      if (!customerId && deviceStatus === "loading") {
        setLoading(false);
        refreshing.current = false;
        return;
      }

      try {
        let lookupCustomerId = customerId;
        if (!lookupCustomerId && mobile) {
          const customer = await getCustomerByMobile({
            companyId,
            countryCode,
            mobile: mobile.replace(/\D/g, ""),
          });
          lookupCustomerId = customer?.customerId || "";
          if (lookupCustomerId) resolvedCustomerId.current = lookupCustomerId;
        }

        if (cancelled) return;
        if (!lookupCustomerId) {
          setError(
            mobile
              ? "We could not find your customer profile. Please try again shortly."
              : "Place an order or scan your table QR to view your orders."
          );
          setOrders([]);
          return;
        }

        const result = await getCustomerOrders(companyId, lookupCustomerId, all);
        if (!cancelled) setOrders(result);
      } catch (loadError) {
        console.error("Could not load customer orders", loadError);
        if (!cancelled) {
          setError("Could not load your orders. Please check your connection and try again.");
          setOrders([]);
        }
      } finally {
        refreshing.current = false;
        if (!cancelled) setLoading(false);
      }
    };

    void loadOrders();
    const refreshInterval = window.setInterval(() => void loadOrders(), 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [all, companyId, countryCode, customerId, deviceStatus, mobile, refreshKey]);

  const localOrder = storedOrder && !all ? toCustomerOrder(storedOrder) : null;
  const displayedOrders = orders.length > 0 ? orders : localOrder ? [localOrder] : [];

  return (
    <main className="page">
      <Header />
      <div className="confirm confirm--bg orders-page">
        <header className="orders-page__header">
          <p className="orders-page__eyebrow">{all ? "Order History" : "Order Updates"}</p>
          <h1 className="confirm__title">{all ? "My Orders" : "Your Order"}</h1>
          <p className="confirm__lead">
            {all
              ? "View your previous and current orders."
              : "Your order details and preparation timing will appear here."}
          </p>
          <button
            type="button"
            className="btn btn-outline orders-page__refresh"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
          >
            Refresh orders
          </button>
        </header>

        {error && (
          <div className="orders-page__error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}

        {loading && displayedOrders.length === 0 && <Loader label="Loading your orders…" />}

        {displayedOrders.length > 0 && (
          <>
            {!all && orders.length === 0 && (
              <p className="orders-page__sync" role="status">
                Showing your order while the latest details sync.
              </p>
            )}
            <div className="customer-orders">
              {displayedOrders.map((order, index) => (
                <CustomerOrderCard key={`${order.orderId}-${index}`} order={order} now={now} />
              ))}
            </div>
          </>
        )}

        {!loading && !error && displayedOrders.length === 0 && (
          <section className="orders-page__empty">
            <h2>No orders yet</h2>
            <p>Your placed orders will appear here.</p>
            <Link to="/categories" className="btn btn-primary">Explore Menu</Link>
          </section>
        )}
      </div>
    </main>
  );
}

function CustomerOrderCard({ order, now }: { order: CustomerOrder; now: number }) {
  const acceptedAt = parseOrderDate(order.acceptedDateTime);
  const estimatedReadyAt =
    parseOrderDate(order.estimatedReadyDateTime) ??
    (acceptedAt != null && order.estimatedMinutes != null
      ? acceptedAt + order.estimatedMinutes * 60_000
      : null);
  const status = order.orderStatus || "Placed";
  const normalizedStatus = status.toUpperCase();
  const isCancelled = normalizedStatus.includes("CANCEL");
  const isReady = ["READY", "COMPLETED", "DELIVERED", "SERVED"].some((value) => normalizedStatus.includes(value));
  const isAccepted =
    !isCancelled &&
    (Boolean(order.acceptedDateTime) ||
      ["ACCEPT", "PREPAR", "READY", "COMPLETED", "DELIVERED", "SERVED"].some((value) =>
        normalizedStatus.includes(value)
      ));
  const remainingMs = estimatedReadyAt == null ? null : Math.max(0, estimatedReadyAt - now);
  const totalPreparationMs =
    order.estimatedMinutes != null
      ? order.estimatedMinutes * 60_000
      : acceptedAt != null && estimatedReadyAt != null
        ? Math.max(0, estimatedReadyAt - acceptedAt)
        : 0;
  const elapsedMs =
    acceptedAt == null ? 0 : Math.max(0, Math.min(totalPreparationMs, now - acceptedAt));
  const progress = totalPreparationMs > 0
    ? Math.min(100, Math.max(0, (elapsedMs / totalPreparationMs) * 100))
    : 0;

  return (
    <article className="customer-order">
      <header className="customer-order__header">
        <div>
          <p className="customer-order__label">Order number</p>
          <h2>{order.orderNo || order.orderId}</h2>
        </div>
        <span className={`customer-order__status${isAccepted ? " is-accepted" : ""}${isCancelled ? " is-cancelled" : ""}`}>
          {status}
        </span>
      </header>

      <section
        className={`customer-order__tracking${isAccepted ? " is-accepted" : ""}${isCancelled ? " is-cancelled" : ""}`}
        aria-live="polite"
      >
        {isCancelled ? (
          <>
            <strong>Order cancelled</strong>
            <span>This order will not be prepared.</span>
          </>
        ) : isReady ? (
          <>
            <strong>Your order is ready</strong>
            <span>Please enjoy your meal.</span>
          </>
        ) : isAccepted ? (
          <>
            <div className="customer-order__tracking-copy">
              <span className="customer-order__tracking-label">
                {remainingMs == null ? "Order accepted" : "Estimated time remaining"}
              </span>
              <strong className="customer-order__countdown">
                {remainingMs == null
                  ? "Being prepared"
                  : remainingMs === 0
                    ? "Ready soon"
                    : formatCountdown(remainingMs)}
              </strong>
              {estimatedReadyAt != null && (
                <span className="customer-order__ready-at">
                  Estimated ready at {formatDateTime(new Date(estimatedReadyAt).toISOString())}
                </span>
              )}
            </div>
            {remainingMs != null && (
              <div
                className="customer-order__progress"
                role="progressbar"
                aria-label="Order preparation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        ) : (
          <>
            <strong>Waiting for restaurant to accept</strong>
            <span>Your order was placed at {formatDateTime(order.orderDateTime)}. We’re checking for updates.</span>
          </>
        )}
      </section>

      <dl className="customer-order__details">
        <div>
          <dt>Placed</dt>
          <dd>{formatDateTime(order.orderDateTime)}</dd>
        </div>
        {order.acceptedDateTime && (
          <div>
            <dt>Accepted</dt>
            <dd>{formatDateTime(order.acceptedDateTime)}</dd>
          </div>
        )}
        {estimatedReadyAt != null && (
          <div>
            <dt>Estimated ready</dt>
            <dd>{formatDateTime(new Date(estimatedReadyAt).toISOString())}</dd>
          </div>
        )}
        {order.tableNo && (
          <div>
            <dt>Table</dt>
            <dd>{formatTable(order.tableNo)}</dd>
          </div>
        )}
      </dl>

      {order.items.length > 0 && (
        <ul className="customer-order__items">
          {order.items.map((item, index) => {
            const lineTotal = item.totalPrice ?? (
              item.unitPrice == null ? null : item.unitPrice * item.quantity
            );
            return (
              <li key={`${item.itemName}-${index}`}>
                <span><strong>{item.quantity}×</strong> {item.itemName}</span>
                <span>{lineTotal == null ? "—" : formatAED(lineTotal)}</span>
              </li>
            );
          })}
        </ul>
      )}

      {(order.grandTotal ?? order.subTotal) != null && (
        <div className="customer-order__total">
          <span>Total</span>
          <strong>{formatAED(order.grandTotal ?? order.subTotal ?? 0)}</strong>
        </div>
      )}
    </article>
  );
}

function toCustomerOrder(order: PlacedOrder): CustomerOrder {
  return {
    orderId: order.orderId || order.id,
    orderNo: order.orderNo || null,
    orderDateTime: order.createdAt,
    tableNo: order.tableNumber,
    countryCode: order.customer.countryCode,
    mobile: order.customer.phone,
    subTotal: order.total,
    orderStatus: "Placed",
    acceptedDateTime: null,
    estimatedMinutes: null,
    estimatedReadyDateTime: null,
    grandTotal: order.total,
    items: order.items.map((item) => ({
      itemName: item.name,
      quantity: item.qty,
      unitPrice: item.price,
      totalPrice: item.price * item.qty,
    })),
    isLocalOrder: true,
  };
}

function parseOrderDate(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const timestamp = new Date(hasTimezone ? normalized : `${normalized}Z`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatDateTime(value: string | null): string {
  const timestamp = parseOrderDate(value);
  return timestamp == null ? "—" : formatOrderTime(new Date(timestamp).toISOString());
}

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}
