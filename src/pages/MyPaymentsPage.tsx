import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerByMobile } from "@/api/customer.api";
import { getCustomerOrders, type CustomerOrder } from "@/api/order.api";
import { Header } from "@/components/layout/Header";
import { Loader } from "@/components/ui/StatusStates";
import { useSession } from "@/context/SessionContext";
import { useAppSelector } from "@/store/hooks";
import { selectReturningCustomer } from "@/store/slices/qrContextSlice";
import type { PlacedOrder } from "@/types/cart.types";
import { formatAED, formatOrderTime, formatTable } from "@/utils/format";
import { readLocal } from "@/utils/storage";

const ORDER_KEY = "ff_last_order_v1";

export function MyPaymentsPage() {
  const { session, websiteConfig } = useSession();
  const returningCustomer = useAppSelector(selectReturningCustomer);
  const [storedOrder] = useState<PlacedOrder | null>(() => readLocal<PlacedOrder | null>(ORDER_KEY, null));
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const companyId = session.companyId || websiteConfig?.companyId || "";
  const customerId = returningCustomer?.customerId || storedOrder?.customerId || "";
  const mobile = returningCustomer?.mobile || storedOrder?.customer.phone || "";
  const countryCode = returningCustomer?.countryCode || storedOrder?.customer.countryCode || "+971";

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      setLoading(true);
      setError(null);

      if (!companyId) {
        setOrders([]);
        setError("Restaurant details are not available. Please reopen the menu and try again.");
        setLoading(false);
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
        }

        if (cancelled) return;
        if (!lookupCustomerId) {
          setOrders([]);
          setError(
            mobile
              ? "We could not find a customer profile for this number."
              : "Place an order or return with the mobile number used for your order to view your payments."
          );
          return;
        }

        const customerOrders = await getCustomerOrders(companyId, lookupCustomerId, true);
        if (!cancelled) setOrders(customerOrders);
      } catch (loadError) {
        console.error("Could not load customer payment activity", loadError);
        if (!cancelled) {
          setOrders([]);
          setError("Could not load your payment activity. Please check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPayments();
    return () => { cancelled = true; };
  }, [companyId, countryCode, customerId, mobile, refreshKey]);

  const localOrderId = storedOrder?.orderId || storedOrder?.id;
  const localOrderNo = storedOrder?.orderNo;

  return (
    <main className="page">
      <Header />
      <div className="confirm confirm--bg payments-page">
        <header className="payments-page__header">
          <p className="orders-page__eyebrow">Your account</p>
          <h1 className="confirm__title">My Payments</h1>
          <p className="confirm__lead">Only payment activity for your customer profile is shown here.</p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
          >
            Refresh activity
          </button>
        </header>

        {error && (
          <div className="orders-page__error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button>
          </div>
        )}

        {loading && orders.length === 0 && <Loader label="Loading your payment activity…" />}

        {!loading && !error && orders.length === 0 && (
          <section className="orders-page__empty">
            <h2>No payment activity yet</h2>
            <p>When your order or payment details are available, they will appear here.</p>
            {storedOrder && <Link to="/pay-bill" className="btn btn-primary">View current bill</Link>}
          </section>
        )}

        {orders.length > 0 && (
          <div className="payments-list">
            {orders.map((order) => {
              const isCurrentOrder = Boolean(
                [localOrderId, localOrderNo].some((localId) =>
                  localId && [order.orderId, order.orderNo].includes(localId)
                )
              );
              const total = order.grandTotal ?? order.subTotal;

              return (
                <article className="payment-record" key={order.orderId}>
                  <header className="payment-record__header">
                    <div>
                      <p>Bill / Order</p>
                      <h2>{order.orderNo || order.orderId}</h2>
                    </div>
                    <span className="payment-record__status">
                      {order.paymentStatus || "Payment status unavailable"}
                    </span>
                  </header>
                  <dl>
                    <div><dt>Amount</dt><dd>{total == null ? "—" : formatAED(total)}</dd></div>
                    <div><dt>Table</dt><dd>{formatTable(order.tableNo)}</dd></div>
                    <div><dt>Method</dt><dd>{order.paymentMethod || "Not provided"}</dd></div>
                    <div><dt>Payment reference</dt><dd>{order.paymentReference || "—"}</dd></div>
                    <div><dt>Date</dt><dd>{order.orderDateTime ? formatOrderTime(order.orderDateTime) : "—"}</dd></div>
                  </dl>
                  {isCurrentOrder && (
                    <Link to="/pay-bill" className="btn btn-primary payment-record__action">
                      Choose a payment method
                    </Link>
                  )}
                  {!order.paymentStatus && (
                    <p className="payment-record__note">
                      The order service does not currently return a verified payment status.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
