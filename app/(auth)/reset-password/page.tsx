import Link from "next/link";
import { Wordmark } from "@/components/chrome/Wordmark";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col"
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

          <ResetPasswordForm />

          <div className="flex items-center justify-center gap-2 text-xs text-white/60">
            <Link
              href="/signin"
              className="underline"
              style={{ color: "rgba(174, 198, 255, 0.8)" }}
            >
              Back to sign in
            </Link>
            <span aria-hidden>Â·</span>
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
