import { NavIcon } from "@/components/ui/Icon";
import type { TableOption } from "@/api/table.api";
import type { CountryCode } from "libphonenumber-js/max";
import { CountryCodeSelect } from "@/components/checkout/CountryCodeSelect";

interface Props {
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  mobile: string;
  onMobileChange: (value: string) => void;
  table: string;
  tableId: string;
  tables: TableOption[];
  tablesLoading: boolean;
  onTableChange: (id: string) => void;
  isLiveSportsReservation: boolean;
  isReservationCheckout: boolean;
  reservationDate: string;
  reservationTime: string;
  onReservationDateChange: (value: string) => void;
  onReservationTimeChange: (value: string) => void;
}

export function ReturningGuestSummary({
  country,
  onCountryChange,
  mobile,
  onMobileChange,
  table,
  tableId,
  tables,
  tablesLoading,
  onTableChange,
  isLiveSportsReservation,
  isReservationCheckout,
  reservationDate,
  reservationTime,
  onReservationDateChange,
  onReservationTimeChange,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="checkout-fields checkout-fields--stack">
      <div className="form-group">
        <label className="form-label" htmlFor="returning-mobile">Mobile Number</label>
        <div className="field-input field-input--phone">
          <span className="field-input__icon" aria-hidden="true">
            <NavIcon name="phone" />
          </span>
          <CountryCodeSelect country={country} onChange={onCountryChange} />
          <input
            id="returning-mobile"
            className="form-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={15}
            placeholder="Enter your mobile number"
            value={mobile}
            onChange={(event) => onMobileChange(event.target.value)}
            required
          />
        </div>
      </div>

      {!isLiveSportsReservation && (
        <div className="form-group">
          <label className="form-label">Table Number</label>
          <div className="field-input">
            <span className="field-input__icon" aria-hidden="true">
              <NavIcon name="table" />
            </span>
            <select
              className="form-input"
              aria-label="Table Number"
              value={tableId}
              onChange={(event) => onTableChange(event.target.value)}
              disabled={tablesLoading}
            >
              <option value="">{tablesLoading ? "Loading tables…" : "Select a table"}</option>
              {tableId && !tables.some((option) => option.id === tableId) && (
                <option value={tableId}>{table || "Current table"}</option>
              )}
              {tables.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}{option.code ? ` (${option.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="returning-order-date">
          {isReservationCheckout ? "Reservation Date" : "Order Date"}
        </label>
        <input
          id="returning-order-date"
          className="form-input"
          type="date"
          min={today}
          value={reservationDate}
          onChange={(event) => onReservationDateChange(event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="returning-order-time">
          {isReservationCheckout ? "Reservation Time" : "Order Time"}
        </label>
        <input
          id="returning-order-time"
          className="form-input"
          type="time"
          value={reservationTime}
          onChange={(event) => onReservationTimeChange(event.target.value)}
          required
        />
      </div>
    </div>
  );
}
