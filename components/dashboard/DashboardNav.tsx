import Link from "next/link";
import { Wordmark } from "@/components/chrome/Wordmark";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

type ActiveTab = "home" | "profile";

export function DashboardNav({ active }: { active: ActiveTab }) {
  return (
    <nav
      className="sticky top-0 z-40 flex w-full max-w-full items-center gap-1 border-b px-4 py-3 sm:gap-6 sm:px-16 sm:py-4"
      style={{
        background: "var(--dashboard-surface)",
        borderColor: "var(--dashboard-track)",
      }}
      aria-label="Dashboard"
    >
      <div className="shrink-0">
        <Wordmark tone="dark" href="/home" />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NavTab href="/home" icon="home" label="Home" active={active === "home"} />
        <NavTab href="/profile" icon="person" label="Profile" active={active === "profile"} />
        <SignOutButton />
      </div>
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
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full p-2 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm"
      style={{
        color: active ? "var(--primary-deep)" : "var(--dashboard-muted)",
        background: active ? "rgba(10, 114, 243, 0.08)" : "transparent",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }} aria-hidden>
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </Link>
  );
}
