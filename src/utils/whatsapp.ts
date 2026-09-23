import { URLS } from "@/config/urls";

/**
 * Restaurant ke WhatsApp number par ek pre-filled deep link open karta hai.
 *
 * NOTE: Koi backend "send WhatsApp message" API is repo/collection me nahi
 * hai (sirf checkDevice/order/reservation APIs hain), isliye ye function
 * `wa.me` deep link approach use karta hai — jo already `URLS.contact`
 * config me define hai. Order ya reservation confirm hote hi ye ek naya tab
 * kholta hai jisme WhatsApp chat pre-filled message ke saath open ho jaati
 * hai. Agar future me koi dedicated WhatsApp-send API mile to is function ke
 * andar hi replace kiya ja sakta hai — baaki app is function ko as-is call
 * karta rahega.
 */
export function notifyWhatsApp(message: string): void {
  try {
    const url = URLS.contact.whatsappBooking(message);
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    // Popup blocked ya window unavailable (e.g. SSR) — silently ignore,
    // is se order/reservation flow fail nahi hona chahiye.
  }
}

export function buildOrderWhatsAppMessage(params: {
  orderNo?: string | null;
  guestName: string;
  mobile: string;
  countryCode: string;
  table?: string;
  peopleCount?: string;
}): string {
  const lines = [
    "New Order — The Desire Lounge",
    params.orderNo ? `Order No: ${params.orderNo}` : null,
    `Guest: ${params.guestName}`,
    `Mobile: ${params.countryCode} ${params.mobile}`,
    params.table ? `Table: ${params.table}` : null,
    params.peopleCount ? `Guests: ${params.peopleCount}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildReservationWhatsAppMessage(params: {
  reservationTitle: string;
  guestName: string;
  mobile: string;
  countryCode: string;
  reservationDateTime?: string;
  table?: string;
  peopleCount?: string;
}): string {
  const lines = [
    `New Reservation — ${params.reservationTitle}`,
    `Guest: ${params.guestName}`,
    `Mobile: ${params.countryCode} ${params.mobile}`,
    params.reservationDateTime
      ? `When: ${params.reservationDateTime}`
      : null,
    params.table ? `Table: ${params.table}` : null,
    params.peopleCount ? `Guests: ${params.peopleCount}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}
