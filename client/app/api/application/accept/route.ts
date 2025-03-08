import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { username, applicationId } = body;

        // check if user exists
        const user = await client.user.findUnique({ where: { username } });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: `user does not exists`,
            });
        }

        // Check if application exists
        const existingApplication = await client.application.findUnique({ where: { id: applicationId } });

        if(!existingApplication) {
            return NextResponse.json({
                success: false,
                message: `application does not exists`,
            });
        }

        const application = await client.application.update({
            where: {
                id: applicationId,
            },
            data: {
                status: "accepted"
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