-- CreateIndex
CREATE INDEX "Historique_date_idx" ON "Historique"("date");

-- CreateIndex
CREATE INDEX "Historique_mesureId_date_idx" ON "Historique"("mesureId", "date");

-- CreateIndex
CREATE INDEX "Mesure_deletedAt_idx" ON "Mesure"("deletedAt");

-- CreateIndex
CREATE INDEX "Mesure_categorie_idx" ON "Mesure"("categorie");

-- CreateIndex
CREATE INDEX "Proposition_statut_idx" ON "Proposition"("statut");

-- CreateIndex
CREATE INDEX "Proposition_mesureId_idx" ON "Proposition"("mesureId");
