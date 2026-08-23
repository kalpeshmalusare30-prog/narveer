import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { rawDb?: PrismaClient };

export const rawDb = g.rawDb ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") g.rawDb = rawDb;
