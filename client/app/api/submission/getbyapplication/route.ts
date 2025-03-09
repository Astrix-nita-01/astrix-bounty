import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { applicationId, username } = body;

        // check if application exists
        const existingApplication = await client.application.findUnique({ where: { id: applicationId } });

        if(!existingApplication) {
            return NextResponse.json({
                success: false,
                message: `application does not exists`,
            });
        }

        const submission = await client.submission.findFirst({
            where: {
                applicationId: applicationId,
                applicantUsername: username
            }
        })


        return NextResponse.json({
            success: true,
            submission: submission,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}