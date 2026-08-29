import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Stepper } from "@/components/checkout/Stepper";
import { NavIcon } from "@/components/ui/Icon";
import { readSession } from "@/utils/storage";
import { formatAED, formatOrderTime, formatPhone, formatTable } from "@/utils/format";
import { getOrderConfirmation } from "@/api/order.api";
import type { PlacedOrder } from "@/types/cart.types";

const ORDER_KEY = "ff_last_order_v1";

export function ConfirmPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const stored = readSession<PlacedOrder | null>(ORDER_KEY, null);
    if (!stored) {
      navigate("/");
      return;
    }
    setOrder(stored);

    // Best-effort: confirm the order actually landed on the backend. The
    // locally-stored order (above) is what's shown either way — this
    // just double-checks silently and is safe to skip if it fails.
    if (stored.orderId) {
      getOrderConfirmation(stored.orderId).catch((err) => {
        console.error("Could not verify order confirmation", err);
      });
    }
  }, [navigate]);

  if (!order) return null;

  const customer = order.customer;

  return (
    <main className="page">
      <Header />

      <div className="confirm confirm--bg">
        <Stepper active="confirmation" />

        <section className="confirm__panel" aria-labelledby="confirm-title">
          <h1 id="confirm-title" className="confirm__title">
            Order Confirmed!
          </h1>
          <p className="confirm__thanks">Thank you for dining with us.</p>
          <p className="confirm__lead">
            Your order has been successfully placed. We've received your details and will have your order ready for
            you shortly.
          </p>
          <span className="checkout__ornament confirm__ornament" aria-hidden="true" />

          <dl className="confirm__card">
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="clipboard" />
                </span>
                <span>Order ID</span>
              </dt>
              <dd>{order.orderNo || order.id || "—"}</dd>
            </div>
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="clock" />
                </span>
                <span>Order Time</span>
              </dt>
              <dd>{formatOrderTime(order.createdAt)}</dd>
            </div>
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="table" />
                </span>
                <span>Table Number</span>
              </dt>
              <dd>{formatTable(customer.table)}</dd>
            </div>
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="phone" />
                </span>
                <span>Mobile Number</span>
              </dt>
              <dd>{formatPhone(customer.countryCode, customer.phone)}</dd>
            </div>
          </dl>

          <p className="confirm__relax">
            <span className="confirm__heart" aria-hidden="true">
              <NavIcon name="heart" />
            </span>
            <span>
              Sit back, relax and enjoy your experience.
              <span className="confirm__relax-accent"> Our team will take care of the rest!</span>
            </span>
          </p>

          <div className="confirm__actions">
            <Link to="/categories" className="btn btn-outline confirm__btn">
              <NavIcon name="home" />
              Back to Menu
            </Link>
            <button
              type="button"
              className="btn btn-primary confirm__btn"
              aria-expanded={showSummary}
              onClick={() => setShowSummary((s) => !s)}
            >
              <NavIcon name="clipboard" />
              View Order Summary
            </button>
          </div>

          {showSummary && (
            <div className="confirm__summary">
              <h2 className="confirm__summary-title">Order Summary</h2>
              <ul className="confirm__summary-list">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      <span className="qty">{item.qty}×</span>
                      {item.name}
                    </span>
                    <span>{formatAED(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="confirm__summary-total">
                <span>Total</span>
                <strong>{formatAED(order.total || 0)}</strong>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}