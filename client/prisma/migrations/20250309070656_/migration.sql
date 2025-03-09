/*
  Warnings:

  - A unique constraint covering the columns `[bountyId]` on the table `Transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transactions_bountyId_key" ON "Transactions"("bountyId");
