-- CreateEnum
CREATE TYPE "Situation" AS ENUM ('NORMALE', 'REPORTEE', 'ADAPTEE', 'ABANDONNEE');

-- AlterTable
ALTER TABLE "Mesure" ADD COLUMN     "situation" "Situation" NOT NULL DEFAULT 'NORMALE',
ADD COLUMN     "situationMotif" TEXT;
