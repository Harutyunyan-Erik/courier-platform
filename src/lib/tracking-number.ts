import { randomInt } from "node:crypto";

// Unambiguous characters only (no 0/O, 1/I).
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Generates a tracking number like EC-AIR-7KQ2M9XH. */
export function generateTrackingNumber(type: "AIR" | "GROUND"): string {
  let body = "";
  for (let i = 0; i < 8; i++) body += ALPHABET[randomInt(ALPHABET.length)];
  return `EC-${type === "AIR" ? "A" : "G"}${body}`;
}

export function normalizeTrackingInput(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
