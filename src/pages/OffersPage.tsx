import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { getOffers } from "@/api/offer.api";
import { useSession } from "@/context/SessionContext";
import { useToast } from "@/context/ToastContext";
import type { Offer } from "@/types/offer.types";

export function OffersPage() {
  const navigate = useNavigate();
  const { session, hasSession } = useSession();
  const { showToast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;
    setIsLoading(true);
    getOffers(session.companyId, session.branchId)
      .then((nextOffers) => {
        if (!cancelled) setOffers(nextOffers);
      })
      .catch((error) => {
        console.error("Could not load offers", error);
        if (!cancelled) showToast("Could not load offers right now");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasSession, session.branchId, session.companyId, showToast]);

  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId);

  const continueToCheckout = () => {
    if (!selectedOffer) {
      showToast("Select an offer first");
      return;
    }
    const params = new URLSearchParams({
      reservationCategory: "OFFER",
      offerId: selectedOffer.id,
      offerName: selectedOffer.title,
      offerDescription: selectedOffer.description,
      returnTo: "/offers",
      ...(selectedOffer.price ? { offerPrice: selectedOffer.price } : {}),
      hideSteps: "true",
    });
    navigate(`/checkout?${params.toString()}`);
  };

  return (
    <main className="page offers-page">
      <Header />
      <div className="offers-page__content">
        <header className="offers-page__intro">
          <p className="checkout__eyebrow">Desire Sheesha Lounge</p>
          <h1 className="checkout__title">Exclusive Offers</h1>
          <p className="checkout__hint">More reasons to visit. More reasons to stay.</p>
          <span className="checkout__ornament" aria-hidden="true" />
        </header>

        {isLoading && <p className="offers-state">Loading today&apos;s offers...</p>}
        {!isLoading && offers.length === 0 && <p className="offers-state">No offers are available right now.</p>}
        <section className="offer-grid" aria-label="Available offers">
          {offers.map((offer) => {
            const selected = offer.id === selectedOfferId;
            return (
              <button
                type="button"
                className={`offer-card${offer.featured ? " offer-card--featured" : ""}${selected ? " is-selected" : ""}`}
                key={offer.id}
                aria-pressed={selected}
                onClick={() => setSelectedOfferId(offer.id)}
              >
                <span className="offer-card__check" aria-hidden="true">{selected ? "✓" : ""}</span>
                <span className="offer-card__title">{offer.title}</span>
                {offer.meta && <span className="offer-card__meta">{offer.meta}</span>}
                <span className="offer-card__description">{offer.description}</span>
                {offer.details?.length ? (
                  <span className="offer-card__details">{offer.details.slice(0, 3).join(" • ")}</span>
                ) : null}
                {offer.price && <span className="offer-card__price">{offer.price}</span>}
              </button>
            );
          })}
        </section>
        <button type="button" className="btn btn-primary offers-page__continue" onClick={continueToCheckout} disabled={!selectedOffer}>
          Continue to reservation <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}