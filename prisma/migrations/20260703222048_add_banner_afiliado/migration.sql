-- CreateTable
CREATE TABLE "BannerAfiliado" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "linkDestino" TEXT NOT NULL,
    "categoria" "Categoria",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerAfiliado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BannerAfiliado_activo_categoria_orden_idx" ON "BannerAfiliado"("activo", "categoria", "orden");
