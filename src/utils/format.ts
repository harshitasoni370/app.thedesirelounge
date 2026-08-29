export function formatAED(amount: number): string {
  return `AED ${Number(amount).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

export function formatOrderTime(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "—";

  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = date.getFullYear();
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${day} ${month} ${year}, ${time}`;
}

export function formatPhone(countryCode: string | undefined, phone: string | undefined): string {
  const code = countryCode || "+971";
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "—";

  if (code === "+971" && digits.length === 9) {
    return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (code === "+91" && digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return `${code} ${digits}`;
}

export function formatTable(table: string | undefined | null): string {
  if (!table) return "—";
  const raw = String(table).trim();
  if (/^table\s+/i.test(raw)) return raw;
  return `Table ${raw}`;
}

export function generateOrderId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `F&F-${y}-${mo}${d}-${h}${mi}`;
}
