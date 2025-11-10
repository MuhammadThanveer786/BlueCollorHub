import connect from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification"; // ✅ Import Notification
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ Use alias
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

    await Promise.all([
      User.findByIdAndUpdate(recipientId, { $pull: { connectionRequestsReceived: senderId } }),
      User.findByIdAndUpdate(senderId, { $pull: { connectionRequestsSent: recipientId } })
    ]);

    // ✅ FIX: Delete the "connect_request" notification
    try {
        await Notification.deleteOne({
            recipientId: recipientId,
            senderId: senderId,
            type: "connect_request"
        });
        console.log("Connect Request Notification Declined and Deleted.");
    } catch (notificationError) {
         console.error("Failed to delete connect request notification:", notificationError);
    }

    return new Response(JSON.stringify({ success: true, message: "Connection request declined" }), { status: 200 });

  } catch (error) {
    console.error("Error declining connection request:", error);
    return new Response(JSON.stringify({ success: false, message: "Server error" }), { status: 500 });
  }
}