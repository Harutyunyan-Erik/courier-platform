import type { ShipmentStatus } from "@prisma/client";
import { prisma } from "../db";
import type { CarrierAdapter, CarrierEvent } from "./types";

// Simulated carrier for testing automation without real API keys. Each event
// becomes "visible" a few minutes after the previous one, starting from when the
// shipment was created (so it also works on serverless hosts with no shared memory).
const STEPS: { status: ShipmentStatus; description: string; location: string }[] = [
  { status: "PICKED_UP", description: "Shipment picked up", location: "Yerevan, AM" },
  { status: "AT_HUB", description: "Arrived at sort facility", location: "Yerevan, AM" },
  { status: "IN_TRANSIT", description: "Departed facility", location: "Yerevan, AM" },
  { status: "CUSTOMS", description: "Customs clearance", location: "Moscow, RU" },
  { status: "OUT_FOR_DELIVERY", description: "With delivery courier", location: "Moscow, RU" },
  { status: "DELIVERED", description: "Delivered", location: "Moscow, RU" },
];

const STEP_MINUTES = Number(process.env.DEMO_STEP_MINUTES ?? 2);

export const demoAdapter: CarrierAdapter = {
  id: "demo",
  label: "Demo (simulated)",
  isConfigured: () => true,
  async fetchEvents(trackingNumber) {
    const shipment = await prisma.shipment.findFirst({
      where: { OR: [{ trackingNumber }, { carrierTrackingNumber: trackingNumber }] },
      select: { createdAt: true },
    });
    const start = shipment?.createdAt.getTime() ?? Date.now();
    const elapsed = Math.floor((Date.now() - start) / 60_000 / STEP_MINUTES);
    return STEPS.slice(0, Math.min(elapsed + 1, STEPS.length)).map<CarrierEvent>((s, i) => ({
      externalId: `demo-${i}`,
      status: s.status,
      rawStatus: s.description,
      description: s.description,
      location: s.location,
      occurredAt: new Date(start + i * STEP_MINUTES * 60_000),
    }));
  },
};
