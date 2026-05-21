import Link from "next/link";
import { Wordmark } from "@/components/chrome/Wordmark";

export default function ResetPasswordPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ background: "var(--dark-sky)" }}
    >
      <header className="px-6 py-5 sm:px-10">
        <Wordmark tone="dark" />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="glass-card w-full max-w-md space-y-6 rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-2 text-center">
            <h1 className="font-display text-[28px] font-semibold leading-9 text-white">
              Reset your password
            </h1>
            <p className="text-sm text-white/60">
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>
          </div>

          <form noValidate className="space-y-6">
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
                  placeholder="name@company.com"
                  autoComplete="email"
                  className="w-full rounded-full border bg-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    // @ts-expect-error custom property for tailwind ring color
                    "--tw-ring-color": "rgba(174, 198, 255, 0.5)",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled
              className="w-full rounded-full py-4 text-sm font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, rgb(0, 201, 252) 0%, rgb(10, 114, 243) 100%)",
              }}
            >
              Send reset link
            </button>

            <p className="text-center text-xs text-white/40">
              Password reset ships in a later phase.
            </p>
          </form>

          <div className="flex items-center justify-center gap-2 text-xs text-white/60">
            <Link
              href="/signin"
              className="underline"
              style={{ color: "rgba(174, 198, 255, 0.8)" }}
            >
              Back to sign in
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/signup"
              className="underline"
              style={{ color: "rgba(174, 198, 255, 0.8)" }}
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
