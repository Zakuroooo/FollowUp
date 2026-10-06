/**
 * Tests for the automatic parts: the Friday check, repeat alerts, reading a message without AI,
 * the Twilio signature check, and the emails (customer text must never become HTML).
 */
import { createHmac } from "node:crypto";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: () => ({ APP_URL: "https://followup.test" }) }));
vi.mock("@/lib/db/admin", () => ({ admin: () => ({}) }));

import { beforeWeekend, dueForRealert, isFriday, waitingEmergencies, REALERT_MAX } from "./rules";
import { parseByRules } from "./ai-fallback";
import { twilioSignatureOk } from "./inbound";
import { esc, senderFor } from "./email";
import { alertEmail, weekendEmail } from "./emails";
import type { Job } from "./types";

const FRI = new Date("2026-10-09T19:00:00Z"); // Friday 3 PM in New York
const FRI_DAY = "2026-10-09";
const TZ = "America/New_York";
const ago = (now: Date, h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

function job(p: Partial<Job>, now = FRI): Job {
  return {
    id: p.id ?? Math.random().toString(36).slice(2), owner_id: "o", customer_name: "X", business: null, phone: null,
    source: "call", issue: null, urgent: false, urgency_source: "user", urgency_reason: null, stage: "new",
    quote_amount: null, scheduled_for: null, follow_up_on: null, lost_reason: null, notes: null,
    last_contact_at: null, first_response_at: null, last_inbound_at: null, tech: null, visit_window: null, attempts: 0,
    acknowledged_at: null, alert_count: 0, last_alert_at: null, stage_changed_at: ago(now, 1), created_at: ago(now, 1), ...p,
  };
}

describe("Friday check: nothing waits silently over the weekend", () => {
  test("only runs on Fridays", () => {
    expect(isFriday("2026-10-09")).toBe(true);
    expect(isFriday("2026-10-08")).toBe(false);
    expect(beforeWeekend([job({})], new Date("2026-10-08T19:00:00Z"), "2026-10-08", TZ).total).toBe(0);
  });
  test("counts everything still on today's list", () => {
    const r = beforeWeekend([job({}), job({ urgent: true })], FRI, FRI_DAY, TZ);
    expect(r.onList).toBe(2);
  });
  test("includes call-backs due Saturday to Monday, not later ones", () => {
    const r = beforeWeekend([
      job({ stage: "quote", follow_up_on: "2026-10-10" }),  // Saturday
      job({ stage: "quote", follow_up_on: "2026-10-12" }),  // Monday
      job({ stage: "quote", follow_up_on: "2026-10-13" }),  // Tuesday: not a weekend risk
    ], FRI, FRI_DAY, TZ);
    expect(r.comingDue.map((u) => u.due)).toEqual(["2026-10-10", "2026-10-12"]);
  });
  test("a quote that goes quiet over the weekend is caught", () => {
    const r = beforeWeekend([job({ stage: "awaiting_yes", last_contact_at: ago(FRI, 26) })], FRI, FRI_DAY, TZ);
    expect(r.comingDue).toHaveLength(1);
    expect(r.comingDue[0].why).toBe("Follow up if no answer");
  });
  test("booked visits, done and lost jobs are not weekend risks", () => {
    const r = beforeWeekend([
      job({ stage: "scheduled", scheduled_for: "2026-10-10" }), job({ stage: "done" }), job({ stage: "lost" }),
    ], FRI, FRI_DAY, TZ);
    expect(r.total).toBe(0);
  });
});

describe("Repeat alerts for emergencies", () => {
  const now = new Date("2026-10-06T14:00:00Z");
  test("an untouched emergency is waiting; an answered one is not", () => {
    expect(waitingEmergencies([job({ urgent: true }, now)], now)).toHaveLength(1);
    expect(waitingEmergencies([job({ urgent: true, first_response_at: ago(now, 0.5) }, now)], now)).toHaveLength(0);
  });
  test("'I'm on it' stops the alerts", () => {
    expect(waitingEmergencies([job({ urgent: true, acknowledged_at: ago(now, 0.1) }, now)], now)).toHaveLength(0);
  });
  test("alerts again only after 3 minutes", () => {
    const fresh = job({ urgent: true, alert_count: 1, last_alert_at: ago(now, 1 / 60) }, now);
    const stale = job({ urgent: true, alert_count: 1, last_alert_at: ago(now, 4 / 60) }, now);
    expect(dueForRealert([fresh, stale], now).map((j) => j.id)).toEqual([stale.id]);
  });
  test(`stops after ${REALERT_MAX} alerts and after a day`, () => {
    expect(dueForRealert([job({ urgent: true, alert_count: REALERT_MAX }, now)], now)).toHaveLength(0);
    expect(waitingEmergencies([job({ urgent: true, created_at: ago(now, 25) }, now)], now)).toHaveLength(0);
  });
});

describe("Reading a message without AI (the fallback)", () => {
  test("finds name, phone and an emergency", () => {
    const p = parseByRules("Hi this is Tony Russo from Russo's Pizzeria, walk-in freezer is down, call 614-555-0142");
    expect(p).toMatchObject({ customer_name: "Tony Russo", phone: "614-555-0142", urgent: true, is_job: true });
  });
  test("a voicemail is filed as a call", () => {
    expect(parseByRules("Left a message: the ice machine is leaking").source).toBe("call");
  });
  test("newsletters and invoices are not jobs", () => {
    expect(parseByRules("Your order receipt. Click to unsubscribe").is_job).toBe(false);
  });
  test("a routine request is not an emergency", () => {
    expect(parseByRules("Can you send a price for new door gaskets? Thanks, Sam").urgent).toBe(false);
  });
});

describe("Twilio signature check", () => {
  afterEach(() => { delete process.env.TWILIO_AUTH_TOKEN; });
  const url = "https://followup.test/api/inbound/tok/sms";
  const params = { From: "+16145550142", Body: "freezer down" };
  const sign = (token: string) =>
    createHmac("sha1", token).update(url + Object.keys(params).sort().map((k) => k + params[k as keyof typeof params]).join("")).digest("base64");

  test("accepts a request signed with the real token", () => {
    process.env.TWILIO_AUTH_TOKEN = "secret";
    expect(twilioSignatureOk(url, params, sign("secret"))).toBe(true);
  });
  test("rejects a forged or missing signature", () => {
    process.env.TWILIO_AUTH_TOKEN = "secret";
    expect(twilioSignatureOk(url, params, sign("wrong"))).toBe(false);
    expect(twilioSignatureOk(url, params, null)).toBe(false);
  });
});

describe("Emails", () => {
  test("customer text is escaped, never turned into HTML", () => {
    expect(esc(`<script>"x"</script>`)).toBe("&lt;script&gt;&quot;x&quot;&lt;/script&gt;");
    const m = alertEmail("d@shop.test", job({ customer_name: "<b>Eve</b>", issue: "<img src=x onerror=alert(1)>" }));
    expect(m.html).not.toContain("<img src=x");
    expect(m.html).toContain("&lt;img");
  });
  test("a customer's name can't forge the sender address", () => {
    expect(senderFor('Tony" <ceo@bank.com>', "FollowUp <a@resend.dev>")).toBe('"Tony ceobank.com" <a@resend.dev>');
  });
  test("emergency alert says so in the subject", () => {
    expect(alertEmail("d@shop.test", job({ urgent: true, business: "Russo's", issue: "freezer down" })).subject).toBe("EMERGENCY: Russo's, freezer down");
  });
  test("Friday email counts what's waiting", () => {
    const m = weekendEmail("d@shop.test", 2, [{ job: job({ business: "Harbor Deli" }), due: "2026-10-12", why: "Call back" }]);
    expect(m.subject).toBe("Before the weekend: 3 jobs still waiting on you");
    expect(m.text).toContain("Harbor Deli");
  });
});
