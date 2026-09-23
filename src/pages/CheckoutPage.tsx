import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Stepper } from "@/components/checkout/Stepper";
import { GuestTypeToggle } from "@/components/checkout/GuestTypeToggle";
import { NewGuestFields } from "@/components/checkout/NewGuestFields";
import { ReturningGuestSummary } from "@/components/checkout/ReturningGuestSummary";
import { BookingSummary } from "@/components/checkout/BookingSummary";
import { NavIcon } from "@/components/ui/Icon";
import { useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import { useToast } from "@/context/ToastContext";
import { generateOrderId } from "@/utils/format";
import { writeLocal } from "@/utils/storage";
import { placeOrder as placeOrderApi } from "@/api/order.api";
import { createReservation } from "@/api/reservation.api";
import { getCustomerByMobile } from "@/api/customer.api";
import {
  getReservationDetails,
  getLiveSportsDetails,
  getSelectedDetails,
  normalizeDob,
  isGuid,
  isValidPhone,
} from "@/utils/checkoutReservation";
import { useCheckoutParams } from "@/hooks/useCheckoutParams";
import { useReturningGuestSync } from "@/hooks/useReturningGuestSync";
import type { CheckoutInfo, GuestType, PlacedOrder } from "@/types/cart.types";
import type { ReservationApiRecord } from "@/types/api.types";
import {
  notifyWhatsApp,
  buildOrderWhatsAppMessage,
  buildReservationWhatsAppMessage,
} from "@/utils/whatsapp";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkDevice, selectReturningCustomer, selectDeviceId, selectCheckDeviceStatus } from "@/store/slices/qrContextSlice";

const ORDER_KEY = "ff_last_order_v1";
const RESERVATION_KEY = "ff_last_reservation_v1";

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { items, count, total, cartId, clearCart } = useCart();
  const { session, setTableNumber, deviceId: ctxDeviceId } = useSession();
  const { showToast } = useToast();

  const returningFromDevice = useAppSelector(selectReturningCustomer);
  const deviceStatus = useAppSelector(selectCheckDeviceStatus);
  const storeDeviceId = useAppSelector(selectDeviceId);
  const deviceId = storeDeviceId || ctxDeviceId || "";

  // checkDevice only auto-runs once per session (see SessionContext) and
  // its "isReturning" result gets cached in Redux. A "new" guest who just
  // placed their first order IS now a known customer in the backend, but
  // that cached result won't know it — so without this, going back to
  // order again in the same visit still shows "New Here". Call this right
  // after a successful order/reservation from the "new" tab to refresh it.
  const refreshDeviceRecognition = () => {
    if (guestType === "new" && deviceId && session.companyId) {
      dispatch(checkDevice({ deviceId, companyId: session.companyId }));
    }
  };

  // All URL-param reading + derived booking-type flags live here now.
  const p = useCheckoutParams(session, returningFromDevice);

  const isReturningGuestFromUrl =
    [p.readParam("guestType"), p.readParam("customerType")].some((v) => v?.toLowerCase() === "returning") ||
    p.readParam("returning") === "true" ||
    p.isReturningParam;

  const initialGuestType: GuestType =
    isReturningGuestFromUrl || Boolean(returningFromDevice) ? "returning" : "new";

  // Reservation deep link explicitly marked this guest as returning →
  // on submit we must fire BOTH the reservation API and (if the cart still
  // has items) the order API, in the same submit.
  const isReturningFromReservation = p.isReservationCheckout && p.isReturningParam;

  /*
   * Normal Order: New Here / Returning tabs visible.
   * Reservation: tabs hidden, New Guest form shown directly but
   * returning-customer fields pre-filled.
   */
  const [guestType, setGuestType] = useState<GuestType>(initialGuestType);

  const [name, setName] = useState(p.urlName || (returningFromDevice?.guestName ?? ""));
  const [countryCode, setCountryCode] = useState(p.urlCountryCode);
  const [phone, setPhone] = useState(p.urlPhone || (returningFromDevice?.mobile ?? ""));
  const [people, setPeople] = useState(p.urlPeople);
  const [table, setTable] = useState(p.urlTable || session.tableNumber || "");
  const [dob, setDob] = useState(p.urlDob || normalizeDob(returningFromDevice?.dateOfBirth ?? null));
  const [email, setEmail] = useState(p.urlEmail);
  const [reservationDate, setReservationDate] = useState(p.urlReservationDate);
  const [reservationTime, setReservationTime] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [momentName, setMomentName] = useState(p.urlMomentName);

  // Returning-guest fields (normal Order flow)
  const [phoneReturn, setPhoneReturn] = useState(p.urlPhone || (returningFromDevice?.mobile ?? ""));
  const [tableReturn, setTableReturn] = useState(p.urlTable || session.tableNumber || "");

  const { isLookingUpGuest, setIsLookingUpGuest, returningCustomer, lookedUpMobile } = useReturningGuestSync(
    returningFromDevice,
    session,
    guestType,
    countryCode,
    phoneReturn,
    deviceStatus,
    {
      setName,
      setCountryCode,
      setPhone,
      setPhoneReturn,
      setDob,
      setPeople,
      setTable,
      setTableReturn,
      setGuestType,
    }
  );
  useEffect(() => {
    if (returningFromDevice) {
      setGuestType("returning");
    }
  }, [returningFromDevice]);

  useEffect(() => {
    if (items.length === 0 && !p.isReservationCheckout && !p.hasDirectCart) {
      showToast("Add something delicious first");
      navigate("/categories");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.hasDirectCart, p.isReservationCheckout]);

  const saveReservationConfirmation = (
    record: ReservationApiRecord | null,
    checkout: CheckoutInfo,
    title: string
  ) => {
    writeLocal(ORDER_KEY, null);

    writeLocal(RESERVATION_KEY, {
      reservationNo:
        record?.reservationNo || record?.reservationId || record?.uidReservationId || record?.id || null,
      moduleId: record?.moduleId || p.reservationModuleId,
      moduleName: record?.moduleName || title,
      tableName: record?.tableName || checkout.table || session.tableName || session.tableNumber || null,
      createdAt: new Date().toISOString(),
      reservationTitle: title,
      reservationCategory: p.urlReservationCategory || "RESERVATION",
      returnTo: p.reservationReturnTo,
      reservationDateTime: `${reservationDate}T${reservationTime}:00+04:00`,
      guestName: checkout.name || "Guest",
      countryCode: checkout.countryCode,
      mobile: checkout.phone,
      deviceId,
    });
  };

  const placeOrder = async (checkout: CheckoutInfo) => {
    const defaultedDate = reservationDate || new Date().toISOString().split("T")[0];
    const defaultedTime = reservationTime || new Date().toTimeString().slice(0, 5);

    // Combined submit: reservation deep link said isReturning=true AND the
    // guest still has items in their cart → both APIs fire in this one
    // submit instead of only the reservation one.
    const isCombinedSubmit = isReturningFromReservation && items.length > 0 && Boolean(cartId);

    if (p.isReservationCheckout) {
      if (p.isOfferReservation && (!p.urlOfferId || !p.urlOfferName)) {
        showToast("The selected offer is no longer available");
        navigate("/offers");
        return;
      }

      const tableId = isGuid(session.tableId) ? session.tableId : p.readParam("tableId");
      const { category, title, extraDetails } = getReservationDetails({ ...p, momentName });

      try {
        const reservation = await createReservation(
          {
            companyId: p.reservationCompanyId,
            branchId: p.reservationBranchId,
            moduleId: p.reservationModuleId,
            reservationCategory: category,
            guestName: checkout.name || "Guest",
            countryCode: checkout.countryCode,
            mobile: checkout.phone,
            email,
            dateOfBirth: checkout.dob || "",
            guestCount: Number(checkout.people) || 1,
            reservationDateTime: `${defaultedDate}T${defaultedTime}:00+04:00`,
            reservationTitle: title,
            ...(isGuid(tableId) ? { tableId } : {}),
            specialRequest,
            deviceId,
            extraDetails,
          },
          p.reservationSessionId,
          deviceId
        );

        saveReservationConfirmation(reservation, checkout, title);

        notifyWhatsApp(
          buildReservationWhatsAppMessage({
            reservationTitle: title,
            guestName: checkout.name || "Guest",
            mobile: checkout.phone,
            countryCode: checkout.countryCode,
            reservationDateTime: `${defaultedDate} ${defaultedTime}`,
            table: checkout.table,
            peopleCount: checkout.people,
          })
        );

        if (!isCombinedSubmit) {
          refreshDeviceRecognition();
          showToast(`${title} reservation submitted successfully`);
          navigate("/confirm");
          return;
        }
        // Combined submit: reservation done, fall through to also place
        // the order below — no navigate/return yet.
      } catch (error) {
        console.error("Could not create reservation", error);
        showToast("Could not submit reservation. Please try again later.");
        return;
      }
    }

    // Regular food order — runs standalone for a normal cart checkout, or
    // as the second half of a combined reservation+order submit.
    if (items.length === 0) {
      if (p.isReservationCheckout) {
        // Combined submit but the cart emptied mid-flight — reservation
        // already succeeded above, nothing left to order.
        refreshDeviceRecognition();
        showToast("Reservation submitted successfully");
        navigate("/confirm");
        return;
      }
      showToast("Your cart is empty");
      navigate("/categories");
      return;
    }

    if (!cartId) {
      if (p.isReservationCheckout) {
        showToast("Reservation submitted successfully");
        navigate("/confirm");
        return;
      }
      showToast("Cart not ready yet — please wait a moment and try again");
      return;
    }

    const now = new Date();

    // Standalone order flow clears any stale reservation confirmation.
    // A combined submit must NOT do this — it would wipe out the
    // reservation confirmation we just saved above.
    if (!isCombinedSubmit) {
      writeLocal(RESERVATION_KEY, null);
    }

    const [firstName, ...rest] = (checkout.name || "Guest").trim().split(" ");

    let orderId: string | null = null;
    let orderNo: string | null = null;

    try {
      const result = await placeOrderApi({
        sessionId: p.reservationSessionId || session.sessionId,
        cartId,
        firstName: firstName || "Guest",
        lastName: rest.join(" ") || "",
        CountryCode: checkout.countryCode,
        mobile: checkout.phone,
        dob: checkout.dob,
        guestCount: Number(checkout.people) || 1,
        companyId: session.companyId,
        branchId: session.branchId,
        deviceId,
      });

      orderId = result.orderId;
      orderNo = result.orderNo;
    } catch (err) {
      console.error("Could not place order via API", err);
      showToast(
        isCombinedSubmit
          ? "Reservation submitted, but the order could not be placed. Please try again."
          : "Could not place order. Please try again later."
      );
      if (isCombinedSubmit) {
        // Reservation already went through — still take them to confirm.
        navigate("/confirm");
      }
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

    writeLocal(ORDER_KEY, order);

    if (checkout.table) {
      setTableNumber(checkout.table);
    }

    notifyWhatsApp(
      buildOrderWhatsAppMessage({
        orderNo,
        guestName: checkout.name || "Guest",
        mobile: checkout.phone,
        countryCode: checkout.countryCode,
        table: checkout.table,
        peopleCount: checkout.people,
      })
    );

    clearCart();
    refreshDeviceRecognition();

    if (isCombinedSubmit) {
      showToast("Reservation and order submitted successfully");
    }

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
      if (p.isReservationCheckout && (!reservationDate || !reservationTime)) {
        showToast("Select the reservation date and time");
        return;
      }
      if (!p.isLiveSportsReservation && !table.trim() && !p.readParam("tableId") && !session.tableId) {
        showToast("Enter your table number");
        return;
      }

      placeOrder({
        guestType: "new",
        name: name.trim(),
        countryCode,
        phone,
        people,
        table: p.isLiveSportsReservation ? "" : table.trim(),
        dob: dob || undefined,
        orderType: "dine-in",
        payment: "cod",
        deviceId,
      });

      return;
    }

    // Returning guest — no editable inputs, so fill any missing
    // reservation fields from current state before submit.
    const resolvedPhone = (returningCustomer?.mobile || phoneReturn).replace(/\D/g, "");
    const resolvedCountryCode = returningCustomer?.countryCode || countryCode;

    if (!isValidPhone(resolvedPhone, resolvedCountryCode)) {
      showToast("Enter a valid mobile number");
      return;
    }

    if (
      !p.isLiveSportsReservation &&
      !(tableReturn || session.tableNumber) &&
      !p.readParam("tableId") &&
      !session.tableId
    ) {
      showToast("Enter your table number");
      return;
    }

    if (!session.companyId) {
      showToast("Session not ready yet — please wait a moment and try again");
      return;
    }

    if (p.isReservationCheckout) {
      if (!reservationDate) setReservationDate(new Date().toISOString().split("T")[0]);
      if (!reservationTime) setReservationTime(new Date().toTimeString().slice(0, 5));
      if (!people) setPeople(returningCustomer?.guestCount ? String(returningCustomer.guestCount) : "1");
    }

    handleReturningGuestSubmit();
  };

  const handleReturningGuestSubmit = async () => {
    setIsLookingUpGuest(true);

    try {
      const mobile = phoneReturn.replace(/\D/g, "");

      let customer = returningCustomer;

      if (!customer && mobile) {
        customer = await getCustomerByMobile({
          countryCode,
          mobile,
          companyId: session.companyId!,
        });
      }

      if (!customer) {
        showToast("No account found for this number — try 'New Here' instead");
        return;
      }

      if (!customer) {
        showToast("No account found for this number — try 'New Here' instead");
        return;
      }
      await placeOrder({
        guestType: "returning",
        name: `${customer.firstName} ${customer.lastName}`.trim() || "Guest",
        countryCode: customer.countryCode || countryCode,
        phone: customer.mobile || phoneReturn,
        people: p.isReservationCheckout
          ? people || (customer.guestCount ? String(customer.guestCount) : undefined)
          : customer.guestCount
            ? String(customer.guestCount)
            : undefined,
        table: p.isLiveSportsReservation ? "" : tableReturn.trim(),
        dob: customer.dob ? normalizeDob(customer.dob) : undefined,
        orderType: "dine-in",
        payment: "cod",
        deviceId,
      });
    } catch (err) {
      console.error("Could not look up returning guest", err);
      showToast("Could not verify your number — please try again");
    } finally {
      setIsLookingUpGuest(false);
    }
  };

  const liveSportsDetails = getLiveSportsDetails(p);
  const selectedDetails = getSelectedDetails(p);

  return (
    <main className="page">
      <Header />

      <div className="checkout checkout--bg">
        <Stepper active="details" hidden={p.isReservationCheckout} />

        <header className="checkout__intro">
          <p className="checkout__eyebrow">Tell us a little</p>
          <h1 className="checkout__title">About You</h1>
          <p className="checkout__hint">Just a few details to complete your order.</p>
          <span className="checkout__ornament" aria-hidden="true" />
        </header>

        <BookingSummary
          isLiveSportsReservation={p.isLiveSportsReservation}
          isCustomMomentReservation={p.isCustomMomentReservation}
          isOfferReservation={p.isOfferReservation}
          liveSportsDetails={liveSportsDetails}
          selectedDetails={selectedDetails}
          momentName={momentName}
          onMomentNameChange={setMomentName}
          urlOfferName={p.urlOfferName}
          urlOfferPrice={p.urlOfferPrice}
          urlOfferDescription={p.urlOfferDescription}
        />

        <GuestTypeToggle guestType={guestType} onChange={setGuestType} />

        <form className="form-panel form-panel--checkout" onSubmit={handleSubmit} noValidate>
          {guestType === "new" ? (
            <NewGuestFields
              name={name}
              onNameChange={setName}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              phone={phone}
              onPhoneChange={setPhone}
              dob={dob}
              onDobChange={setDob}
              email={email}
              onEmailChange={setEmail}
              people={people}
              onPeopleChange={setPeople}
              table={table}
              onTableChange={setTable}
              reservationDate={reservationDate}
              onReservationDateChange={setReservationDate}
              reservationTime={reservationTime}
              onReservationTimeChange={setReservationTime}
              specialRequest={specialRequest}
              onSpecialRequestChange={setSpecialRequest}
              isReservationCheckout={p.isReservationCheckout}
              isLiveSportsReservation={p.isLiveSportsReservation}
              tableRequired={!session.tableId && !p.checkoutParams.get("tableId")}
            />
          ) : (
            <ReturningGuestSummary
              countryCode={countryCode}
              mobile={returningCustomer?.mobile || phoneReturn}
              table={tableReturn || session.tableNumber || ""}
              isLiveSportsReservation={p.isLiveSportsReservation}
              isReservationCheckout={p.isReservationCheckout}
              reservationDate={reservationDate}
              reservationTime={reservationTime}
            />
          )}

          <button type="submit" className="btn btn-primary btn-block btn-checkout" disabled={isLookingUpGuest}>
            {isLookingUpGuest
              ? "Checking…"
              : p.isOfferReservation
                ? "Reserve This Offer"
                : p.isReservationCheckout
                  ? "Reserve Session"
                  : "Complete Your Order"}
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