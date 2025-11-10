import dbConnect from "@/lib/dbConnect";
import Message from "@/models/Message";



export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const user1 = searchParams.get("user1");
    const user2 = searchParams.get("user2");

    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
