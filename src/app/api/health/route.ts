import { getDb } from "@/lib/db";
import { noStore } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getDb().prepare("SELECT 1 AS ok").get();
    return noStore({ ok: true, time: new Date().toISOString() });
  } catch {
    return noStore({ ok: false, error: "Database unavailable." }, 500);
  }
}
