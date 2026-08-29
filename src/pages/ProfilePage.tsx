import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { NavIcon } from "@/components/ui/Icon";

export function ProfilePage() {
  return (
    <main className="page">
      <Header />
      <h1 className="page-title">Profile</h1>
      <div className="section text-center" style={{ maxWidth: 380 }}>
        <div className="profile-avatar">
          <NavIcon name="profile" />
        </div>
        <h2 className="font-display text-2xl mb-2">Guest</h2>
        <p className="text-brand-muted text-sm mb-8">Sign in coming soon. Enjoy browsing as a guest.</p>
        <Link to="/categories" className="btn btn-primary">
          Explore Menu
        </Link>
      </div>
    </main>
  );
}
