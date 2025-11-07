// src/app/api/post/[postId]/comment/route.js
import connect from "@lib/mongodb";         // Alias should work for root /lib
import Post from "../../../../../../models/Post";   // Relative path from API route to root /models
import User from "../../../../../../models/User";   // Relative path from API route to root /models
import Notification from "../../../../../../models/Notification"; // 👈 Relative path for Notification model
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  await connect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }
    const senderUserId = session.user.id; // User adding the comment

    // FETCH SENDER USER DETAILS (needed for comment.name)
    const senderUser = await User.findById(senderUserId).select("name profilePic");
    if (!senderUser) {
      return new Response(JSON.stringify({ success: false, message: "Authenticated user not found" }), { status: 404 });
    }

    const { postId } = params;
    const { comment } = await req.json();

    if (!comment || comment.trim() === "") {
      return new Response(JSON.stringify({ success: false, message: "Comment cannot be empty" }), { status: 400 });
    }
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        return new Response(JSON.stringify({ success: false, message: "Invalid Post ID" }), { status: 400 });
    }

    // Find post
    const post = await Post.findById(postId);
    if (!post) {
      return new Response(JSON.stringify({ success: false, message: "Post not found" }), { status: 404 });
    }
    const recipientUserId = post.userId.toString(); // User who owns the post

    // Push full comment object (ensure field names match your Post schema's commentSchema)
    const newCommentData = {
      userId: senderUserId, // Ensure this matches your schema
      text: comment,
      name: senderUser.name || "User", // Ensure 'name' is required in schema
      profilePic: senderUser.profilePic || "", // Ensure 'profilePic' or 'avatar' exists in schema
      createdAt: new Date(),
    };
    post.comments.push(newCommentData);

    const savedPost = await post.save(); // Save the post with the new comment

    // ✅ Create Notification (if not commenting on own post)
    let notification = null;
    if (senderUserId !== recipientUserId) {
        try {
            notification = await Notification.create({
              recipientId: recipientUserId,
              senderId: senderUserId,
              type: "comment",
              postId: postId,
            });
            // LATER: Emit socket event
            console.log("Comment Notification Created:", notification?._id);
        } catch (notificationError) {
            console.error("Failed to create comment notification:", notificationError);
        }
    }

    const addedComment = savedPost.comments[savedPost.comments.length - 1];

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comment added",
        comment: addedComment,
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error("Error adding comment:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}