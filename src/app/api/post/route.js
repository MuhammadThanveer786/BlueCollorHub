import connect from "../../../../lib/mongodb";
import Post from "../../../../models/Post";
import User from "../../../../models/User"; // ✅ Import User model
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// =======================
// 📌 GET ALL POSTS
// =======================
export async function GET(req) {
  await connect();

  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // latest first
      .populate("userId", "name email profilePic title") // post creator info
      .populate("likes", "name profilePic")              // users who liked
      .populate("comments.userId", "name profilePic")    // users who commented
      .populate("ratings.userId", "name profilePic");    // users who rated

    // Calculate likes count & average rating for each post
    const postsWithStats = posts.map((post) => {
      const likesCount = post.likes?.length || 0;
      const avgRating =
        post.ratings?.length > 0
          ? (
              post.ratings.reduce((sum, r) => sum + r.value, 0) /
              post.ratings.length
            ).toFixed(1)
          : 0;

      return {
        ...post.toObject(),
        likesCount,
        averageRating: parseFloat(avgRating),
      };
    });

    return new Response(
      JSON.stringify({ success: true, posts: postsWithStats }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}

// =======================
// 📌 CREATE NEW POST
// =======================
export async function POST(req) {
  await connect();

  try {
    // Get logged-in session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { title, description, images, video } = body;

    if (!title || !description) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Title and description are required",
        }),
        { status: 400 }
      );
    }

    const newPost = await Post.create({
      title,
      description,
      images: images || [],
      video: video || null,
      userId,
      likes: [],
      comments: [],
      ratings: [],
    });

    return new Response(
      JSON.stringify({ success: true, post: newPost }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}
