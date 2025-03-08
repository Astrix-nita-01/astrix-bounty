/*
  Warnings:

  - You are about to drop the column `budgetRange` on the `Bounty` table. All the data in the column will be lost.
  - Added the required column `budget` to the `Bounty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "budgetRange",
ADD COLUMN     "budget" DOUBLE PRECISION NOT NULL;
