export function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}