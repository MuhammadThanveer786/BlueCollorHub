import connect from "../../../../../lib/mongodb";
import Post from "../../../../../models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // adjust path if needed

//delete your own post
export async function DELETE(req, { params }) {
  await connect();

  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const userId = session.user.id; // logged-in user ID
    const { postId } = params;      // post ID from URL

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return new Response(
        JSON.stringify({ success: false, message: "Post not found" }),
        { status: 404 }
      );
    }

    // Check if the logged-in user is the owner
    if (post.userId.toString() !== userId) {
      return new Response(
        JSON.stringify({ success: false, message: "You can only delete your own posts" }),
        { status: 403 }
      );
    }

    // Delete the post
    await post.deleteOne();

    return new Response(
      JSON.stringify({ success: true, message: "Post deleted successfully" }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
