import { useSession } from "@/context/SessionContext";
import { useLocation } from "react-router-dom";

export function SessionDetails() {
  const { session } = useSession();
  const location = useLocation();
  const params = new URLSearchParams(location.search || session.capturedFrom?.split("?")[1] || "");
  const details = [
    ["Category", params.get("categoryName") || params.get("category")],
    ["Booking", params.get("bookingType")],
    ["Game", params.get("gameName")],
    ["Session", params.get("sessionType")],
    ["Players", params.get("players")],
    ["Duration", params.get("duration")],
    ["Difficulty", params.get("difficulty")],
    ["Company", session.companyName],
    ["Table ID", session.tableId],
    ["Table", session.tableName || session.tableNumber || params.get("tableNumber") || params.get("tableNo") || params.get("tableName") || params.get("name")],
    ["Branch", session.branchName],
    ["Company ID", session.companyId],
    ["Branch ID", session.branchId],
    ["Session ID", session.sessionId],
    ["Location", params.get("location")],
  ].filter(([, value]) => value);

  if (!details.length) return null;

  return (
    <aside className="session-details" aria-label="Current dining session">
      <div className="session-details__heading">Current table session</div>
      <div className="session-details__grid">
        {details.map(([label, value]) => (
          <div className="session-details__item" key={label}>
            <span className="session-details__label">{label}</span>
            <strong className="session-details__value" title={value || undefined}>{value}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
