import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { submissionId, username, applicantname } = body;

        // check if user exists
        const user = await client.user.findUnique({ where: { username } });

        if(!user) {
            return NextResponse.json({
                success: true,
                message: `user does not exists`,
            });
        }

        // check if submission exists
        const existingSubmission = await client.submission.findUnique({ where: { id: submissionId } });

        if(!existingSubmission) {
            return NextResponse.json({
                success: false,
                message: `submission does not exists`,
            });
        }

        const requiredBounty = await client.bounty.findUnique({
            where: { id: existingSubmission.bountyId },
        });

        if(!requiredBounty) {
            return NextResponse.json({
                success: false,
                message: `invalid bounty`,
            });
        }

        // check if user owns the bounty that the submission is related to
        if(requiredBounty.postedByUsername !== username) {
            return NextResponse.json({
                success: false,
                message: `user do not own the bounty`,
            });
        }

        // update the transaction for the bounty
        const updatedTransaction = await client.transactions.update({
            where: {
                bountyId: requiredBounty.id,
            },
            data: {
                freelancer: applicantname,
                bountyStatus: "accepted"
            }
        });

        // // delete all applications of the bounty
        // await client.application.deleteMany({
        //     where: {
        //         bountyId: requiredBounty.id,
        //     }
        // });

        // Update bounty status
        const updatedBounty = await client.bounty.update({
            where: {
                id: requiredBounty.id,
            },
            data: {
                status: "completed",
            }
        })
        
        // Update submission
        const updatedSubmission = await client.submission.update({
            where: {
                id: submissionId
            },
            data: {
                status: "accepted"
            }
        });

        return NextResponse.json({
            success: true,
            updatedSubmission: updatedSubmission,
            updatedTransaction: updatedTransaction,
            updatedBounty: updatedBounty
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}