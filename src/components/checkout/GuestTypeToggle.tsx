import { NavIcon } from "@/components/ui/Icon";
import type { GuestType } from "@/types/cart.types";

interface Props {
  guestType: GuestType;
  onChange: (type: GuestType) => void;
}

export function GuestTypeToggle({ guestType, onChange }: Props) {
  return (
    <div className="guest-toggle" role="group" aria-label="Guest type">
      <button
        type="button"
        className={`guest-toggle__btn${guestType === "new" ? " is-active" : ""}`}
        aria-pressed={guestType === "new"}
        onClick={() => onChange("new")}
      >
        <span className="guest-toggle__icon" aria-hidden="true">
          <NavIcon name="user-plus" />
        </span>
        <span className="guest-toggle__copy">
          <span className="guest-toggle__title">New Here</span>
          <span className="guest-toggle__sub">I'm a new guest.</span>
        </span>
      </button>

      <button
        type="button"
        className={`guest-toggle__btn${guestType === "returning" ? " is-active" : ""}`}
        aria-pressed={guestType === "returning"}
        onClick={() => onChange("returning")}
      >
        <span className="guest-toggle__icon" aria-hidden="true">
          <NavIcon name="user-return" />
        </span>
        <span className="guest-toggle__copy">
          <span className="guest-toggle__title">Returning</span>
          <span className="guest-toggle__sub">I've ordered here before.</span>
        </span>
      </button>
    </div>
  );
}
