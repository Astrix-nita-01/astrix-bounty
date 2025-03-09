-- AlterTable
ALTER TABLE "Bounty" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Transactions" ALTER COLUMN "bountyStatus" SET DEFAULT 'pending';
