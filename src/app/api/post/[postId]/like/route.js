// src/app/api/post/[postId]/like/route.js
import connect from "@/lib/mongodb";
import Post from "../../../../../models/Post";
import Notification from "../../../../../models/Notification"; // Import Notification model
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import mongoose from "mongoose";

// We'll need access to the Socket.IO instance later
// This is tricky in Next.js API routes, might need a helper function or global setup
// For now, let's focus on saving to DB

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

    const postAuthorId = post.userId.toString(); // Get the ID of the user who created the post

    // Check if user already liked the post
    const likeIndex = post.likes.findIndex(likeUserId => likeUserId.toString() === userId);

    let updatedPost;
    let notificationCreated = null;

    if (likeIndex > -1) {
      // User already liked, so unlike
      post.likes.splice(likeIndex, 1);
      updatedPost = await post.save();
      // Optionally: Delete the corresponding 'like' notification if needed (more complex)
    } else {
      // User hasn't liked, so add like
      post.likes.push(new mongoose.Types.ObjectId(userId));
      updatedPost = await post.save();

      // ✅ Create Notification (only if liking, and not liking your own post)
      if (postAuthorId !== userId) {
        notificationCreated = await Notification.create({
          recipientId: postAuthorId,
          senderId: userId,
          type: "like",
          postId: postId,
        });
        // LATER: Emit socket event here: io.to(postAuthorId).emit('new_notification', notificationCreated);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        liked: likeIndex === -1, // True if the user now likes it, false if they unliked
        likesCount: updatedPost.likes.length,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error toggling like:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}