/*
  Warnings:

  - Changed the type of `projects` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "projects",
ADD COLUMN     "projects" JSONB NOT NULL;
