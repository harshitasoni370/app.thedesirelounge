export function Loader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="section" style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <p className="text-brand-muted text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="section" style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <p className="text-brand-muted text-sm">{message}</p>
    </div>
  );
}
