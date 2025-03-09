import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", body);
        const { idoftx } = body;

        // check if transaction exists
        const existingTx = await client.transactions.findUnique({ where: { id: idoftx } });

        if(!existingTx) {
            return NextResponse.json({
                success: false,
                message: `trabsaction does not exists`,
            });
        }

        await client.transactions.delete({
            where: {
                id: idoftx
            }
        })

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}