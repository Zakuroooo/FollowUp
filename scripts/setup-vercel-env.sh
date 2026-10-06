#!/usr/bin/env bash
# One-time production setup. Run it yourself:  bash scripts/setup-vercel-env.sh
# Keys go straight from the Supabase CLI / your keyboard into Vercel. Nothing is printed or saved to disk.
set -euo pipefail
cd "$(dirname "$0")/.."
REF="qofdlzikeupikpkmjpmk"
APP_URL="https://followup-indol-seven.vercel.app"

put() { # name value — replaces the variable in Vercel production
  npx vercel env rm "$1" production -y >/dev/null 2>&1 || true
  printf "%s" "$2" | npx vercel env add "$1" production >/dev/null
  echo "  set $1"
}

echo "1/4 Supabase keys (from your logged-in Supabase CLI)…"
KEYS_JSON="$(npx supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null)"
ANON="$(printf "%s" "$KEYS_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const k=JSON.parse(s);const a=(Array.isArray(k)?k:k.keys||[]).find(x=>x.name==="anon");process.stdout.write(a?a.api_key:"")})')"
SERVICE="$(printf "%s" "$KEYS_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const k=JSON.parse(s);const a=(Array.isArray(k)?k:k.keys||[]).find(x=>x.name==="service_role");process.stdout.write(a?a.api_key:"")})')"
[ -n "$ANON" ] && [ -n "$SERVICE" ] || { echo "Could not read Supabase keys. Run: npx supabase login"; exit 1; }
put NEXT_PUBLIC_SUPABASE_URL "https://$REF.supabase.co"
put NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON"
put SUPABASE_SERVICE_ROLE_KEY "$SERVICE"
put APP_URL "$APP_URL"

echo "2/4 Device-alert keys + cron secret (generated on this Mac)…"
VAPID="$(npx --yes web-push generate-vapid-keys --json)"
put NEXT_PUBLIC_VAPID_PUBLIC_KEY "$(printf "%s" "$VAPID" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).publicKey))')"
put VAPID_PRIVATE_KEY "$(printf "%s" "$VAPID" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).privateKey))')"
put VAPID_SUBJECT "mailto:alerts@followup.app"
put CRON_SECRET "$(openssl rand -hex 32)"

echo "3/4 Groq (AI). Paste your key and press Enter (input is hidden), or just Enter to skip:"
read -rs GROQ; echo
if [ -n "$GROQ" ]; then put GROQ_API_KEY "$GROQ"; put GROQ_MODEL "openai/gpt-oss-20b"; fi

echo "4/4 Resend (email). Paste your key and press Enter (hidden), or just Enter to skip for now:"
read -rs RESEND; echo
if [ -n "$RESEND" ]; then put RESEND_API_KEY "$RESEND"; fi

echo "Done. Tell Claude 'env done' and it will redeploy and test the live site."
