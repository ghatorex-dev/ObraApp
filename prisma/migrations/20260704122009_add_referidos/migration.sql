/*
  Warnings:

  - A unique constraint covering the columns `[codigoReferido]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "codigoReferido" TEXT,
ADD COLUMN     "referidoPorId" TEXT;

-- CreateTable
CREATE TABLE "Comision" (
    "id" TEXT NOT NULL,
    "referidorId" TEXT NOT NULL,
    "referidoId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL DEFAULT 0.49,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fechaComisionable" TIMESTAMP(3) NOT NULL,
    "fechaPagada" TIMESTAMP(3),
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comision_estado_idx" ON "Comision"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Comision_referidoId_key" ON "Comision"("referidoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_codigoReferido_key" ON "User"("codigoReferido");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referidoPorId_fkey" FOREIGN KEY ("referidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_referidorId_fkey" FOREIGN KEY ("referidorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_referidoId_fkey" FOREIGN KEY ("referidoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
