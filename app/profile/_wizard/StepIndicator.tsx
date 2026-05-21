type Step = "identity" | "curate" | "finalize" | "done";

const STEPS: { key: Exclude<Step, "done">; label: string }[] = [
  { key: "identity", label: "Identity" },
  { key: "curate", label: "Bio-Link" },
  { key: "finalize", label: "Finalize" },
];

export function StepIndicator({ step }: { step: Step }) {
  if (step === "done") return null;
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <ol
      className="flex w-full items-center justify-between gap-2 sm:gap-4"
      aria-label="Wizard progress"
    >
      {STEPS.map((s, i) => {
        const state: "active" | "complete" | "pending" =
          i === activeIndex ? "active" : i < activeIndex ? "complete" : "pending";
        return (
          <li
            key={s.key}
            className="flex flex-1 items-center gap-2 sm:gap-3"
            aria-current={state === "active" ? "step" : undefined}
          >
            <Circle index={i + 1} state={state} />
            <span
              className="hidden text-xs font-semibold uppercase tracking-wider sm:inline"
              style={{
                color:
                  state === "pending"
                    ? "var(--dashboard-muted)"
                    : "var(--dashboard-text)",
              }}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="ml-1 h-px flex-1 sm:ml-2"
                style={{
                  background:
                    state === "complete"
                      ? "var(--primary-deep)"
                      : "var(--dashboard-track)",
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Circle({
  index,
  state,
}: {
  index: number;
  state: "active" | "complete" | "pending";
}) {
  const base =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm";
  if (state === "active") {
    return (
      <span
        className={base}
        style={{
          background: "var(--neon-blue-gradient)",
          color: "white",
          boxShadow: "0 4px 14px rgba(10,114,243,0.35)",
        }}
        aria-label={`Step ${index}, current`}
      >
        {index}
      </span>
    );
  }
  if (state === "complete") {
    return (
      <span
        className={base}
        style={{ background: "var(--primary-deep)", color: "white" }}
        aria-label={`Step ${index}, complete`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }} aria-hidden>
          check
        </span>
      </span>
    );
  }
  return (
    <span
      className={base}
      style={{
        background: "var(--dashboard-track)",
        color: "var(--dashboard-muted)",
      }}
      aria-label={`Step ${index}, pending`}
    >
      {index}
    </span>
  );
}
