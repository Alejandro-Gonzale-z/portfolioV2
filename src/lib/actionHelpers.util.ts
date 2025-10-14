export function toBool(v: FormDataEntryValue | null): boolean | undefined {
  if (v == null) return undefined;
  const s = v.toString().trim().toLowerCase();
  if (["true", "on", "1", "yes"].includes(s)) return true;
  if (["false", "off", "0", "no"].includes(s)) return false;
  return undefined;
}

export function parseMMDDYYYY(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10) - 1;
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  // Normalize to midnight UTC to avoid TZ shifts
  return new Date(Date.UTC(year, month, day));
}