import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function GET(){

    try {
        const allBounties = await client.bounty.findMany({
            where: {
                status: "pending"
            }
        });


        return NextResponse.json({
            success: true,
            allBounties: allBounties,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}