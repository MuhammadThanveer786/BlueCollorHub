import connect from "@/lib/mongodb";
import User from "@/models/User";
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
  const { userIdToRemove } = await req.json(); // This is the follower's ID

  if (!userIdToRemove || !mongoose.Types.ObjectId.isValid(userIdToRemove)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid User ID" }), { status: 400 });
  }

  try {
    // 1. Remove the follower from your (myId) 'followers' list
    await User.findByIdAndUpdate(myId, {
        $pull: { followers: userIdToRemove }
    });

    // 2. Remove yourself (myId) from their (userIdToRemove) 'following' list
    await User.findByIdAndUpdate(userIdToRemove, {
        $pull: { following: myId }
    });

    return new Response(JSON.stringify({ success: true, message: "Follower removed" }), { status: 200 });

  } catch (error) {
    console.error("Error removing follower:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}