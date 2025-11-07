import connect from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function GET() {
  await connect();

  try {
    // Fetch all users without password
    const users = await User.find().select("-password");

    return new Response(
      JSON.stringify({ users }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500 }
    );
  }
}
