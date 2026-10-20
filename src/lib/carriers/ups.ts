import type { ShipmentStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { type CarrierAdapter, type CarrierEvent, eventId, fetchJson } from "./types";

// UPS Tracking API: https://developer.ups.com/api/reference?loc=en_US#tag/Tracking
type UpsResponse = {
  trackResponse?: {
    shipment?: {
      package?: {
        activity?: {
          date: string; // YYYYMMDD
          time: string; // HHMMSS
          location?: { address?: { city?: string; country?: string; countryCode?: string } };
          status?: { type?: string; description?: string; code?: string };
        }[];
      }[];
    }[];
  };
};

let cachedToken: { value: string; expiresAt: number } | null = null;

const baseUrl = () => process.env.UPS_API_URL || "https://onlinetools.ups.com";

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const basic = Buffer.from(`${process.env.UPS_CLIENT_ID}:${process.env.UPS_CLIENT_SECRET}`).toString("base64");
  const data = await fetchJson<{ access_token: string; expires_in: string }>(`${baseUrl()}/security/v1/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in) * 1000 };
  return data.access_token;
}

export function mapUpsStatus(type = "", description = ""): ShipmentStatus {
  const d = description.toLowerCase();
  if (type === "D") return "DELIVERED";
  if (type === "M" || type === "MV") return "CREATED";
  if (type === "P") return "PICKED_UP";
  if (type === "X") return d.includes("return") ? "RETURNED" : "EXCEPTION";
  if (type === "RS") return "RETURNED";
  if (d.includes("out for delivery")) return "OUT_FOR_DELIVERY";
  if (d.includes("customs") || d.includes("clearance")) return "CUSTOMS";
  if (d.includes("facility") || d.includes("arrived")) return "AT_HUB";
  return "IN_TRANSIT";
}

function parseUpsDate(date: string, time: string) {
  const t = time.padStart(6, "0");
  return new Date(
    `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}Z`,
  );
}

export const upsAdapter: CarrierAdapter = {
  id: "ups",
  label: "UPS",
  isConfigured: () => Boolean(process.env.UPS_CLIENT_ID && process.env.UPS_CLIENT_SECRET),
  async fetchEvents(trackingNumber) {
    const token = await getToken();
    const data = await fetchJson<UpsResponse>(
      `${baseUrl()}/api/track/v1/details/${encodeURIComponent(trackingNumber)}`,
      { headers: { Authorization: `Bearer ${token}`, transId: randomUUID(), transactionSrc: "courier-platform" } },
    );
    const activity = data.trackResponse?.shipment?.[0]?.package?.[0]?.activity ?? [];
    return activity.map<CarrierEvent>((a) => {
      const addr = a.location?.address;
      return {
        externalId: eventId(a.date, a.time, a.status?.code),
        status: mapUpsStatus(a.status?.type, a.status?.description),
        rawStatus: a.status?.description ?? a.status?.type ?? "",
        description: a.status?.description,
        location: [addr?.city, addr?.countryCode ?? addr?.country].filter(Boolean).join(", ") || undefined,
        occurredAt: parseUpsDate(a.date, a.time),
      };
    });
  },
};
