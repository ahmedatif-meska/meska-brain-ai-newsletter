import Link from "next/link";
import { Wordmark } from "@/components/chrome/Wordmark";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

type ActiveTab = "home" | "profile";

export function DashboardNav({ active }: { active: ActiveTab }) {
  return (
    <nav
      className="sticky top-0 z-40 flex w-full max-w-full items-center gap-1 overflow-hidden border-b px-2 py-3 sm:gap-6 sm:px-8 sm:py-4"
      style={{
        background: "var(--dashboard-surface)",
        borderColor: "var(--dashboard-track)",
      }}
      aria-label="Dashboard"
    >
      <Wordmark tone="dark" href="/home" />

      <div className="ml-1 flex items-center gap-0.5 sm:ml-4 sm:gap-2">
        <NavTab href="/home" icon="home" label="Home" active={active === "home"} />
        <NavTab href="/profile" icon="person" label="Profile" active={active === "profile"} />
      </div>

      <div className="flex-1" />
      <SignOutButton />
    </nav>
  );
}

function NavTab({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-2 text-[11px] font-semibold transition-colors sm:gap-1.5 sm:px-4 sm:text-sm"
      style={{
        color: active ? "var(--primary-deep)" : "var(--dashboard-muted)",
        background: active ? "rgba(10, 114, 243, 0.08)" : "transparent",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }} aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}
