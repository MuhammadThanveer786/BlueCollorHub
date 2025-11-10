import connect from "../../../../lib/mongodb";
import Post from "../../../../models/Post";
import User from "../../../../models/User";

export async function GET(req) {
  await connect();

  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const category = decodeURIComponent(searchParams.get("category") || "");
    const skill = decodeURIComponent(searchParams.get("skill") || "");

    const userFilter = {};

    // 🗺️ Location filter
    const locationFilter = {};
    if (state) locationFilter["location.state"] = new RegExp(`^${state}$`, "i");
    if (district) locationFilter["location.district"] = new RegExp(`^${district}$`, "i");

    if (Object.keys(locationFilter).length > 0) {
      Object.assign(userFilter, locationFilter);
    }

    // 🧰 Category and skill filters
    if (category) {
      userFilter.skillCategories = { $in: [new RegExp(category, "i")] };
    }

    if (skill) {
      userFilter.skills = { $in: [new RegExp(skill, "i")] };
    }

    // 🔍 Query filter (name or skill search)
    if (query) {
      const regex = new RegExp(query, "i");
      userFilter.$or = [{ name: regex }, { skills: regex }];
    }

    console.log("🧭 Final User Filter =>", JSON.stringify(userFilter, null, 2));

    // 🧑‍🔧 Find matching users
    const matchingUsers = await User.find(userFilter).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    console.log("👥 Matched User IDs =>", userIds.length);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, posts: [] }), { status: 200 });
    }

    // 📰 Find posts of matched users
    const posts = await Post.find({ userId: { $in: userIds } })
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
    console.error("❌ Error fetching filtered posts:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500 }
    );
  }
}
