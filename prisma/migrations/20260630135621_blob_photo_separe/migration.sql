/*
  Warnings:

  - You are about to drop the column `contenu` on the `PieceJointe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PieceJointe" DROP COLUMN "contenu";

-- CreateTable
CREATE TABLE "PieceJointeBlob" (
    "pieceJointeId" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,

    CONSTRAINT "PieceJointeBlob_pkey" PRIMARY KEY ("pieceJointeId")
);

-- CreateIndex
CREATE INDEX "PieceJointe_mesureId_idx" ON "PieceJointe"("mesureId");

-- AddForeignKey
ALTER TABLE "PieceJointeBlob" ADD CONSTRAINT "PieceJointeBlob_pieceJointeId_fkey" FOREIGN KEY ("pieceJointeId") REFERENCES "PieceJointe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
