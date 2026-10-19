-- Unicité de la RÉFÉRENCE d'un document (userId IS NULL) : le @@unique Prisma
-- (groupe, cle, userId) ne contraint pas les lignes à userId NULL (Postgres traite
-- les NULL comme distincts). Index partiel pour garantir une seule référence par
-- (groupe, cle) et éviter des doublons en cas d'écritures concurrentes.
CREATE UNIQUE INDEX "DocumentPole_reference_unique"
  ON "DocumentPole" ("groupe", "cle")
  WHERE "userId" IS NULL;
