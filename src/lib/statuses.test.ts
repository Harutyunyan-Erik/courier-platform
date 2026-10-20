import { describe, expect, it } from "vitest";
import { progressIndex } from "./statuses";
import { generateTrackingNumber, normalizeTrackingInput } from "./tracking-number";

describe("statuses", () => {
  it("places detailed statuses on the progress bar", () => {
    expect(progressIndex("CUSTOMS")).toBe(progressIndex("IN_TRANSIT"));
    expect(progressIndex("DELIVERED")).toBe(4);
    expect(progressIndex("CANCELLED")).toBe(-1);
  });
});

describe("tracking numbers", () => {
  it("generates readable numbers by type", () => {
    expect(generateTrackingNumber("AIR")).toMatch(/^EC-A[2-9A-HJ-NP-Z]{8}$/);
    expect(generateTrackingNumber("GROUND")).toMatch(/^EC-G/);
  });
  it("normalizes user input", () => {
    expect(normalizeTrackingInput("  ec-a 7kq2 ")).toBe("EC-A7KQ2");
  });
});
