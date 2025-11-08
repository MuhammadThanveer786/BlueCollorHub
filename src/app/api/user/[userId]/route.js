import connect from "@lib/mongodb";
import User from "@models/User";
import Post from "@models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    await connect();
    
    // FIX: Access parameter directly to avoid the Next.js warning
    const userIdToFetch = params.userId; 

    try {
        if (!userIdToFetch || !mongoose.Types.ObjectId.isValid(userIdToFetch)) {
            return NextResponse.json({ message: "Invalid User ID format" }, { status: 400 });
        }
        
        const user = await User.findById(userIdToFetch).select("-password");
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const postsCount = await Post.countDocuments({ userId: userIdToFetch });
        const followerCount = user.followers?.length || 0;
        const followingCount = user.following?.length || 0;

        const userProfileData = {
            ...user.toObject(),
            postsCount,
            followerCount,
            followingCount,
        };
        return NextResponse.json(userProfileData, { status: 200 });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        let errorMessage = "Something went wrong";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    await connect();
    
    // FIX: Access parameter directly
    const userIdToUpdate = params.userId;
    
    try {
        const body = await req.json();
        
        if (!userIdToUpdate || !mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
            return NextResponse.json({ message: "Invalid User ID format" }, { status: 400 });
        }
        
        // Prevent updating fields managed by connection logic
        delete body.email;
        delete body.password;
        delete body.emailVerified;
        delete body.connections;
        delete body.followers;
        delete body.following;
        delete body.connectionRequestsSent;
        delete body.connectionRequestsReceived;

        const updatedUser = await User.findByIdAndUpdate(userIdToUpdate, { $set: body }, { new: true, runValidators: true }).select("-password");
        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        const postsCount = await Post.countDocuments({ userId: userIdToUpdate });
        const followerCount = updatedUser.followers?.length || 0;
        const followingCount = updatedUser.following?.length || 0;
        const userProfileData = {
            ...updatedUser.toObject(),
            postsCount,
            followerCount,
            followingCount,
        };
        return NextResponse.json({ message: "User updated successfully", user: userProfileData }, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        let errorMessage = "Something went wrong during update";
        if (error.name === 'ValidationError') {
            errorMessage = "Validation failed: " + Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.name === 'CastError') {
            errorMessage = "Invalid data format provided";
        }
        return NextResponse.json({ error: errorMessage }, { status: error.name === 'ValidationError' ? 400 : 500 });
    }
}

export async function DELETE(req, { params }) {
    await connect();
    
    // FIX: Access parameter directly
    const userIdToDelete = params.userId;

    try {
        if (!userIdToDelete || !mongoose.Types.ObjectId.isValid(userIdToDelete)) {
            return NextResponse.json({ message: "Invalid User ID format" }, { status: 400 });
        }
        const deletedUser = await User.findByIdAndDelete(userIdToDelete);
        if (!deletedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Something went wrong during deletion" }, { status: 500 });
    }
}