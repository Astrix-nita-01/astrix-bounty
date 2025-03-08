import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { username, coverLetter, bountyId } = body;

        // check if user exists
        const user = await client.user.findUnique({ where: { username } });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: `user does not exists`,
            });
        }

        const application = await client.application.create({
            data: {
                coverLetter: coverLetter,
                resume: user.resume,
                applicantUsername: username,
                bountyId: bountyId
            }
        });

        return NextResponse.json({
            success: true,
            application: application
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}