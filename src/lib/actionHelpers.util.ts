export function toBool(v: FormDataEntryValue | null): boolean | undefined {
  if (v == null) return undefined;
  const s = v.toString().trim().toLowerCase();
  if (["true", "on", "1", "yes"].includes(s)) return true;
  if (["false", "off", "0", "no"].includes(s)) return false;
  return undefined;
}