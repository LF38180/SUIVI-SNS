-- CreateEnum
CREATE TYPE "GroupeTravail" AS ENUM ('MOYENS_GENERAUX');

-- CreateTable
CREATE TABLE "GroupeMembre" (
    "id" SERIAL NOT NULL,
    "groupe" "GroupeTravail" NOT NULL,
    "userId" INTEGER NOT NULL,
    "ajouteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ajoutePar" TEXT,

    CONSTRAINT "GroupeMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPole" (
    "id" SERIAL NOT NULL,
    "groupe" "GroupeTravail" NOT NULL,
    "cle" TEXT NOT NULL,
    "userId" INTEGER,
    "contenu" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "modifiePar" TEXT NOT NULL,
    "modifieLe" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentPole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPoleVersion" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "contenu" JSONB NOT NULL,
    "auteur" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentPoleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupeMembre_userId_idx" ON "GroupeMembre"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupeMembre_groupe_userId_key" ON "GroupeMembre"("groupe", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPole_groupe_cle_userId_key" ON "DocumentPole"("groupe", "cle", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPoleVersion_documentId_version_key" ON "DocumentPoleVersion"("documentId", "version");

-- AddForeignKey
ALTER TABLE "GroupeMembre" ADD CONSTRAINT "GroupeMembre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPole" ADD CONSTRAINT "DocumentPole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPoleVersion" ADD CONSTRAINT "DocumentPoleVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentPole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
