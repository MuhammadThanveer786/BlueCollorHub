// src/app/api/notifications/route.js
import connect from "@/lib/mongodb"; // Adjust path if needed
import Notification from "@/models/Notification"; // Use alias
import User from "@/models/User";// Adjust path to User model
import Post from "@/models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route"; // Adjust path if needed
import mongoose from "mongoose";

export async function GET(req) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Fetch notifications for the user, newest first
    // Populate sender details (name, profilePic)
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 }) // Sort newest first
      .limit(50) // Limit the number of notifications fetched
      .populate({
         path: 'senderId',
         select: 'name profilePic' // Select only name and profilePic
      })
      .populate({ // Optionally populate post title if needed
          path: 'postId',
          select: 'title'
      });

    // Optionally, count unread notifications separately if needed
    // const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });

    return new Response(JSON.stringify(notifications), { status: 200 });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}