interface Props {
  isLiveSportsReservation: boolean;
  isCustomMomentReservation: boolean;
  isOfferReservation: boolean;
  liveSportsDetails: Array<[string, string]>;
  selectedDetails: Array<[string, string]>;
  momentName: string;
  onMomentNameChange: (value: string) => void;
  urlOfferName: string;
  urlOfferPrice: string;
  urlOfferDescription: string;
}

export function BookingSummary({
  isLiveSportsReservation,
  isCustomMomentReservation,
  isOfferReservation,
  liveSportsDetails,
  selectedDetails,
  momentName,
  onMomentNameChange,
  urlOfferName,
  urlOfferPrice,
  urlOfferDescription,
}: Props) {
  return (
    <>
      {isLiveSportsReservation && !isCustomMomentReservation && liveSportsDetails.length > 0 && (
        <section className="checkout-event-details" aria-label="Selected live sports fixture">
          <p className="checkout__eyebrow">Selected fixture</p>
          <div className="checkout-event-details__grid">
            {liveSportsDetails.map(([label, value]) => (
              <div className="checkout-event-details__item" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedDetails.length > 0 && (
        <section className="checkout-event-details" aria-label="Selected booking details">
          <p className="checkout__eyebrow">Selected booking</p>
          <div className="checkout-event-details__grid">
            {selectedDetails
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div className="checkout-event-details__item" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
          </div>
        </section>
      )}

      {isCustomMomentReservation && (
        <div className="form-group checkout-event-details" style={{ marginBottom: "1.5rem" }}>
          <label className="form-label" htmlFor="input-moment-name">
            Selected Moment
          </label>
          <input
            id="input-moment-name"
            className="form-input"
            type="text"
            value={momentName}
            onChange={(event) => onMomentNameChange(event.target.value)}
            required
          />
        </div>
      )}

      {isOfferReservation && (
        <section className="checkout-event-details checkout-offer-summary" aria-label="Selected offer">
          <p className="checkout__eyebrow">Selected offer</p>
          <h2>{urlOfferName}</h2>
          {urlOfferPrice && <strong>{urlOfferPrice}</strong>}
          {urlOfferDescription && <p>{urlOfferDescription}</p>}
        </section>
      )}
    </>
  );
}
