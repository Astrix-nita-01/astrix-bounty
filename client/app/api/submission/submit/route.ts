import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { applicantUsername, applicationId, bountyId, submissionFile, submissionDetails } = body;

        // check if user exists
        const user = await client.user.findUnique({ where: { username: applicantUsername } });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: `user does not exists`,
            });
        }

        // check if the bounty exists
        const existingBounty = await client.bounty.findUnique({ where: { id: bountyId } });

        if(!existingBounty) {
            return NextResponse.json({
                success: false,
                message: `bounty does not exists`,
            });
        }

        // Check if user do has a accepted application on that specific bounty
        const existingApplication = await client.application.findUnique({ where: { id: applicationId, bountyId: bountyId, status: "accepted" } });

        if(!existingApplication) {
            return NextResponse.json({
                success: false,
                message: `invalid application to submit`,
            });
        }


        const submission = await client.submission.create({
            data: {
                submissionDetails: submissionDetails,
                submissionFile: submissionFile,
                applicantUsername: applicantUsername,
                applicationId: applicationId,
                bountyId: bountyId
            }
        });

        return NextResponse.json({
            success: true,
            submission: submission
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured prisma: ${error}`,
        });
    }
}