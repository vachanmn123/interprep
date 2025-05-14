/*
  Warnings:

  - You are about to drop the column `value` on the `question_options` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_question_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" TEXT NOT NULL,
    CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_question_options" ("id", "isCorrect", "label", "questionId") SELECT "id", "isCorrect", "label", "questionId" FROM "question_options";
DROP TABLE "question_options";
ALTER TABLE "new_question_options" RENAME TO "question_options";
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");
CREATE UNIQUE INDEX "question_options_questionId_label_key" ON "question_options"("questionId", "label");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
