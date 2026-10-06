#!/usr/bin/env bash
# Fix/replace keys in Vercel. Run yourself:  bash scripts/set-keys.sh
# - Supabase anon key: copied automatically from your logged-in Supabase CLI.
# - Groq and Resend: paste when asked (input is hidden). Press Enter to keep the current value.
set -uo pipefail
cd "$(dirname "$0")/.."
REF="qofdlzikeupikpkmjpmk"
put() {
  npx vercel env rm "$1" production -y >/dev/null 2>&1
  if printf "%s" "$2" | npx vercel env add "$1" production >/dev/null 2>&1; then echo "  ✓ $1 set"; else echo "  ✗ $1 FAILED — run the script again"; fi
}
ANON="$(npx supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const k=JSON.parse(s).find(x=>x.name==="anon");process.stdout.write(k?k.api_key:"")})')"
[ -n "$ANON" ] && put NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON" || echo "  ✗ couldn't read the anon key (run: npx supabase login)"
read -rsp "Groq API key (hidden, Enter to keep current): " GROQ; echo
[ -n "$GROQ" ] && put GROQ_API_KEY "$GROQ"
read -rsp "Resend API key (hidden, Enter to keep current): " RESEND; echo
[ -n "$RESEND" ] && put RESEND_API_KEY "$RESEND"
echo; echo "Now in Vercel:"; npx vercel env ls production 2>/dev/null | grep -oE "^\s+[A-Z_]+" | tr -d ' ' | sort | tr '\n' ' '; echo
echo "Tell Claude 'keys done'."
