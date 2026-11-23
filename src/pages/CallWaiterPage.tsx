import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { fetchTables, type TableOption } from "@/api/table.api";
import { fetchWaiterTypes, type WaiterRequestType } from "@/api/waiter.api";
import { DEFAULT_RESERVATION_MODULE_ID } from "@/config/urls";
import { useSession } from "@/context/SessionContext";

type LoadStatus = "loading" | "succeeded" | "failed";

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function normalizeTableLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^table/, "");
}

export function CallWaiterPage() {
  const { session, websiteConfig, deviceId } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const companyId = session.companyId || websiteConfig?.companyId || "";
  const branchId = session.branchId || websiteConfig?.branchId || "";
  const [tables, setTables] = useState<TableOption[]>([]);
  const [tablesStatus, setTablesStatus] = useState<LoadStatus>("loading");
  const [tablesError, setTablesError] = useState("");
  const [tablesRetry, setTablesRetry] = useState(0);
  const [selectedTableId, setSelectedTableId] = useState(session.tableId || "");
  const [types, setTypes] = useState<WaiterRequestType[]>([]);
  const [typesStatus, setTypesStatus] = useState<LoadStatus>("loading");
  const [typesError, setTypesError] = useState("");
  const [typesRetry, setTypesRetry] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!branchId) {
      setTables([]);
      setTablesStatus("failed");
      setTablesError("Branch details are missing. Please reopen this page from your table QR code.");
      return;
    }

    let cancelled = false;
    setTablesStatus("loading");
    setTablesError("");

    fetchTables(branchId)
      .then((result) => {
        if (!cancelled) {
          setTables(result);
          setTablesStatus("succeeded");
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load tables for waiter request", error);
        if (!cancelled) {
          setTables([]);
          setTablesError(readErrorMessage(error, "Unable to load tables. Please try again."));
          setTablesStatus("failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [branchId, tablesRetry]);

  useEffect(() => {
    if (!session.tableId || selectedTableId) return;
    setSelectedTableId(session.tableId);
  }, [selectedTableId, session.tableId]);

  useEffect(() => {
    if (!session.tableNumber || selectedTableId || tables.length === 0) return;
    const wanted = normalizeTableLabel(session.tableNumber);
    const match = tables.find((table) =>
      [table.name, table.code].some((value) => value && normalizeTableLabel(value) === wanted)
    );
    if (match) setSelectedTableId(match.id);
  }, [selectedTableId, session.tableNumber, tables]);

  useEffect(() => {
    if (!companyId || !branchId) {
      setTypes([]);
      setTypesStatus("failed");
      setTypesError("Venue details are missing. Please reopen this page from your table QR code.");
      return;
    }

    const controller = new AbortController();
    setTypesStatus("loading");
    setTypesError("");

    fetchWaiterTypes(companyId, branchId, controller.signal)
      .then((items) => {
        setTypes(items);
        setTypesStatus("succeeded");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Could not load waiter request types", error);
        setTypesError(readErrorMessage(error, "Unable to load request types. Please try again."));
        setTypesStatus("failed");
      });

    return () => controller.abort();
  }, [branchId, companyId, typesRetry]);

  const clearFeedback = () => {
    setSubmitError("");
  };

  const toggleRequestType = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
    clearFeedback();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTableId) {
      setSubmitError("Please select your table number.");
      return;
    }
    if (selectedIds.length === 0) {
      setSubmitError("Please select at least one reason.");
      return;
    }
    if (!companyId || !branchId) {
      setSubmitError("Venue details are missing. Please reopen this page from your table QR code.");
      return;
    }

    const selectedReasons = types
      .filter((type) => selectedIds.includes(type.id))
      .map((type) => type.name);
    const selectedTable = tables.find((table) => table.id === selectedTableId);
    const reservationDetails = {
      id: "call-waiter",
      name: "Call Waiter",
      type: "call-waiter",
      categoryName: "Call Waiter",
      category: "CALL_WAITER",
      bookingType: "Call Waiter",
      reasons: selectedReasons,
      note: note.trim(),
      selectedItem: {
        id: "call-waiter-reason",
        name: selectedReasons.join(", "),
      },
    };
    const specialRequest = [
      "Call waiter requested.",
      `Reason(s): ${selectedReasons.join(", ")}.`,
      note.trim() ? `Additional note: ${note.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const params = new URLSearchParams(location.search);
    [
      "moduleId",
      "mid",
      "gameId",
      "gid",
      "gameName",
      "gn",
      "categoryName",
      "cn",
      "eventId",
      "momentId",
      "mid_event",
      "offerId",
      "offerName",
      "offerPrice",
    ].forEach((key) => params.delete(key));
    params.set("companyId", companyId);
    params.set("branchId", branchId);
    params.set("tableId", selectedTableId);
    params.set("moduleId", DEFAULT_RESERVATION_MODULE_ID);
    params.set("categoryName", "Call Waiter");
    if (selectedTable?.name || session.tableNumber) {
      params.set("tableNumber", selectedTable?.name || session.tableNumber || "");
    }
    if (session.sessionId) params.set("sessionId", session.sessionId);
    if (deviceId) params.set("deviceId", deviceId);
    params.set("category", "CALL_WAITER");
    params.set("reservationCategory", "CALL_WAITER");
    params.set("reservationTitle", "Call Waiter");
    params.set("bookingType", "Call Waiter");
    params.set("specialRequest", specialRequest);
    params.set("extraDetails", JSON.stringify(reservationDetails));
    params.set("hideSteps", "true");
    params.set("hideCardIcon", "true");
    setSubmitError("");
    navigate({ pathname: "/checkout", search: `?${params.toString()}` });
  };

  const siteName = websiteConfig?.siteName || websiteConfig?.companyName || "The Desire Sheesha Lounge";
  const selectedTable = tables.find((table) => table.id === selectedTableId);

  return (
    <main className="page call-waiter-page">
      <Header />

      <section className="call-waiter-content">
        <Link to={{ pathname: "/categories", search: location.search }} className="call-waiter-back">
          <span aria-hidden="true">‹</span> Back to menu
        </Link>
        <header className="call-waiter-intro">
          <p className="checkout__eyebrow">Assistance</p>
          <h1 className="checkout__title">Call Waiter</h1>
          <p>Select why you need us and your table number, then continue to registration.</p>
        </header>

        <form className="form-panel call-waiter-form" onSubmit={handleSubmit}>
          <h2>How can {siteName} help?</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="waiter-table-number">Table Number</label>
            <select
              id="waiter-table-number"
              className="form-input"
              value={selectedTableId}
              onChange={(event) => {
                setSelectedTableId(event.target.value);
                clearFeedback();
              }}
              disabled={tablesStatus === "loading"}
              required
            >
              <option value="">
                {tablesStatus === "loading" ? "Loading tables…" : "Select your table"}
              </option>
              {selectedTableId && !tables.some((table) => table.id === selectedTableId) && (
                <option value={selectedTableId}>{session.tableNumber || "Current table"}</option>
              )}
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}{table.code ? ` (${table.code})` : ""}
                </option>
              ))}
            </select>
            {tablesStatus === "failed" && (
              <div className="call-waiter-inline-error" role="alert">
                <span>{tablesError}</span>
                <button type="button" className="call-waiter-retry" onClick={() => setTablesRetry((value) => value + 1)}>
                  Try again
                </button>
              </div>
            )}
            {tablesStatus === "succeeded" && tables.length === 0 && (
              <p className="call-waiter-inline-error" role="alert">No tables are available for this branch.</p>
            )}
          </div>

          <fieldset className="call-waiter-reasons">
            <legend className="form-label">Select one or more reasons</legend>
            {typesStatus === "loading" && <p role="status">Loading request types…</p>}
            {typesStatus === "failed" && (
              <div className="call-waiter-inline-error" role="alert">
                <span>{typesError}</span>
                <button type="button" className="call-waiter-retry" onClick={() => setTypesRetry((value) => value + 1)}>
                  Try again
                </button>
              </div>
            )}
            {typesStatus === "succeeded" && types.length === 0 && (
              <p className="call-waiter-inline-error" role="alert">No waiter request types are available right now.</p>
            )}
            {typesStatus === "succeeded" && types.map((type) => (
              <label className="call-waiter-reason" key={type.id}>
                <input
                  type="checkbox"
                  name="requestTypeIds"
                  value={type.id}
                  checked={selectedIds.includes(type.id)}
                  onChange={() => toggleRequestType(type.id)}
                />
                <span>
                  <strong>{type.name}</strong>
                  {type.description && <small>{type.description}</small>}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="form-group">
            <label className="form-label" htmlFor="waiter-note">
              Additional Note <span className="call-waiter-optional">(optional)</span>
            </label>
            <textarea
              id="waiter-note"
              className="form-input call-waiter-note"
              rows={4}
              placeholder="Anything else we should know?"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                clearFeedback();
              }}
            />
          </div>

          {submitError && <p className="call-waiter-message call-waiter-message--error" role="alert">{submitError}</p>}
          <button
            className="btn btn-primary btn-block call-waiter-submit"
            type="submit"
            disabled={
              typesStatus !== "succeeded" ||
              types.length === 0 ||
              !selectedTableId ||
              (tablesStatus === "loading" && !selectedTable)
            }
          >
            Continue to registration
          </button>
        </form>
      </section>
    </main>
  );
}
