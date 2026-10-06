import { describe, expect, test } from "vitest";
import { callList, callbackTime, classify, comingUp, summary } from "./rules";
import { triageByRules } from "./triage";
import { dialable, phoneAppearsIn, phoneKey } from "./phone";
import { nextStage, previousStage } from "./stages";
import type { Job } from "./types";

const NOW = new Date("2026-10-06T14:00:00Z");
const TODAY = "2026-10-06";
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

function job(p: Partial<Job>): Job {
  return {
    id: p.id ?? Math.random().toString(36).slice(2), owner_id: "o", customer_name: "X", business: null, phone: null,
    source: "call", issue: null, urgent: false, urgency_source: "user", urgency_reason: null, stage: "new",
    quote_amount: null, scheduled_for: null, follow_up_on: null, lost_reason: null, notes: null,
    last_contact_at: null, first_response_at: null, last_inbound_at: null, tech: null, visit_window: null, attempts: 0, acknowledged_at: null, alert_count: 0, last_alert_at: null, stage_changed_at: hoursAgo(1), created_at: hoursAgo(1), ...p,
  };
}

describe("call-today rules", () => {
  test("urgent new request → emergency block", () => {
    expect(classify(job({ urgent: true }), NOW, TODAY)?.bucket).toBe("emergency");
  });
  test("normal new request → new block, overdue after a day", () => {
    expect(classify(job({}), NOW, TODAY)).toMatchObject({ bucket: "new", overdue: false });
    expect(classify(job({ created_at: hoursAgo(30) }), NOW, TODAY)?.overdue).toBe(true);
  });
  test("waiting on quote → quote block, overdue after 24h", () => {
    expect(classify(job({ stage: "quote", stage_changed_at: hoursAgo(30) }), NOW, TODAY)).toMatchObject({ bucket: "quote", overdue: true });
  });
  test("sent quote returns only after 2 quiet days", () => {
    expect(classify(job({ stage: "awaiting_yes", last_contact_at: hoursAgo(20) }), NOW, TODAY)).toBeNull();
    expect(classify(job({ stage: "awaiting_yes", last_contact_at: hoursAgo(49) }), NOW, TODAY)?.bucket).toBe("follow_up");
  });
  test("said yes, no date → schedule; future date → not on list; past date → finished?", () => {
    expect(classify(job({ stage: "scheduled" }), NOW, TODAY)?.bucket).toBe("schedule");
    expect(classify(job({ stage: "scheduled", scheduled_for: "2026-10-09" }), NOW, TODAY)).toBeNull();
    expect(classify(job({ stage: "scheduled", scheduled_for: "2026-10-03" }), NOW, TODAY)?.bucket).toBe("visit_passed");
  });
  test("a reminder date overrides every stage rule", () => {
    expect(classify(job({ stage: "awaiting_yes", last_contact_at: hoursAgo(1), follow_up_on: TODAY }), NOW, TODAY)?.bucket).toBe("reminder");
  });
  test("done and lost never appear, even with a reminder", () => {
    expect(classify(job({ stage: "done", follow_up_on: TODAY }), NOW, TODAY)).toBeNull();
    expect(classify(job({ stage: "lost" }), NOW, TODAY)).toBeNull();
  });
  test("blocks come out in priority order", () => {
    const { groups, total } = callList(
      [job({ stage: "quote", stage_changed_at: hoursAgo(30) }), job({ urgent: true }), job({})],
      NOW, TODAY,
    );
    expect(total).toBe(3);
    expect(groups.map((g) => g.key)).toEqual(["emergency", "new", "quote"]);
  });
});

describe("numbers", () => {
  test("open jobs and money waiting on a yes", () => {
    const s = summary([job({ stage: "awaiting_yes", quote_amount: 1000 }), job({ stage: "awaiting_yes", quote_amount: 500 }), job({ stage: "done" })], NOW);
    expect(s.open).toBe(2);
    expect(s.waitingOnYesValue).toBe(1500);
  });
});

describe("urgency rules", () => {
  test.each([
    "Our walk-in freezer is down!",
    "cooler not cooling, food spoiling",
    "ice machine leaking everywhere",
    "freezer holding 40F please come today",
  ])("urgent: %s", (t) => expect(triageByRules(t)).toMatchObject({ urgent: true, sure: true }));
  test.each(["Annual maintenance on two freezers", "Quote for a new reach-in cooler"])("routine: %s", (t) =>
    expect(triageByRules(t)).toMatchObject({ urgent: false, sure: true }));
  test("unclear → not sure (the AI decides in V2)", () => {
    expect(triageByRules("ice machine making small cloudy ice")).toMatchObject({ urgent: false, sure: false });
  });
});

describe("phones and stages", () => {
  test("phone helpers", () => {
    expect(dialable("(614) 555-0142")).toBe("6145550142");
    expect(phoneKey("+1 614.555.0142")).toBe("6145550142");
    expect(phoneAppearsIn("614-555-0142", "call me at 614 555 0142 asap")).toBe(true);
    expect(phoneAppearsIn("614-555-9999", "call me at 614 555 0142")).toBe(false);
  });
  test("stage moves forward and back", () => {
    expect(nextStage("quote")).toBe("awaiting_yes");
    expect(nextStage("done")).toBeNull();
    expect(previousStage("awaiting_yes")).toBe("quote");
    expect(previousStage("lost")).toBe("new");
  });
});

describe("no answer, coming up, time to call back", () => {
  test("a job pushed to tomorrow is off today's list and back tomorrow as a reminder", () => {
    const j = job({ follow_up_on: "2026-10-07" });
    expect(classify(j, NOW, TODAY)).toBeNull();
    expect(classify(j, NOW, "2026-10-07")?.bucket).toBe("reminder");
  });
  test("coming up lists snoozed jobs, quiet-window quotes and booked visits, soonest first", () => {
    const items = comingUp([
      job({ id: "visit", stage: "scheduled", scheduled_for: "2026-10-09" }),
      job({ id: "snooze", follow_up_on: "2026-10-07" }),
      job({ id: "quote", stage: "awaiting_yes", last_contact_at: hoursAgo(20) }),
      job({ id: "today", urgent: true }), // on today's list, so not "coming up"
    ], NOW, TODAY, "America/New_York");
    expect(items.map((i) => i.job.id)).toEqual(["snooze", "quote", "visit"]);
    expect(items[1].due).toBe("2026-10-07");
  });
  test("time to call back is the median, and counts who is still waiting", () => {
    const t = callbackTime([
      job({ created_at: hoursAgo(10), first_response_at: hoursAgo(9) }), // 1 h
      job({ created_at: hoursAgo(60), first_response_at: hoursAgo(8) }), // 52 h
      job({ created_at: hoursAgo(20), first_response_at: hoursAgo(17) }), // 3 h
      job({}), // still waiting
    ], NOW);
    expect(t).toEqual({ medianHours: 3, sample: 3, waiting: 1 });
  });
});

import { draftByTemplate, parseByRules } from "./ai-fallback";

describe("AI fallbacks (no key needed)", () => {
  test("a pasted voicemail: phone, name, business and urgency come out without AI", () => {
    const p = parseByRules("Hi, this is Tony Russo from Russo's Pizzeria. Our walk-in freezer is not holding temp, call me at (614) 555-0142");
    expect(p).toMatchObject({ customer_name: "Tony Russo", phone: "(614) 555-0142", urgent: true, via: "rules" });
    expect(p.business).toContain("Russo's Pizzeria");
  });
  test("a follow-up draft names the customer, the quote and the shop", () => {
    const text = draftByTemplate({ customer_name: "Jim Turner", issue: "Walk-in cooler refrigerant leak", stage: "awaiting_yes", quote_amount: 2400 } as never, "Denise's Refrigeration (demo)");
    expect(text).toContain("Hi Jim");
    expect(text).toContain("$2,400");
    expect(text).toContain("Denise's Refrigeration.");
    expect(text).not.toContain("(demo)");
  });
});

test("a draft never echoes the customer's own sentence, and fits how they reached us", () => {
  const web = draftByTemplate({ customer_name: "Carla Mendes", issue: "Our walk-in cooler is at 50F, everything is warming", stage: "new", source: "web_form", quote_amount: null } as never, "Cold Air Co.");
  expect(web).toBe("Hi Carla, it's Cold Air Co., following up on your repair request you sent through our website. When is a good time to talk? We can usually get a tech out quickly.");
  const call = draftByTemplate({ customer_name: "Ed", issue: "Freezer door gasket", stage: "new", source: "call", quote_amount: null } as never, "Cold Air Co.");
  expect(call).toContain("returning your call about the freezer door gasket");
});

test("a customer who messaged again (and hasn't been answered) comes back as 'They messaged you'", () => {
  const j = job({ stage: "awaiting_yes", last_contact_at: hoursAgo(30), last_inbound_at: hoursAgo(1) });
  expect(classify(j, NOW, TODAY)).toMatchObject({ bucket: "replied", action: "Reply" });
  expect(classify({ ...j, last_contact_at: hoursAgo(0.5) }, NOW, TODAY)).toBeNull(); // answered → off the list
});

test("after 3 unanswered tries the reminder suggests marking it lost", () => {
  expect(classify(job({ follow_up_on: TODAY, attempts: 3 }), NOW, TODAY)).toMatchObject({ reason: "3 tries, no answer · mark lost?", action: "Last try" });
  expect(classify(job({ follow_up_on: TODAY, attempts: 1 }), NOW, TODAY)?.reason).toBe("No answer last time (try 2)");
});

import { dueForRealert, waitingEmergencies } from "./rules";
test("an unanswered emergency re-alerts every 3 minutes, at most 10 times, until she acts", () => {
  const fresh = job({ urgent: true, created_at: hoursAgo(0.1), last_alert_at: hoursAgo(0.06), alert_count: 1 }); // 3.6 min ago
  expect(dueForRealert([fresh], NOW)).toHaveLength(1);
  expect(dueForRealert([{ ...fresh, last_alert_at: hoursAgo(0.02) }], NOW)).toHaveLength(0); // 1.2 min ago: too soon
  expect(dueForRealert([{ ...fresh, alert_count: 10 }], NOW)).toHaveLength(0); // gave up after 10
  expect(waitingEmergencies([{ ...fresh, acknowledged_at: hoursAgo(0.01) }], NOW)).toHaveLength(0); // "I'm on it"
  expect(waitingEmergencies([{ ...fresh, first_response_at: hoursAgo(0.01) }], NOW)).toHaveLength(0); // talked to them
});
