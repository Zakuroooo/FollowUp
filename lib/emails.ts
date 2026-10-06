/** The two emails FollowUp sends: an instant alert for website requests, and the 7 AM call list. */
import "server-only";
import { esc, type Mail } from "@/lib/email";
import { env } from "@/lib/env";
import type { Job } from "@/lib/types";
import type { CallItem } from "@/lib/rules";

const wrap = (inner: string) => `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0a0a0c">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="font-weight:700;font-size:16px;margin-bottom:16px">FollowUp</div>
<div style="background:#ffffff;border:1px solid #e6e8ee;border-radius:14px;padding:24px">${inner}</div>
<p style="color:#71737d;font-size:12px;margin-top:16px">You get this because email alerts are on in FollowUp → Settings.</p>
</div></body></html>`;

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;font-size:14px">${esc(label)}</a>`;

const tel = (p: string | null) => (p ? `<a href="tel:${esc(p.replace(/[^\d+]/g, ""))}" style="color:#2b5cff;font-weight:600">${esc(p)}</a>` : "no phone given");

export function alertEmail(to: string, job: Job, replyTo?: string): Mail & { fromName?: string } {
  const who = job.business ?? job.customer_name;
  const subject = job.urgent ? `EMERGENCY: ${who}, ${job.issue ?? "equipment down"}` : `New request: ${who}`;
  const link = `${env().APP_URL}/app/jobs/${job.id}`;
  const html = wrap(`
${job.urgent ? `<div style="background:#b4232f;color:#fff;border-radius:10px;padding:14px 16px;margin:-6px -6px 18px;font-weight:700;font-size:15px;letter-spacing:.02em">&#9888; EQUIPMENT DOWN &middot; CALL NOW<div style="font-weight:400;font-size:13px;opacity:.85;margin-top:2px">FollowUp will remind you every 3 minutes until someone acts on it.</div></div>` : ""}
<h1 style="font-size:22px;margin:0 0 4px">${esc(who)}</h1>
<p style="margin:0 0 16px;color:#3c3f48">${esc(job.customer_name)} · ${tel(job.phone)}</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 20px">${esc(job.issue)}</p>
${button(link, job.urgent ? "Open it and call now" : "Open the job")}
<p style="color:#71737d;font-size:13px;margin:16px 0 0">Came in through your website form. It's already on today's call list.</p>`);
  const text = `${job.urgent ? "EMERGENCY - " : ""}${who}\n${job.customer_name} ${job.phone ?? ""}\n\n${job.issue ?? ""}\n\nOpen: ${link}`;
  // Shown as "Tony Russo (via FollowUp)", and Reply goes straight to the customer when they gave an email.
  return { to, subject, html, text, replyTo, fromName: `${job.customer_name} (via FollowUp)` };
}

export function digestEmail(to: string, businessName: string, dateLabel: string, groups: { title: string; items: CallItem[] }[], total: number): Mail {
  const link = `${env().APP_URL}/app`;
  const subject = total === 0 ? `Nobody to chase today (${dateLabel})` : `${total} ${total === 1 ? "call" : "calls"} to make today (${dateLabel})`;
  const rows = groups.map((g) => `
<h2 style="font-size:13px;color:${g.title === "Emergencies" ? "#c2262e" : "#71737d"};margin:20px 0 8px;font-weight:600">${esc(g.title)} (${g.items.length})</h2>
${g.items.map(({ job, action, reason }) => `<div style="border-top:1px solid #eef0f4;padding:10px 0">
<div style="font-weight:600">${esc(job.business ?? job.customer_name)} <span style="font-weight:400;color:#71737d">· ${tel(job.phone)}</span></div>
<div style="color:#3c3f48;font-size:14px">${esc(job.issue)}</div>
<div style="font-size:13px;color:#71737d"><b style="color:#2b5cff">${esc(action)}</b> · ${esc(reason)}</div></div>`).join("")}`).join("");
  const html = wrap(`<p style="margin:0;color:#2b5cff;font-size:13px;font-weight:600">${esc(dateLabel)}</p>
<h1 style="font-size:24px;margin:4px 0 4px">${esc(subject.replace(/ \(.*\)$/, ""))}</h1>
<p style="margin:0 0 8px;color:#3c3f48">Good morning from FollowUp for ${esc(businessName.replace(/\s*\(demo\)$/, ""))}.</p>
${rows || `<p style="color:#3c3f48">Every open job is waiting on the customer, not on you.</p>`}
<div style="margin-top:20px">${button(link, "Open the call list")}</div>`);
  const text = `${subject}\n\n` + groups.map((g) => `${g.title}\n` + g.items.map((i) => `- ${i.job.business ?? i.job.customer_name} ${i.job.phone ?? ""}: ${i.action} (${i.reason})`).join("\n")).join("\n\n") + `\n\n${link}`;
  return { to, subject, html, text };
}
