import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useSession } from "@/context/SessionContext";

export function HomePage() {
  const { captureSession } = useSession();

  return (
    <main className="page">
      <div className="hero">
        <div className="hero__bg" role="img" aria-label="Lounge interior with hookah and gourmet food" />

        <Header />

        <div className="hero__content">
          <p className="hero__eyebrow hero-anim">Welcome to</p>
          <h1 className="hero__title hero-anim">
            The <span className="text-amp">Desire</span> Sheesha Lounge
          </h1>
          <p className="hero__subtitle hero-anim">Sheesha Lounge</p>
          <span className="hero__divider hero-anim" aria-hidden="true" />
          <p className="hero__lead hero-anim">
            Where premium food <br /> meets premium sheesha.
          </p>
          <Link to="/categories" className="btn btn-primary hero-anim" onClick={captureSession}>
            Explore Menu
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M4 5h7v14H4zM13 5h7v14h-7z" strokeLinejoin="round" />
              <path d="M11 5v14M13 5v14" strokeLinecap="round" />
            </svg>
          </Link>
          <Link to="/offers" className="btn btn-outline hero-anim" onClick={captureSession}>
            View Exclusive Offers
          </Link>
        </div>
      </div>
    </main>
  );
}
