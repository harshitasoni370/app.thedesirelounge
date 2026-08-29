import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Stepper } from "@/components/checkout/Stepper";
import { NavIcon } from "@/components/ui/Icon";
import { useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import { useToast } from "@/context/ToastContext";
import { generateOrderId } from "@/utils/format";
import { writeSession } from "@/utils/storage";
import { placeOrder as placeOrderApi } from "@/api/order.api";
import type { CheckoutInfo, GuestType, PlacedOrder } from "@/types/cart.types";
import { getCustomerByMobile } from "@/api/customer.api";

const ORDER_KEY = "ff_last_order_v1";

function isValidPhone(phone: string, countryCode: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (countryCode === "+971") return /^5\d{8}$/.test(digits);
  if (countryCode === "+91") return /^[6-9]\d{9}$/.test(digits);
  return digits.length >= 7 && digits.length <= 10;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, count, total, cartId, clearCart } = useCart();
  const { session, setTableNumber } = useSession();
  const { showToast } = useToast();

  const [guestType, setGuestType] = useState<GuestType>("new");

  // New guest fields
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState("");
  const [table, setTable] = useState(session.tableNumber || "");
  const [dob, setDob] = useState("");

  // Returning guest fields (OTP removed - phone + table only)
  const [phoneReturn, setPhoneReturn] = useState("");
  const [tableReturn, setTableReturn] = useState(session.tableNumber || "");
  const [isLookingUpGuest, setIsLookingUpGuest] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      showToast("Add something delicious first");
      navigate("/categories");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeOrder = async (checkout: CheckoutInfo) => {
    if (items.length === 0) {
      showToast("Your cart is empty");
      navigate("/categories");
      return;
    }

    // cartId is set once the first item is added to the cart.
    if (!cartId) {
      showToast("Cart not ready yet — please wait a moment and try again");
      return;
    }

    const now = new Date();
    const [firstName, ...rest] = (checkout.name || "Guest").trim().split(" ");
    let orderId: string | null = null;
    let orderNo: string | null = null;

    try {
      const result = await placeOrderApi({
        cartId,
        firstName: firstName || "Guest",
        lastName: rest.join(" ") || "",
        CountryCode: checkout.countryCode,
        mobile: checkout.phone,
        dob: checkout.dob,
        guestCount: Number(checkout.people) || 1,
      });
      orderId = result.orderId;
      orderNo = result.orderNo;
    } catch (err) {
      console.error("Could not place order via API", err);
      showToast("Could not place your order — please try again");
      return;
    }

    const order: PlacedOrder = {
      id: orderId || generateOrderId(now),
      createdAt: now.toISOString(),
      count,
      total,
      payment: checkout.payment,
      orderType: checkout.orderType,
      items: [...items],
      customer: checkout,
      companyId: session.companyId,
      branchId: session.branchId,
      tableNumber: checkout.table,
      orderId,
      orderNo,
      cartId,
    };

    writeSession(ORDER_KEY, order);
    if (checkout.table) setTableNumber(checkout.table);

    clearCart();
    navigate("/confirm");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (guestType === "new") {
      if (!name || name.trim().length < 2) {
        showToast("Please enter your full name");
        return;
      }
      if (!isValidPhone(phone, countryCode)) {
        showToast("Enter a valid mobile number");
        return;
      }
      if (!people) {
        showToast("Select number of guests");
        return;
      }
      if (!table.trim()) {
        showToast("Enter your table number");
        return;
      }
      placeOrder({
        guestType: "new",
        name: name.trim(),
        countryCode,
        phone,
        people,
        table: table.trim(),
        dob: dob || undefined,
        orderType: "dine-in",
        payment: "cod",
      });
    } else {
      if (!isValidPhone(phoneReturn, countryCode)) {
        showToast("Enter a valid mobile number");
        return;
      }
      if (!tableReturn.trim()) {
        showToast("Enter your table number");
        return;
      }
      if (!session.companyId) {
        showToast("Session not ready yet — please wait a moment and try again");
        return;
      }
      handleReturningGuestSubmit();
    }
  };

  // Looks up the returning guest's name via Customer/getcustomerbymobile
  // before placing the order — Cart/order needs a real firstName/lastName,
  // not the "Returning Guest" placeholder the old flow used.
  const handleReturningGuestSubmit = async () => {
    setIsLookingUpGuest(true);
    try {
      const customer = await getCustomerByMobile({
        countryCode,
        mobile: phoneReturn,
        companyId: session.companyId!,
      });

      if (!customer) {
        showToast("No account found for this number — try 'New Here' instead");
        return;
      }

      placeOrder({
        guestType: "returning",
        name: `${customer.firstName} ${customer.lastName}`.trim() || "Guest",
        countryCode,
        phone: phoneReturn,
        people: customer.guestCount ? String(customer.guestCount) : undefined,
        table: tableReturn.trim(),
        dob: customer.dob,
        orderType: "dine-in",
        payment: "cod",
      });
    } catch (err) {
      console.error("Could not look up returning guest", err);
      showToast("Could not verify your number — please try again");
    } finally {
      setIsLookingUpGuest(false);
    }
  };

  return (
    <main className="page">
      <Header />

      <div className="checkout checkout--bg">
        <Stepper active="details" />

        <header className="checkout__intro">
          <p className="checkout__eyebrow">Tell us a little</p>
          <h1 className="checkout__title">About You</h1>
          <p className="checkout__hint">Just a few details to complete your order.</p>
          <span className="checkout__ornament" aria-hidden="true" />
        </header>

        <div className="guest-toggle" role="group" aria-label="Guest type">
          <button
            type="button"
            className={`guest-toggle__btn${guestType === "new" ? " is-active" : ""}`}
            aria-pressed={guestType === "new"}
            onClick={() => setGuestType("new")}
          >
            <span className="guest-toggle__icon" aria-hidden="true">
              <NavIcon name="user-plus" />
            </span>
            <span className="guest-toggle__copy">
              <span className="guest-toggle__title">New Here</span>
              <span className="guest-toggle__sub">I'm a new guest.</span>
            </span>
          </button>
          <button
            type="button"
            className={`guest-toggle__btn${guestType === "returning" ? " is-active" : ""}`}
            aria-pressed={guestType === "returning"}
            onClick={() => setGuestType("returning")}
          >
            <span className="guest-toggle__icon" aria-hidden="true">
              <NavIcon name="user-return" />
            </span>
            <span className="guest-toggle__copy">
              <span className="guest-toggle__title">Returning</span>
              <span className="guest-toggle__sub">I've ordered here before.</span>
            </span>
          </button>
        </div>

        <form className="form-panel form-panel--checkout" onSubmit={handleSubmit} noValidate>
          {guestType === "new" ? (
            <div className="checkout-fields checkout-fields--grid">
              <div className="form-group">
                <label className="form-label" htmlFor="input-name">
                  Full Name
                </label>
                <div className="field-input">
                  <span className="field-input__icon" aria-hidden="true">
                    <NavIcon name="user" />
                  </span>
                  <input
                    id="input-name"
                    className="form-input"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

             

              <div className="form-group">
                <label className="form-label" htmlFor="input-phone">
                  Mobile Number
                </label>
                <div className="field-input field-input--phone">
                  <span className="field-input__icon" aria-hidden="true">
                    <NavIcon name="phone" />
                  </span>
                  <select
                    className="form-select form-select--code"
                    aria-label="Country code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input
                    id="input-phone"
                    className="form-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Enter your mobile number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

               <div className="form-group">
                <label className="form-label" htmlFor="input-dob">
                  Date of Birth
                </label>
                <div className="field-input">
                  <span className="field-input__icon" aria-hidden="true">
                    <NavIcon name="calendar" />
                  </span>
                  <input
                    id="input-dob"
                    className="form-input"
                    type="date"
                    autoComplete="bday"
                    max={new Date().toISOString().split("T")[0]}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-people">
                  Number of People
                </label>
                <div className="field-input">
                  <span className="field-input__icon" aria-hidden="true">
                    <NavIcon name="users" />
                  </span>
                  <select
                    id="input-people"
                    className="form-select form-select--full"
                    value={people}
                    onChange={(e) => setPeople(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select number of guests
                    </option>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n} Guest{n > 1 ? "s" : ""}
                      </option>
                    ))}
                    <option value="8">8+ Guests</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-table">
                  Table Number
                </label>
                <div className="field-input">
                  <span className="field-input__icon" aria-hidden="true">
                    <NavIcon name="table" />
                  </span>
                  <input
                    id="input-table"
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter your table number"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    required
                  />
                </div>
                <p className="form-help">You can find your table number on your table.</p>
              </div>
            </div>
          ) : (
            <div className="checkout-fields checkout-fields--stack">
              <div className="form-group">
                <label className="form-label" htmlFor="input-phone-return">
                  Mobile Number
                </label>
                <div className="field-input">
                  <span className="field-input__icon" aria-hidden="true">
                    <NavIcon name="phone" />
                  </span>
                  <select
                    className="form-select form-select--code"
                    aria-label="Country code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input
                    id="input-phone-return"
                    className="form-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Enter your mobile number"
                    maxLength={10}
                    value={phoneReturn}
                    onChange={(e) => setPhoneReturn(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-table-return">
                  Table Number
                </label>
                <div className="field-input">
                  <span className="field-input__icon" aria-hidden="true">
                    <NavIcon name="table" />
                  </span>
                  <input
                    id="input-table-return"
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter your table number"
                    value={tableReturn}
                    onChange={(e) => setTableReturn(e.target.value)}
                  />
                </div>
                <p className="form-help">You can find your table number on your table.</p>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-checkout" disabled={isLookingUpGuest}>
            {isLookingUpGuest ? "Checking…" : "Complete Your Order"}
            <span aria-hidden="true">→</span>
          </button>

          <p className="form-trust">
            <span className="form-trust__icon" aria-hidden="true">
              <NavIcon name="shield" />
            </span>
            <span>Your details are safe with us and will only be used to complete your dining experience.</span>
          </p>
        </form>
      </div>
    </main>
  );
}