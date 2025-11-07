// root/app/api/messages/route.js
import dbConnect from "../../lib/dbConnect"; // relative path to root/lib/dbConnect.js
import Message from "../../models/Message";  // relative path to root/models/Message.js

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get("senderId");
    const receiverId = searchParams.get("receiverId");

    if (!senderId || !receiverId) {
      return new Response(JSON.stringify({ error: "Missing user IDs" }), { status: 400 });
    }

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET messages error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch messages" }), { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();

  try {
    const { senderId, receiverId, content, media } = await req.json();

    if (!senderId || !receiverId || (!content && !media)) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      content: content || null,
      media: media || null,
      read: false,
    });

    return new Response(JSON.stringify(newMessage), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST messages error:", err);
    return new Response(JSON.stringify({ error: "Failed to send message" }), { status: 500 });
  }
}
