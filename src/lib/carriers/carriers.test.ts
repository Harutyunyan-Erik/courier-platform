import { describe, expect, it } from "vitest";
import { mapDhlStatus } from "./dhl";
import { mapFedexStatus } from "./fedex";
import { mapUpsStatus } from "./ups";
import { mapTrack17Stage, parseTrack17Events } from "./track17";
import { demoAdapter } from "./demo";

describe("status mapping", () => {
  it("maps DHL", () => {
    expect(mapDhlStatus("delivered")).toBe("DELIVERED");
    expect(mapDhlStatus("transit", "Customs clearance status updated")).toBe("CUSTOMS");
    expect(mapDhlStatus("transit", "With delivery courier")).toBe("OUT_FOR_DELIVERY");
    expect(mapDhlStatus("failure", "Returned to shipper")).toBe("RETURNED");
  });
  it("maps FedEx", () => {
    expect(mapFedexStatus("DL")).toBe("DELIVERED");
    expect(mapFedexStatus("", "OD")).toBe("OUT_FOR_DELIVERY");
    expect(mapFedexStatus("XX")).toBe("IN_TRANSIT");
  });
  it("maps UPS", () => {
    expect(mapUpsStatus("D", "Delivered")).toBe("DELIVERED");
    expect(mapUpsStatus("I", "Out For Delivery Today")).toBe("OUT_FOR_DELIVERY");
    expect(mapUpsStatus("X", "Exception")).toBe("EXCEPTION");
  });
  it("maps 17TRACK", () => {
    expect(mapTrack17Stage("PickedUp")).toBe("PICKED_UP");
    expect(mapTrack17Stage("", "Delivered_Other")).toBe("DELIVERED");
  });
});

describe("17TRACK parsing", () => {
  it("builds stable events and skips ones without time", () => {
    const events = parseTrack17Events({
      tracking: {
        providers: [
          {
            events: [
              { time_iso: "2026-10-20T10:00:00+04:00", description: "Accepted", location: "Yerevan", stage: "InfoReceived" },
              { description: "no time" },
            ],
          },
        ],
      },
    });
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe("CREATED");
    expect(events[0].externalId).toBe(parseTrack17Events({ tracking: { providers: [{ events: [{ time_iso: "2026-10-20T10:00:00+04:00", description: "Accepted", stage: "InfoReceived" }] }] } })[0].externalId);
  });
});

describe("demo adapter", () => {
  it("returns at least the first step with stable ids", async () => {
    const first = await demoAdapter.fetchEvents("X1");
    const second = await demoAdapter.fetchEvents("X1");
    expect(first[0].status).toBe("PICKED_UP");
    expect(second.map((e) => e.externalId)).toEqual(first.map((e) => e.externalId));
  });
});
