import connect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { NextResponse } from "next/server"; // Use NextResponse for dynamic routes

export async function GET(req, { params }) {
    await connect();
    const session = await getServerSession(authOptions);
    const userIdToFetch = params.userId;

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch the user specified in the URL parameter
        const user = await User.findById(userIdToFetch)
            .select('following')
            .populate('following', 'name profilePic title skillCategories'); // Added skillCategories for UI detail

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        return NextResponse.json({ list: user.following || [] }, { status: 200 });

    } catch (error) {
        console.error("Error fetching following list:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}