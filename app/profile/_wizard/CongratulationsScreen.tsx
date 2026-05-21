"use client";

import { useRouter } from "next/navigation";
import { Confetti } from "./Confetti";

export function CongratulationsScreen() {
  const router = useRouter();
  return (
    <div
      className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center"
      style={{
        fontFamily:
          'Calibri, var(--font-calibri), "Carlito", system-ui, -apple-system, sans-serif',
      }}
    >
      <Confetti />
      <h2
        className="font-bold tracking-tight"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
          lineHeight: 1.2,
          color: "var(--dashboard-text)",
          maxWidth: "32ch",
        }}
      >
        <span aria-hidden>🎉</span> Profile complete! Your personalized
        intelligence sync is live.
      </h2>
      <p
        className="mt-3 max-w-md text-sm"
        style={{ color: "var(--dashboard-muted)" }}
      >
        We&apos;ve calibrated the Meska Brain to your interests. Head back to
        your home dashboard to see your profile at 100%.
      </p>
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
        style={{ background: "var(--neon-blue-gradient)" }}
      >
        Go to Home
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "20px" }}
          aria-hidden
        >
          arrow_forward
        </span>
      </button>
    </div>
  );
}
