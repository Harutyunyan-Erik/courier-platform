import type { ShipmentStatus } from "@prisma/client";
import { type CarrierAdapter, type CarrierEvent, eventId, fetchJson } from "./types";

// DHL Shipment Tracking - Unified API: https://developer.dhl.com/api-reference/shipment-tracking
type DhlResponse = {
  shipments?: {
    events?: {
      timestamp: string;
      statusCode?: string;
      status?: string;
      description?: string;
      location?: { address?: { addressLocality?: string; countryCode?: string } };
    }[];
  }[];
};

export function mapDhlStatus(code = "", text = ""): ShipmentStatus {
  const t = `${code} ${text}`.toLowerCase();
  if (code === "delivered") return "DELIVERED";
  if (code === "failure") return t.includes("return") ? "RETURNED" : "EXCEPTION";
  if (code === "pre-transit") return "CREATED";
  if (t.includes("customs") || t.includes("clearance")) return "CUSTOMS";
  if (t.includes("out for delivery") || t.includes("with delivery courier")) return "OUT_FOR_DELIVERY";
  if (t.includes("picked up") || t.includes("pickup")) return "PICKED_UP";
  if (t.includes("facility") || t.includes("hub") || t.includes("sort")) return "AT_HUB";
  return "IN_TRANSIT";
}

export const dhlAdapter: CarrierAdapter = {
  id: "dhl",
  label: "DHL",
  isConfigured: () => Boolean(process.env.DHL_API_KEY),
  async fetchEvents(trackingNumber) {
    const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`;
    const data = await fetchJson<DhlResponse>(url, {
      headers: { "DHL-API-Key": process.env.DHL_API_KEY ?? "", Accept: "application/json" },
    });
    const events = data.shipments?.[0]?.events ?? [];
    return events.map<CarrierEvent>((e) => {
      const addr = e.location?.address;
      const location = [addr?.addressLocality, addr?.countryCode].filter(Boolean).join(", ") || undefined;
      return {
        externalId: eventId(e.timestamp, e.statusCode, e.description),
        status: mapDhlStatus(e.statusCode, `${e.status ?? ""} ${e.description ?? ""}`),
        rawStatus: e.status ?? e.statusCode ?? "",
        description: e.description,
        location,
        occurredAt: new Date(e.timestamp),
      };
    });
  },
};
