import mongoose from "mongoose";

// Rating Subschema
const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, default: "" }
  },
  { timestamps: true }
);

// Comment Subschema
const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    name: { type: String, required: true },     // 👈 Add this
    avatar: { type: String, default: "" },      // 👈 Add this
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    video: { type: String },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    comments: [commentSchema],   // ✅ Updated schema

    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", postSchema);
