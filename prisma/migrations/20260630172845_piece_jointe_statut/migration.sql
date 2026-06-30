-- AlterTable
ALTER TABLE "PieceJointe" ADD COLUMN     "statut" "StatutProposition" NOT NULL DEFAULT 'EN_ATTENTE';

-- CreateIndex
CREATE INDEX "PieceJointe_statut_idx" ON "PieceJointe"("statut");
