import { useEffect, useState } from "react";

/** Mirrors the original initHeaderScroll(): true once the user has scrolled past ~16px. */
export function useHeaderScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const enterAt = 16;
    const leaveAt = 4;

    const sync = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (!prev && y > enterAt) return true;
        if (prev && y <= leaveAt) return false;
        return prev;
      });
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return scrolled;
}
