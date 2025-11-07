// src/app/api/post/[postId]/rating/route.js
import connect from "@lib/mongodb";
import Post from "@models/Post"; // ✅ FIXED: Use @models alias
import Notification from "@models/Notification"; // ✅ FIXED: Use @models alias
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route"; // This relative path should be correct
import mongoose from "mongoose";

export async function POST(req, { params }) {
  await connect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }
    const senderUserId = session.user.id;

    const { postId } = params;
    const { value, feedback } = await req.json();

    if (!value || value < 1 || value > 5) {
      return new Response(JSON.stringify({ success: false, message: "Rating value must be between 1 and 5" }), { status: 400 });
    }
     if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        return new Response(JSON.stringify({ success: false, message: "Invalid Post ID" }), { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return new Response(JSON.stringify({ success: false, message: "Post not found" }), { status: 404 });
    }
    const recipientUserId = post.userId.toString();

    const existingRatingIndex = post.ratings.findIndex(r => r.userId.toString() === senderUserId);

    let savedRating;

    if (existingRatingIndex > -1) {
      post.ratings[existingRatingIndex].value = value;
      post.ratings[existingRatingIndex].feedback = feedback || "";
      savedRating = post.ratings[existingRatingIndex];
    } else {
      const newRating = {
        userId: senderUserId,
        value: value,
        feedback: feedback || "",
      };
      post.ratings.push(newRating);
      savedRating = post.ratings[post.ratings.length - 1];
    }

    const totalRating = post.ratings.reduce((sum, r) => sum + r.value, 0);
    post.averageRating = post.ratings.length > 0 ? totalRating / post.ratings.length : 0;

    await post.save();

    let notification = null;
     if (senderUserId !== recipientUserId) {
        try {
            notification = await Notification.create({
              recipientId: recipientUserId,
              senderId: senderUserId,
              type: "rating",
              postId: postId,
            });
             console.log("Rating Notification Created:", notification?._id);
        } catch (notificationError) {
            console.error("Failed to create rating notification:", notificationError);
        }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Rating submitted",
        rating: savedRating,
        averageRating: post.averageRating,
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error("Error submitting rating:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}