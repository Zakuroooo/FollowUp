import { BackLink } from "@/components/ui";
import { AddJobForm } from "./AddJobForm";
import { NotebookImport } from "./NotebookImport";

const NEXT = [
  ["It joins your call list", "New requests show up under “New requests” until someone calls them back."],
  ["Emergencies go to the top", "Words like “freezer down”, “not holding temp” or “food spoiling” mark it urgent on their own."],
  ["Repeat callers are caught", "If the phone number already has an open job, you get a warning before a duplicate is saved."],
];

export default function NewJob() {
  return (
    <div className="mx-auto max-w-[1240px]">
      <BackLink href="/app" label="Call list" />
      <h1 className="display mt-2 text-[32px] leading-tight md:text-[38px]">Add a job</h1>
      <p className="mt-1.5 text-ink-2">A call, a text, a referral or a line from the notebook.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <AddJobForm />
          <NotebookImport />
        </div>
        <aside className="relative self-start overflow-hidden rounded-2xl bg-navy p-6 text-white">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-brand/35 blur-[80px]" />
          <p className="relative text-sm font-semibold">When you save</p>
          <ol className="relative mt-5 flex flex-col gap-5">
            {NEXT.map(([t, d], i) => (
              <li key={t} className="flex gap-3.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-[12px]">{i + 1}</span>
                <div>
                  <p className="text-[15px] font-medium">{t}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-navy-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
