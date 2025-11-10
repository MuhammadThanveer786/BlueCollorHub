import connect from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
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
    if (recipientId === senderId) {
        return new Response(JSON.stringify({ success: false, message: "Cannot accept own request" }), { status: 400 });
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

    const recipientHasRequest = recipient.connectionRequestsReceived?.map(id => id.toString()).includes(senderIdStr);
    const senderSentRequest = sender.connectionRequestsSent?.map(id => id.toString()).includes(recipientIdStr);

    if (!recipientHasRequest || !senderSentRequest) {
        await User.findByIdAndUpdate(recipientId, { $pull: { connectionRequestsReceived: senderId } });
        await User.findByIdAndUpdate(senderId, { $pull: { connectionRequestsSent: recipientId } });
        return new Response(JSON.stringify({ success: false, message: "No matching pending connection request found" }), { status: 404 });
     }

    await Promise.all([
        User.findByIdAndUpdate(recipientId, {
            $pull: { connectionRequestsReceived: senderId },
            $addToSet: { followers: senderId }
        }),
        User.findByIdAndUpdate(senderId, {
            $pull: { connectionRequestsSent: recipientId },
            $addToSet: { following: recipientId }
        })
    ]);

    try {
        await Notification.create({
          recipientId: senderId,
          senderId: recipientId,
          type: "connect_accept",
        });

        // ✅ FIX: Delete the original "connect_request" notification
        await Notification.deleteOne({
            recipientId: recipientId, // The user who accepted
            senderId: senderId,     // The user who sent
            type: "connect_request"
        });

        console.log("Connect Accept Notification Created and original request deleted.");

    } catch (notificationError) {
        console.error("Failed to create/delete notifications:", notificationError);
    }

    return new Response(JSON.stringify({ success: true, message: "Connection accepted" }), { status: 200 });

  } catch (error) {
    console.error("Error accepting connection request:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error occurred" }), { status: 500 });
  }
}