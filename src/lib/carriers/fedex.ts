import type { ShipmentStatus } from "@prisma/client";
import { type CarrierAdapter, type CarrierEvent, eventId, fetchJson } from "./types";

// FedEx Track API: https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html
type FedexTrackResponse = {
  output?: {
    completeTrackResults?: {
      trackResults?: {
        scanEvents?: {
          date: string;
          eventType?: string;
          eventDescription?: string;
          derivedStatusCode?: string;
          scanLocation?: { city?: string; countryCode?: string };
        }[];
      }[];
    }[];
  };
};

let cachedToken: { value: string; expiresAt: number } | null = null;

const baseUrl = () => process.env.FEDEX_API_URL || "https://apis.fedex.com";

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.FEDEX_CLIENT_ID ?? "",
    client_secret: process.env.FEDEX_CLIENT_SECRET ?? "",
  });
  const data = await fetchJson<{ access_token: string; expires_in: number }>(`${baseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export function mapFedexStatus(code = "", eventType = ""): ShipmentStatus {
  switch (code || eventType) {
    case "DL":
      return "DELIVERED";
    case "OD":
      return "OUT_FOR_DELIVERY";
    case "PU":
      return "PICKED_UP";
    case "OC":
    case "IN":
      return "CREATED";
    case "CC":
    case "CD":
      return "CUSTOMS";
    case "AR":
    case "DP":
    case "AF":
      return "AT_HUB";
    case "DE":
    case "SE":
    case "DY":
    case "CA":
      return "EXCEPTION";
    case "RS":
      return "RETURNED";
    default:
      return "IN_TRANSIT";
  }
}

export const fedexAdapter: CarrierAdapter = {
  id: "fedex",
  label: "FedEx",
  isConfigured: () => Boolean(process.env.FEDEX_CLIENT_ID && process.env.FEDEX_CLIENT_SECRET),
  async fetchEvents(trackingNumber) {
    const token = await getToken();
    const data = await fetchJson<FedexTrackResponse>(`${baseUrl()}/track/v1/trackingnumbers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        includeDetailedScans: true,
        trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      }),
    });
    const scans = data.output?.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents ?? [];
    return scans.map<CarrierEvent>((s) => ({
      externalId: eventId(s.date, s.eventType, s.scanLocation?.city),
      status: mapFedexStatus(s.derivedStatusCode, s.eventType),
      rawStatus: s.eventType ?? "",
      description: s.eventDescription,
      location: [s.scanLocation?.city, s.scanLocation?.countryCode].filter(Boolean).join(", ") || undefined,
      occurredAt: new Date(s.date),
    }));
  },
};
