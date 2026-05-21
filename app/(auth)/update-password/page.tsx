import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/chrome/Wordmark";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/signin?reason=reset_failed");
  }

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
              Choose a new password
            </h1>
            <p className="text-sm text-white/60">
              Pick something at least 8 characters long. You&apos;ll sign in
              again afterward.
            </p>
          </div>

          <UpdatePasswordForm />

          <div className="text-center text-xs text-white/60">
            <Link
              href="/signin"
              className="underline"
              style={{ color: "rgba(174, 198, 255, 0.8)" }}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
