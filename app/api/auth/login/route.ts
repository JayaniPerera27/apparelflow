import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Valid email and password required" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  // same message for wrong email or wrong password
  if (!user || !valid) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  await setSessionCookie(token);

  return Response.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  });
}