import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Stepper } from "@/components/checkout/Stepper";
import { NavIcon } from "@/components/ui/Icon";
import { readLocal } from "@/utils/storage";
import { formatAED, formatOrderTime, formatPhone, formatTable } from "@/utils/format";
import { getOrderConfirmation } from "@/api/order.api";
import type { PlacedOrder } from "@/types/cart.types";

const ORDER_KEY = "ff_last_order_v1";
const RESERVATION_KEY = "ff_last_reservation_v1";

interface StoredReservation {
  reservationNo?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  tableName?: string | null;
  createdAt: string;
  reservationTitle?: string;
  reservationDateTime?: string;
  guestName?: string;
  countryCode?: string;
  mobile?: string;
  returnTo?: string;
}

export function ConfirmPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [reservation, setReservation] = useState<StoredReservation | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const storedReservation = readLocal<StoredReservation | null>(RESERVATION_KEY, null);
    if (storedReservation) {
      setReservation(storedReservation);
      return;
    }

    const stored = readLocal<PlacedOrder | null>(ORDER_KEY, null);
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

  if (!reservation && !order) return null;

  if (reservation) {
    return (
      <main className="page">
        <Header />
        <div className="confirm confirm--bg">
          <Stepper active="confirmation" />
          <section className="confirm__panel" aria-labelledby="reservation-confirm-title">
            <h1 id="reservation-confirm-title" className="confirm__title">Reservation Confirmed!</h1>
            <p className="confirm__thanks">Thank you for choosing Desire Sheesha Lounge.</p>
            <p className="confirm__lead">
              Your reservation has been created successfully. A confirmation email has been sent to you.
            </p>
            <span className="checkout__ornament confirm__ornament" aria-hidden="true" />

            <dl className="confirm__card">
              <div className="confirm__row">
                <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="clipboard" /></span><span>Reservation No.</span></dt>
                <dd>{reservation.reservationNo || "—"}</dd>
              </div>
              <div className="confirm__row">
                <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="clipboard" /></span><span>Module</span></dt>
                <dd>{reservation.moduleName || "—"}</dd>
              </div>
              <div className="confirm__row">
                <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="table" /></span><span>Table</span></dt>
                <dd>{formatTable(reservation.tableName)}</dd>
              </div>
              <div className="confirm__row">
                <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="clock" /></span><span>Reservation Time</span></dt>
                <dd>{reservation.reservationDateTime ? formatOrderTime(reservation.reservationDateTime) : formatOrderTime(reservation.createdAt)}</dd>
              </div>
              <div className="confirm__row">
                <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="phone" /></span><span>Mobile Number</span></dt>
                <dd>{formatPhone(reservation.countryCode, reservation.mobile)}</dd>
              </div>
            </dl>

            <p className="confirm__relax">
              <span className="confirm__heart" aria-hidden="true"><NavIcon name="heart" /></span>
              <span>We look forward to welcoming you.</span>
            </p>
          
          </section>
        </div>
      </main>
    );
  }

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