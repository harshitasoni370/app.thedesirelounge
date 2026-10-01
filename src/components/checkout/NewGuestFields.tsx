import { NavIcon } from "@/components/ui/Icon";
import type { TableOption } from "@/api/table.api";
import type { CountryCode } from "libphonenumber-js/max";
import { CountryCodeSelect } from "@/components/checkout/CountryCodeSelect";

interface Props {
  name: string;
  onNameChange: (v: string) => void;
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  dob: string;
  onDobChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  people: string;
  onPeopleChange: (v: string) => void;
  table: string;
  tableId: string;
  tables: TableOption[];
  tablesLoading: boolean;
  onTableChange: (id: string) => void;
  reservationDate: string;
  onReservationDateChange: (v: string) => void;
  reservationTime: string;
  onReservationTimeChange: (v: string) => void;
  specialRequest: string;
  onSpecialRequestChange: (v: string) => void;
  isReservationCheckout: boolean;
  isLiveSportsReservation: boolean;
  tableRequired: boolean;
}

export function NewGuestFields({
  name,
  onNameChange,
  country,
  onCountryChange,
  phone,
  onPhoneChange,
  dob,
  onDobChange,
  email,
  onEmailChange,
  people,
  onPeopleChange,
  table,
  tableId,
  tables,
  tablesLoading,
  onTableChange,
  reservationDate,
  onReservationDateChange,
  reservationTime,
  onReservationTimeChange,
  specialRequest,
  onSpecialRequestChange,
  isReservationCheckout,
  isLiveSportsReservation,
  tableRequired,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="checkout-fields checkout-fields--grid">
      <div className="form-group">
        <label className="form-label" htmlFor="input-name">
          Full Name
        </label>
        <div className="field-input">
          <span className="field-input__icon" aria-hidden="true">
            <NavIcon name="user" />
          </span>
          <input
            id="input-name"
            className="form-input"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="input-phone">
          Mobile Number
        </label>
        <div className="field-input field-input--phone">
          <span className="field-input__icon" aria-hidden="true">
            <NavIcon name="phone" />
          </span>
          <CountryCodeSelect country={country} onChange={onCountryChange} />
          <input
            id="input-phone"
            className="form-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter your mobile number"
            maxLength={15}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="input-dob">
          Date of Birth
        </label>
        <div className="field-input">
          <span className="field-input__icon" aria-hidden="true">
            <NavIcon name="calendar" />
          </span>
          <input
            id="input-dob"
            className="form-input"
            type="date"
            autoComplete="bday"
            max={today}
            value={dob}
            onChange={(e) => onDobChange(e.target.value)}
          />
        </div>
      </div>

      {isReservationCheckout && (
        <div className="form-group">
          <label className="form-label" htmlFor="input-email">
            Email
          </label>
          <div className="field-input">
            <input
              id="input-email"
              className="form-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="input-people">
          Number of People
        </label>
        <div className="field-input">
          <span className="field-input__icon" aria-hidden="true">
            <NavIcon name="users" />
          </span>
          <select
            id="input-people"
            className="form-select form-select--full"
            value={people}
            onChange={(e) => onPeopleChange(e.target.value)}
            required
          >
            <option value="" disabled>
              Select number of guests
            </option>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} Guest{n > 1 ? "s" : ""}
              </option>
            ))}
            <option value="8">8+ Guests</option>
          </select>
        </div>
      </div>

      {isReservationCheckout && (
        <div className="form-group">
          <label className="form-label" htmlFor="input-email">
            Email
          </label>
          <div className="field-input">
            <input
              id="input-email"
              className="form-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="input-order-date">
          {isReservationCheckout ? "Reservation Date" : "Order Date"}
        </label>
        <div className="field-input">
          <input
            id="input-order-date"
            className="form-input"
            type="date"
            min={today}
            value={reservationDate}
            onChange={(e) => onReservationDateChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="input-order-time">
          {isReservationCheckout ? "Reservation Time" : "Order Time"}
        </label>
        <div className="field-input">
          <input
            id="input-order-time"
            className="form-input"
            type="time"
            value={reservationTime}
            onChange={(e) => onReservationTimeChange(e.target.value)}
            required
          />
        </div>
      </div>

      {isReservationCheckout && (
        <div className="form-group">
          <label className="form-label" htmlFor="input-special-request">
            Special Request
          </label>
          <div className="field-input">
            <textarea
              id="input-special-request"
              className="form-input"
              placeholder="Any special request"
              value={specialRequest}
              onChange={(e) => onSpecialRequestChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {!isLiveSportsReservation && (
        <div className="form-group">
          <label className="form-label" htmlFor="input-table">
            Table Number
          </label>
          <div className="field-input">
            <span className="field-input__icon" aria-hidden="true">
              <NavIcon name="table" />
            </span>
            <select
              id="input-table"
              className="form-input"
              value={tableId}
              onChange={(e) => onTableChange(e.target.value)}
              required={tableRequired}
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
          <p className="form-help">{table || "Choose your table number to continue."}</p>
        </div>
      )}
    </div>
  );
}
