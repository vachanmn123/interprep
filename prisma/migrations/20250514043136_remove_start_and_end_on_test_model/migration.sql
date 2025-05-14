/*
  Warnings:

  - You are about to drop the column `endTime` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `tests` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "candidateId" TEXT NOT NULL,
    CONSTRAINT "tests_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tests" ("candidateId", "expiresAt", "id", "title", "type") SELECT "candidateId", "expiresAt", "id", "title", "type" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE INDEX "tests_candidateId_idx" ON "tests"("candidateId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
