import connect from "@lib/mongodb";
import Post from "@models/Post";
import User from "@models/User"; // Import User to populate
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await connect();

  try {
    const { postId } = params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid Post ID" }), { status: 400 });
    }

    const post = await Post.findById(postId)
      .populate('userId', 'name profilePic title followers following connectionRequestsSent') // Populate author details
      .populate('comments.userId', 'name profilePic') // Populate user details within comments
      .populate('ratings.userId', 'name profilePic'); // Populate user details within ratings

    if (!post) {
      return new Response(JSON.stringify({ success: false, message: "Post not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, post: post }), { status: 200 });

  } catch (error) {
    console.error("Error fetching post:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}