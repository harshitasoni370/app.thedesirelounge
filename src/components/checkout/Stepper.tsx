import { NavIcon } from "@/components/ui/Icon";

interface StepperProps {
  active: "details" | "confirmation";
  hidden?: boolean;
}

export function Stepper({ active, hidden = false }: StepperProps) {
  if (hidden) return null;

  return (
    <ol className="stepper" aria-label="Checkout progress">
      <li className="stepper__item is-done">
        <span className="stepper__dot" aria-hidden="true">
          <NavIcon name="step-menu" />
          <span className="stepper__check">
            <NavIcon name="check" />
          </span>
        </span>
        <span className="stepper__label">Menu</span>
      </li>
      <li className="stepper__item is-done">
        <span className="stepper__dot" aria-hidden="true">
          <NavIcon name="step-cart" />
          <span className="stepper__check">
            <NavIcon name="check" />
          </span>
        </span>
        <span className="stepper__label">Cart</span>
      </li>
      <li className={`stepper__item${active === "details" ? " is-active" : " is-done"}`} aria-current={active === "details" ? "step" : undefined}>
        <span className="stepper__dot" aria-hidden="true">
          <NavIcon name="step-user" />
          {active !== "details" && (
            <span className="stepper__check">
              <NavIcon name="check" />
            </span>
          )}
        </span>
        <span className="stepper__label">Your Details</span>
      </li>
      <li className={`stepper__item${active === "confirmation" ? " is-active" : ""}`} aria-current={active === "confirmation" ? "step" : undefined}>
        <span className="stepper__dot" aria-hidden="true">
          <NavIcon name="step-confirm" />
        </span>
        <span className="stepper__label">Confirmation</span>
      </li>
    </ol>
  );
}
