import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { fetchTables, type TableOption } from "@/api/table.api";
import { createWaiterRequest, fetchWaiterTypes, type WaiterRequestType } from "@/api/waiter.api";
import { useSession } from "@/context/SessionContext";

type LoadStatus = "loading" | "succeeded" | "failed";
type SubmitStatus = "idle" | "loading" | "succeeded" | "failed";

function readMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? record.Message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function normalizeTableLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^table/, "");
}

export function CallWaiterPage() {
  const { session, websiteConfig } = useSession();
  const location = useLocation();
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
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");
    if (submitStatus !== "loading") setSubmitStatus("idle");
  };

  const toggleRequestType = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
    clearFeedback();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    setSubmitStatus("loading");
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await createWaiterRequest({
        companyId,
        branchId,
        tableId: selectedTableId,
        requestTypeIds: selectedIds,
        note: note.trim(),
      });
      setSuccessMessage(readMessage(response, "Your request has been sent. Our team will be with you shortly."));
      setSubmitStatus("succeeded");
    } catch (error) {
      console.error("Could not send waiter request", error);
      setSubmitError(readErrorMessage(error, "Unable to send your request. Please try again."));
      setSubmitStatus("failed");
    }
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
          <p>Select why you need us and your table number. Our team will be with you shortly.</p>
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
          {successMessage && (
            <p className="call-waiter-message call-waiter-message--success" role="status">{successMessage}</p>
          )}

          <button
            className="btn btn-primary btn-block call-waiter-submit"
            type="submit"
            disabled={
              submitStatus === "loading" ||
              typesStatus !== "succeeded" ||
              types.length === 0 ||
              !selectedTableId ||
              (tablesStatus === "loading" && !selectedTable)
            }
          >
            {submitStatus === "loading" ? "Sending request…" : "Call Waiter"}
          </button>
        </form>
      </section>
    </main>
  );
}
