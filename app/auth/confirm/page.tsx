import Link from "next/link";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  token_hash?: string;
  type?: string;
  next?: string;
}>;

async function verifyAction(formData: FormData) {
  "use server";
  const token_hash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "") as EmailOtpType;
  const next = String(formData.get("next") ?? "/update-password");

  console.log("[auth/confirm] action invoked", {
    hasTokenHash: Boolean(token_hash),
    tokenHashLen: token_hash.length,
    type,
    next,
  });

  if (!token_hash || !type) {
    console.error("[auth/confirm] missing params, redirecting");
    redirect("/signin?reason=reset_failed");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
  console.log("[auth/confirm] verifyOtp result", {
    hasSession: Boolean(data?.session),
    hasUser: Boolean(data?.user),
    error: error ? { message: error.message, status: error.status, code: error.code } : null,
  });
  if (error) {
    redirect("/signin?reason=reset_failed");
  }
  redirect(next);
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token_hash = "", type = "", next = "/update-password" } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
        <h1 className="mb-3 text-2xl font-semibold text-white">
          Confirm password reset
        </h1>
        <p className="mb-6 text-sm text-white/70">
          Click the button below to continue resetting your Meska Brain password.
        </p>
        <form action={verifyAction}>
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          >
            Continue
          </button>
        </form>
        <p className="mt-6 text-xs text-white/50">
          If you didn&apos;t request this, you can safely ignore the email.{" "}
          <Link href="/signin" className="underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
