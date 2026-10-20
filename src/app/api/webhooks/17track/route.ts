import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { parseTrack17Events, type Track17Info } from "@/lib/carriers/track17";
import { importCarrierEvents, recomputeStatus } from "@/lib/shipments";

// 17TRACK push: configure this URL in the 17TRACK dashboard.
// Signature header `sign` = sha256(rawBody + "/" + apiKey).
export async function POST(req: Request) {
  const key = process.env.TRACK17_API_KEY;
  if (!key) return new Response("Not configured", { status: 404 });
  const raw = await req.text();
  const expected = createHash("sha256").update(`${raw}/${key}`).digest("hex");
  const sign = req.headers.get("sign") ?? "";
  if (sign.length !== expected.length || !timingSafeEqual(Buffer.from(sign), Buffer.from(expected))) {
    return new Response("Bad signature", { status: 401 });
  }

  const body = JSON.parse(raw) as { event?: string; data?: { number?: string; track_info?: Track17Info } };
  const number = body.data?.number;
  if (body.event !== "TRACKING_UPDATED" || !number) return Response.json({ ok: true });

  const shipments = await prisma.shipment.findMany({
    where: { autoSync: true, OR: [{ carrierTrackingNumber: number }, { trackingNumber: number }] },
  });
  for (const s of shipments) {
    await importCarrierEvents(s.id, parseTrack17Events(body.data?.track_info), "WEBHOOK");
    await recomputeStatus(s.id);
  }
  return Response.json({ ok: true, matched: shipments.length });
}
