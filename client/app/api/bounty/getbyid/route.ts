import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { bountyId } = body;

        // check if bounty exists
        const existingBounty = await client.bounty.findUnique({ where: { id: bountyId } });

        if(!existingBounty) {
            return NextResponse.json({
                success: false,
                message: `bounty does not exists`,
            });
        }


        return NextResponse.json({
            success: true,
            bounty: existingBounty,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}