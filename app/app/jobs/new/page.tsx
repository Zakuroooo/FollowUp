import { BackLink } from "@/components/ui";
import { AddJobForm } from "./AddJobForm";

export default function NewJob() {
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/app" label="Today" />
      <p className="eyebrow mt-2">A call, a text, a note from the notebook</p>
      <h1 className="display mt-1 text-[32px] md:text-[40px]">Add a job</h1>
      <p className="mb-5 mt-1 text-ink-2">It goes straight onto your list. Emergencies jump to the top.</p>
      <AddJobForm />
    </div>
  );
}
