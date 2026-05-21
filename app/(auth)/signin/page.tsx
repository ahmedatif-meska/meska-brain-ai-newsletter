import { StarField } from "@/components/background/StarField";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/SignInForm";
import { Wordmark } from "@/components/chrome/Wordmark";

type SearchParams = Promise<{ reason?: string; signedup?: string }>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { reason, signedup } = await searchParams;
  const banner =
    signedup === "1"
      ? "Account created. Sign in to continue."
      : reason === "existing"
        ? "This email is already registered — sign in instead."
        : undefined;

  return (
    <>
      <StarField />

      <nav
        className="fixed left-0 top-0 z-50 flex w-full items-center justify-between px-4 py-4 sm:px-16"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div className="flex items-center gap-2">
          <Wordmark tone="dark" />
        </div>
        <div className="hidden items-center gap-8 text-base md:flex" />
      </nav>

      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-12 pt-24 sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "800px",
            height: "800px",
            background: "rgba(174, 198, 255, 0.1)",
            filter: "blur(120px)",
          }}
        />

        <div className="relative z-10 w-full max-w-4xl space-y-8 text-center sm:space-y-12">
          <div className="space-y-4 sm:space-y-6">
            <div
              className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest sm:px-4 sm:text-sm"
              style={{
                borderColor: "rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "#aec6ff",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "14px" }}
                aria-hidden
              >
                hub
              </span>
              AI Hyperpersonalized Newsletter
            </div>
            <h1
              className="font-display font-bold tracking-tight text-white"
              style={{
                fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              News built for you.{" "}
              <br className="hidden md:block" />
              <span className="headline-gradient">Not for the feed</span>.
            </h1>
          </div>

          <AuthCard activeTab="signin">
            <SignInForm initialBanner={banner} />
          </AuthCard>
        </div>
      </main>
    </>
  );
}
