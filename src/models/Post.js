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
    
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    comments: [commentSchema],
    ratings: [ratingSchema],
    
    // The average rating for *this specific post*
    averageRating: { type: Number, default: 0 } 
  },
  { timestamps: true }
);

// 🌟 NEW: Pre-save hook to automatically calculate post's average rating 🌟
postSchema.pre('save', function (next) {
    if (this.isModified('ratings') && this.ratings && this.ratings.length > 0) {
        const totalValue = this.ratings.reduce((sum, rating) => sum + rating.value, 0);
        const count = this.ratings.length;
        
        // Calculate average and set it, rounded to one decimal place
        this.averageRating = parseFloat((totalValue / count).toFixed(1));
    } else if (this.isModified('ratings') && this.ratings && this.ratings.length === 0) {
        // Handle case where all ratings are removed
        this.averageRating = 0;
    }
    next();
});
// ----------------------------------------------------------------------

export default mongoose.models.Post || mongoose.model("Post", postSchema);