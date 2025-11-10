// src/services/ratingService.js

import mongoose from 'mongoose';
// ⚠️ REVISED PATHS ⚠️ 
import User from '../models/User'; // Go up to src/, then up to root/, then into models/
import Post from '../models/Post'; // Go up to src/, then up to root/, then into models/

/**
 * Recalculates and updates the overall rating metrics for a given user.
 * @param {string} userId - The ID of the post author.
 */
export async function recalculateOverallRating(userId) {
    if (!userId) {
        console.error("Recalculation failed: userId is missing.");
        return;
    }
    
    const authorId = new mongoose.Types.ObjectId(userId);

    try {
        // ... (Mongoose Aggregation logic remains the same) ...
        const aggregationResult = await Post.aggregate([
            { $match: { userId: authorId } }, 
            // ... rest of aggregation pipeline ...
        ]);

        // ... (rest of the calculation and User.findByIdAndUpdate logic remains the same) ...
        
    } catch (error) {
        console.error("Error during overall rating recalculation:", error);
    }
}