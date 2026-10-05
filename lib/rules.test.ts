import { describe, expect, test } from "vitest";
import { callList, classify, summary } from "./rules";
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
    last_contact_at: null, stage_changed_at: hoursAgo(1), created_at: hoursAgo(1), ...p,
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
