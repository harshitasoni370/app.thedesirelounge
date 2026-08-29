import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/context/SessionContext";

/**
 * Wraps any page that needs `branchId` to function. Right now,
 * session data (branchId etc.) is only captured when the guest taps
 * "Explore Menu" on the home page (see HomePage.tsx / SessionContext)
 * — landing directly on a deep link without going through Home means
 * we don't have it yet, so we show a friendly nudge back to Home
 * instead of silently failing API calls.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const { hasSession, isReady } = useSession();

  if (!isReady) return null;

  if (!hasSession) {
    return (
      <div className="section" style={{ textAlign: "center", padding: "4rem 1.25rem" }}>
        <h2 className="font-display text-2xl mb-2">Let's find your table first</h2>
        <p className="text-brand-muted text-sm mb-4">
          Please go back to the home screen and tap "Explore Menu" to load your table's menu.
        </p>
        <Link to="/" className="btn btn-primary">
          Go to Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
