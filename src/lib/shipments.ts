import type { EventSource, ShipmentStatus } from "@prisma/client";
import { prisma } from "./db";
import { getAdapter } from "./carriers";
import type { CarrierEvent } from "./carriers/types";
import { notifyStatusChange } from "./notify";

/**
 * The current status is always the latest visible event. Recomputing it after
 * every change means API imports, webhooks and manual edits can never disagree.
 */
export async function recomputeStatus(shipmentId: string) {
  const shipment = await prisma.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
  const latest = await prisma.statusEvent.findFirst({
    where: { shipmentId, hidden: false },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });
  const status: ShipmentStatus = latest?.status ?? "CREATED";
  if (status !== shipment.currentStatus) {
    await prisma.shipment.update({ where: { id: shipmentId }, data: { currentStatus: status } });
    await notifyStatusChange(shipmentId, status, latest?.location ?? undefined).catch((err) =>
      console.error("notify failed", err),
    );
  }
  return status;
}

export async function addManualEvent(input: {
  shipmentId: string;
  status: ShipmentStatus;
  description?: string;
  location?: string;
  occurredAt?: Date;
  isPublic?: boolean;
  userId: string | null;
  source?: EventSource;
}) {
  await prisma.statusEvent.create({
    data: {
      shipmentId: input.shipmentId,
      status: input.status,
      description: input.description || null,
      location: input.location || null,
      occurredAt: input.occurredAt ?? new Date(),
      isPublic: input.isPublic ?? true,
      source: input.source ?? "MANUAL",
      createdById: input.userId,
    },
  });
  return recomputeStatus(input.shipmentId);
}

/** Stores carrier events, skipping ones already imported. Returns how many were new. */
export async function importCarrierEvents(shipmentId: string, events: CarrierEvent[], source: EventSource) {
  let created = 0;
  for (const e of events) {
    if (Number.isNaN(e.occurredAt.getTime())) continue;
    // Existing events are left alone so an admin's "hide" or edit is never overwritten.
    const existing = await prisma.statusEvent.findUnique({
      where: { shipmentId_externalId: { shipmentId, externalId: e.externalId } },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.statusEvent.create({
      data: {
        shipmentId,
        externalId: e.externalId,
        status: e.status,
        rawStatus: e.rawStatus || null,
        description: e.description || null,
        location: e.location || null,
        occurredAt: e.occurredAt,
        source,
      },
    });
    created++;
  }
  return created;
}

export async function syncShipment(shipmentId: string) {
  const shipment = await prisma.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: { carrier: true },
  });
  const adapter = getAdapter(shipment.carrier?.adapter);
  if (!adapter) return { skipped: "no adapter" as const };
  if (!adapter.isConfigured()) return { skipped: "not configured" as const };
  const number = shipment.carrierTrackingNumber || shipment.trackingNumber;
  try {
    const events = await adapter.fetchEvents(number);
    const created = await importCarrierEvents(shipment.id, events, "API");
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { lastSyncedAt: new Date(), lastSyncError: null },
    });
    const status = await recomputeStatus(shipment.id);
    return { created, status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { lastSyncedAt: new Date(), lastSyncError: message.slice(0, 500) },
    });
    return { error: message };
  }
}

/** Syncs every active shipment that has auto-sync on and a carrier with an adapter. */
export async function syncAll() {
  const shipments = await prisma.shipment.findMany({
    where: {
      autoSync: true,
      currentStatus: { notIn: ["DELIVERED", "RETURNED", "CANCELLED"] },
      carrier: { active: true, adapter: { not: "manual" } },
    },
    select: { id: true, trackingNumber: true },
  });
  const results = [];
  for (const s of shipments) {
    results.push({ trackingNumber: s.trackingNumber, ...(await syncShipment(s.id)) });
  }
  return results;
}
