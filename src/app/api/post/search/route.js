import connect from "../../../../../lib/mongodb";
import Post from "../../../../../models/Post";
import User from "../../../../../models/User";

export async function GET(req) {
  await connect();

  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const category = decodeURIComponent(searchParams.get("category") || "");
    const skill = decodeURIComponent(searchParams.get("skill") || "");

    const userFilter = { $and: [] };

    // Location filters
    if (state) userFilter.$and.push({ "location.state": state });
    if (district) userFilter.$and.push({ "location.district": district });

    // Category filter
    if (category) {
      userFilter.$and.push({
        skillCategories: { $in: [new RegExp(category, "i")] },
      });
    }

    // Skill filter
    if (skill) {
      userFilter.$and.push({ skills: { $in: [new RegExp(skill, "i")] } });
    }

    // Query filter (name OR skills)
    if (query) {
      const regex = new RegExp(query, "i");
      userFilter.$and.push({ $or: [{ name: regex }, { skills: regex }] });
    }

    if (userFilter.$and.length === 0) delete userFilter.$and;

    // Find matching users
    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, posts: [] }), {
        status: 200,
      });
    }

    // Filter posts by matched users
    const postFilter = { userId: { $in: userIds } };

    const posts = await Post.find(postFilter)
      .sort({ createdAt: -1 })
      .populate(
        "userId",
        "name email profilePic title location skills skillCategories"
      )
      .populate("likes", "name profilePic")
      .populate("comments.userId", "name profilePic")
      .populate("ratings.userId", "name profilePic");

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
    console.error("Error fetching filtered posts:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}
