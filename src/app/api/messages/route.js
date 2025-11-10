import connect from "@/lib/mongodb";
import Message from "@/models/Message";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { URL } from 'url';

export async function POST(req) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { senderId, receiverId, content, media } = body;

    if (senderId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Sender ID mismatch" }), { status: 403 });
    }
    
    const newMessage = new Message({
      senderId,
      receiverId,
      content,
      media,
      read: false
    });
    
    await newMessage.save();

    return new Response(JSON.stringify({ success: true, message: newMessage }), { status: 201 });

  } catch (error) {
    console.error("Error saving message:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function GET(req) {
  await connect();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const otherUserId = searchParams.get('to');

  if (!otherUserId) {
      return new Response(JSON.stringify({ error: "Missing 'to' parameter" }), { status: 400 });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    return new Response(JSON.stringify(messages), { status: 200 });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}