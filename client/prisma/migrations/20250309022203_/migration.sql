-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "appliedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Bounty" ADD COLUMN     "postedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "submissionFile" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "bountyId" INTEGER NOT NULL,
    "applicantUsername" TEXT NOT NULL,
    "submittedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_applicantUsername_fkey" FOREIGN KEY ("applicantUsername") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
