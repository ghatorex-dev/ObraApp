import { PrismaClient } from "@prisma/client";

// Cliente único de Prisma reutilizado entre recargas en desarrollo
// para evitar abrir múltiples conexiones a la base de datos.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
