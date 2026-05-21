"use client";

import type { PasswordStrength } from "@/lib/validation/signup";

const LABELS: Record<PasswordStrength, string> = {
  empty: "",
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",
};

const FILLED: Record<PasswordStrength, number> = {
  empty: 0,
  weak: 1,
  medium: 2,
  strong: 3,
};

const SEGMENT_TINT: Record<PasswordStrength, string> = {
  empty: "rgba(255,255,255,0.15)",
  weak: "#ef4444",
  medium: "#f59e0b",
  strong: "var(--neon-blue-mid)",
};

export function PasswordStrengthMeter({ strength }: { strength: PasswordStrength }) {
  const filled = FILLED[strength];
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              background: i < filled ? SEGMENT_TINT[strength] : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
      <span className="w-12 text-right text-[10px] font-medium uppercase tracking-wider text-blue-100/70">
        {LABELS[strength]}
      </span>
    </div>
  );
}
