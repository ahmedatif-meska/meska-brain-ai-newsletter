export type SignupField = "firstName" | "lastName" | "email" | "password" | "form";

export type FieldError = {
  field: SignupField;
  message: string;
};

export type SignupInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const NAME_RE = /^[\p{L}\p{M}'\-\s]+$/u;

export function validateName(
  value: string,
  field: "firstName" | "lastName",
  label: string,
): FieldError | null {
  const v = value.trim();
  if (!v) return { field, message: `${label} is required.` };
  if (v.length > 60) return { field, message: `${label} is too long.` };
  if (!NAME_RE.test(v))
    return { field, message: `${label} contains invalid characters.` };
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SYMBOL_RE = /[!@#$%^&*()_+\-=\[\]{};':",.<>/?\\|`~]/;
const UPPER_RE = /[A-Z]/;
const DIGIT_RE = /[0-9]/;

export function validateEmail(value: string): FieldError | null {
  const v = value.trim();
  if (!v) return { field: "email", message: "Email is required." };
  if (v.length > 254) return { field: "email", message: "Email is too long." };
  if (!EMAIL_RE.test(v)) return { field: "email", message: "Enter a valid email address." };
  return null;
}

export function validatePassword(value: string): FieldError | null {
  if (!value) return { field: "password", message: "Password is required." };
  if (value.length < 8) return { field: "password", message: "Password must be at least 8 characters." };
  if (!UPPER_RE.test(value)) return { field: "password", message: "Password must contain at least one uppercase letter." };
  if (!DIGIT_RE.test(value)) return { field: "password", message: "Password must contain at least one number." };
  if (!SYMBOL_RE.test(value)) return { field: "password", message: "Password must contain at least one symbol." };
  return null;
}

export function validateSignupInput(input: SignupInput): FieldError[] {
  const errors: FieldError[] = [];
  const firstName = validateName(input.firstName, "firstName", "First name");
  if (firstName) errors.push(firstName);
  const lastName = validateName(input.lastName, "lastName", "Last name");
  if (lastName) errors.push(lastName);
  const email = validateEmail(input.email);
  if (email) errors.push(email);
  const pw = validatePassword(input.password);
  if (pw) errors.push(pw);
  return errors;
}

export type PasswordStrength = "empty" | "weak" | "medium" | "strong";

export function scorePassword(value: string): PasswordStrength {
  if (!value) return "empty";
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (UPPER_RE.test(value)) score++;
  if (DIGIT_RE.test(value)) score++;
  if (SYMBOL_RE.test(value)) score++;
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}
