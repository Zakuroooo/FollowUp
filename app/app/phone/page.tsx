import Link from "next/link";
import { AlertsToggle } from "@/components/AlertsToggle";

export const metadata = { title: "Alerts on this phone" };

/** Where the QR code on Settings lands: one job, one big button. */
export default function PhoneAlerts() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="display text-[30px] leading-tight md:text-[36px]">Alerts on this phone</h1>
      <p className="mt-2 text-ink-2">Tap <b>Turn on alerts</b>, then <b>Allow</b>. New requests will buzz this phone, and emergencies keep buzzing every 3 minutes until someone acts.</p>
      <div className="mt-6"><AlertsToggle /></div>
      <details className="mt-6 rounded-xl border border-line bg-card p-4 text-sm">
        <summary className="cursor-pointer font-medium">On an iPhone?</summary>
        <ol className="mt-3 grid gap-1.5 text-ink-2">
          <li><b className="text-ink">1.</b> Tap the Share button at the bottom of Safari (the square with an arrow).</li>
          <li><b className="text-ink">2.</b> Tap <b className="text-ink">Add to Home Screen</b>, then <b className="text-ink">Add</b>.</li>
          <li><b className="text-ink">3.</b> Open FollowUp from your Home Screen and tap <b className="text-ink">Turn on alerts</b> here.</li>
        </ol>
      </details>
      <Link href="/app" className="btn-line mt-6">Go to the call list</Link>
    </div>
  );
}
