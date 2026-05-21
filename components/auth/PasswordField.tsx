"use client";

import { useState } from "react";

export function PasswordField({
  name,
  value,
  onChange,
  error,
  autoComplete = "new-password",
  placeholder = "••••••••",
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const borderStyle: React.CSSProperties = {
    borderColor: error ? "var(--error-border)" : "var(--border-glass)",
    background: "rgba(255, 255, 255, 0.05)",
  };

  return (
    <div className="relative flex items-center">
      <span
        className="material-symbols-outlined pointer-events-none absolute left-4 text-white/40"
        style={{ fontSize: "20px" }}
        aria-hidden
      >
        lock
      </span>
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        className="w-full rounded-full border py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
        style={{
          ...borderStyle,
          // @ts-expect-error custom prop for focus ring color via Tailwind plugin not available — use inline ring fallback
          "--tw-ring-color": "rgba(174, 198, 255, 0.5)",
        }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-4 text-white/40 transition hover:text-white"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }} aria-hidden>
          {visible ? "visibility" : "visibility_off"}
        </span>
      </button>
    </div>
  );
}
