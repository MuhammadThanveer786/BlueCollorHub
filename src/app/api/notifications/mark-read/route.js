// src/app/api/notifications/mark-read/route.js
import connect from "@/lib/mongodb";                     // Correct alias
import Notification from "@/models/Notification"; // Correct relative path to root models
import { getServerSession } from "next-auth/next";
// Correct relative path from mark-read route to auth route (adjust if auth route is elsewhere)
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function POST(req) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { notificationIds } = await req.json(); // Expect an array of IDs

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      const result = await Notification.updateMany(
        { _id: { $in: notificationIds }, recipientId: userId },
        { $set: { read: true } }
      );
      console.log(`Marked ${result.modifiedCount} notifications as read.`);

      // Validate result if necessary
      if (result.matchedCount === 0) {
         console.log("No matching notifications found to mark as read for user:", userId);
         // Decide if this should be an error or just success with 0 modified
      }

    } else {
       return new Response(JSON.stringify({ success: false, message: "No notification IDs provided or invalid format" }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Error marking notifications read:", error);
    let errorMessage = "Server error";
    if (error instanceof SyntaxError) { // Handle invalid JSON body
        errorMessage = "Invalid request body";
        return new Response(JSON.stringify({ success: false, message: errorMessage }), { status: 400 });
    }
    return new Response(JSON.stringify({ success: false, message: errorMessage }), { status: 500 });
  }
}