import { NavIcon } from "@/components/ui/Icon";

interface Props {
  countryCode: string;
  mobile: string;
  table: string;
  isLiveSportsReservation: boolean;
  isReservationCheckout: boolean;
  reservationDate: string;
  reservationTime: string;
}

export function ReturningGuestSummary({
  countryCode,
  mobile,
  table,
  isLiveSportsReservation,
  isReservationCheckout,
  reservationDate,
  reservationTime,
}: Props) {
  return (
    <div className="checkout-fields checkout-fields--stack">
      <div className="form-group">
        <label className="form-label">Mobile Number</label>
        <div className="checkout-summary-field">
          <span className="field-input__icon" aria-hidden="true">
            <NavIcon name="phone" />
          </span>
          <span className="checkout-summary-field__value">
            {countryCode} {mobile}
          </span>
        </div>
      </div>

      {!isLiveSportsReservation && (
        <div className="form-group">
          <label className="form-label">Table Number</label>
          <div className="checkout-summary-field">
            <span className="field-input__icon" aria-hidden="true">
              <NavIcon name="table" />
            </span>
            <span className="checkout-summary-field__value">{table || "—"}</span>
          </div>
        </div>
      )}

      {/* {isReservationCheckout && (
        <>
          <div className="form-group">
            <label className="form-label">Reservation Date</label>
            <div className="checkout-summary-field">
              <span className="checkout-summary-field__value">
                {reservationDate || new Date().toISOString().split("T")[0]}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reservation Time</label>
            <div className="checkout-summary-field">
              <span className="checkout-summary-field__value">
                {reservationTime || new Date().toTimeString().slice(0, 5)}
              </span>
            </div>
          </div>
        </>
      )} */}
    </div>
  );
}
