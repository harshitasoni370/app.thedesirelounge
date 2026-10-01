/**
 * The "session" is everything the app learns from the QR code the guest
 * scans at their table: which company/outlet, which branch, and which
 * table they're sitting at.
 *
 * Captured from the QR context response. Static config is retained only as
 * a fallback for opening the menu without QR query parameters.
 */
export interface DiningSession {
  companyId: string | null;
  companyName: string | null;
  branchId: string | null;
  branchName: string | null;
  /** GUID for the physical table — sent to the Reservation API. */
  tableId: string | null;
  /** Human-readable table label shown in the UI (e.g. "1", "12A"). */
  tableNumber: string | null;
  tableName: string | null;
  sessionId: string | null;
  /**
   * "qr"     -> guest ne QR scan kiya, table session id valid hai (header me jayegi).
   * "direct" -> guest website/direct link se aaya, session nahi banegi aur
   *             Table-Session-Id header kisi API me nahi jayega.
   */
  source?: "qr" | "direct";
  /** Raw querystring the session was captured from, kept for debugging. */
  capturedFrom?: string;
  /** ISO timestamp of when this session was captured/updated. */
  updatedAt: string;
}

export const EMPTY_SESSION: DiningSession = {
  companyId: null,
  companyName: null,
  branchId: null,
  branchName: null,
  tableId: null,
  tableNumber: null,
  tableName: null,
  sessionId: null,
  updatedAt: new Date(0).toISOString(),
};