import { syncAll } from "@/lib/shipments";

// Call from any scheduler (system cron, Vercel Cron, GitHub Actions) with
// `Authorization: Bearer $CRON_SECRET`. The worker script does the same in-process.
export async function POST(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const results = await syncAll();
  return Response.json({ synced: results.length, results });
}

export const GET = POST;
