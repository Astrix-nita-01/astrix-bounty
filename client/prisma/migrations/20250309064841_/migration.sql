-- CreateTable
CREATE TABLE "Transactions" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "From" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bountyId" TEXT NOT NULL,
    "bountyStatus" TEXT NOT NULL,
    "freelancer" TEXT,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
);
