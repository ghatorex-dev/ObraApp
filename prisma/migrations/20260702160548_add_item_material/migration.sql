-- AlterTable
ALTER TABLE "ItemPresupuesto" ADD COLUMN     "cantidadUsada" DOUBLE PRECISION,
ADD COLUMN     "materialId" TEXT;

-- CreateIndex
CREATE INDEX "ItemPresupuesto_materialId_idx" ON "ItemPresupuesto"("materialId");

-- AddForeignKey
ALTER TABLE "ItemPresupuesto" ADD CONSTRAINT "ItemPresupuesto_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
