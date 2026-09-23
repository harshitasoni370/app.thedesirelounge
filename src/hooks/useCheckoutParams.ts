import { useLocation } from "react-router-dom";
import { resolveParam } from "@/store/slices/qrContextSlice";
import { DEFAULT_COUNTRY_CODE } from "@/config/urls";

// Adjust these to your actual SessionContext / redux shapes if they differ —
// kept loose here since only these fields are read.
interface SessionLike {
  companyId?: string | null;
  branchId?: string | null;
  sessionId?: string | null;
  tableNumber?: string | null;
  tableId?: string | null;
}

interface ReturningFromDeviceLike {
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  guestName?: string | null;
  countryCode?: string | null;
  mobile?: string | null;
  dateOfBirth?: string | null;
}

export function useCheckoutParams(session: SessionLike, returningFromDevice: ReturningFromDeviceLike | null) {
  const location = useLocation();
  const checkoutParams = new URLSearchParams(location.search);

  const readParam = (...keys: string[]) => {
    for (const key of keys) {
      const value = resolveParam(checkoutParams, key);
      if (value) return value;
    }
    return "";
  };

  const reservationCompanyId =
    readParam("companyId", "companyID", "uidCompanyId") ||
    session.companyId ||
    "0ffbe39e-abf8-4827-9107-1a04b39f3416";

  const reservationBranchId =
    readParam("branchId", "branchID", "uidBranchId") ||
    session.branchId ||
    "f4fb1d76-83a0-4965-86b5-63da28249dae";

  const reservationSessionId =
    readParam("tableSessionId", "sessionId", "Table-Session-Id") || session.sessionId || null;

  const reservationModuleId = readParam("moduleId") || "3e340f23-d842-47f0-98e8-b0d458dc22dd";

  const urlGameName = readParam("gameName");
  const urlGameId = readParam("gameId");
  const urlMomentName = readParam("momentName", "eventName", "event");
  const urlMomentId = readParam("momentId");
  const urlMomentPrice = readParam("price");
  const urlOfferId = readParam("offerId");
  const urlOfferName = readParam("offerName");
  const urlOfferDescription = readParam("offerDescription");
  const urlOfferPrice = readParam("offerPrice");
  const urlName = readParam("guestName", "customerName");
  const urlPhone = readParam("mobile", "phone");
  const urlCountryCode =
    readParam("countryCode", "CountryCode") ||
    (returningFromDevice?.countryCode && returningFromDevice.countryCode.length > 1
      ? returningFromDevice.countryCode
      : DEFAULT_COUNTRY_CODE);
  const urlPeople = readParam("guestCount", "people");
  const urlDob = readParam("dob", "dateOfBirth");
  const urlEmail = readParam("email");
  const urlReservationDate = readParam("dateStart");
  const urlCategoryName = readParam("categoryName");
  const urlTable =
   readParam(
      "tn",
      "tableNumber",
      "tableNo",
      "tableName",
      "name"
   ) ||
   session.tableNumber ||
   "";
  const urlBookingType = readParam("bookingType");
  const urlReservationCategory = readParam("reservationCategory");
  const urlReservationTitle = readParam("reservationTitle");
  const urlCategory = readParam("category");

  const urlExtraDetails = (() => {
    const raw = readParam("extraDetails");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  })();

  const isSessionReservation = Boolean(
    urlGameName ||
      (urlBookingType && urlBookingType !== "Table Reservation") ||
      urlReservationCategory === "EVENT" ||
      urlReservationCategory === "OFFER" ||
      urlReservationCategory === "EXCLUSIVE_OFFER" ||
      urlReservationCategory === "CUSTOM_MOMENT"
  );

  const isCustomMomentReservation = urlBookingType === "Custom Moment" || Boolean(urlMomentId);

  const isLiveSportsReservation =
    !isCustomMomentReservation && (urlReservationCategory === "EVENT" || urlCategory === "EVENT");

  const isOfferReservation = urlReservationCategory === "OFFER" || urlReservationCategory === "EXCLUSIVE_OFFER";

  const isTableReservation =
    urlReservationCategory === "TABLE_RESERVATION" || urlCategory === "TABLE_RESERVATION";

  const isReservationCheckout = isSessionReservation || isTableReservation;

  const hasDirectCart = Boolean(readParam("cartId"));

  // Reservation deep links pass isReturning=true to say "this guest is
  // already known — land them on the Returning tab and, on submit, also
  // place whatever's still in their cart alongside the reservation."
  const isReturningParam = readParam("isReturning") === "true";

  const reservationReturnTo = readParam("returnTo") || (isOfferReservation ? "/offers" : "/categories");

  return {
    checkoutParams,
    readParam,
    reservationCompanyId,
    reservationBranchId,
    reservationSessionId,
    reservationModuleId,
    urlGameName,
    urlGameId,
    urlMomentName,
    urlMomentId,
    urlMomentPrice,
    urlOfferId,
    urlOfferName,
    urlOfferDescription,
    urlOfferPrice,
    urlName,
    urlPhone,
    urlCountryCode,
    urlPeople,
    urlDob,
    urlEmail,
    urlReservationDate,
    urlTable,
    urlCategoryName,
    urlBookingType,
    urlReservationCategory,
    urlReservationTitle,
    urlCategory,
    urlExtraDetails,
    isSessionReservation,
    isCustomMomentReservation,
    isLiveSportsReservation,
    isOfferReservation,
    isTableReservation,
    isReservationCheckout,
    hasDirectCart,
    isReturningParam,
    reservationReturnTo,
  };
}

export type CheckoutParams = ReturnType<typeof useCheckoutParams>;