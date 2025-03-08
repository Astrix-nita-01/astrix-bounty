/*
  Warnings:

  - You are about to drop the column `applicantId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `postedById` on the `Bounty` table. All the data in the column will be lost.
  - Added the required column `applicantUsername` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postedByUsername` to the `Bounty` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "Bounty" DROP CONSTRAINT "Bounty_postedById_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "applicantId",
ADD COLUMN     "applicantUsername" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Bounty" DROP COLUMN "postedById",
ADD COLUMN     "postedByUsername" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_postedByUsername_fkey" FOREIGN KEY ("postedByUsername") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantUsername_fkey" FOREIGN KEY ("applicantUsername") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
