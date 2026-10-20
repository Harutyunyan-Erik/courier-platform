import type { ShipmentStatus } from "@prisma/client";
import { type CarrierAdapter, type CarrierEvent, eventId, fetchJson } from "./types";

// 17TRACK API v2.2: https://api.17track.net/en/doc
// Aggregator that covers postal operators (including Haypost) and 1000+ other carriers.
const BASE = "https://api.17track.net/track/v2.2";

export type Track17Info = {
  tracking?: {
    providers?: {
      events?: { time_iso?: string; time_utc?: string; description?: string; location?: string; stage?: string; sub_status?: string }[];
    }[];
  };
};

type GetTrackInfoResponse = {
  data?: { accepted?: { number: string; track_info?: Track17Info }[]; rejected?: { number: string }[] };
};

export function mapTrack17Stage(stage = "", subStatus = ""): ShipmentStatus {
  switch (stage) {
    case "InfoReceived":
      return "CREATED";
    case "PickedUp":
      return "PICKED_UP";
    case "Departure":
      return "IN_TRANSIT";
    case "Arrival":
      return "AT_HUB";
    case "AvailableForPickup":
    case "OutForDelivery":
      return "OUT_FOR_DELIVERY";
    case "Delivered":
      return "DELIVERED";
    case "Returning":
    case "Returned":
      return "RETURNED";
    case "Exception":
    case "DeliveryFailure":
      return "EXCEPTION";
  }
  if (subStatus.startsWith("Delivered")) return "DELIVERED";
  if (subStatus.startsWith("Exception") || subStatus.startsWith("DeliveryFailure")) return "EXCEPTION";
  if (subStatus.includes("Customs")) return "CUSTOMS";
  return "IN_TRANSIT";
}

export function parseTrack17Events(info?: Track17Info): CarrierEvent[] {
  const events = info?.tracking?.providers?.flatMap((p) => p.events ?? []) ?? [];
  return events
    .filter((e) => e.time_iso || e.time_utc)
    .map<CarrierEvent>((e) => {
      const time = (e.time_iso ?? e.time_utc)!;
      return {
        externalId: eventId(time, e.stage, e.description),
        status: mapTrack17Stage(e.stage, e.sub_status),
        rawStatus: e.sub_status ?? e.stage ?? "",
        description: e.description,
        location: e.location || undefined,
        occurredAt: new Date(time),
      };
    });
}

function headers() {
  return { "17token": process.env.TRACK17_API_KEY ?? "", "Content-Type": "application/json" };
}

export const track17Adapter: CarrierAdapter = {
  id: "track17",
  label: "17TRACK (Haypost and others)",
  isConfigured: () => Boolean(process.env.TRACK17_API_KEY),
  async fetchEvents(trackingNumber) {
    // Registering an already registered number is harmless; 17TRACK just rejects the duplicate.
    await fetchJson(`${BASE}/register`, { method: "POST", headers: headers(), body: JSON.stringify([{ number: trackingNumber }]) });
    const data = await fetchJson<GetTrackInfoResponse>(`${BASE}/gettrackinfo`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify([{ number: trackingNumber }]),
    });
    return parseTrack17Events(data.data?.accepted?.[0]?.track_info);
  },
};
