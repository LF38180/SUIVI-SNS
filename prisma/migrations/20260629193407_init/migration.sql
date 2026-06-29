-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ELU');

-- CreateEnum
CREATE TYPE "Categorie" AS ENUM ('AXE_1', 'AXE_2', 'AXE_3', 'AXE_4', 'HORS_PROGRAMME');

-- CreateEnum
CREATE TYPE "TypePiece" AS ENUM ('PHOTO', 'DOCUMENT', 'LIEN');

-- CreateEnum
CREATE TYPE "StatutProposition" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ELU',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "fonction" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mesure" (
    "id" SERIAL NOT NULL,
    "categorie" "Categorie" NOT NULL,
    "rubrique" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "natureCout" TEXT,
    "ordreGrandeur" TEXT,
    "besoins" TEXT,
    "limites" TEXT,
    "echeanceCible" TIMESTAMP(3),
    "avancementPublie" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "coutPublic" BOOLEAN NOT NULL DEFAULT false,
    "limitesPublic" BOOLEAN NOT NULL DEFAULT false,
    "eluReferentId" INTEGER,
    "adjointRattachementId" INTEGER,

    CONSTRAINT "Mesure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposition" (
    "id" SERIAL NOT NULL,
    "mesureId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "avancementPropose" INTEGER NOT NULL,
    "commentaire" TEXT,
    "echeanceProposee" TIMESTAMP(3),
    "statut" "StatutProposition" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifRefus" TEXT,
    "valideeParId" INTEGER,
    "creeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteeLe" TIMESTAMP(3),

    CONSTRAINT "Proposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntree" (
    "id" SERIAL NOT NULL,
    "mesureId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT NOT NULL,
    "avancementAssocie" INTEGER,

    CONSTRAINT "JournalEntree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceJointe" (
    "id" SERIAL NOT NULL,
    "mesureId" INTEGER NOT NULL,
    "type" "TypePiece" NOT NULL,
    "url" TEXT NOT NULL,
    "legende" TEXT,
    "ajouteeParId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Historique" (
    "id" SERIAL NOT NULL,
    "mesureId" INTEGER NOT NULL,
    "ancienPourcent" INTEGER NOT NULL,
    "nouveauPourcent" INTEGER NOT NULL,
    "proposeParId" INTEGER,
    "valideeParId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Mesure" ADD CONSTRAINT "Mesure_eluReferentId_fkey" FOREIGN KEY ("eluReferentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesure" ADD CONSTRAINT "Mesure_adjointRattachementId_fkey" FOREIGN KEY ("adjointRattachementId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposition" ADD CONSTRAINT "Proposition_mesureId_fkey" FOREIGN KEY ("mesureId") REFERENCES "Mesure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposition" ADD CONSTRAINT "Proposition_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposition" ADD CONSTRAINT "Proposition_valideeParId_fkey" FOREIGN KEY ("valideeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntree" ADD CONSTRAINT "JournalEntree_mesureId_fkey" FOREIGN KEY ("mesureId") REFERENCES "Mesure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntree" ADD CONSTRAINT "JournalEntree_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_mesureId_fkey" FOREIGN KEY ("mesureId") REFERENCES "Mesure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_ajouteeParId_fkey" FOREIGN KEY ("ajouteeParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historique" ADD CONSTRAINT "Historique_mesureId_fkey" FOREIGN KEY ("mesureId") REFERENCES "Mesure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
