"use server";

import "server-only";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateEmail, type FieldError } from "@/lib/validation/signup";

export type ResetRequestResult =
  | { ok: true }
  | { ok: false; errors: FieldError[] };

export async function requestPasswordReset(
  _: unknown,
  formData: FormData,
): Promise<ResetRequestResult> {
  const email = String(formData.get("email") ?? "").trim();
  const emailError = validateEmail(email);
  if (emailError) return { ok: false, errors: [emailError] };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    console.error("[reset-password] server client init failed:", e);
    return {
      ok: false,
      errors: [{ field: "form", message: "Server is not configured. Try again later." }],
    };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  if (error) {
    console.error("[reset-password] supabase error:", error);
  }
  // Always return ok to avoid email enumeration.
  return { ok: true };
}

export type UpdatePasswordResult =
  | { ok: true; redirect: "/signin?pwreset=1" }
  | { ok: false; errors: FieldError[] };

export async function updatePassword(
  _: unknown,
  formData: FormData,
): Promise<UpdatePasswordResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errors: FieldError[] = [];
  if (password.length < 8)
    errors.push({ field: "password", message: "Password must be at least 8 characters." });
  if (password !== confirm)
    errors.push({ field: "password", message: "Passwords do not match." });
  if (errors.length > 0) return { ok: false, errors };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    console.error("[update-password] server client init failed:", e);
    return {
      ok: false,
      errors: [{ field: "form", message: "Server is not configured. Try again later." }],
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      errors: [{ field: "form", message: "Reset link expired. Request a new one." }],
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[update-password] supabase error:", error);
    return {
      ok: false,
      errors: [{ field: "form", message: error.message || "Could not update password." }],
    };
  }

  await supabase.auth.signOut();
  return { ok: true, redirect: "/signin?pwreset=1" };
}
