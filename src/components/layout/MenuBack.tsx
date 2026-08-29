import { Link } from "react-router-dom";
import { NavIcon } from "@/components/ui/Icon";

export function MenuBack({ to, label }: { to: string; label: string }) {
  return (
    <div className="menu-toolbar">
      <Link to={to} className="menu-back">
        <NavIcon name="back" />
        {label}
      </Link>
    </div>
  );
}
