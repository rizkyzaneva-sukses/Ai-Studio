// Prisma client singleton for Next.js (Prisma 7+)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const options: Record<string, unknown> = {
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  };
  if (process.env.DATABASE_URL) {
    options.datasourceUrl = process.env.DATABASE_URL;
  }
  return new PrismaClient(options as ConstructorParameters<typeof PrismaClient>[0]);
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
