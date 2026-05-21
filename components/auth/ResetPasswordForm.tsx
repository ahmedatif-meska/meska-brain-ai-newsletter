"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/(auth)/_actions/reset-password";
import { type FieldError } from "@/lib/validation/signup";

type ErrorMap = Partial<Record<FieldError["field"], string>>;

export function ResetPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ErrorMap>({});
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setErrors({});
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const result = await requestPasswordReset(null, fd);
      if (result.ok) {
        setSent(true);
        return;
      }
      const map: ErrorMap = {};
      for (const err of result.errors) {
        if (!map[err.field]) map[err.field] = err.message;
      }
      setErrors(map);
    });
  }

  if (sent) {
    return (
      <div
        className="rounded-2xl border px-4 py-4 text-center text-sm text-white/80"
        style={{
          borderColor: "rgba(0, 201, 252, 0.4)",
          background: "rgba(0, 201, 252, 0.08)",
        }}
        role="status"
      >
        If an account exists for{" "}
        <span className="font-semibold text-white">{email}</span>, a reset link
        is on its way. Check your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block px-4 text-left text-xs font-semibold uppercase tracking-wider text-white/80"
        >
          Email Address
        </label>
        <div className="relative flex items-center">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-4 text-white/60"
            aria-hidden
          >
            mail
          </span>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : undefined}
            className="w-full rounded-full border bg-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
            style={{
              borderColor: errors.email
                ? "var(--error-border)"
                : "rgba(255, 255, 255, 0.12)",
              // @ts-expect-error custom property for tailwind ring color
              "--tw-ring-color": "rgba(174, 198, 255, 0.5)",
            }}
          />
        </div>
        {errors.email && (
          <p className="px-4 text-left text-xs text-red-300" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {errors.form && (
        <p className="text-center text-xs text-red-300" role="alert">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full py-4 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--neon-blue-gradient)" }}
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
