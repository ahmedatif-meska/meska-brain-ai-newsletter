"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/(auth)/_actions/reset-password";
import { type FieldError } from "@/lib/validation/signup";

type ErrorMap = Partial<Record<FieldError["field"], string>>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setErrors({});
    const fd = new FormData();
    fd.set("password", password);
    fd.set("confirm", confirm);
    startTransition(async () => {
      const result = await updatePassword(null, fd);
      if (result.ok) {
        router.push(result.redirect);
        router.refresh();
        return;
      }
      const map: ErrorMap = {};
      for (const err of result.errors) {
        if (!map[err.field]) map[err.field] = err.message;
      }
      setErrors(map);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <PasswordField
        id="password"
        label="New Password"
        value={password}
        onChange={setPassword}
        visible={visible}
        toggleVisible={() => setVisible((v) => !v)}
        autoComplete="new-password"
        error={errors.password}
      />
      <PasswordField
        id="confirm"
        label="Confirm Password"
        value={confirm}
        onChange={setConfirm}
        visible={visible}
        toggleVisible={() => setVisible((v) => !v)}
        autoComplete="new-password"
      />

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
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  toggleVisible,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  toggleVisible: () => void;
  autoComplete: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block px-4 text-left text-xs font-semibold uppercase tracking-wider text-white/80"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          className="material-symbols-outlined pointer-events-none absolute left-4 text-white/60"
          aria-hidden
        >
          lock
        </span>
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : undefined}
          className="w-full rounded-full border bg-white/5 py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
          style={{
            borderColor: error
              ? "var(--error-border)"
              : "rgba(255, 255, 255, 0.12)",
            // @ts-expect-error custom property for tailwind ring color
            "--tw-ring-color": "rgba(174, 198, 255, 0.5)",
          }}
        />
        <button
          type="button"
          onClick={toggleVisible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="material-symbols-outlined absolute right-4 cursor-pointer text-white/60 hover:text-white"
        >
          {visible ? "visibility" : "visibility_off"}
        </button>
      </div>
      {error && (
        <p className="px-4 text-left text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
