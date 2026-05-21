"use client";

import { signOut } from "@/app/_actions/signout";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        aria-label="Sign out"
        className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors hover:bg-zinc-100 sm:px-4 sm:text-sm"
        style={{
          borderColor: "var(--dashboard-track)",
          color: "var(--dashboard-text)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "18px" }}
          aria-hidden
        >
          logout
        </span>
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </form>
  );
}
