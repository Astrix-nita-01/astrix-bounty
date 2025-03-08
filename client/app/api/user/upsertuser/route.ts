import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export async function POST(req: NextRequest){
    const body = await req.json();

    try {
        console.log("body: ", typeof body.projects);
        const { username, description, profilePicture, resume, skills, projects } = body;

        // check if user exists
        const existingUser = await client.user.findUnique({
            where: {
                username: username
            }
        });

        if(existingUser) {
            // update user
            const updatedUser = await client.user.update({
                where: {
                    username: username,
                },
                data: {
                    description: description,
                    profilePicture: profilePicture,
                    resume: resume,
                    skills: skills,
                    projects: projects,
                }
            });

            return NextResponse.json({
                success: true,
                user: updatedUser
            });
        } else {
            // create user
            const user = await client.user.create({
                data: {
                    username: username,
                    description: description,
                    profilePicture: profilePicture,
                    ratings: 0,
                    resume: resume,
                    skills: skills,
                    projects: projects,
                }
            });

            return NextResponse.json({
                success: true,
                user: user
            });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: `error occured redis: ${error}`,
        });
    }
}