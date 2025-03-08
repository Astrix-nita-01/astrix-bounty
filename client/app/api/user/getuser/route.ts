import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        const { username } = body;

        // check if user exists
        const existingUser = await client.user.findUnique({
            where: {
                username: username
            }
        });

        if(!existingUser) {
            return NextResponse.json({
                success: true,
                user: null,
            });
        }

        return NextResponse.json({
            success: true,
            user: existingUser,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}