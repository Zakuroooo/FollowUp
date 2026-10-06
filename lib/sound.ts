/**
 * Alert sounds, synthesised with Web Audio (no files to load).
 * Browsers only allow sound after the person has interacted with the page, so the audio
 * engine is "unlocked" on the first tap/click/keypress.
 */
let ctx: AudioContext | null = null;

export function unlockSound() {
  if (typeof window === "undefined" || ctx) return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor) ctx = new Ctor();
}

export function soundOn() {
  try { return localStorage.getItem("fu-sound") !== "off"; } catch { return true; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem("fu-sound", on ? "on" : "off"); } catch { /* private mode */ }
}

/** New request: a soft two-note chime. Emergency: three sharp, rising beeps. */
export function playAlert(urgent: boolean) {
  if (!ctx || !soundOn()) return;
  if (ctx.state === "suspended") ctx.resume();
  const notes = urgent ? [[880, 0], [880, 0.22], [1175, 0.44]] : [[660, 0], [990, 0.16]];
  for (const [freq, at] of notes) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = urgent ? "square" : "sine";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(urgent ? 0.18 : 0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (urgent ? 0.18 : 0.35));
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}
