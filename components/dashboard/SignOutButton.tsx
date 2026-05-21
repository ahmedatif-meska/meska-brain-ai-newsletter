"use client";

import { signOut } from "@/app/_actions/signout";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        aria-label="Sign out"
        className="inline-flex items-center gap-2 rounded-full p-2 text-xs font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
        style={{
          background: "var(--neon-blue-gradient)",
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
