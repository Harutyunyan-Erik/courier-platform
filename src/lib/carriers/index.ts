import type { CarrierAdapter } from "./types";
import { dhlAdapter } from "./dhl";
import { fedexAdapter } from "./fedex";
import { upsAdapter } from "./ups";
import { track17Adapter } from "./track17";
import { demoAdapter } from "./demo";

/** To add a carrier: write an adapter next to these and register it here. */
export const adapters: Record<string, CarrierAdapter> = {
  [dhlAdapter.id]: dhlAdapter,
  [fedexAdapter.id]: fedexAdapter,
  [upsAdapter.id]: upsAdapter,
  [track17Adapter.id]: track17Adapter,
  [demoAdapter.id]: demoAdapter,
};

/** "manual" carriers (our own couriers) have no adapter and are updated by staff only. */
export function getAdapter(id: string | null | undefined): CarrierAdapter | null {
  return (id && adapters[id]) || null;
}
