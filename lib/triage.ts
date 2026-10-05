/**
 * IS THIS URGENT? — rules first.
 *
 * Missing a real emergency is the costliest mistake ($2,000 gone), so the rules
 * lean towards "urgent", and an AI layer (V2) may only RAISE urgency, never lower it.
 * The person can always override.
 */

export type Verdict = { urgent: boolean; sure: boolean; reason: string | null };

/** Words that mean equipment is failing right now. */
const URGENT = [
  /\b(is|are|went|gone|completely)\s+down\b/i,
  /\bdown\b.*\b(freezer|cooler|fridge|walk-?in|ice machine|compressor)\b/i,
  /\b(freezer|cooler|fridge|walk-?in|ice machine|compressor|unit)\b.*\bdown\b/i,
  /\bnot (cooling|working|holding|freezing|keeping cold)\b/i,
  /\b(stopped|quit|died|dead)\b/i,
  /\b(warm|warming up|melting|thawing)\b/i,
  /\bleak(ing)?\b/i,
  /\b(spoil|spoiling|spoiled|food at risk|losing (food|product|stock))\b/i,
  /\b(emergency|asap|urgent|right away|immediately|tonight|today)\b/i,
  /\bholding\s+\d+\s*°?\s*f\b/i,
];

/** Words that mean planned work, not a breakdown. */
const ROUTINE = [
  /\b(maintenance|service plan|annual|yearly|routine|check-?up|inspection)\b/i,
  /\b(quote for|estimate for|pricing for|new (unit|cooler|freezer|reach-?in))\b/i,
  /\bnext (week|month)\b/i,
  /\bwhen(ever)? you (can|have time)\b/i,
];

export function triageByRules(text: string | null | undefined): Verdict {
  const t = (text ?? "").trim();
  if (t.length < 3) return { urgent: false, sure: false, reason: null };

  const hit = URGENT.find((r) => r.test(t));
  if (hit) {
    const word = t.match(hit)?.[0]?.trim() ?? "urgent words";
    return { urgent: true, sure: true, reason: `mentions "${word.toLowerCase()}"` };
  }
  if (ROUTINE.some((r) => r.test(t))) return { urgent: false, sure: true, reason: "planned work" };
  return { urgent: false, sure: false, reason: null }; // unsure → V2 asks the AI
}
