import connect from "@lib/mongodb";
import User from "@models/User";
import Notification from "@models/Notification";
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
    const senderId = session.user.id;
    const recipientId = params.userId;

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
        return new Response(JSON.stringify({ success: false, message: "Invalid recipient User ID format" }), { status: 400 });
    }
    if (senderId === recipientId) {
       return new Response(JSON.stringify({ success: false, message: "Cannot connect with yourself" }), { status: 400 });
    }

    const [sender, recipient] = await Promise.all([
        User.findById(senderId),
        User.findById(recipientId)
    ]);

    if (!sender || !recipient) {
      return new Response(JSON.stringify({ success: false, message: "Sender or Recipient not found" }), { status: 404 });
    }

    const recipientIdStr = recipient._id.toString();
    const senderIdStr = sender._id.toString();

    // Check if sender is ALREADY following recipient
    if (sender.following?.map(id => id.toString()).includes(recipientIdStr)) {
       return new Response(JSON.stringify({ success: false, message: "Already following" }), { status: 400 });
    }

    const isRequestPending =
        sender.connectionRequestsSent?.map(id => id.toString()).includes(recipientIdStr) ||
        sender.connectionRequestsReceived?.map(id => id.toString()).includes(recipientIdStr) ||
        recipient.connectionRequestsSent?.map(id => id.toString()).includes(senderIdStr) ||
        recipient.connectionRequestsReceived?.map(id => id.toString()).includes(senderIdStr);

    if (isRequestPending) {
        return new Response(JSON.stringify({ success: false, message: "Connection request already pending" }), { status: 400 });
    }

    await User.findByIdAndUpdate(senderId, { $addToSet: { connectionRequestsSent: recipientId } });
    await User.findByIdAndUpdate(recipientId, { $addToSet: { connectionRequestsReceived: senderId } });

    let notification = null;
    try {
        notification = await Notification.create({
          recipientId: recipientId,
          senderId: senderId,
          type: "connect_request",
        });
        console.log("Connect Request Notification Created:", notification?._id);
        // LATER: Emit socket event here
    } catch (notificationError) {
        console.error("Failed to create connect request notification:", notificationError);
    }

    return new Response(JSON.stringify({ success: true, message: "Connection request sent" }), { status: 200 });

  } catch (error) {
    console.error("Error sending connection request:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error occurred" }), { status: 500 });
  }
}