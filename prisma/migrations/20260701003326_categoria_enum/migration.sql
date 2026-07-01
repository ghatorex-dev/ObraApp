/*
  Warnings:

  - Changed the type of `categoria` on the `ItemPresupuesto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `categoria` on the `TareaComunitaria` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('plomeria', 'gas', 'albanileria', 'pintura');

-- AlterTable
ALTER TABLE "ItemPresupuesto" DROP COLUMN "categoria",
ADD COLUMN     "categoria" "Categoria" NOT NULL;

-- AlterTable
ALTER TABLE "TareaComunitaria" DROP COLUMN "categoria",
ADD COLUMN     "categoria" "Categoria" NOT NULL;
