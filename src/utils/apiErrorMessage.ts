import { isAxiosError } from "axios";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

/**
 * True when the backend sent no usable string (missing, empty, or whitespace-only).
 */
function isMissingUserMessage(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== "string") return true;
  return value.trim().length === 0;
}

/**
 * Backend auth/session failures sometimes return technical strings that are not appropriate for end users.
 */
function isTechnicalAuthMessage(value: string): boolean {
  const t = value.trim();
  if (!t) return true;
  return (
    /^invalid token$/i.test(t) ||
    /^jwt expired$/i.test(t) ||
    /^token expired$/i.test(t) ||
    /^unauthorized\.?$/i.test(t) ||
    /^request failed with status code 401$/i.test(t)
  );
}

function pickMessageFromResponseData(data: unknown): string | undefined {
  if (data == null) return undefined;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return undefined;
  const o = data as Record<string, unknown>;
  let fromMessage: unknown = o.message ?? o.error ?? o.msg;
  if (typeof fromMessage !== "string" && o.data && typeof o.data === "object") {
    const inner = o.data as Record<string, unknown>;
    fromMessage = inner.message ?? inner.error ?? inner.msg;
  }
  if (typeof fromMessage === "string") return fromMessage;
  const first = Array.isArray(o.errors) ? o.errors[0] : undefined;
  if (typeof first === "string") return first;
  return undefined;
}

/**
 * Message suitable for toasts/UI: prefers backend `message` (and common alternates),
 * otherwise returns a generic string. Suppresses common JWT/session technical phrases.
 */
export function getUserFacingApiError(
  error: unknown,
  fallback: string = DEFAULT_MESSAGE
): string {
  let raw: string | undefined;

  if (isAxiosError(error)) {
    raw = pickMessageFromResponseData(error.response?.data);
  } else if (error instanceof Error) {
    raw = error.message;
  }

  if (isMissingUserMessage(raw)) {
    return fallback;
  }

  const text = raw!.trim();
  if (isTechnicalAuthMessage(text)) {
    return fallback;
  }

  return text;
}
