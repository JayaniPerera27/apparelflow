// Safety guard: tests must never run against the app database.
const test = process.env.TEST_DATABASE_URL;
if (!test) throw new Error("TEST_DATABASE_URL is not set");

const host = (url?: string) => (url ? new URL(url).hostname.replace("-pooler", "") : "");
if (host(test) === host(process.env.DATABASE_URL) || host(test) === host(process.env.DIRECT_URL)) {
  throw new Error("TEST_DATABASE_URL points at the app database. Refusing to run tests.");
}

// lib/prisma.ts reads DATABASE_URL, so point it at the test branch
process.env.DATABASE_URL = test;