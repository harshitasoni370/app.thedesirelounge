import type { DiningSession } from "@/types/session.types";

/**
 * TEMPORARY: static stand-in for what a real QR-code scan would give
 * us (companyId, branchId, tableId). This is NOT read from the URL
 * right now — it's written to storage (and used to create a table
 * session via the API) only when the guest taps "Explore Menu" on the
 * home page (see HomePage.tsx / SessionContext).
 *
 * Replace these values with your real branch/company/table ids, and
 * swap `captureSession()` in SessionContext for real QR-param parsing
 * whenever the actual QR flow is ready — nothing else in the app
 * needs to change, since every page reads from useSession().
 */
export const STATIC_SESSION: Pick<DiningSession, "companyId" | "branchId" | "tableId" | "tableNumber"> = {
  // companyId: "28c5f656-294c-49a6-86f1-214be2fe6e6e",
  // branchId: "04ac2f31-17ef-4fc3-9053-9d64bee9a19e",
   companyId: "0ffbe39e-abf8-4827-9107-1a04b39f3416",
  branchId: "f4fb1d76-83a0-4965-86b5-63da28249dae",
  // Placeholder table GUID from the Postman collection — replace with
  // the real table's id once each table has its own QR code/id.
  tableId: "b9689df4-cb11-46f1-8207-c5fc46c22712",
  tableNumber: "1",
};
