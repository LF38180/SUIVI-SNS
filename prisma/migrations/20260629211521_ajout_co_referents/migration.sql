-- CreateTable
CREATE TABLE "MesureCoReferent" (
    "mesureId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "MesureCoReferent_pkey" PRIMARY KEY ("mesureId","userId")
);

-- AddForeignKey
ALTER TABLE "MesureCoReferent" ADD CONSTRAINT "MesureCoReferent_mesureId_fkey" FOREIGN KEY ("mesureId") REFERENCES "Mesure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MesureCoReferent" ADD CONSTRAINT "MesureCoReferent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
