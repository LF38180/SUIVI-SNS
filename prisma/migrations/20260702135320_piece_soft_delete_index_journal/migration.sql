-- AlterTable
ALTER TABLE "PieceJointe" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "JournalEntree_mesureId_date_idx" ON "JournalEntree"("mesureId", "date");

-- CreateIndex
CREATE INDEX "PieceJointe_deletedAt_idx" ON "PieceJointe"("deletedAt");
