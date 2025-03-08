import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        const { username, rating } = body;

        // check if user exists
        const existingUser = await client.user.findUnique({
            where: {
                username: username
            }
        });

        if(!existingUser) {
            return NextResponse.json({
                success: false,
                message: `user not found`,
            });
        }

        const existingRatings = existingUser.ratings;

        const newRating = (existingRatings + rating)/2;

        const updatedUser = await client.user.update({
            where: {
                username: username,
            },
            data: {
                ratings: newRating,
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}