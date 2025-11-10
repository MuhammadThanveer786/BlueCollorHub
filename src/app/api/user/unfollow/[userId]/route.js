// File: app/api/user/unfollow/[userId]/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust this path if needed
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";


 // Assuming your model is named 'User'
import mongoose from "mongoose";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Get the ID from the URL (params)
  const { userId: userIdToUnfollow } = params;
  // Get the ID of the person doing the unfollowing
  const currentUserId = session.user.id;

  if (!userIdToUnfollow || !mongoose.Types.ObjectId.isValid(userIdToUnfollow)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  try {
    await dbConnect();

    // 1. Remove the person from the current user's 'following' list
    await User.findByIdAndUpdate(
      currentUserId,
      // Use $pull to remove from the array
      { $pull: { following: new mongoose.Types.ObjectId(userIdToUnfollow) } },
      { new: true }
    );

    // 2. Remove the current user from the other person's 'followers' list
    await User.findByIdAndUpdate(
      userIdToUnfollow,
      // Use $pull to remove from the array
      { $pull: { followers: new mongoose.Types.ObjectId(currentUserId) } },
      { new: true }
    );

    // 3. IMPORTANT: Update the counts on both user documents
    const currentUser = await User.findById(currentUserId);
    const unfollowedUser = await User.findById(userIdToUnfollow);

    if (currentUser) {
        // Recalculate the count based on the array's new length
        currentUser.followingCount = currentUser.following.length;
        await currentUser.save();
    }
    
    if (unfollowedUser) {
        // Recalculate the count based on the array's new length
        unfollowedUser.followerCount = unfollowedUser.followers.length;
        await unfollowedUser.save();
    }

    return NextResponse.json({ success: true, message: "User unfollowed" });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}