import connect from "@/lib/mongodb";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import mongoose from "mongoose";

// 🌟 PATH FIXED: Go up 3 levels (app/api/post) to reach src/
import { recalculateOverallRating } from "../../../../../services/ratingService"; 


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

    // Prevent users from rating their own post
    if (senderUserId === recipientUserId) {
      return new Response(JSON.stringify({ success: false, message: "Cannot rate your own post" }), { status: 403 });
    }

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
      // Get the newly pushed rating to return it
      savedRating = post.ratings[post.ratings.length - 1]; 
    }

    // Calculate post-specific average rating (kept for post document data)
    const totalRating = post.ratings.reduce((sum, r) => sum + r.value, 0);
    post.averageRating = post.ratings.length > 0 ? totalRating / post.ratings.length : 0;

    await post.save();

    // -------------------------------------------------------------
    // 🌟 CORE INTEGRATION STEP 🌟
    // Call the service to update the worker's overall rating on the User document.
    const newOverallRating = await recalculateOverallRating(recipientUserId);
    // -------------------------------------------------------------

    let notification = null;
    if (senderUserId !== recipientUserId) {
        try {
          // Check if a rating notification from this sender already exists for this post
          const existingNotification = await Notification.findOne({
            recipientId: recipientUserId,
            senderId: senderUserId,
            type: "rating",
            postId: postId,
          });

          if (!existingNotification) {
            notification = await Notification.create({
              recipientId: recipientUserId,
              senderId: senderUserId,
              type: "rating",
              postId: postId,
            });
            console.log("Rating Notification Created:", notification?._id);
          } else {
            // Update existing notification timestamp to surface it
            existingNotification.createdAt = new Date();
            await existingNotification.save();
          }
        } catch (notificationError) {
            console.error("Failed to create rating notification:", notificationError);
        }
    }

    // Return the updated overall rating for the frontend to immediately update the worker's profile summary.
    return new Response(
      JSON.stringify({
        success: true,
        message: "Rating submitted",
        rating: savedRating,
        averageRating: post.averageRating,
        newOverallRating: newOverallRating // Send this to the client for immediate UI update
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error("Error submitting rating:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}