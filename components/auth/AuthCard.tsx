import Link from "next/link";

type ActiveTab = "signup" | "signin";

export function AuthCard({
  activeTab = "signup",
  children,
}: {
  activeTab?: ActiveTab;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card group relative mx-auto max-w-md space-y-6 rounded-[2rem] p-6 sm:space-y-8 sm:p-8">
      <div
        className="-mx-6 -mt-6 mb-6 flex overflow-hidden rounded-t-[2rem] sm:-mx-8 sm:-mt-8 sm:mb-8"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.12)" }}
      >
        <TabButton href="/signup" active={activeTab === "signup"} withRightBorder>
          Sign Up
        </TabButton>
        <TabButton href="/signin" active={activeTab === "signin"}>
          Sign In
        </TabButton>
      </div>
      {children}
    </div>
  );
}

function TabButton({
  href,
  active,
  withRightBorder = false,
  children,
}: {
  href: string;
  active: boolean;
  withRightBorder?: boolean;
  children: React.ReactNode;
}) {
  const base =
    "flex-1 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-center transition-colors";
  const tone = active ? "text-white" : "text-white/40 hover:text-white";
  const styles: React.CSSProperties = {
    background: active ? "rgba(255, 255, 255, 0.03)" : "transparent",
    borderRight: withRightBorder ? "1px solid rgba(255, 255, 255, 0.12)" : undefined,
  };
  return (
    <Link href={href} className={`${base} ${tone}`} style={styles}>
      {children}
    </Link>
  );
}
