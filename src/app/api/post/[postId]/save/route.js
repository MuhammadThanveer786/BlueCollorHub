import connect from "@/lib/mongodb";
import Post from "@/models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Assumes authOptions is here
import mongoose from "mongoose";

export async function POST(req, { params }) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
  }

  const userId = session.user.id;
  const { postId } = params;

  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return new Response(JSON.stringify({ success: false, message: "Invalid Post ID" }), { status: 400 });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return new Response(JSON.stringify({ success: false, message: "Post not found" }), { status: 404 });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const isAlreadySaved = post.savedBy.some(id => id.equals(userIdObj));

    let updatedPost;
    let savedStatus;

    if (isAlreadySaved) {
      // Remove user ID (Unsave)
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $pull: { savedBy: userIdObj } },
        { new: true }
      );
      savedStatus = false;
    } else {
      // Add user ID (Save)
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { savedBy: userIdObj } },
        { new: true }
      );
      savedStatus = true;
    }

    return new Response(JSON.stringify({
      success: true,
      saved: savedStatus,
      savedCount: updatedPost.savedBy.length,
    }), { status: 200 });

  } catch (error) {
    console.error("Error saving post:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}