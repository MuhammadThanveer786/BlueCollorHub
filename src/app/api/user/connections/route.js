import connect from "@lib/mongodb";
import User from "@models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function GET(req) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id)
      .select('followers following')
      .populate('followers', 'name profilePic title')
      .populate('following', 'name profilePic title');

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
    
    const allContacts = new Map();
    [...user.followers, ...user.following].forEach(contact => {
        if(contact?._id) {
             allContacts.set(contact._id.toString(), contact);
        }
    });

    return new Response(JSON.stringify(Array.from(allContacts.values())), { status: 200 });

  } catch (error) {
    console.error("Error fetching connections:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}