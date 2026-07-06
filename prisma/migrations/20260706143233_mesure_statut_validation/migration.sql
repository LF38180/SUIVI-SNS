-- CreateEnum
CREATE TYPE "StatutMesure" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REFUSEE');

-- AlterTable
ALTER TABLE "Mesure" ADD COLUMN     "motifRefus" TEXT,
ADD COLUMN     "statutMesure" "StatutMesure" NOT NULL DEFAULT 'VALIDEE';

-- CreateIndex
CREATE INDEX "Mesure_statutMesure_idx" ON "Mesure"("statutMesure");
