import { NavIcon } from "@/components/ui/Icon";

interface Props {
  name: string;
  onNameChange: (v: string) => void;
  countryCode: string;
  onCountryCodeChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  dob: string;
  onDobChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  people: string;
  onPeopleChange: (v: string) => void;
  table: string;
  onTableChange: (v: string) => void;
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
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  dob,
  onDobChange,
  email,
  onEmailChange,
  people,
  onPeopleChange,
  table,
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
          <select
            className="form-select form-select--code"
            aria-label="Country code"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
          >
            <option value="+971">🇦🇪 +971</option>
            <option value="+91">🇮🇳 +91</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
          </select>
          <input
            id="input-phone"
            className="form-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter your mobile number"
            maxLength={10}
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
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="input-reservation-date">
              Reservation Date
            </label>
            <div className="field-input">
              <input
                id="input-reservation-date"
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
            <label className="form-label" htmlFor="input-reservation-time">
              Reservation Time
            </label>
            <div className="field-input">
              <input
                id="input-reservation-time"
                className="form-input"
                type="time"
                value={reservationTime}
                onChange={(e) => onReservationTimeChange(e.target.value)}
                required
              />
            </div>
          </div>

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
        </>
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
            <input
              id="input-table"
              className="form-input"
              type="text"
              inputMode="numeric"
              placeholder="Enter your table number"
              value={table}
              onChange={(e) => onTableChange(e.target.value)}
              required={tableRequired}
            />
          </div>
          <p className="form-help">You can find your table number on your table.</p>
        </div>
      )}
    </div>
  );
}
