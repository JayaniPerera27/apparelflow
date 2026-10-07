import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@/app/generated/prisma/client";

const COOKIE_NAME = "af_token";
const MAX_AGE = 60 * 60 * 8; // 8 hours

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export type Session = {
  userId: number;
  role: Role;
  email: string;
  fullName: string;
};

export async function signToken(s: Session) {
  return new SignJWT({ role: s.role, email: s.email, fullName: s.fullName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(s.userId))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const role = payload.role as Role;
    if (!Object.values(Role).includes(role) || !payload.sub) return null;
    return {
      userId: Number(payload.sub),
      role,
      email: String(payload.email),
      fullName: String(payload.fullName),
    };
  } catch {
    return null; // expired or tampered token
  }
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE_NAME);
}