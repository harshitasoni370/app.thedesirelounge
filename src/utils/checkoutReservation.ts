import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js/max";
import { getCountryForCallingCode } from "@/utils/countryCallingCodes";

/**
 * Everything here is pure/derived — no state, no side effects.
 * Extracted out of CheckoutPage so the four near-identical reservation
 * branches (Offer / Custom Moment / Live Sports / generic Table-or-Gaming)
 * collapse into one function instead of four copies of createReservation().
 */

interface ReservationDetailsInput {
  isOfferReservation: boolean;
  isCustomMomentReservation: boolean;
  isLiveSportsReservation: boolean;
  isTableReservation: boolean;
  urlOfferName: string;
  urlOfferId: string;
  urlMomentId: string;
  urlGameName: string;
  urlGameId: string;
  urlReservationCategory: string;
  urlReservationTitle: string;
  urlBookingType: string;
  urlExtraDetails: Record<string, unknown> | null;
  momentName: string;
  readParam: (...keys: string[]) => string;
}

export interface ReservationDetails {
  category: string;
  title: string;
  extraDetails: Record<string, unknown>;
}

export function getReservationDetails(input: ReservationDetailsInput): ReservationDetails {
  const {
    isOfferReservation,
    isCustomMomentReservation,
    isLiveSportsReservation,
    isTableReservation,
    urlOfferName,
    urlOfferId,
    urlMomentId,
    urlGameName,
    urlGameId,
    urlReservationCategory,
    urlReservationTitle,
    urlBookingType,
    urlExtraDetails,
    momentName,
    readParam,
  } = input;

  if (isOfferReservation) {
    return {
      category: "OFFER",
      title: urlOfferName,
      extraDetails: urlExtraDetails || { id: urlOfferId, name: urlOfferName },
    };
  }

  if (isCustomMomentReservation) {
    const title = momentName || "Custom Moment";
    return {
      category: "CUSTOM_MOMENT",
      title,
      extraDetails: urlExtraDetails || { id: urlMomentId, name: momentName },
    };
  }

  if (isLiveSportsReservation) {
    // NOTE: previously this branch could send reservationTitle: null to the
    // API while toasts/WhatsApp used "Live Sports Reservation" as the
    // fallback. Unified to always use the same fallback everywhere.
    const title = readParam("eventName") || momentName || "Live Sports Reservation";
    return {
      category: "EVENT",
      title,
      extraDetails: urlExtraDetails || {
        id: urlMomentId || readParam("eventId") || "",
        name: momentName || readParam("eventName"),
      },
    };
  }

  const category = urlReservationCategory || (urlGameName ? "GAMING" : "TABLE_RESERVATION");
  const title = urlGameName
    ? `Gaming: ${urlGameName}`
    : urlReservationTitle || urlBookingType || (isTableReservation ? "Table Reservation" : "Reservation");

  return {
    category,
    title,
    extraDetails: urlExtraDetails || { id: urlGameId || readParam("eventId") || "", name: urlGameName || title },
  };
}

export function getLiveSportsDetails(p: {
  readParam: (...keys: string[]) => string;
  isLiveSportsReservation: boolean;
}): Array<[string, string]> {
  if (!p.isLiveSportsReservation) return [];

  return [
    ["Sport", p.readParam("sportCategory", "sport")],
    ["Event", p.readParam("eventName", "event")],
    ["Competition", p.readParam("competitionName")],
    ["Teams", [p.readParam("teamHome"), p.readParam("teamAway")].filter(Boolean).join(" vs ")],
    ["Venue", p.readParam("venue")],
    ["Date", p.readParam("dateStart")],
    ["UAE time", p.readParam("uaeTime")],
    ["Channel", p.readParam("channel")],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;
}

export function getSelectedDetails(p: {
  isTableReservation: boolean;
  isCustomMomentReservation: boolean;
  isOfferReservation: boolean;
  urlGameName: string;
  urlMomentName: string;
  urlMomentPrice: string;
  urlCategoryName: string;
  urlOfferName: string;
  urlOfferPrice: string;
  urlBookingType: string;
  urlReservationTitle: string;
  readParam: (...keys: string[]) => string;
}): Array<[string, string]> {
  if (p.isTableReservation) return [];

  if (p.isCustomMomentReservation) {
    return [
      ["Type", "Custom Moment"],
      ["Name", p.urlMomentName],
      ["Price", p.urlMomentPrice ? `AED ${p.urlMomentPrice}` : ""],
    ].filter(([, v]) => v) as Array<[string, string]>;
  }

  if (p.urlGameName) {
    return [
      ["Type", p.urlCategoryName || "Gaming Session"],
      ["Game", p.urlGameName],
      ["Players", p.readParam("players")],
      ["Duration", p.readParam("duration")],
      ["Difficulty", p.readParam("difficulty")],
    ].filter(([, v]) => v) as Array<[string, string]>;
  }

  if (p.isOfferReservation) {
    return [
      ["Type", "Exclusive Offer"],
      ["Offer", p.urlOfferName],
      ["Price", p.urlOfferPrice],
    ].filter(([, v]) => v) as Array<[string, string]>;
  }

  if (p.urlBookingType) {
    return [
      ["Type", p.urlBookingType || "Reservation"],
      ["Name", p.readParam("eventName") || p.urlReservationTitle || ""],
      ["Price", p.urlMomentPrice ? `AED ${p.urlMomentPrice}` : ""],
    ].filter(([, v]) => v) as Array<[string, string]>;
  }

  return [];
}

export function normalizeDob(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s.split(" ")[0] || "";
}

export function isGuid(value: string | null | undefined): value is string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

export function isValidPhone(phone: string, countryCode: string, country?: CountryCode): boolean {
  const normalizedPhone = phone.trim();
  if (!normalizedPhone) return false;
  return isValidPhoneNumber(normalizedPhone, country || getCountryForCallingCode(countryCode));
}
