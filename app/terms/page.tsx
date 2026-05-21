import Link from "next/link";
import { Wordmark } from "@/components/chrome/Wordmark";

export const metadata = {
  title: "Terms & Conditions | Meska Brain",
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Introduction",
    body: "Welcome to Meska AI. These Terms and Conditions govern your use of our platform and services. By accessing or using our services, you agree to be bound by these terms. Please read them carefully before using our platform.",
  },
  {
    title: "2. Use of Services",
    body: "You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
  },
  {
    title: "3. User Accounts",
    body: "To access certain features of our platform, you may be required to create an account. You must provide accurate and complete information when creating your account. You are solely responsible for the activity that occurs on your account.",
  },
  {
    title: "4. Privacy",
    body: "Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.",
  },
  {
    title: "5. Intellectual Property",
    body: "All content, features, and functionality of our platform, including but not limited to text, graphics, logos, and software, are owned by Meska AI and are protected by intellectual property laws.",
  },
  {
    title: "6. Limitation of Liability",
    body: "To the maximum extent permitted by law, Meska AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.",
  },
  {
    title: "7. Changes to Terms",
    body: "We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the platform after any changes constitutes your acceptance of the new Terms.",
  },
  {
    title: "8. Contact Us",
    body: "If you have any questions about these Terms, please contact us through our support channels.",
  },
];

export default function TermsPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ background: "var(--dark-sky)" }}
    >
      <nav
        className="fixed left-0 top-0 z-50 flex w-full items-center justify-between px-4 py-4 sm:px-16"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <Wordmark tone="dark" />
        <Link
          href="/signup"
          className="text-xs font-semibold uppercase tracking-widest text-white/70 hover:text-white sm:text-sm"
        >
          Back
        </Link>
      </nav>

      <main className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-28 sm:px-8">
        <div className="w-full max-w-3xl space-y-8">
          <header className="space-y-3 text-center">
            <h1
              className="font-display font-bold tracking-tight text-white"
              style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)", lineHeight: 1.15 }}
            >
              Terms &amp; <span className="headline-gradient">Conditions</span>
            </h1>
            <p className="text-sm text-white/60">
              Last updated: May 21, 2026
            </p>
          </header>

          <article className="glass-card rounded-[2rem] p-6 sm:p-10">
            <div className="space-y-8 text-left">
              {SECTIONS.map((s) => (
                <section key={s.title} className="space-y-2">
                  <h2 className="font-display text-lg font-semibold text-white sm:text-xl">
                    {s.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-white/70 sm:text-[15px]">
                    {s.body}
                  </p>
                </section>
              ))}
            </div>
          </article>

          <p className="text-center text-xs text-white/50">
            By creating an account on Meska Brain, you acknowledge that you have read
            and agree to these Terms.
          </p>
        </div>
      </main>
    </div>
  );
}
