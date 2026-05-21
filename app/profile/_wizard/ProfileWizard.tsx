"use client";

import { useCallback, useState } from "react";
import { StepIndicator } from "./StepIndicator";
import { Form1Identity } from "./Form1Identity";
import { Form2Curation } from "./Form2Curation";
import { Form3Finalize } from "./Form3Finalize";
import { CongratulationsScreen } from "./CongratulationsScreen";
import type {
  ProfileIdentityRow,
  ProfileCurationRow,
  ProfileFinalizeRow,
} from "@/lib/profile/schema";

export type WizardStep = "identity" | "curate" | "finalize" | "done";

export function ProfileWizard({
  firstNameDefault,
  lastNameDefault,
  initial,
}: {
  firstNameDefault: string;
  lastNameDefault: string;
  initial: {
    identity: ProfileIdentityRow | null;
    curation: ProfileCurationRow | null;
    finalize: ProfileFinalizeRow | null;
  };
}) {
  const [step, setStep] = useState<WizardStep>("identity");

  const goTo = useCallback((next: WizardStep) => {
    setStep(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  if (step === "done") {
    return <CongratulationsScreen />;
  }

  return (
    <div
      className="space-y-8"
      style={{
        fontFamily:
          'Calibri, var(--font-calibri), "Carlito", system-ui, -apple-system, sans-serif',
      }}
    >
      <StepIndicator step={step} />

      <section
        className="rounded-3xl border p-6 sm:p-10"
        style={{
          background: "var(--dashboard-surface)",
          borderColor: "var(--dashboard-track)",
          boxShadow: "0 10px 30px rgba(11,30,59,0.06)",
        }}
        aria-live="polite"
      >
        {step === "identity" && (
          <Form1Identity
            firstNameDefault={firstNameDefault}
            lastNameDefault={lastNameDefault}
            initial={initial.identity}
            onSaved={() => goTo("curate")}
          />
        )}
        {step === "curate" && (
          <Form2Curation
            initial={initial.curation}
            onSaved={() => goTo("finalize")}
            onBack={() => goTo("identity")}
          />
        )}
        {step === "finalize" && (
          <Form3Finalize
            initial={initial.finalize}
            onSubmitted={() => goTo("done")}
            onBack={() => goTo("curate")}
          />
        )}
      </section>
    </div>
  );
}
