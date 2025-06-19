import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pgbouncer=true&connection_limit=5", // Fix for Neon
    },
  },
});

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;