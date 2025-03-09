import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { submissionId, username } = body;

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

        await client.bounty.delete({
            where: {
                id: requiredBounty.id
            }
        });

        await client.submission.delete({
            where: {
                id: submissionId
            }
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}