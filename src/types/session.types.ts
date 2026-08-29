/**
 * The "session" is everything the app learns from the QR code the guest
 * scans at their table: which company/outlet, which branch, and which
 * table they're sitting at.
 *
 * Currently captured from static config (see src/config/staticSession.ts)
 * when the guest taps "Explore Menu", not from a real QR-scan URL yet.
 */
export interface DiningSession {
  companyId: string | null;
  branchId: string | null;
  /** GUID for the physical table — sent to the Reservation API. */
  tableId: string | null;
  /** Human-readable table label shown in the UI (e.g. "1", "12A"). */
  tableNumber: string | null;
  /** Raw querystring the session was captured from, kept for debugging. */
  capturedFrom?: string;
  /** ISO timestamp of when this session was captured/updated. */
  updatedAt: string;
}

export const EMPTY_SESSION: DiningSession = {
  companyId: null,
  branchId: null,
  tableId: null,
  tableNumber: null,
  updatedAt: new Date(0).toISOString(),
};
