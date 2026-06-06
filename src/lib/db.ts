import { PrismaClient } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Parse connection string manually to preserve dotted Supabase usernames (postgres.ridsppgxnwjxaoiopbnm)
  const url = new URL(connectionString);
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const host = url.hostname;
  const port = parseInt(url.port || '5432', 10);
  const database = url.pathname.slice(1) || 'postgres';
  
  // Extract SSL mode from query parameters
  const sslMode = url.searchParams.get('sslmode');
  const connectionLimit = Number(url.searchParams.get("connection_limit") || 1);
  const poolSize = Number.isFinite(connectionLimit) && connectionLimit > 0 ? connectionLimit : 1;

  // Create connection pool with Supabase pooler configuration
  const pool = new Pool({
    host,
    port,
    database,
    user: username,
    password,
    ssl: sslMode === 'require' ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    } : false,
    max: poolSize,
    min: 0,
    keepAlive: true,
    allowExitOnIdle: true,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
    query_timeout: 30000,
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Cache the client in both dev and production to avoid connection pool exhaustion
if (!globalForPrisma.prisma) globalForPrisma.prisma = db;
