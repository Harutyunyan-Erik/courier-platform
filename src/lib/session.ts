import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

// Kept free of Node-only imports so middleware (edge runtime) can use it.
export const SESSION_COOKIE = "session";

export type SessionPayload = { uid: string; role: Role };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: payload.uid as string, role: payload.role as Role };
  } catch {
    return null;
  }
}
