import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useSession } from "@/context/SessionContext";

export function HomePage() {
  const { captureSession, websiteConfig, websiteConfigStatus, websiteConfigError } = useSession();
  const [entryError, setEntryError] = useState<string | null>(null);
  const siteName = websiteConfig?.siteName || websiteConfig?.companyName || "The Desire Sheesha Lounge";
  const [brandWord, ...brandDescription] = siteName.trim().replace(/^the\s+/i, "").split(/\s+/);
  const styledBrandWord = brandWord
    ? `${brandWord.charAt(0).toUpperCase()}${brandWord.slice(1).toLowerCase()}`
    : "Desire";
  const brandSubtitle =
    brandDescription.join(" ") || websiteConfig?.branchName || "Sheesha Lounge";
  const phoneNumber = websiteConfig?.phone
    ? `${websiteConfig.countryCode || ""}${websiteConfig.phone}`.replace(/[^\d+]/g, "")
    : null;

  const handleMenuNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (captureSession()) {
      setEntryError(null);
      return;
    }

    event.preventDefault();
    setEntryError(
      websiteConfigStatus === "failed"
        ? `Restaurant details could not be loaded: ${websiteConfigError || "Please refresh and try again."}`
        : "Restaurant details are still loading. Please try again in a moment."
    );
  };

  return (
    <main className="page">
      <div className="hero">
        <div className="hero__bg" role="img" aria-label="Lounge interior with hookah and gourmet food" />

        <Header />

        <div className="hero__content">
          <p className="hero__eyebrow hero-anim">Welcome to</p>
          <h1 className="hero__title hero-anim">
            The <span className="text-amp">{styledBrandWord}</span>
            {brandDescription.length ? ` ${brandDescription.join(" ")}` : ""}
          </h1>
          <p className="hero__subtitle hero-anim">{brandSubtitle}</p>
          <span className="hero__divider hero-anim" aria-hidden="true" />
          <p className="hero__lead hero-anim">
            Where premium food <br /> meets premium sheesha.
          </p>
          <Link to="/categories" className="btn btn-primary hero-anim" onClick={handleMenuNavigation}>
            Explore Menu
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M4 5h7v14H4zM13 5h7v14h-7z" strokeLinejoin="round" />
              <path d="M11 5v14M13 5v14" strokeLinecap="round" />
            </svg>
          </Link>
          <Link to="/offers" className="btn btn-outline hero-anim" onClick={handleMenuNavigation}>
            View Exclusive Offers
          </Link>
          {(websiteConfig?.address || (websiteConfig?.phone && phoneNumber)) && (
            <address className="hero__contact hero-anim">
              {websiteConfig.address && <span>{websiteConfig.address}</span>}
              {websiteConfig.phone && phoneNumber && (
                <a href={`tel:${phoneNumber}`}>
                  {websiteConfig.countryCode ? `${websiteConfig.countryCode} ` : ""}
                  {websiteConfig.phone}
                </a>
              )}
              {websiteConfig.timezone && <span>{websiteConfig.timezone}</span>}
            </address>
          )}
          {entryError && <p className="text-sm text-red-700" role="alert">{entryError}</p>}
        </div>
      </div>
    </main>
  );
}
