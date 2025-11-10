// src/app/api/user/[userId]/route.js

import connect from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    await connect();
    
    const userIdToFetch = params.userId; 

    try {
        if (!userIdToFetch || !mongoose.Types.ObjectId.isValid(userIdToFetch)) {
            return NextResponse.json({ message: "Invalid User ID format" }, { status: 400 });
        }
        
        // 1. Fetch the user's core profile data
        const user = await User.findById(userIdToFetch).select("-password").lean(); // Use .lean() for easier modification
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 2. AGGREGATION PIPELINE: Calculate Overall Worker Rating from ALL their posts
        const aggregationResult = await Post.aggregate([
            // Match posts created by this user ID
            { $match: { userId: new mongoose.Types.ObjectId(userIdToFetch) } },
            
            // Unwind the ratings array in all matched posts
            // This turns each rating into a separate document for counting
            { $unwind: "$ratings" },
            
            // Group all individual ratings together to calculate totals
            {
                $group: {
                    _id: null, // Group all documents into a single result
                    totalRatings: { $sum: 1 },
                    sumOfRatings: { $sum: "$ratings.value" },
                    
                    // Count distribution for each star rating
                    count5: { $sum: { $cond: [{ $eq: ["$ratings.value", 5] }, 1, 0] } },
                    count4: { $sum: { $cond: [{ $eq: ["$ratings.value", 4] }, 1, 0] } },
                    count3: { $sum: { $cond: [{ $eq: ["$ratings.value", 3] }, 1, 0] } },
                    count2: { $sum: { $cond: [{ $eq: ["$ratings.value", 2] }, 1, 0] } },
                    count1: { $sum: { $cond: [{ $eq: ["$ratings.value", 1] }, 1, 0] } },
                }
            },
            
            // Final projection to calculate average and format distribution
            {
                $project: {
                    _id: 0,
                    totalRatings: 1,
                    // Calculate average and round to 1 decimal place
                    averageScore: { $round: [{ $divide: ["$sumOfRatings", "$totalRatings"] }, 1] }, 
                    ratingDistribution: {
                        "5": "$count5",
                        "4": "$count4",
                        "3": "$count3",
                        "2": "$count2",
                        "1": "$count1",
                    },
                    // We can use totalRatings for totalReviews if they aren't tracked separately
                    totalReviews: { $sum: { $cond: [{ $ne: ["$ratings.feedback", ""] }, 1, 0] } } // Counts ratings that have feedback (reviews)
                }
            }
        ]);

        const aggregatedData = aggregationResult[0] || {};
        
        // 3. Merge aggregated data with the user profile object
        // Use the aggregated data if it exists, otherwise default to 0/empty object
        const finalUser = {
            ...user,
            // Core user stats
            postsCount: await Post.countDocuments({ userId: userIdToFetch }),
            followerCount: user.followers?.length || 0,
            followingCount: user.following?.length || 0,
            
            // AGGREGATED RATING FIELDS FOR FRONTEND
            averageRating: aggregatedData.averageScore || 0,
            totalRatings: aggregatedData.totalRatings || 0,
            // Use aggregated totalReviews, or fall back to totalRatings if reviews are not tracked separately
            totalReviews: aggregatedData.totalReviews || aggregatedData.totalRatings || 0,
            ratingDistribution: aggregatedData.ratingDistribution || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        };

        return NextResponse.json(finalUser, { status: 200 });

    } catch (error) {
        console.error("Error fetching user by ID with aggregated ratings:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

// ⚠️ IMPORTANT: The PATCH and DELETE functions remain UNCHANGED as they don't need rating aggregation.
export async function PATCH(req, { params }) {
    await connect();
    
    // FIX: Access parameter directly
    const userIdToUpdate = params.userId;
    
    try {
        const body = await req.json();
        
        if (!userIdToUpdate || !mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
            return NextResponse.json({ message: "Invalid User ID format" }, { status: 400 });
        }
        
        // Prevent updating fields managed by connection logic
        delete body.email;
        delete body.password;
        delete body.emailVerified;
        delete body.connections;
        delete body.followers;
        delete body.following;
        delete body.connectionRequestsSent;
        delete body.connectionRequestsReceived;

        const updatedUser = await User.findByIdAndUpdate(userIdToUpdate, { $set: body }, { new: true, runValidators: true }).select("-password");
        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        const postsCount = await Post.countDocuments({ userId: userIdToUpdate });
        const followerCount = updatedUser.followers?.length || 0;
        const followingCount = updatedUser.following?.length || 0;
        const userProfileData = {
            ...updatedUser.toObject(),
            postsCount,
            followerCount,
            followingCount,
        };
        return NextResponse.json({ message: "User updated successfully", user: userProfileData }, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        let errorMessage = "Something went wrong during update";
        if (error.name === 'ValidationError') {
            errorMessage = "Validation failed: " + Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.name === 'CastError') {
            errorMessage = "Invalid data format provided";
        }
        return NextResponse.json({ error: errorMessage }, { status: error.name === 'ValidationError' ? 400 : 500 });
    }
}

export async function DELETE(req, { params }) {
    await connect();
    
    // FIX: Access parameter directly
    const userIdToDelete = params.userId;

    try {
        if (!userIdToDelete || !mongoose.Types.ObjectId.isValid(userIdToDelete)) {
            return NextResponse.json({ message: "Invalid User ID format" }, { status: 400 });
        }
        const deletedUser = await User.findByIdAndDelete(userIdToDelete);
        if (!deletedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Something went wrong during deletion" }, { status: 500 });
    }
}