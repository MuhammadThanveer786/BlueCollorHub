import connect from "@lib/mongodb";
import User from "@models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function POST(req) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
  }

  const myId = session.user.id;
  const { userIdToUnfollow } = await req.json(); // This is the user you want to unfollow

  if (!userIdToUnfollow || !mongoose.Types.ObjectId.isValid(userIdToUnfollow)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid User ID" }), { status: 400 });
  }

  try {
    // 1. Remove the user (userIdToUnfollow) from your (myId) 'following' list
    await User.findByIdAndUpdate(myId, {
        $pull: { following: userIdToUnfollow }
    });

    // 2. Remove yourself (myId) from their (userIdToUnfollow) 'followers' list
    await User.findByIdAndUpdate(userIdToUnfollow, {
        $pull: { followers: myId }
    });

    return new Response(JSON.stringify({ success: true, message: "Unfollowed user" }), { status: 200 });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}