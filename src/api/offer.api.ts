import { apiClient } from "./axiosClient";
import { unwrapToArray } from "./normalize";
import type { Offer } from "@/types/offer.types";

interface OfferApiRecord {
  id?: string;
  offerId?: string;
  uidOfferId?: string;
  title?: string;
  name?: string;
  offerName?: string;
  meta?: string;
  timing?: string;
  description?: string;
  details?: string[];
  terms?: string[];
  price?: string | number;
  active?: boolean;
  isActive?: boolean;
  featured?: boolean;
  [key: string]: unknown;
}

const offersPath = import.meta.env.VITE_OFFERS_API_PATH || "/Offer/GetOffers";

function normalizeOffer(record: OfferApiRecord, index: number): Offer {
  return {
    id: String(record.offerId || record.uidOfferId || record.id || `offer-${index + 1}`),
    title: record.title || record.name || record.offerName || "Exclusive Offer",
    meta: record.meta || record.timing,
    description: record.description || "Ask our team about this exclusive offer.",
    details: record.details || record.terms,
    price: record.price !== undefined ? String(record.price) : undefined,
    featured: record.featured,
    active: record.active ?? record.isActive,
  };
}

export async function getOffers(companyId: string | null, branchId: string | null): Promise<Offer[]> {
  const response = await apiClient.post(offersPath, { companyId, branchId });
  return unwrapToArray<OfferApiRecord>(response.data)
    .map(normalizeOffer)
    .filter((offer) => offer.active !== false);
}