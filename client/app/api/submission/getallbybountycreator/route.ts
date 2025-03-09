import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { username } = body;

        // check if user exists
        const user = await client.user.findUnique({ where: { username } });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: `user does not exists`,
            });
        }

        const requiredBounties = await client.bounty.findMany({ where: { postedByUsername: username } });

        const allSubmissionToReview = [];
        for (const bounty of requiredBounties) {
            const bountyId = bounty.id;

            const submissions = await client.submission.findMany({ where: { bountyId } });
            if(submissions) {
                for (const submission of submissions) {
                    if(submission.status === "pending") {
                        allSubmissionToReview.push(submission);
                    }
                }
            }
        }


        return NextResponse.json({
            success: true,
            allSubmissionToReview: allSubmissionToReview,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}