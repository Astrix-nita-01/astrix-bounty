-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "Bounty" DROP CONSTRAINT "Bounty_postedById_fkey";

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "applicantId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Bounty" ALTER COLUMN "postedById" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
