// src/app/api/user/[userId]/posts/route.js

import connect from "@/lib/mongodb";         // Correct alias for root lib folder
import Post from "@/models/Post";   // <-- Use the new alias
import User from "@/models/User";   // <-- Use the new alias   // Correct relative path to root models folder
import mongoose from "mongoose";        // Import mongoose if using ObjectId validation

export async function GET(req, { params }) {
  await connect();

  try {
    const { userId } = params;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return new Response(JSON.stringify({ error: "Valid User ID is required" }), { status: 400 });
    }

    // Find posts by the userId and sort them by creation date (newest first)
    // Populate userId field to get basic user info for display
    const userPosts = await Post.find({ userId: userId })
                                .sort({ createdAt: -1 }) // Sort newest first
                                .populate('userId', 'name profilePic title'); // Get author details

    return new Response(JSON.stringify(userPosts), { status: 200 });

  } catch (error) {
    console.error("Error fetching user posts:", error);
     let errorMessage = "Something went wrong while fetching posts";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}