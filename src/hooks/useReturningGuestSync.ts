import { useEffect, useState } from "react";
import { getCustomerByMobile } from "@/api/customer.api";
import { isValidPhone, normalizeDob } from "@/utils/checkoutReservation";
import type { GuestType } from "@/types/cart.types";

interface ReturningFromDeviceLike {
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  guestName?: string | null;
  countryCode?: string | null;
  mobile?: string | null;
  dateOfBirth?: string | null;
}

interface SessionLike {
  companyId?: string | null;
  tableNumber?: string | null;
}

interface FieldSetters {
  setName: (updater: (prev: string) => string) => void;
  setCountryCode: (updater: (prev: string) => string) => void;
  setPhone: (updater: (prev: string) => string) => void;
  setPhoneReturn: (updater: (prev: string) => string) => void;
  setDob: (updater: (prev: string) => string) => void;
  setPeople: (updater: (prev: string) => string) => void;
  setTable: (updater: (prev: string) => string) => void;
  setTableReturn: (updater: (prev: string) => string) => void;
  setGuestType: (value: GuestType) => void;
}

/**
 * Owns everything related to resolving "who is this returning guest":
 *  - mirrors checkDevice's returningFromDevice into the form fields, then
 *    confirms it against the backend (FIX: used to silently skip this
 *    confirmation if session.companyId wasn't ready yet on first run,
 *    leaving returningCustomer/lookedUpMobile empty even though the name/
 *    phone fields were already filled — causing a false "No account found"
 *    at submit time)
 *  - keeps table / tableReturn in sync once session.tableNumber resolves
 *    (FIX: previously only read once at useState init, so a table number
 *    that arrived asynchronously from SessionContext never auto-filled)
 *  - does the manual mobile-number lookup when there's no device guest
 */
export function useReturningGuestSync(
  returningFromDevice: ReturningFromDeviceLike | null,
  session: SessionLike,
  guestType: GuestType,
  countryCode: string,
  phoneReturn: string,
  deviceStatus: string,
  fields: FieldSetters
) {
  const [isLookingUpGuest, setIsLookingUpGuest] = useState(deviceStatus === "loading");
  const [returningCustomer, setReturningCustomer] =
    useState<Awaited<ReturnType<typeof getCustomerByMobile>>>(null);
  const [lookedUpMobile, setLookedUpMobile] = useState("");

  const {
    setName,
    setCountryCode,
    setPhone,
    setPhoneReturn,
    setDob,
    setPeople,
    setTable,
    setTableReturn,
    setGuestType,
  } = fields;

  // Device-detected guest → pre-fill fields, then confirm via API once
  // companyId is actually available.
  useEffect(() => {
    if (!returningFromDevice || !session.companyId) return;

    if (returningFromDevice.guestName) {
      setName((prev) => prev || returningFromDevice.guestName!);
    }
    if (returningFromDevice.countryCode) {
      setCountryCode((prev) => prev || returningFromDevice.countryCode!);
    }
    if (returningFromDevice.mobile) {
      setPhone((prev) => prev || returningFromDevice.mobile!);
      setPhoneReturn((prev) => prev || returningFromDevice.mobile!);
    }
    if (returningFromDevice.dateOfBirth) {
      setDob((prev) => prev || normalizeDob(returningFromDevice.dateOfBirth));
    }

    const strippedMobile = returningFromDevice.mobile?.replace(/\D/g, "");
    if (!strippedMobile) return;

    getCustomerByMobile({
      countryCode: returningFromDevice.countryCode || countryCode,
      mobile: strippedMobile,
      companyId: session.companyId,
    })
      .then((cust) => {
        if (cust) {
          setReturningCustomer(cust);
          setLookedUpMobile(strippedMobile);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returningFromDevice?.customerId, session.companyId]);

  // Table number can resolve after mount — keep it synced.
  useEffect(() => {
    if (!session.tableNumber) return;
    setTable((prev) => prev || session.tableNumber!);
    setTableReturn((prev) => prev || session.tableNumber!);
  }, [session.tableNumber]);

  // Manual mobile-based lookup — only when checkDevice hasn't already
  // resolved the guest.
  useEffect(() => {
    const mobile = phoneReturn.replace(/\D/g, "");

    if (returningFromDevice) return;

    setReturningCustomer(null);
    setLookedUpMobile("");

    if (guestType !== "returning" || !session.companyId || !isValidPhone(mobile, countryCode)) {
      return;
    }

    let cancelled = false;
    setIsLookingUpGuest(true);

    getCustomerByMobile({ countryCode, mobile, companyId: session.companyId })
      .then((customer) => {
        if (cancelled) return;

        setReturningCustomer(customer);
        setLookedUpMobile(mobile);

        if (customer) {
          setGuestType("returning");
          const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
          if (fullName) setName((prev) => prev || fullName);
          if (customer.countryCode) setCountryCode((prev) => prev || customer.countryCode!);
          if (customer.mobile) {
            setPhone((prev) => prev || customer.mobile!);
            setPhoneReturn((prev) => prev || customer.mobile!);
          }
          if (customer.dob) setDob((prev) => prev || normalizeDob(customer.dob));
          if (customer.guestCount) setPeople((prev) => prev || String(customer.guestCount));
        }
      })
      .catch((error) => {
        if (!cancelled) console.error("Could not look up returning guest", error);
      })
      .finally(() => {
        if (!cancelled) setIsLookingUpGuest(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode, guestType, phoneReturn, session.companyId, returningFromDevice]);

  return { isLookingUpGuest, setIsLookingUpGuest, returningCustomer, lookedUpMobile };
}