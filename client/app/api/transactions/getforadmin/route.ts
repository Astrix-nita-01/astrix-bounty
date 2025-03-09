import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function GET(){

    try {
        const allTransactions = await client.transactions.findMany({
            where: {
                bountyStatus: "accepted"
            }
        });


        return NextResponse.json({
            success: true,
            allTransactions: allTransactions,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}