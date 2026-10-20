import type { ShipmentStatus } from "@prisma/client";

export const STATUS_ORDER: ShipmentStatus[] = [
  "CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_HUB",
  "CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "RETURNED",
  "CANCELLED",
];

/** Main steps shown in the customer progress bar. */
export const PROGRESS_STEPS: ShipmentStatus[] = [
  "CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function progressIndex(status: ShipmentStatus): number {
  switch (status) {
    case "CREATED":
      return 0;
    case "PICKED_UP":
      return 1;
    case "IN_TRANSIT":
    case "AT_HUB":
    case "CUSTOMS":
    case "EXCEPTION":
      return 2;
    case "OUT_FOR_DELIVERY":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return -1;
  }
}

export const STATUS_TONE: Record<ShipmentStatus, string> = {
  CREATED: "bg-slate-100 text-slate-700",
  PICKED_UP: "bg-sky-100 text-sky-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  AT_HUB: "bg-indigo-100 text-indigo-800",
  CUSTOMS: "bg-amber-100 text-amber-800",
  OUT_FOR_DELIVERY: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  EXCEPTION: "bg-red-100 text-red-800",
  RETURNED: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

export function isFinal(status: ShipmentStatus) {
  return status === "DELIVERED" || status === "RETURNED" || status === "CANCELLED";
}
