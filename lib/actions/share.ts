"use server";
/** Turn the read-only Numbers link on or off. The token is random and only the server can write it. */
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/db/server";
import { admin } from "@/lib/db/admin";

export async function shareNumbers() {
  const user = await currentUser();
  if (!user) return;
  await admin().from("profiles").update({ numbers_token: randomBytes(16).toString("base64url") }).eq("id", user.id);
  revalidatePath("/app/numbers");
}

export async function stopSharingNumbers() {
  const user = await currentUser();
  if (!user) return;
  await admin().from("profiles").update({ numbers_token: null }).eq("id", user.id);
  revalidatePath("/app/numbers");
}
