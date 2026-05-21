import Link from "next/link";
import type { ProfileCompletion } from "@/lib/profile/completion";

export function ProfileProgressCard({
  completion,
}: {
  completion: ProfileCompletion;
}) {
  const { percent } = completion;
  const isComplete = percent === 100;

  return (
    <section
      className="rounded-3xl border p-6 sm:p-8"
      style={{
        background: "var(--dashboard-surface)",
        borderColor: "var(--dashboard-track)",
        boxShadow: "0 10px 30px rgba(11, 30, 59, 0.06)",
      }}
      aria-label="Profile progress"
    >
      <div className="flex flex-col items-center text-center">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "44px", color: "var(--primary-deep)" }}
          aria-hidden
        >
          account_circle
        </span>
        <h2
          className="mt-3 font-display text-xl font-semibold leading-[1.3] sm:text-2xl"
          style={{
            color: "var(--dashboard-text)",
            paddingBottom: "2px",
            fontVariantLigatures: "none",
          }}
        >
          Profile Progress
        </h2>
        <p
          className="mt-2 max-w-xs text-sm leading-relaxed"
          style={{ color: "var(--dashboard-muted)" }}
        >
          Finish setting up your profile to unlock personalized delivery.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
        <span style={{ color: "var(--dashboard-muted)" }}>Completion status</span>
        <span style={{ color: "var(--primary-deep)" }}>{percent}%</span>
      </div>

      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--dashboard-track)" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            background: "var(--neon-blue-gradient)",
          }}
        />
      </div>

      <div className="mt-6">
        {isComplete ? (
          <p
            className="text-center text-sm font-semibold"
            style={{ color: "var(--primary-deep)" }}
            role="status"
          >
            Profile complete ✓
          </p>
        ) : (
          <Link
            href="/profile"
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--neon-blue-gradient)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }} aria-hidden>
              person_add
            </span>
            Complete Profile
          </Link>
        )}
      </div>
    </section>
  );
}
