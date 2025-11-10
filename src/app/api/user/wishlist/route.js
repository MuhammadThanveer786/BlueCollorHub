import connect from "@/lib/mongodb";
import Post from "@/models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Assumes authOptions is here
import mongoose from "mongoose";

export async function GET(req) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Find all posts where the 'savedBy' array includes the current user's ID
    const wishlistPosts = await Post.find({ savedBy: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('userId', 'name profilePic title'); // Populate post author details

    return new Response(JSON.stringify(wishlistPosts || []), { status: 200 });

  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}