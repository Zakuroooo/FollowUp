import { BackLink } from "@/components/ui";
import { AddJobForm } from "./AddJobForm";

export default function NewJob() {
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/app" label="Call list" />
      <h1 className="display mt-2 text-[28px] leading-tight md:text-[32px]">Add a job</h1>
      <p className="mb-6 mt-1 text-ink-2">A call, a text, a referral or a line from the notebook. It goes straight onto your call list, and emergencies jump to the top.</p>
      <AddJobForm />
    </div>
  );
}
