import { AuthForm } from "@/components/AuthForm";

// Only known codes are shown — never raw text from the URL (stops fake-message links).
const NOTICES: Record<string, string> = {
  demo_unavailable: "The demo is unavailable right now. Please try again in a minute.",
  demo_data: "We couldn't load the demo jobs. Please try again.",
  link_expired: "That link has expired or was already used. Ask for a new one.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <AuthForm mode="login" next={next} notice={error ? NOTICES[error] : undefined} />;
}
