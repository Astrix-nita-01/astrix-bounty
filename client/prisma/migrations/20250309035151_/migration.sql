/*
  Warnings:

  - Added the required column `submissionDetails` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "submissionDetails" TEXT NOT NULL;
