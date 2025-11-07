import connect from "@lib/mongodb";
import User from "@models/User";
import Post from "@models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  await connect();
  try {
    const { userId } = params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return new Response(JSON.stringify({ message: "Invalid User ID format" }), { status: 400 });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    // Calculate Counts from correct fields
    const postsCount = await Post.countDocuments({ userId: userId });
    const followerCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    const userProfileData = {
      ...user.toObject(),
      postsCount,
      followerCount, // Use calculated follower count
      followingCount, // Use calculated following count
    };
    return new Response(JSON.stringify(userProfileData), { status: 200 });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    let errorMessage = "Something went wrong";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  await connect();
  try {
    const { userId } = params;
    const body = await req.json();
     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return new Response(JSON.stringify({ message: "Invalid User ID format" }), { status: 400 });
    }
    // Prevent updating fields managed by connection logic
    delete body.email;
    delete body.password;
    delete body.emailVerified;
    delete body.connections; // Should not exist anymore
    delete body.followers;
    delete body.following;
    delete body.connectionRequestsSent;
    delete body.connectionRequestsReceived;

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: body }, { new: true, runValidators: true }).select("-password");
    if (!updatedUser) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }
    // Recalculate counts
    const postsCount = await Post.countDocuments({ userId: userId });
    const followerCount = updatedUser.followers?.length || 0;
    const followingCount = updatedUser.following?.length || 0;
    const userProfileData = {
      ...updatedUser.toObject(),
      postsCount,
      followerCount,
      followingCount,
    };
    return new Response(
      JSON.stringify({ message: "User updated successfully", user: userProfileData }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    let errorMessage = "Something went wrong during update";
     if (error.name === 'ValidationError') {
       errorMessage = "Validation failed: " + Object.values(error.errors).map(e => e.message).join(', ');
     } else if (error.name === 'CastError') {
        errorMessage = "Invalid data format provided";
     }
    return new Response(JSON.stringify({ error: errorMessage }), { status: error.name === 'ValidationError' ? 400 : 500 });
  }
}

export async function DELETE(req, { params }) {
  await connect();
  try {
    const { userId } = params;
     if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return new Response(JSON.stringify({ message: "Invalid User ID format" }), { status: 400 });
    }
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }
    // Add cleanup logic here if needed (e.g., remove from others' follower/following lists)
    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return new Response(JSON.stringify({ error: "Something went wrong during deletion" }), { status: 500 });
  }
}