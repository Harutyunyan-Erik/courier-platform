import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./db";
import { signSession, verifySession, SESSION_COOKIE, type SessionPayload } from "./session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: { id: string; role: Role }) {
  const token = await signSession({ uid: user.id, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  return user?.active ? user : null;
}

export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "COURIER"];
export const MANAGER_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER"];

/** Loads the current user or redirects to the login page when the role is not allowed. */
export async function requireUser(locale: string, roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (roles && !roles.includes(user.role)) redirect(`/${locale}`);
  return user;
}
