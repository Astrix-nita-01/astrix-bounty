import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { bountyId } = body;

        // check if application exists
        const requiredAplications = await client.application.findMany({ where: { bountyId: bountyId } });
        console.log("requiredAplications: ", requiredAplications);
        return NextResponse.json({
            success: true,
            requiredAplications: requiredAplications,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}