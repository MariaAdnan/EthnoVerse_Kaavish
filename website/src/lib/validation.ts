const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireText(value: string, label: string, maxLength = 500) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return normalized;
}

export function optionalText(
  value: string | null | undefined,
  label: string,
  maxLength = 5_000,
) {
  if (value == null || value.trim() === "") return null;
  return requireText(value, label, maxLength);
}

export function requireUuid(value: string, label: string) {
  const normalized = value.trim();
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a valid identifier.`);
  }
  return normalized;
}

export function requireHttpUrl(value: string, label: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`${label} must use HTTPS.`);
  }
  return url.toString();
}

export function normalizeTags(tags: string[] | null | undefined) {
  if (!tags) return null;
  const normalized = tags
    .map((tag) => tag.trim().toLocaleLowerCase())
    .filter(Boolean);
  const unique = [...new Set(normalized)];
  if (unique.length > 20) throw new Error("Use no more than 20 tags.");
  if (unique.some((tag) => tag.length > 40)) {
    throw new Error("Each tag must be 40 characters or fewer.");
  }
  return unique.length ? unique : null;
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
