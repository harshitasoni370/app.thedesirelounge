import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Stepper } from "@/components/checkout/Stepper";
import { NavIcon } from "@/components/ui/Icon";
import { useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import { useToast } from "@/context/ToastContext";
import { generateOrderId } from "@/utils/format";
import { writeLocal } from "@/utils/storage";
import { placeOrder as placeOrderApi } from "@/api/order.api";
import { createReservation } from "@/api/reservation.api";
import type { CheckoutInfo, GuestType, PlacedOrder } from "@/types/cart.types";
import type { ReservationApiRecord } from "@/types/api.types";
import { getCustomerByMobile } from "@/api/customer.api";

const ORDER_KEY = "ff_last_order_v1";
const RESERVATION_KEY = "ff_last_reservation_v1";

function isValidPhone(phone: string, countryCode: string): boolean {
  const digits = phone.replace(/\D/g, "");

  if (countryCode === "+971") {
    return /^5\d{8}$/.test(digits);
  }

  if (countryCode === "+91") {
    return /^[6-9]\d{9}$/.test(digits);
  }

  return digits.length >= 7 && digits.length <= 10;
}

function isGuid(value: string | null | undefined): value is string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { items, count, total, cartId, clearCart } = useCart();
  const { session, setTableNumber } = useSession();
  const { showToast } = useToast();

  const checkoutParams = new URLSearchParams(location.search);

  const reservationCompanyId =
    checkoutParams.get("companyId") ||
    session.companyId ||
    "0ffbe39e-abf8-4827-9107-1a04b39f3416";

  const reservationBranchId =
    checkoutParams.get("branchId") ||
    session.branchId ||
    "f4fb1d76-83a0-4965-86b5-63da28249dae";

  const reservationSessionId =
    checkoutParams.get("tableSessionId") ||
    checkoutParams.get("sessionId") ||
    session.sessionId;

  const reservationModuleId =
    checkoutParams.get("moduleId") ||
    "3e340f23-d842-47f0-98e8-b0d458dc22dd";

  const isSessionReservation = Boolean(
    checkoutParams.get("gameName") ||
      (checkoutParams.get("bookingType") &&
        checkoutParams.get("bookingType") !== "Table Reservation") ||
      checkoutParams.get("reservationCategory") === "EVENT" ||
      checkoutParams.get("reservationCategory") === "OFFER" ||
      checkoutParams.get("reservationCategory") === "EXCLUSIVE_OFFER" ||
      checkoutParams.get("reservationCategory") === "CUSTOM_MOMENT"
  );

  const isCustomMomentReservation =
    checkoutParams.get("bookingType") === "Custom Moment" ||
    Boolean(checkoutParams.get("momentId"));

  const isLiveSportsReservation =
    !isCustomMomentReservation &&
    (checkoutParams.get("reservationCategory") === "EVENT" ||
      checkoutParams.get("category") === "EVENT");

  const isOfferReservation =
    checkoutParams.get("reservationCategory") === "OFFER" ||
    checkoutParams.get("reservationCategory") === "EXCLUSIVE_OFFER";

  const isTableReservation =
    checkoutParams.get("reservationCategory") === "TABLE_RESERVATION" ||
    checkoutParams.get("category") === "TABLE_RESERVATION";

  const isReservationCheckout =
    isSessionReservation || isTableReservation;

  const hasDirectCart = Boolean(checkoutParams.get("cartId"));

  const urlName =
    checkoutParams.get("guestName") ||
    checkoutParams.get("customerName") ||
    "";

  const urlPhone =
    checkoutParams.get("mobile") ||
    checkoutParams.get("phone") ||
    "";

  const urlCountryCode =
    checkoutParams.get("countryCode") ||
    checkoutParams.get("CountryCode") ||
    "+971";

  const urlPeople =
    checkoutParams.get("guestCount") ||
    checkoutParams.get("people") ||
    "";

  const urlDob =
    checkoutParams.get("dob") ||
    checkoutParams.get("dateOfBirth") ||
    "";

  const urlEmail = checkoutParams.get("email") || "";

  const urlReservationDate =
    checkoutParams.get("dateStart") || "";

  const urlMomentName =
    checkoutParams.get("momentName") ||
    checkoutParams.get("eventName") ||
    checkoutParams.get("event") ||
    "";

  const urlMomentId =
    checkoutParams.get("momentId") || "";

  const urlMomentPrice =
    checkoutParams.get("price") || "";

  const urlGameName =
    checkoutParams.get("gameName") || "";

  const urlGameId =
    checkoutParams.get("gameId") || "";

  const urlOfferId =
    checkoutParams.get("offerId") || "";

  const urlOfferName =
    checkoutParams.get("offerName") || "";

  const urlOfferDescription =
    checkoutParams.get("offerDescription") || "";

  const urlOfferPrice =
    checkoutParams.get("offerPrice") || "";

  const isReturningGuest = [
    checkoutParams.get("guestType"),
    checkoutParams.get("customerType"),
  ].some(
    (value) => value?.toLowerCase() === "returning"
  ) || checkoutParams.get("returning") === "true";

  const reservationReturnTo =
    checkoutParams.get("returnTo") ||
    (isOfferReservation ? "/offers" : "/categories");

  const liveSportsDetails: Array<[string, string]> =
    isLiveSportsReservation
      ? [
          [
            "Sport",
            checkoutParams.get("sportCategory") ||
              checkoutParams.get("sport") ||
              "",
          ],
          [
            "Event",
            checkoutParams.get("eventName") ||
              checkoutParams.get("event") ||
              "",
          ],
          [
            "Competition",
            checkoutParams.get("competitionName") || "",
          ],
          [
            "Teams",
            [
              checkoutParams.get("teamHome"),
              checkoutParams.get("teamAway"),
            ]
              .filter(Boolean)
              .join(" vs "),
          ],
          ["Venue", checkoutParams.get("venue") || ""],
          ["Date", checkoutParams.get("dateStart") || ""],
          ["UAE time", checkoutParams.get("uaeTime") || ""],
          ["Channel", checkoutParams.get("channel") || ""],
        ].filter(([, value]) => value) as Array<[string, string]>
      : [];

  const urlTable =
    checkoutParams.get("tableNumber") ||
    checkoutParams.get("tableNo") ||
    checkoutParams.get("tableName") ||
    checkoutParams.get("name") ||
    "";

  const selectedDetails: Array<[string, string]> =
    !isTableReservation && isCustomMomentReservation
      ? [
          ["Type", "Custom Moment"],
          ["Name", urlMomentName],
          [
            "Price",
            urlMomentPrice ? `AED ${urlMomentPrice}` : "",
          ],
        ]
      : !isTableReservation && urlGameName
      ? [
          [
            "Type",
            checkoutParams.get("categoryName") ||
              "Gaming Session",
          ],
          ["Game", urlGameName],
          [
            "Players",
            checkoutParams.get("players") || "",
          ],
          [
            "Duration",
            checkoutParams.get("duration") || "",
          ],
          [
            "Difficulty",
            checkoutParams.get("difficulty") || "",
          ],
        ]
      : !isTableReservation && isOfferReservation
      ? [
          ["Type", "Exclusive Offer"],
          ["Offer", urlOfferName],
          ["Price", urlOfferPrice],
        ]
      : !isTableReservation &&
        checkoutParams.get("bookingType")
      ? [
          [
            "Type",
            checkoutParams.get("bookingType") ||
              "Reservation",
          ],
          [
            "Name",
            checkoutParams.get("eventName") ||
              checkoutParams.get("reservationTitle") ||
              "",
          ],
          [
            "Price",
            urlMomentPrice
              ? `AED ${urlMomentPrice}`
              : "",
          ],
        ]
      : [];

  /*
   * IMPORTANT:
   * Normal Order:
   *   New Here / Returning tabs visible.
   *
   * Reservation:
   *   Tabs hidden.
   *   New Guest form shown directly.
   */
  const [guestType, setGuestType] = useState<GuestType>(
    isReturningGuest ? "returning" : "new"
  );

  // New guest fields
  const [name, setName] = useState(urlName);
  const [countryCode, setCountryCode] =
    useState(urlCountryCode);
  const [phone, setPhone] = useState(urlPhone);
  const [people, setPeople] = useState(urlPeople);
  const [table, setTable] = useState(
    urlTable || session.tableNumber || ""
  );
  const [dob, setDob] = useState(urlDob);
  const [email, setEmail] = useState(urlEmail);
  const [reservationDate, setReservationDate] =
    useState(urlReservationDate);
  const [reservationTime, setReservationTime] =
    useState("");
  const [specialRequest, setSpecialRequest] =
    useState("");
  const [momentName, setMomentName] =
    useState(urlMomentName);

  // Returning guest fields
  const [phoneReturn, setPhoneReturn] =
    useState(urlPhone);

  const [tableReturn, setTableReturn] = useState(
    urlTable || session.tableNumber || ""
  );

  const [isLookingUpGuest, setIsLookingUpGuest] =
    useState(false);

  const [returningCustomer, setReturningCustomer] =
    useState<Awaited<
      ReturnType<typeof getCustomerByMobile>
    >>(null);

  const [lookedUpMobile, setLookedUpMobile] =
    useState("");

  const saveReservationConfirmation = (
    record: ReservationApiRecord | null,
    checkout: CheckoutInfo,
    title: string
  ) => {
    writeLocal(ORDER_KEY, null);

    writeLocal(RESERVATION_KEY, {
      reservationNo:
        record?.reservationNo ||
        record?.reservationId ||
        record?.uidReservationId ||
        record?.id ||
        null,

      moduleId:
        record?.moduleId || reservationModuleId,

      moduleName:
        record?.moduleName || title,

      tableName:
        record?.tableName ||
        checkout.table ||
        session.tableName ||
        session.tableNumber ||
        null,

      createdAt: new Date().toISOString(),

      reservationTitle: title,

      reservationCategory:
        checkoutParams.get("reservationCategory") ||
        "RESERVATION",

      returnTo: reservationReturnTo,

      reservationDateTime:
        `${reservationDate}T${reservationTime}:00+04:00`,

      guestName:
        checkout.name || "Guest",

      countryCode: checkout.countryCode,

      mobile: checkout.phone,
    });
  };

  useEffect(() => {
    if (
      items.length === 0 &&
      !isReservationCheckout &&
      !hasDirectCart
    ) {
      showToast("Add something delicious first");
      navigate("/categories");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDirectCart, isReservationCheckout]);

  /*
   * Returning guest lookup.
   * This is used only for normal Order flow because
   * Reservation flow directly uses New Guest form.
   */
  useEffect(() => {
    const mobile = phoneReturn.replace(/\D/g, "");

    setReturningCustomer(null);
    setLookedUpMobile("");

    if (
      guestType !== "returning" ||
      isReservationCheckout ||
      !session.companyId ||
      !isValidPhone(mobile, countryCode)
    ) {
      return;
    }

    let cancelled = false;

    setIsLookingUpGuest(true);

    getCustomerByMobile({
      countryCode,
      mobile,
      companyId: session.companyId,
    })
      .then((customer) => {
        if (cancelled) return;

        setReturningCustomer(customer);
        setLookedUpMobile(mobile);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(
            "Could not look up returning guest",
            error
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLookingUpGuest(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    countryCode,
    guestType,
    phoneReturn,
    session.companyId,
    isReservationCheckout,
  ]);

  const placeOrder = async (
    checkout: CheckoutInfo
  ) => {
    if (isOfferReservation) {
      if (!urlOfferId || !urlOfferName) {
        showToast(
          "The selected offer is no longer available"
        );
        navigate("/offers");
        return;
      }

      if (!reservationDate || !reservationTime) {
        showToast(
          "Select the offer reservation date and time"
        );
        return;
      }

      try {
        const tableId = isGuid(session.tableId)
          ? session.tableId
          : checkoutParams.get("tableId");

        const reservation =
          await createReservation(
            {
              companyId: reservationCompanyId,
              branchId: reservationBranchId,
              moduleId: reservationModuleId,
              reservationCategory: "OFFER",
              guestName: checkout.name || "Guest",
              mobile: checkout.phone,
              email,
              dateOfBirth: checkout.dob || "",
              guestCount:
                Number(checkout.people) || 1,
              reservationDateTime:
                `${reservationDate}T${reservationTime}:00+04:00`,
              reservationTitle: urlOfferName,
              ...(isGuid(tableId)
                ? { tableId }
                : {}),
              specialRequest,
              extraDetails: {
                id: urlOfferId,
                name: urlOfferName,
              },
            },
            reservationSessionId
          );

        saveReservationConfirmation(
          reservation,
          checkout,
          urlOfferName
        );

        showToast(
          "Offer reservation submitted successfully"
        );

        navigate("/confirm");
      } catch (error) {
        console.error(
          "Could not create offer reservation",
          error
        );

        showToast(
          "Could not submit reservation. Please try again later."
        );
      }

      return;
    }

    if (isCustomMomentReservation) {
      if (!reservationDate || !reservationTime) {
        showToast(
          "Select the moment reservation date and time"
        );
        return;
      }

      try {
        const tableId = isGuid(session.tableId)
          ? session.tableId
          : checkoutParams.get("tableId");

        const reservation =
          await createReservation(
            {
              companyId: reservationCompanyId,
              branchId: reservationBranchId,
              moduleId: reservationModuleId,
              reservationCategory: "CUSTOM_MOMENT",
              guestName: checkout.name || "Guest",
              mobile: checkout.phone,
              email,
              dateOfBirth: checkout.dob || "",
              guestCount:
                Number(checkout.people) || 1,
              reservationDateTime:
                `${reservationDate}T${reservationTime}:00+04:00`,
              reservationTitle:
                momentName || "Custom Moment",
              ...(isGuid(tableId)
                ? { tableId }
                : {}),
              specialRequest,
              extraDetails: {
                id: urlMomentId,
                name: momentName,
              },
            },
            reservationSessionId
          );

        saveReservationConfirmation(
          reservation,
          checkout,
          momentName || "Custom Moment"
        );

        showToast(
          "Custom moment reservation submitted successfully"
        );

        navigate("/confirm");
      } catch (error) {
        console.error(
          "Could not create custom moment reservation",
          error
        );

        showToast(
          "Could not submit reservation. Please try again later."
        );
      }

      return;
    }

    if (isLiveSportsReservation) {
      if (!reservationDate || !reservationTime) {
        showToast(
          "Select the match reservation date and time"
        );
        return;
      }

      try {
        const tableId = isGuid(session.tableId)
          ? session.tableId
          : checkoutParams.get("tableId");

        const reservation =
          await createReservation(
            {
              companyId: reservationCompanyId,
              branchId: reservationBranchId,
              reservationCategory: "EVENT",
              guestName: checkout.name || "Guest",
              mobile: checkout.phone,
              email,
              dateOfBirth: checkout.dob || "",
              guestCount:
                Number(checkout.people) || 1,
              reservationDateTime:
                `${reservationDate}T${reservationTime}:00+04:00`,
              reservationTitle: null,
              ...(isGuid(tableId)
                ? { tableId }
                : {}),
              moduleId: reservationModuleId,
              specialRequest,
              extraDetails: {
                id:
                  urlMomentId ||
                  checkoutParams.get("eventId") ||
                  "",
                name: momentName,
              },
            },
            reservationSessionId
          );

        saveReservationConfirmation(
          reservation,
          checkout,
          momentName || "Live Sports Reservation"
        );

        showToast(
          "Reservation submitted successfully"
        );

        navigate("/confirm");
      } catch (error) {
        console.error(
          "Could not create Live Sports reservation",
          error
        );

        showToast(
          "Could not submit reservation. Please try again later."
        );
      }

      return;
    }

    // Table, gaming, package, event, and custom bookings
    // all use the reservation API.
    if (isReservationCheckout) {
      if (!reservationDate || !reservationTime) {
        showToast(
          "Select the reservation date and time"
        );
        return;
      }

      const tableId = isGuid(session.tableId)
        ? session.tableId
        : checkoutParams.get("tableId");

      const reservationCategory =
        checkoutParams.get("reservationCategory") ||
        (urlGameName
          ? "GAMING"
          : "TABLE_RESERVATION");

      const reservationTitle = urlGameName
        ? `Gaming: ${urlGameName}`
        : checkoutParams.get("reservationTitle") ||
          checkoutParams.get("bookingType") ||
          (isTableReservation
            ? "Table Reservation"
            : "Reservation");

      try {
        const reservation =
          await createReservation(
            {
              companyId: reservationCompanyId,
              branchId: reservationBranchId,
              moduleId: reservationModuleId,
              reservationCategory,
              guestName: checkout.name || "Guest",
              mobile: checkout.phone,
              email,
              dateOfBirth: checkout.dob || "",
              guestCount:
                Number(checkout.people) || 1,
              reservationDateTime:
                `${reservationDate}T${reservationTime}:00+04:00`,
              reservationTitle,
              ...(isGuid(tableId)
                ? { tableId }
                : {}),
              specialRequest,
              extraDetails: {
                id:
                  urlGameId ||
                  checkoutParams.get("eventId") ||
                  "",
                name:
                  urlGameName || reservationTitle,
              },
            },
            reservationSessionId
          );

        saveReservationConfirmation(
          reservation,
          checkout,
          reservationTitle
        );

        showToast(
          `${reservationTitle} reservation submitted successfully`
        );

        navigate("/confirm");
      } catch (error) {
        console.error(
          "Could not create reservation",
          error
        );

        showToast(
          "Could not submit reservation. Please try again later."
        );
      }

      return;
    }

    if (items.length === 0) {
      showToast("Your cart is empty");
      navigate("/categories");
      return;
    }

    if (!cartId) {
      showToast(
        "Cart not ready yet — please wait a moment and try again"
      );
      return;
    }

    const now = new Date();

    writeLocal(RESERVATION_KEY, null);

    const [firstName, ...rest] = (
      checkout.name || "Guest"
    )
      .trim()
      .split(" ");

    let orderId: string | null = null;
    let orderNo: string | null = null;

    try {
      const result = await placeOrderApi({
        sessionId: session.sessionId,
        cartId,
        firstName: firstName || "Guest",
        lastName: rest.join(" ") || "",
        CountryCode: checkout.countryCode,
        mobile: checkout.phone,
        dob: checkout.dob,
        guestCount:
          Number(checkout.people) || 1,
        companyId: session.companyId,
        branchId: session.branchId,
      });

      orderId = result.orderId;
      orderNo = result.orderNo;
    } catch (err) {
      console.error(
        "Could not place order via API",
        err
      );

      showToast(
        "Could not place order. Please try again later."
      );

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

    clearCart();
    navigate("/confirm");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    /*
     * Reservation always uses New Guest form.
     * Therefore reservation does NOT use Returning Guest flow.
     */
    if (guestType === "new" || isReservationCheckout) {
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

      if (
        isReservationCheckout &&
        (!reservationDate || !reservationTime)
      ) {
        showToast(
          "Select the reservation date and time"
        );
        return;
      }

      if (
        !isLiveSportsReservation &&
        !table.trim() &&
        !checkoutParams.get("tableId") &&
        !session.tableId
      ) {
        showToast("Enter your table number");
        return;
      }

      placeOrder({
        guestType: "new",
        name: name.trim(),
        countryCode,
        phone,
        people,
        table: isLiveSportsReservation
          ? ""
          : table.trim(),
        dob: dob || undefined,
        orderType: "dine-in",
        payment: "cod",
      });

      return;
    }

    /*
     * Returning Guest flow is ONLY for normal Order.
     */
    if (!isValidPhone(phoneReturn, countryCode)) {
      showToast("Enter a valid mobile number");
      return;
    }

    if (
      !tableReturn.trim() &&
      !isReservationCheckout
    ) {
      showToast("Enter your table number");
      return;
    }

    if (
      isReservationCheckout &&
      (!reservationDate || !reservationTime)
    ) {
      showToast(
        "Select the reservation date and time"
      );
      return;
    }

    if (!session.companyId) {
      showToast(
        "Session not ready yet — please wait a moment and try again"
      );
      return;
    }

    handleReturningGuestSubmit();
  };

  /*
   * Returning guest is only applicable to normal Order.
   */
  const handleReturningGuestSubmit = async () => {
    setIsLookingUpGuest(true);

    try {
      const mobile =
        phoneReturn.replace(/\D/g, "");

      const customer =
        lookedUpMobile === mobile
          ? returningCustomer
          : await getCustomerByMobile({
              countryCode,
              mobile,
              companyId: session.companyId!,
            });

      if (!customer) {
        showToast(
          "No account found for this number — try 'New Here' instead"
        );

        return;
      }

      await placeOrder({
        guestType: "returning",
        name:
          `${customer.firstName} ${customer.lastName}`.trim() ||
          "Guest",
        countryCode,
        phone: phoneReturn,
        people: customer.guestCount
          ? String(customer.guestCount)
          : undefined,
        table: tableReturn.trim(),
        dob: customer.dob,
        orderType: "dine-in",
        payment: "cod",
      });
    } catch (err) {
      console.error(
        "Could not look up returning guest",
        err
      );

      showToast(
        "Could not verify your number — please try again"
      );
    } finally {
      setIsLookingUpGuest(false);
    }
  };

  return (
    <main className="page">
      <Header />

      <div className="checkout checkout--bg">

        {/* Stepper/Tabs:
            Normal Order = SHOW
            Reservation = HIDE
        */}
        <Stepper
          active="details"
          hidden={isReservationCheckout}
        />

        <header className="checkout__intro">
          <p className="checkout__eyebrow">
            Tell us a little
          </p>

          <h1 className="checkout__title">
            About You
          </h1>

          <p className="checkout__hint">
            Just a few details to complete your order.
          </p>

          <span
            className="checkout__ornament"
            aria-hidden="true"
          />
        </header>

        {isLiveSportsReservation &&
          !isCustomMomentReservation &&
          liveSportsDetails.length > 0 && (
            <section
              className="checkout-event-details"
              aria-label="Selected live sports fixture"
            >
              <p className="checkout__eyebrow">
                Selected fixture
              </p>

              <div className="checkout-event-details__grid">
                {liveSportsDetails.map(
                  ([label, value]) => (
                    <div
                      className="checkout-event-details__item"
                      key={label}
                    >
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

        {selectedDetails.length > 0 && (
          <section
            className="checkout-event-details"
            aria-label="Selected booking details"
          >
            <p className="checkout__eyebrow">
              Selected booking
            </p>

            <div className="checkout-event-details__grid">
              {selectedDetails
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div
                    className="checkout-event-details__item"
                    key={label}
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
            </div>
          </section>
        )}

        {isCustomMomentReservation && (
          <div
            className="form-group checkout-event-details"
            style={{ marginBottom: "1.5rem" }}
          >
            <label
              className="form-label"
              htmlFor="input-moment-name"
            >
              Selected Moment
            </label>

            <input
              id="input-moment-name"
              className="form-input"
              type="text"
              value={momentName}
              onChange={(event) =>
                setMomentName(event.target.value)
              }
              required
            />
          </div>
        )}

        {isOfferReservation && (
          <section
            className="checkout-event-details checkout-offer-summary"
            aria-label="Selected offer"
          >
            <p className="checkout__eyebrow">
              Selected offer
            </p>

            <h2>{urlOfferName}</h2>

            {urlOfferPrice && (
              <strong>{urlOfferPrice}</strong>
            )}

            {urlOfferDescription && (
              <p>{urlOfferDescription}</p>
            )}
          </section>
        )}

        {/* =====================================================
            NEW HERE / RETURNING TABS
            Only visible during NORMAL ORDER.
            Hidden during ALL RESERVATIONS.
        ===================================================== */}
        {!isReturningGuest &&
          !isReservationCheckout && (
            <div
              className="guest-toggle"
              role="group"
              aria-label="Guest type"
            >
              <button
                type="button"
                className={`guest-toggle__btn${
                  guestType === "new"
                    ? " is-active"
                    : ""
                }`}
                aria-pressed={
                  guestType === "new"
                }
                onClick={() =>
                  setGuestType("new")
                }
              >
                <span
                  className="guest-toggle__icon"
                  aria-hidden="true"
                >
                  <NavIcon name="user-plus" />
                </span>

                <span className="guest-toggle__copy">
                  <span className="guest-toggle__title">
                    New Here
                  </span>

                  <span className="guest-toggle__sub">
                    I'm a new guest.
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`guest-toggle__btn${
                  guestType === "returning"
                    ? " is-active"
                    : ""
                }`}
                aria-pressed={
                  guestType === "returning"
                }
                onClick={() =>
                  setGuestType("returning")
                }
              >
                <span
                  className="guest-toggle__icon"
                  aria-hidden="true"
                >
                  <NavIcon name="user-return" />
                </span>

                <span className="guest-toggle__copy">
                  <span className="guest-toggle__title">
                    Returning
                  </span>

                  <span className="guest-toggle__sub">
                    I've ordered here before.
                  </span>
                </span>
              </button>
            </div>
          )}

        <form
          className="form-panel form-panel--checkout"
          onSubmit={handleSubmit}
          noValidate
        >
          {/*
            IMPORTANT:
            Reservation => New Guest form
            Normal Order => selected guestType form
          */}
          {guestType === "new" ||
          isReservationCheckout ? (
            <div className="checkout-fields checkout-fields--grid">

              {/* Full Name */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="input-name"
                >
                  Full Name
                </label>

                <div className="field-input">
                  <span
                    className="field-input__icon"
                    aria-hidden="true"
                  >
                    <NavIcon name="user" />
                  </span>

                  <input
                    id="input-name"
                    className="form-input"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="input-phone"
                >
                  Mobile Number
                </label>

                <div className="field-input field-input--phone">
                  <span
                    className="field-input__icon"
                    aria-hidden="true"
                  >
                    <NavIcon name="phone" />
                  </span>

                  <select
                    className="form-select form-select--code"
                    aria-label="Country code"
                    value={countryCode}
                    onChange={(e) =>
                      setCountryCode(
                        e.target.value
                      )
                    }
                  >
                    <option value="+971">
                      🇦🇪 +971
                    </option>

                    <option value="+91">
                      🇮🇳 +91
                    </option>

                    <option value="+1">
                      🇺🇸 +1
                    </option>

                    <option value="+44">
                      🇬🇧 +44
                    </option>
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
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="input-dob"
                >
                  Date of Birth
                </label>

                <div className="field-input">
                  <span
                    className="field-input__icon"
                    aria-hidden="true"
                  >
                    <NavIcon name="calendar" />
                  </span>

                  <input
                    id="input-dob"
                    className="form-input"
                    type="date"
                    autoComplete="bday"
                    max={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    value={dob}
                    onChange={(e) =>
                      setDob(e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Email - Reservation only */}
              {isReservationCheckout && (
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="input-email"
                  >
                    Email
                  </label>

                  <div className="field-input">
                    <input
                      id="input-email"
                      className="form-input"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              )}

              {/* Number of People */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="input-people"
                >
                  Number of People
                </label>

                <div className="field-input">
                  <span
                    className="field-input__icon"
                    aria-hidden="true"
                  >
                    <NavIcon name="users" />
                  </span>

                  <select
                    id="input-people"
                    className="form-select form-select--full"
                    value={people}
                    onChange={(e) =>
                      setPeople(e.target.value)
                    }
                    required
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select number of guests
                    </option>

                    {[1, 2, 3, 4, 5, 6, 7].map(
                      (n) => (
                        <option
                          key={n}
                          value={n}
                        >
                          {n} Guest
                          {n > 1 ? "s" : ""}
                        </option>
                      )
                    )}

                    <option value="8">
                      8+ Guests
                    </option>
                  </select>
                </div>
              </div>

              {/* Reservation fields */}
              {isReservationCheckout && (
                <>
                  {/* Reservation Date */}
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor="input-reservation-date"
                    >
                      Reservation Date
                    </label>

                    <div className="field-input">
                      <input
                        id="input-reservation-date"
                        className="form-input"
                        type="date"
                        min={
                          new Date()
                            .toISOString()
                            .split("T")[0]
                        }
                        value={reservationDate}
                        onChange={(e) =>
                          setReservationDate(
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Reservation Time */}
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor="input-reservation-time"
                    >
                      Reservation Time
                    </label>

                    <div className="field-input">
                      <input
                        id="input-reservation-time"
                        className="form-input"
                        type="time"
                        value={reservationTime}
                        onChange={(e) =>
                          setReservationTime(
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Special Request */}
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor="input-special-request"
                    >
                      Special Request
                    </label>

                    <div className="field-input">
                      <textarea
                        id="input-special-request"
                        className="form-input"
                        placeholder="Any special request"
                        value={specialRequest}
                        onChange={(e) =>
                          setSpecialRequest(
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Table Number */}
              {!isLiveSportsReservation && (
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="input-table"
                  >
                    Table Number
                  </label>

                  <div className="field-input">
                    <span
                      className="field-input__icon"
                      aria-hidden="true"
                    >
                      <NavIcon name="table" />
                    </span>

                    <input
                      id="input-table"
                      className="form-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter your table number"
                      value={table}
                      onChange={(e) =>
                        setTable(e.target.value)
                      }
                      required={
                        !session.tableId &&
                        !checkoutParams.get(
                          "tableId"
                        )
                      }
                    />
                  </div>

                  <p className="form-help">
                    You can find your table number
                    on your table.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /*
             * Returning Guest form.
             * This will ONLY be reachable for normal Order,
             * because Reservation forces the New Guest form above.
             */
            <div className="checkout-fields checkout-fields--stack">

              {/* Returning Mobile */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="input-phone-return"
                >
                  Mobile Number
                </label>

                <div className="field-input">
                  <span
                    className="field-input__icon"
                    aria-hidden="true"
                  >
                    <NavIcon name="phone" />
                  </span>

                  <select
                    className="form-select form-select--code"
                    aria-label="Country code"
                    value={countryCode}
                    onChange={(e) =>
                      setCountryCode(
                        e.target.value
                      )
                    }
                  >
                    <option value="+971">
                      🇦🇪 +971
                    </option>

                    <option value="+91">
                      🇮🇳 +91
                    </option>

                    <option value="+1">
                      🇺🇸 +1
                    </option>

                    <option value="+44">
                      🇬🇧 +44
                    </option>
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
                    onChange={(e) =>
                      setPhoneReturn(
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Returning Table */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="input-table-return"
                >
                  Table Number
                </label>

                <div className="field-input">
                  <span
                    className="field-input__icon"
                    aria-hidden="true"
                  >
                    <NavIcon name="table" />
                  </span>

                  <input
                    id="input-table-return"
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter your table number"
                    value={tableReturn}
                    onChange={(e) =>
                      setTableReturn(
                        e.target.value
                      )
                    }
                  />
                </div>

                <p className="form-help">
                  You can find your table number
                  on your table.
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-checkout"
            disabled={isLookingUpGuest}
          >
            {isLookingUpGuest
              ? "Checking…"
              : isOfferReservation
              ? "Reserve This Offer"
              : isReservationCheckout
              ? "Reserve Session"
              : "Complete Your Order"}

            <span aria-hidden="true">
              →
            </span>
          </button>

          <p className="form-trust">
            <span
              className="form-trust__icon"
              aria-hidden="true"
            >
              <NavIcon name="shield" />
            </span>

            <span>
              Your details are safe with us and
              will only be used to complete your
              dining experience.
            </span>
          </p>
        </form>
      </div>
    </main>
  );
}