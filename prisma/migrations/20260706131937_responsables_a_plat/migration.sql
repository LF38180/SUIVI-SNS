-- CreateEnum
CREATE TYPE "RoleSurMesure" AS ENUM ('RESPONSABLE', 'CONCERNE');

-- AlterTable
ALTER TABLE "Mesure" ADD COLUMN     "proposeeParId" INTEGER;

-- CreateTable
CREATE TABLE "MesureResponsable" (
    "mesureId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "RoleSurMesure" NOT NULL DEFAULT 'RESPONSABLE',

    CONSTRAINT "MesureResponsable_pkey" PRIMARY KEY ("mesureId","userId")
);

-- CreateIndex
CREATE INDEX "MesureResponsable_userId_idx" ON "MesureResponsable"("userId");

-- AddForeignKey
ALTER TABLE "Mesure" ADD CONSTRAINT "Mesure_proposeeParId_fkey" FOREIGN KEY ("proposeeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MesureResponsable" ADD CONSTRAINT "MesureResponsable_mesureId_fkey" FOREIGN KEY ("mesureId") REFERENCES "Mesure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MesureResponsable" ADD CONSTRAINT "MesureResponsable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL (aucune perte du travail Loïck + Julie) : on peuple le modèle à plat
-- depuis l'ancien. référent + adjoint de rattachement → RESPONSABLE ;
-- co-référents → CONCERNE. ON CONFLICT : si un élu est à la fois référent/adjoint
-- ET co-référent, le rôle RESPONSABLE l'emporte (on ne rétrograde jamais).
-- ─────────────────────────────────────────────────────────────────────────────

-- Référents → RESPONSABLE
INSERT INTO "MesureResponsable" ("mesureId", "userId", "role")
SELECT "id", "eluReferentId", 'RESPONSABLE'
FROM "Mesure"
WHERE "eluReferentId" IS NOT NULL
ON CONFLICT ("mesureId", "userId") DO NOTHING;

-- Adjoints de rattachement → RESPONSABLE
INSERT INTO "MesureResponsable" ("mesureId", "userId", "role")
SELECT "id", "adjointRattachementId", 'RESPONSABLE'
FROM "Mesure"
WHERE "adjointRattachementId" IS NOT NULL
ON CONFLICT ("mesureId", "userId") DO NOTHING;

-- Co-référents → CONCERNE (seulement s'ils ne sont pas déjà RESPONSABLE)
INSERT INTO "MesureResponsable" ("mesureId", "userId", "role")
SELECT "mesureId", "userId", 'CONCERNE'
FROM "MesureCoReferent"
ON CONFLICT ("mesureId", "userId") DO NOTHING;
