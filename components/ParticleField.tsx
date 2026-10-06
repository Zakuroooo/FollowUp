"use client";
import { useEffect, useRef } from "react";

/**
 * Moving blue light points, drawn on a <canvas>.
 * - "field": rings of points in perspective that slowly turn and flow toward the viewer (landing hero, login).
 * - "drift": a few sparkles rising gently (sidebar, the Call-first card).
 * Pauses when off-screen and stays still for people who ask their OS for reduced motion.
 */
type Variant = "field" | "drift";

interface P { t: number; a: number; x: number; y: number; v: number; ph: number; f: number; s: number }

export function ParticleField({ variant = "field", className = "", density = 1 }: { variant?: Variant; className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now();
    let pts: P[] = [];

    const seed = () => {
      pts = [];
      if (variant === "field") {
        const rings = 36;
        for (let r = 0; r < rings; r++) {
          const t = r / rings;
          const count = Math.round((20 + t * 140) * density);
          for (let i = 0; i < count; i++) {
            pts.push({ t: t + Math.random() / rings, a: (i / count) * Math.PI * 2 + Math.random() * 0.1, x: 0, y: 0, v: 0, ph: Math.random() * 6.28, f: 0.6 + Math.random() * 1.6, s: Math.random() });
          }
        }
      } else {
        const count = Math.max(8, Math.round(((w * h) / 2600) * density));
        for (let i = 0; i < count; i++) {
          pts.push({ t: 0, a: 0, x: Math.random() * w, y: Math.random() * h, v: 4 + Math.random() * 10, ph: Math.random() * 6.28, f: 0.5 + Math.random() * 1.5, s: Math.random() });
        }
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    // One crisp dot per point, no halo: a faded halo under a 1-2px dot reads as blur, not glow.
    const dot = (x: number, y: number, size: number, alpha: number) => {
      if (alpha < 0.04) return;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = size > 1.4 ? "#e4ebff" : "#a9bfff";
      ctx.beginPath(); ctx.arc(x, y, size, 0, 6.283); ctx.fill();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;
      ctx.clearRect(0, 0, w, h);
      if (variant === "field") {
        const cx = w / 2, cy = h * 0.2, R = Math.max(w * 0.62, 520);
        for (const p of pts) {
          if (!still) {
            p.a += dt * (0.05 + (1 - p.t) * 0.07); // inner rings turn faster
            p.t += dt * 0.018; // flow outward, toward the viewer
            if (p.t > 1) p.t -= 1;
          }
          const sin = Math.sin(p.a);
          if (sin < -0.12) continue; // only the front half of each ring
          const rx = 30 + p.t * R, ry = rx * 0.34;
          const x = cx + Math.cos(p.a) * rx, y = cy + sin * ry;
          if (x < -10 || x > w + 10 || y > h + 10) continue;
          const tw = 0.7 + 0.3 * Math.sin(time * p.f + p.ph);
          const fadeIn = Math.max(0, Math.min(1, (p.t - 0.07) * 9)); // hide the innermost rings: they overlap into a smudge
          dot(x, y, 0.75 + (1 - p.t) * 1.1 + p.s * 0.35, (0.25 + (1 - p.t) * 0.85) * tw * fadeIn);
        }
      } else {
        for (const p of pts) {
          if (!still) {
            p.y -= p.v * dt;
            p.x += Math.sin(time * 0.4 + p.ph) * dt * 3;
            if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
          }
          const tw = 0.35 + 0.65 * Math.max(0, Math.sin(time * p.f + p.ph));
          const lowBias = 0.35 + 0.65 * (p.y / Math.max(1, h)); // brighter near the bottom glow
          dot(p.x, p.y, 0.6 + p.s * 0.9, 0.75 * tw * lowBias);
        }
      }
      ctx.globalAlpha = 1;
      if (!still && visible) raf = requestAnimationFrame(frame);
    };

    resize();
    const ro = new ResizeObserver(() => { resize(); if (still) frame(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was && !still) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [variant, density]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none block ${className}`} />;
}
