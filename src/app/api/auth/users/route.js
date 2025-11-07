import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connect from "../../../../../lib/mongodb";
import User from "../../../../../models/User";

export async function GET(req) {
  await connect(); // Connect to MongoDB

  const session = await getServerSession(authOptions); // Get logged-in user session
  if (!session) 
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await User.findById(session.user.id); // Fetch user from DB
  return new Response(JSON.stringify({ user }), { status: 200 }); // Return user info
}

