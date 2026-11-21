import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// CHANGELOG 53: each Vercel instance opens its own pool, and the Prisma Postgres Free plan allows
// only 10 connections, so the pool stays small and lets idle connections go after 5 s (Vercel's
// advice for Fluid compute). On Vercel, DATABASE_URL is the pooled host (pooled.db.prisma.io);
// migrations use DIRECT_URL (prisma.config.ts).
const POOL_MAX = 5;
const IDLE_MS = 5_000;
const CONNECT_TIMEOUT_MS = 10_000;

// pg already treats sslmode=prefer, require and verify-ca as verify-full and warns about it on every
// connection. Spelling out verify-full keeps the same checks without the warning in the logs.
function withExplicitSsl(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode");
    if (mode === "prefer" || mode === "require" || mode === "verify-ca") url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createClient(): PrismaClient {
  const pool = new Pool({
    connectionString: withExplicitSsl(process.env.DATABASE_URL),
    max: POOL_MAX,
    idleTimeoutMillis: IDLE_MS,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  // Closes idle connections before Vercel suspends the instance; does nothing elsewhere.
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// Reuse one client across dev hot reloads so connections do not pile up.
export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
