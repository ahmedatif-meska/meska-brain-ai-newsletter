import { TOPICS, type Topic, type WizardFieldError } from "./schema";

const E164_RE = /^\+[1-9]\d{6,14}$/;
const LINKEDIN_RE =
  /^https:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9._-]{2,100}\/?(?:\?.*)?$/i;

export function validateWhatsappE164(value: string): WizardFieldError | null {
  const v = value.trim();
  if (!v) return { field: "whatsapp", message: "WhatsApp number is required." };
  if (!E164_RE.test(v))
    return {
      field: "whatsapp",
      message: "Enter a valid WhatsApp number in international format (e.g. +201001234567).",
    };
  return null;
}

export function validateLinkedInUrl(value: string): WizardFieldError | null {
  const v = value.trim();
  if (!v) return { field: "linkedinUrl", message: "LinkedIn URL is required." };
  if (!LINKEDIN_RE.test(v))
    return {
      field: "linkedinUrl",
      message: "Enter a valid LinkedIn profile URL (https://linkedin.com/in/...).",
    };
  return null;
}

const TOPIC_SET = new Set<string>(TOPICS);

export function validateExactlyThreeTopics(
  topics: unknown,
): WizardFieldError | null {
  if (!Array.isArray(topics))
    return { field: "topics", message: "Please select exactly 3 topics." };
  if (topics.length !== 3)
    return { field: "topics", message: "Please select exactly 3 topics." };
  const uniq = new Set(topics);
  if (uniq.size !== 3)
    return { field: "topics", message: "Please select exactly 3 topics." };
  for (const t of topics) {
    if (typeof t !== "string" || !TOPIC_SET.has(t)) {
      return { field: "topics", message: "Please select exactly 3 topics." };
    }
  }
  return null;
}

export function isTopicArray(value: unknown): value is Topic[] {
  return validateExactlyThreeTopics(value) === null;
}
