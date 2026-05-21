export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
      style={{
        borderColor: "var(--border-glass)",
        background: "var(--surface-glass)",
        color: "var(--primary)",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: "14px", lineHeight: 1 }}
        aria-hidden
      >
        network_intelligence
      </span>
      {children}
    </span>
  );
}
