-- AlterTable
ALTER TABLE "TareaComunitaria" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "TareaComunitaria_userId_idx" ON "TareaComunitaria"("userId");

-- AddForeignKey
ALTER TABLE "TareaComunitaria" ADD CONSTRAINT "TareaComunitaria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
