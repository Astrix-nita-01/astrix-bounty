import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { username, title, description, category, promptFile, budget, skillsRequired } = body;

        // check if user exists
        const user = await client.user.findUnique({ where: { username } });

        if(!user) {
            return NextResponse.json({
                success: false,
                message: `user does not exists`,
            });
        }

        const bounty = await client.bounty.create({
            data: {
                postedByUsername: username,
                title,
                description, 
                category, 
                promptFile, 
                budget, 
                skillsRequired,
            }
        });

        return NextResponse.json({
            success: true,
            bounty: bounty
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}