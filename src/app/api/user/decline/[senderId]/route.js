import connect from "@lib/mongodb";
import User from "@models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  await connect();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }
    const recipientId = session.user.id;
    const senderId = params.senderId;

    if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
        return new Response(JSON.stringify({ success: false, message: "Invalid sender ID format" }), { status: 400 });
    }

    const recipientIdStr = recipientId.toString();
    const senderIdStr = senderId.toString();

    const [recipientUpdateResult, senderUpdateResult] = await Promise.all([
      User.findByIdAndUpdate(recipientId, { $pull: { connectionRequestsReceived: senderId } }, { new: true }),
      User.findByIdAndUpdate(senderId, { $pull: { connectionRequestsSent: recipientId } })
    ]);

    console.log(`Attempted to remove request from ${senderIdStr} for ${recipientIdStr}.`);

    return new Response(JSON.stringify({ success: true, message: "Connection request declined" }), { status: 200 });

  } catch (error) {
    console.error("Error declining connection request:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}