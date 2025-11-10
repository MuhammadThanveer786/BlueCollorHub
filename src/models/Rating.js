import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
    // The specific post that received the rating
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    // The user who submitted the rating
    reviewerId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // The star value (1 to 5)
    value: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    // The written review/feedback
    feedback: {
        type: String,
        trim: true,
        maxlength: 500,
    },
}, { timestamps: true });

// CRITICAL: Ensure a user can only rate a single post once
RatingSchema.index({ postId: 1, reviewerId: 1 }, { unique: true });

export default mongoose.models.Rating || mongoose.model('Rating', RatingSchema);