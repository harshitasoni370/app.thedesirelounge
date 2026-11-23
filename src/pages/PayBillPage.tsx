import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MenuBack } from "@/components/layout/MenuBack";
import { NavIcon } from "@/components/ui/Icon";
import { formatAED, formatTable } from "@/utils/format";
import { readLocal } from "@/utils/storage";
import type { PlacedOrder } from "@/types/cart.types";

const ORDER_KEY = "ff_last_order_v1";

type PaymentMethod = "online" | "cash";

export function PayBillPage() {
  const [order] = useState<PlacedOrder | null>(() => readLocal<PlacedOrder | null>(ORDER_KEY, null));
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [message, setMessage] = useState("");

  if (!order) {
    return (
      <main className="page payment-page">
        <Header />
        <MenuBack to="/orders?all=false" label="Back to Order" />
        <section className="payment-empty">
          <span className="payment-empty__icon" aria-hidden="true"><NavIcon name="clipboard" /></span>
          <h1>Bill not available</h1>
          <p>Place an order first to view its payment options.</p>
          <Link to="/categories" className="btn btn-primary">Browse Menu</Link>
        </section>
      </main>
    );
  }

  const billNumber = order.orderNo || order.orderId || order.id;
  const table = order.tableNumber || order.customer.table;

  const handleContinue = () => {
    setMessage(
      method === "online"
        ? "AFS checkout is not connected yet. No payment has been taken. Please contact the restaurant or pay at the table."
        : "Cash at table selected. Please pay the restaurant team directly; this page has not recorded a payment."
    );
  };

  return (
    <main className="page payment-page">
      <Header />
      <MenuBack to="/orders?all=false" label="Back to Order" />

      <div className="payment-shell">
        <header className="payment-heading">
          <p className="checkout__eyebrow">Secure checkout</p>
          <h1>Pay your bill</h1>
          <p>Choose how you would like to settle your dine-in order.</p>
          <span className="checkout__ornament" aria-hidden="true" />
        </header>

        <section className="payment-bill" aria-label="Bill details">
          <div className="payment-bill__top">
            <span>Amount due</span>
            <strong>{formatAED(order.total)}</strong>
          </div>
          <dl>
            <div><dt>Bill / Order</dt><dd>{billNumber}</dd></div>
            <div><dt>Table</dt><dd>{formatTable(table)}</dd></div>
          </dl>
        </section>

        <fieldset className="payment-methods">
          <legend>Payment method</legend>
          <label className={`payment-method${method === "online" ? " is-selected" : ""}`}>
            <input
              type="radio"
              name="payment-method"
              value="online"
              checked={method === "online"}
              onChange={() => { setMethod("online"); setMessage(""); }}
            />
            <span className="payment-method__icon" aria-hidden="true">↗</span>
            <span className="payment-method__copy">
              <strong>Pay online</strong>
              <small>Card and other secure options via AFS</small>
            </span>
            <span className="payment-method__tag">AFS</span>
          </label>

          <label className={`payment-method${method === "cash" ? " is-selected" : ""}`}>
            <input
              type="radio"
              name="payment-method"
              value="cash"
              checked={method === "cash"}
              onChange={() => { setMethod("cash"); setMessage(""); }}
            />
            <span className="payment-method__icon" aria-hidden="true">د.إ</span>
            <span className="payment-method__copy">
              <strong>Cash at table</strong>
              <small>Pay the restaurant team in person</small>
            </span>
          </label>
        </fieldset>

        {message && <p className="payment-message" role="status">{message}</p>}

        <button type="button" className="btn btn-primary btn-block payment-submit" onClick={handleContinue}>
          {method === "online" ? `Pay ${formatAED(order.total)}` : "Choose cash at table"}
          <span aria-hidden="true">→</span>
        </button>
        <p className="payment-disclaimer">
          These payment options are a screen preview. Admin-configured options and online payments will be enabled after the payment APIs are connected.
        </p>

        <section className="payment-order-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                <span>{item.qty} × {item.name}</span>
                <span>{formatAED(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="payment-order-summary__total">
            <span>Total</span><strong>{formatAED(order.total)}</strong>
          </div>
        </section>
        <Link to="/payments" className="payment-history-link">View my payment activity</Link>
      </div>
    </main>
  );
}
