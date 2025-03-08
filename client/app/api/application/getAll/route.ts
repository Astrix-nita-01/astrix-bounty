import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function GET(){

    try {
        const allApplications = await client.application.findMany();


        return NextResponse.json({
            success: true,
            allApplications: allApplications,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}