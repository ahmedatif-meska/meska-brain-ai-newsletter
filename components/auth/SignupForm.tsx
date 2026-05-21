"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupWithPassword } from "@/app/(auth)/_actions/signup";
import { type FieldError } from "@/lib/validation/signup";

type ErrorMap = Partial<Record<FieldError["field"], string>>;

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("email", email);
    formData.set("password", password);
    setErrors({});
    startTransition(async () => {
      const result = await signupWithPassword(null, formData);
      if (result.ok) {
        router.push(result.redirect);
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
    <>
      <div className="space-y-2 text-center">
        <h2 className="font-display text-[28px] font-semibold leading-9 text-white">
          Create account
        </h2>
        <p className="text-sm text-white/60">
          Skip the feed. Get the brief.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-2">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block px-4 text-left text-xs font-semibold uppercase tracking-wider text-white/80"
              >
                First Name <span className="text-red-400" aria-hidden>*</span>
                <span className="sr-only">(required)</span>
              </label>
              <div className="relative flex items-center">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-4 text-white/60"
                  aria-hidden
                >
                  person
                </span>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoComplete="given-name"
                  aria-invalid={errors.firstName ? "true" : undefined}
                  className="w-full rounded-full border bg-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
                  style={{
                    borderColor: errors.firstName
                      ? "var(--error-border)"
                      : "rgba(255, 255, 255, 0.12)",
                    // @ts-expect-error custom property for tailwind ring color
                    "--tw-ring-color": "rgba(174, 198, 255, 0.5)",
                  }}
                />
              </div>
              {errors.firstName && (
                <p className="px-4 text-left text-xs text-red-300" role="alert">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block px-4 text-left text-xs font-semibold uppercase tracking-wider text-white/80"
              >
                Last Name <span className="text-red-400" aria-hidden>*</span>
                <span className="sr-only">(required)</span>
              </label>
              <div className="relative flex items-center">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-4 text-white/60"
                  aria-hidden
                >
                  person
                </span>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                  aria-invalid={errors.lastName ? "true" : undefined}
                  className="w-full rounded-full border bg-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
                  style={{
                    borderColor: errors.lastName
                      ? "var(--error-border)"
                      : "rgba(255, 255, 255, 0.12)",
                    // @ts-expect-error custom property for tailwind ring color
                    "--tw-ring-color": "rgba(174, 198, 255, 0.5)",
                  }}
                />
              </div>
              {errors.lastName && (
                <p className="px-4 text-left text-xs text-red-300" role="alert">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block px-4 text-left text-xs font-semibold uppercase tracking-wider text-white/80"
            >
              Email Address <span className="text-red-400" aria-hidden>*</span>
              <span className="sr-only">(required)</span>
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

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block px-4 text-left text-xs font-semibold uppercase tracking-wider text-white/80"
            >
              Password <span className="text-red-400" aria-hidden>*</span>
              <span className="sr-only">(required)</span>
            </label>
            <div className="relative flex items-center">
              <span
                className="material-symbols-outlined pointer-events-none absolute left-4 text-white/60"
                aria-hidden
              >
                lock
              </span>
              <input
                id="password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={errors.password ? "true" : undefined}
                className="w-full rounded-full border bg-white/5 py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
                style={{
                  borderColor: errors.password
                    ? "var(--error-border)"
                    : "rgba(255, 255, 255, 0.12)",
                  // @ts-expect-error custom property for tailwind ring color
                  "--tw-ring-color": "rgba(174, 198, 255, 0.5)",
                }}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((v) => !v)}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                className="material-symbols-outlined absolute right-4 cursor-pointer text-white/60 hover:text-white"
              >
                {passwordVisible ? "visibility" : "visibility_off"}
              </button>
            </div>
            {errors.password && (
              <p className="px-4 text-left text-xs text-red-300" role="alert">
                {errors.password}
              </p>
            )}
          </div>
        </div>

        {errors.form && (
          <p className="text-center text-xs text-red-300" role="alert">
            {errors.form}
          </p>
        )}

        <div className="space-y-4 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full py-4 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg, rgb(0, 201, 252) 0%, rgb(10, 114, 243) 100%)",
            }}
          >
            {pending ? "Creating account…" : "Sign up"}
          </button>
          <Link
            href="/signin"
            className="block w-full rounded-full border py-4 text-center text-sm font-semibold text-white transition-all hover:bg-white/5 active:scale-95"
            style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </form>

      <p className="text-center text-[10px] leading-relaxed text-white/60">
        By signing up, you agree to the
        <br />
        <Link href="/terms" className="underline" style={{ color: "rgba(174, 198, 255, 0.8)" }}>
          Terms and Conditions
        </Link>
        .
      </p>
    </>
  );
}
