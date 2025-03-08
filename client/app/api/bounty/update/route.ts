import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function PUT(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { bountyId, username, title, description, category, promptFile, budgetRange, skillsRequired } = body;

        // check if user exists
        const user = await client.user.findUnique({ where: { username } });

        if(!user) {
            return NextResponse.json({
                success: true,
                message: `user does not exists`,
            });
        }

        // check if bounty exists
        const existingBounty = await client.bounty.findUnique({ where: { id: bountyId } });

        if(!existingBounty) {
            return NextResponse.json({
                success: false,
                message: `bounty does not exists`,
            });
        }

        // check if user owns the bounty
        if(existingBounty.postedByUsername !== username) {
            return NextResponse.json({
                success: false,
                message: `user do not own the bounty`,
            });
        }

        const updatedBounty = await client.bounty.update({
            where: {
                id: bountyId,
            },
            data: {
                title,
                description, 
                category, 
                promptFile, 
                budgetRange, 
                skillsRequired,
            }
        });

        return NextResponse.json({
            success: true,
            updatedBounty: updatedBounty
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}