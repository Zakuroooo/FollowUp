/** "Get alerts on your phone": scan, log in, one tap. The QR just opens FollowUp's phone page on the phone. */
import QRCode from "qrcode";
import Link from "next/link";
import { env } from "@/lib/env";

export async function PhoneSetup({ demo }: { demo: boolean }) {
  const url = `${env().APP_URL}/app/phone`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0a0a0c", light: "#ffffff" } });
  return (
    <section aria-labelledby="phone-h" className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-card p-6 md:flex-nowrap md:p-7">
      <div className="hidden size-36 shrink-0 overflow-hidden rounded-xl border border-line bg-white p-2 md:block" aria-label="QR code that opens FollowUp on your phone" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="min-w-0">
        <h2 id="phone-h" className="text-[17px] font-semibold">Get alerts on your phone</h2>
        <ol className="mt-3 grid gap-1.5 text-sm text-ink-2">
          <li><b className="text-ink">1.</b> <span className="hidden md:inline">Point your phone&apos;s camera at this code and open the link.</span><span className="md:hidden">Tap the button below on your phone.</span></li>
          <li><b className="text-ink">2.</b> {demo ? "Your phone opens its own sample copy (it's a demo)." : "Log in with the same email and password."}</li>
          <li><b className="text-ink">3.</b> Tap <b className="text-ink">Turn on alerts</b>, then <b className="text-ink">Allow</b>. That&apos;s it.</li>
        </ol>
        <Link href="/app/phone" className="btn-brand btn-sm mt-4 md:hidden">This is my phone: turn on alerts</Link>
      </div>
    </section>
  );
}
