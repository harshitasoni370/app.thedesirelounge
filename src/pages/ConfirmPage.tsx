import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DigitalLoungeHomeLink, Header } from "@/components/layout/Header";
import { Stepper } from "@/components/checkout/Stepper";
import { NavIcon } from "@/components/ui/Icon";
import { readLocal } from "@/utils/storage";
import { formatAED, formatOrderTime, formatPhone, formatTable } from "@/utils/format";
import { getOrderConfirmation } from "@/api/order.api";
import type { OrderConfirmation } from "@/types/api.types";
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
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [reservation, setReservation] = useState<StoredReservation | null>(null);
  const [refreshError, setRefreshError] = useState(false);
  const [now, setNow] = useState(Date.now());

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

    if (!stored.orderId) return;

    let cancelled = false;
    let refreshing = false;
    const refreshOrder = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const result = await getOrderConfirmation(stored.orderId!);
        if (!cancelled) {
          if (result) {
            setConfirmation(result);
            setRefreshError(false);
          } else {
            console.error("Order confirmation API returned no order details");
            setRefreshError(true);
          }
        }
      } catch (err) {
        console.error("Could not refresh order confirmation", err);
        if (!cancelled) setRefreshError(true);
      } finally {
        refreshing = false;
      }
    };

    void refreshOrder();
    const refreshInterval = window.setInterval(() => void refreshOrder(), 60_000);
    const clockInterval = window.setInterval(() => setNow(Date.now()), 1_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.clearInterval(clockInterval);
    };
  }, [navigate]);

  if (!reservation && !order) return null;

  if (reservation) {
    return (
      <main className="page">
        <div className="confirm-home">
          <DigitalLoungeHomeLink />
        </div>
        <div className="confirm confirm--bg">
          {/* <Stepper active="confirmation" /> */}
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
  const orderDetails = confirmation?.order;
  const orderStatus = orderDetails?.orderStatus?.toUpperCase() || "PLACED";
  const accepted = orderStatus === "ACCEPTED" || Boolean(orderDetails?.acceptedDateTime);
  const acceptedAt = parseOrderDate(orderDetails?.acceptedDateTime);
  const estimatedReadyAt = parseOrderDate(orderDetails?.estimatedReadyDateTime) ??
    (acceptedAt != null && orderDetails?.estimatedMinutes != null
      ? acceptedAt + orderDetails.estimatedMinutes * 60_000
      : null);
  const remainingMs = estimatedReadyAt == null ? null : Math.max(0, estimatedReadyAt - now);
  const apiItems = confirmation?.items ?? [];

  return (
    <main className="page">
      <Header />

      <div className="confirm confirm--bg">
        <Stepper active="confirmation" />

        <section className="confirm__panel" aria-labelledby="confirm-title">
          <h1 id="confirm-title" className="confirm__title">
            {orderStatus === "ACCEPTED" ? "Order Accepted" : "Order Received"}
          </h1>
          <p className="confirm__thanks">Thank you for dining with us.</p>
          <p className="confirm__lead">
            {accepted
              ? "The restaurant has accepted your order and is preparing it."
              : "Your order is placed. Please wait while the restaurant accepts it."}
          </p>
          <span className="checkout__ornament confirm__ornament" aria-hidden="true" />

          <section className={`order-tracking${accepted ? " is-accepted" : ""}`} aria-live="polite">
            <span className="order-tracking__status">
              <span className="order-tracking__dot" aria-hidden="true" />
              {orderDetails ? orderStatus : "CHECKING STATUS"}
            </span>
            {!accepted && (
              <p className="order-tracking__message">
                Your order has not been accepted by the restaurant yet. Please wait; we are checking for updates every minute.
              </p>
            )}
            {accepted && orderDetails?.estimatedMinutes != null && (
              <div className="order-tracking__eta">
                <span>{remainingMs == null ? "Estimated preparation time" : "Estimated time remaining"}</span>
                <strong>
                  {remainingMs == null
                    ? `About ${orderDetails.estimatedMinutes} minutes`
                    : remainingMs === 0
                      ? "Ready soon"
                      : formatRemainingTime(remainingMs)}
                </strong>
              </div>
            )}
            {accepted && orderDetails?.estimatedMinutes == null && (
              <p className="order-tracking__message">Your order is being prepared. The restaurant will update the estimated time shortly.</p>
            )}
            {refreshError && (
              <p className="order-tracking__error" role="status">
                Could not refresh order status. We will try again in a minute.
              </p>
            )}
          </section>

          <dl className="confirm__card">
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="clipboard" />
                </span>
                <span>Order ID</span>
              </dt>
              <dd>{orderDetails?.orderNo || order.orderNo || orderDetails?.orderId || order.orderId || order.id || "—"}</dd>
            </div>
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="clock" />
                </span>
                <span>Order Time</span>
              </dt>
              <dd>{formatOrderDisplayTime(orderDetails?.orderDateTime || order.createdAt)}</dd>
            </div>
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="table" />
                </span>
                <span>Table Number</span>
              </dt>
              <dd>{formatTable(orderDetails?.tableNo || customer.table)}</dd>
            </div>
            <div className="confirm__row">
              <dt>
                <span className="confirm__row-icon" aria-hidden="true">
                  <NavIcon name="phone" />
                </span>
                <span>Mobile Number</span>
              </dt>
              <dd>{formatPhone(orderDetails?.countryCode || customer.countryCode, orderDetails?.mobile || customer.phone)}</dd>
            </div>
            <div className="confirm__row">
              <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="clipboard" /></span><span>Order Status</span></dt>
              <dd>{orderDetails ? orderStatus : "Checking…"}</dd>
            </div>
            {orderDetails?.acceptedDateTime && (
              <div className="confirm__row">
                <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="clock" /></span><span>Accepted At</span></dt>
                <dd>{formatOrderDisplayTime(orderDetails.acceptedDateTime)}</dd>
              </div>
            )}
            {orderDetails?.estimatedReadyDateTime && (
              <div className="confirm__row">
                <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="clock" /></span><span>Estimated Ready</span></dt>
                <dd>{formatOrderDisplayTime(orderDetails.estimatedReadyDateTime)}</dd>
              </div>
            )}
            <div className="confirm__row">
              <dt><span className="confirm__row-icon" aria-hidden="true"><NavIcon name="clipboard" /></span><span>Subtotal</span></dt>
              <dd>{formatAED(orderDetails?.subTotal ?? order.total)}</dd>
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
            <a href="#order-summary" className="btn btn-primary confirm__btn">
              <NavIcon name="clipboard" />
              View Order
            </a>
          </div>

          <div className="confirm__summary" id="order-summary">
            <h2 className="confirm__summary-title">Order Summary</h2>
            <ul className="confirm__summary-list">
              {apiItems.length > 0
                ? apiItems.map((item, index) => (
                    <li key={`${item.itemName}-${index}`}>
                      <span><span className="qty">{item.quantity}×</span>{item.itemName}</span>
                      <span>{formatAED(item.totalPrice)}</span>
                    </li>
                  ))
                : order.items.map((item) => (
                    <li key={item.id}>
                      <span><span className="qty">{item.qty}×</span>{item.name}</span>
                      <span>{formatAED(item.price * item.qty)}</span>
                    </li>
                  ))}
            </ul>
            <div className="confirm__summary-total">
              <span>Total</span>
              <strong>{formatAED(orderDetails?.subTotal ?? order.total)}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function parseOrderDate(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value.includes(" ") ? value.replace(" ", "T") : value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatOrderDisplayTime(value?: string | null): string {
  const timestamp = parseOrderDate(value);
  return timestamp == null ? "—" : formatOrderTime(new Date(timestamp).toISOString());
}

function formatRemainingTime(milliseconds: number): string {
  const totalMinutes = Math.ceil(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}