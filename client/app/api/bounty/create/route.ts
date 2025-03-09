import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { username, title, description, category, promptFile, budget, skillsRequired, transactionId } = body;

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

        const transaction = await client.transactions.create({
            data: {
                From: username,
                amount: budget,
                bountyId: bounty.id,
                transactionId: transactionId,
            }
        });

        return NextResponse.json({
            success: true,
            bounty: bounty,
            transaction: transaction
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}