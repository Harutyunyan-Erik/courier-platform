import type { ShipmentStatus } from "@prisma/client";

export type CarrierEvent = {
  /** Stable id used to skip events that were already imported. */
  externalId: string;
  status: ShipmentStatus;
  rawStatus: string;
  description?: string;
  location?: string;
  occurredAt: Date;
};

export interface CarrierAdapter {
  /** Matches Carrier.adapter in the database. */
  id: string;
  label: string;
  /** True when the credentials this adapter needs are present. */
  isConfigured(): boolean;
  fetchEvents(trackingNumber: string): Promise<CarrierEvent[]>;
}

export class CarrierError extends Error {}

export function eventId(...parts: (string | undefined)[]) {
  return parts.map((p) => (p ?? "").trim()).join("|");
}

export async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CarrierError(`${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}
