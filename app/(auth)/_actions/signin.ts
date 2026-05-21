"use server";

import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateEmail, type FieldError } from "@/lib/validation/signup";

export type SignInResult =
  | { ok: true; redirect: "/home" }
  | { ok: false; errors: FieldError[] };

export async function signInWithPassword(
  _: unknown,
  formData: FormData,
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: FieldError[] = [];
  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);
  if (!password) errors.push({ field: "password", message: "Password is required." });
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (e) {
    console.error("[signin] server client init failed:", e);
    return {
      ok: false,
      errors: [{ field: "form", message: "Server is not configured. Try again later." }],
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    const status = (error as { status?: number }).status;
    const invalid =
      status === 400 ||
      msg.includes("invalid login") ||
      msg.includes("invalid credentials") ||
      msg.includes("email not confirmed");

    if (invalid) {
      return {
        ok: false,
        errors: [
          { field: "form", message: "Invalid email or password." },
        ],
      };
    }

    console.error("[signin] unexpected supabase error:", error);
    return {
      ok: false,
      errors: [{ field: "form", message: "Something went wrong. Try again." }],
    };
  }

  return { ok: true, redirect: "/home" };
}
