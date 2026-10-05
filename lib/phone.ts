/** Phone helpers — Denise's customers are in the US. */

/** Keep only digits and a leading + for tel:/sms: links. */
export function dialable(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/[^\d+]/g, "");
  return d.replace(/\D/g, "").length >= 7 ? d : null;
}

/** Last 10 digits — used to spot the same customer contacting twice. */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-10) : null;
}

/** AI safety: a phone the AI returns is kept only if those digits appear in the original text. */
export function phoneAppearsIn(phone: string, source: string): boolean {
  const key = phoneKey(phone);
  if (!key) return false;
  return source.replace(/\D/g, "").includes(key.slice(-7));
}
