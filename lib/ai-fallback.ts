/**
 * The no-AI fallbacks. Pure functions (no network, no database), so they are unit-tested
 * and the app behaves sensibly when there is no AI key or the daily AI limit is reached.
 */
import { triageByRules } from "@/lib/triage";
import type { Job, Source } from "@/lib/types";

export type Parsed = {
  customer_name: string; business: string; phone: string; issue: string;
  source: Source; urgent: boolean; urgent_reason: string; via: "ai" | "rules"; is_job?: boolean;
};

const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

/** No-AI fallback: pull out what plain patterns can find. Honest about its limits: the person checks the form. */
export function parseByRules(text: string): Parsed {
  const t = text.trim();
  const phone = t.match(PHONE)?.[0] ?? "";
  const name =
    t.match(/\b(?:this is|it'?s|my name is|i'?m)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/)?.[1] ??
    t.match(/(?:thanks|thank you|regards|cheers)[,!.\s-]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*$/i)?.[1] ?? "";
  const business = t.match(/\b(?:from|at|over at)\s+((?:[A-Z][\w'&]*\s?){1,4})/)?.[1]?.trim() ?? "";
  const v = triageByRules(t);
  return {
    customer_name: name, business, phone, issue: t.replace(PHONE, "").replace(/\s+/g, " ").slice(0, 300),
    source: /voicemail|called|left a message/i.test(t) ? "call" : /referr|recommended/i.test(t) ? "referral" : "text",
    urgent: v.urgent, urgent_reason: v.reason ?? "", via: "rules",
    is_job: !/\b(unsubscribe|newsletter|invoice #|receipt|your order|promo|discount code|seo services|marketing services)\b/i.test(t),
  };
}


export function draftByTemplate(job: Job, businessName: string): string {
  const first = job.customer_name.split(/\s+/)[0];
  // Quote the problem only when it's a short noun phrase ("door gasket"); otherwise stay general,
  // so we never echo the customer's own sentence back at them ("our cooler is at 50f").
  const raw = (job.issue ?? "").trim().replace(/\.$/, "");
  const what = raw && raw.length <= 45 && !/^(our|my|we|i|it|the|they|please|hi)\b/i.test(raw) && !/\b(is|are|was|were|has|have)\b/i.test(raw)
    ? `the ${raw.charAt(0).toLowerCase()}${raw.slice(1)}` : "your repair request";
  const shop = businessName.replace(/\s*\(demo\)$/, "");
  if (job.stage === "awaiting_yes") {
    const amt = job.quote_amount ? ` ($${job.quote_amount.toLocaleString("en-US")})` : "";
    return `Hi ${first}, it's ${shop}. Just checking in on the quote${amt} for ${what}. Happy to answer any questions or get a tech booked this week. Thanks!`;
  }
  if (job.stage === "quote") return `Hi ${first}, it's ${shop}. Thanks for your patience on ${what}. I'm putting your quote together and will send it over today.`;
  if (job.stage === "scheduled") return `Hi ${first}, it's ${shop}. Confirming your service visit for ${what}${job.scheduled_for ? ` on ${job.scheduled_for}` : ""}. Reply here if anything changes.`;
  const opener = job.source === "web_form" ? `following up on ${what} you sent through our website` : job.source === "text" ? `following up on your message about ${what}` : `returning your call about ${what}`;
  return `Hi ${first}, it's ${shop}, ${opener}. When is a good time to talk? We can usually get a tech out quickly.`;
}

