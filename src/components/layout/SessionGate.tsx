import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { useAppSelector } from "@/store/hooks";
import { selectQrContextError, TABLE_OCCUPIED_ERROR } from "@/store/slices/qrContextSlice";

/**
 * Wraps pages that need the company and branch IDs loaded from the QR context.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const { hasSession, isReady, websiteConfigStatus, websiteConfigError } = useSession();
  const qrContextError = useAppSelector(selectQrContextError);

  if (!isReady) return null;

  if (qrContextError === TABLE_OCCUPIED_ERROR) {
    return (
      <section className="session-gate session-gate--occupied" role="alert" aria-labelledby="occupied-title">
        <div className="session-gate__card">
          <div className="session-gate__icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M13 21v-5a11 11 0 0 1 22 0v5" />
              <rect x="9" y="21" width="30" height="22" rx="4" />
              <path d="M24 29v6" />
              <circle cx="24" cy="28" r="1" />
            </svg>
          </div>
          <p className="session-gate__eyebrow">Table unavailable</p>
          <h2 id="occupied-title" className="session-gate__title">This table is already booked</h2>
          <p className="session-gate__message">{TABLE_OCCUPIED_ERROR}</p>
          <p className="session-gate__help">
            Please ask a team member for help or scan a different table&apos;s QR code.
          </p>
        </div>
      </section>
    );
  }

  if (!hasSession) {
    return (
      <div className="section" style={{ textAlign: "center", padding: "4rem 1.25rem" }}>
        <h2 className="font-display text-2xl mb-2">Let's find your table first</h2>
        <p className="text-brand-muted text-sm mb-4">
          {websiteConfigStatus === "failed"
            ? `Restaurant details could not be loaded: ${websiteConfigError || "Please try again later."}`
            : `Please go back to the home screen and tap "Explore Menu" to load your table's menu.`}
        </p>
        <Link to="/" className="btn btn-primary">
          Go to Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
