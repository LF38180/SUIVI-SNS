-- AlterTable
ALTER TABLE "PieceJointe" ADD COLUMN     "contenu" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "nomFichier" TEXT,
ALTER COLUMN "url" DROP NOT NULL;
