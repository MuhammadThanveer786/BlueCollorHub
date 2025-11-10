import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate likes (same user liking the same post twice)
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model("Like", likeSchema);
