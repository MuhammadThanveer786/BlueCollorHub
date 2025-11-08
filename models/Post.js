import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, default: "" }
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" }, // 'avatar' or 'profilePic'
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
    
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // <-- ADDED

    comments: [commentSchema],
    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", postSchema);