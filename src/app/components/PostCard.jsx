// src/app/components/PostCard.jsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from 'sonner';
import {
    FaHeart, FaRegHeart, FaComment, FaStar, FaPaperPlane,
    FaChevronLeft, FaChevronRight, FaTimes, FaUserPlus,
    FaCheck, FaHourglassHalf, FaUserCheck,
    FaBookmark, FaRegBookmark, FaChartBar
} from "react-icons/fa";
import Link from 'next/link';
// 🌟 UPDATED IMPORT: Using the existing component file
import RatingBreakdown from "./RatingBreakdown"; 

export default function PostCard({ post }) {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
    const [isSaved, setIsSaved] = useState(false);
    const [showComments, setShowComments] = useState("collapsed");
    const [showRatings, setShowRatings] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    // Kept for post rating count, but content is not displayed
    const [feedbacks, setFeedbacks] = useState(post.ratings || []); 
    const [newComment, setNewComment] = useState("");
    
    // ❌ REMOVED: const [newFeedback, setNewFeedback] = useState("");

    const [newRating, setNewRating] = useState(0);
    const [currentImage, setCurrentImage] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [connectStatus, setConnectStatus] = useState('idle');
    
    // 🌟 NEW STATE: For the overall worker rating modal
    const [showOverallRatingModal, setShowOverallRatingModal] = useState(false);

    // 🌟 RATING STATE: Worker's overall rating (used in the header)
    const initialWorkerRatingData = post.userId?.overallRating || { 
        averageScore: 0, 
        totalRatings: 0, 
        distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } 
    };
    const [liveWorkerOverallRating, setLiveWorkerOverallRating] = useState(initialWorkerRatingData);

    // 🌟 NEW STATE: Post's specific rating (used in the footer)
    // We rely on post.averageRating and post.ratings.length which should be updated by the backend
    const [livePostAverageRating, setLivePostAverageRating] = useState(post.averageRating || 0);
    const [livePostTotalRatings, setLivePostTotalRatings] = useState(post.ratings?.length || 0);

    // 🌟 NEW STATE: To track the current user's rating for single-use/overwrite logic
    const currentUserRating = post.ratings?.find(
        (r) => (r.userId?._id || r.userId) === currentUserId
    );
    const [userCurrentRating, setUserCurrentRating] = useState(
        currentUserRating?.value || 0
    ); 

    const commentsRef = useRef(null);
    const ratingsRef = useRef(null);
    
    // ... existing useEffects
    
    useEffect(() => {
        if (session && post.likes && Array.isArray(post.likes)) {
            const userLiked = post.likes.some(
                (like) => (typeof like === 'string' && like === currentUserId) || (like?._id === currentUserId)
            );
            setLiked(userLiked);
            setLikesCount(post.likes.length);
        }
    }, [session, post.likes, currentUserId]);

    useEffect(() => {
        if (session && post.savedBy && Array.isArray(post.savedBy)) {
            const userSaved = post.savedBy.some(
                (id) => id === currentUserId || id?._id === currentUserId
            );
            setIsSaved(userSaved);
        }
    }, [session, post.savedBy, currentUserId]);

    useEffect(() => {
        if (!session || !session.user || !post?.userId?._id) {
            setConnectStatus('idle');
            return;
        }
        const postAuthorId = post.userId._id.toString();
        if (currentUserId === postAuthorId) {
            setConnectStatus('self');
            return;
        }
        
        // NOTE: This logic requires user session to include 'following' and 'connectionRequestsSent' arrays
        const sessionUser = session.user;
        if (sessionUser.following && Array.isArray(sessionUser.following) && sessionUser.following.map(id => id.toString()).includes(postAuthorId)) {
            setConnectStatus('following');
        } else if (sessionUser.connectionRequestsSent && Array.isArray(sessionUser.connectionRequestsSent) && sessionUser.connectionRequestsSent.map(id => id.toString()).includes(postAuthorId)) {
            setConnectStatus('pending');
        } else {
            setConnectStatus('idle');
        }

    }, [session, currentUserId, post?.userId]);

    // ... handleLike and handleSavePost functions (omitted for brevity, assume unchanged)
    
    const handleLike = async () => {
        if (!currentUserId) return toast.error("Please login to like posts.");
        const prevLiked = liked;
        const newLikesCount = prevLiked ? likesCount - 1 : likesCount + 1;
        setLiked(!prevLiked);
        setLikesCount(newLikesCount);
        try {
            const { data } = await axios.post(`/api/post/${post._id}/like`);
            if (data.success) {
                setLikesCount(data.likesCount);
                setLiked(data.liked);
            } else {
                toast.error("Failed to update like status.");
                setLiked(prevLiked);
                setLikesCount(prevLiked ? newLikesCount + 1 : newLikesCount - 1);
            }
        } catch (err) {
            toast.error("Error liking post.");
            console.error("Error toggling like:", err);
            setLiked(prevLiked);
            setLikesCount(prevLiked ? newLikesCount + 1 : newLikesCount - 1);
        }
    };
    
    const handleSavePost = async () => {
        if (!currentUserId) return toast.error("Please login to save posts.");
        
        const prevSaved = isSaved;
        setIsSaved(!prevSaved);

        try {
            const { data } = await axios.post(`/api/post/${post._id}/save`);
            if (data.success) {
                setIsSaved(data.saved);
                toast.success(data.saved ? "Post saved to wishlist!" : "Post removed from wishlist.");
            } else {
                setIsSaved(prevSaved);
                toast.error("Failed to update wishlist.");
            }
        } catch (err) {
            setIsSaved(prevSaved);
            console.error("Error saving post:", err);
            toast.error("Error updating wishlist.");
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return toast.warn("Comment cannot be empty.");
        if (!currentUserId) return toast.error("Please login to comment.");
        try {
            const payload = { comment: newComment };
            const { data } = await axios.post(`/api/post/${post._id}/comment`, payload);
            if (data.success && data.comment) {
                const addedComment = {
                    ...data.comment,
                    userId: {
                        _id: currentUserId,
                        name: session?.user?.name || "You",
                        profilePic: session?.user?.image || "/profile.jpg",
                    },
                    name: session?.user?.name || "You",
                    avatar: session?.user?.image || "/profile.jpg",
                };
                setComments(prev => [addedComment, ...prev]);
                setNewComment("");
                setShowComments("expanded");
                toast.success("Comment added!");
            } else {
                toast.error(data.message || "Failed to add comment.");
            }
        } catch (err) {
            console.error("Error adding comment:", err);
            toast.error(err.response?.data?.message || "Error adding comment.");
        }
    };

    // 🌟 UPDATED: Implemented fix for instant UI refresh after rating submission
    const handleAddFeedback = async () => {
        if (newRating === 0) return toast.warn("Please select a rating.");
        if (!currentUserId) return toast.error("Please login to rate.");

        // The API payload only sends the value. Backend must handle overwrite.
        const ratingObj = { value: newRating, feedback: "" }; 

        try {
            const { data } = await axios.post(`/api/post/${post._id}/rating`, ratingObj);
            
            if (data.success) {
                // 1. Update the local state for the user's current rating (for overwrite check)
                setUserCurrentRating(newRating);
                setNewRating(0); // Reset input field
                setShowRatings(false); // Close the rating box after submission

                toast.success(userCurrentRating > 0 ? "Rating updated successfully!" : "Rating submitted successfully!");
                
                // 2. FIX: Update the Post's Overall Rating display using the 'in' operator 
                // to ensure properties are used even if they are null or 0.
                if ('newPostAverageRating' in data) {
                    // Use the new average rating from the backend, defaulting to 0 if the value is null
                    setLivePostAverageRating(data.newPostAverageRating ?? 0);
                }
                
                if ('newPostTotalRatings' in data) {
                    // Use the new total count from the backend, defaulting to 0 if the value is null
                    setLivePostTotalRatings(data.newPostTotalRatings ?? 0);
                } else if (userCurrentRating === 0) {
                    // Fallback client-side update for total count if it was a new rating 
                    // AND total count wasn't returned by the backend.
                    setLivePostTotalRatings(prev => prev + 1);
                }
                
                // 3. Update the Worker's overall rating if the backend returns it
                if (data.newOverallRating) {
                    setLiveWorkerOverallRating(data.newOverallRating);
                }
                
            } else {
                toast.error(data.message || "Failed to submit rating.");
            }
        } catch (err) {
            console.error("Error adding rating:", err);
            toast.error(err.response?.data?.message || "Error submitting rating.");
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (commentsRef.current && !commentsRef.current.contains(e.target) && !e.target.closest('[data-comment-toggle]')) {
                setShowComments("collapsed");
            }
            // Use userCurrentRating to initialize the star input when opening the ratings panel
            if (ratingsRef.current && !ratingsRef.current.contains(e.target) && !e.target.closest('[data-rating-toggle]')) {
                setShowRatings(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showOverallRatingModal]);

    // ... openModal, prevImage, nextImage, closeModal, handleConnect, renderConnectButton functions (omitted for brevity, assume unchanged)

    const openModal = (index) => {
        setModalImageIndex(index);
        setShowModal(true);
    };
    const prevImage = (e) => { e.stopPropagation(); setModalImageIndex((prev) => (prev === 0 ? (post.images?.length || 1) - 1 : prev - 1)); };
    const nextImage = (e) => { e.stopPropagation(); setModalImageIndex((prev) => (prev === (post.images?.length || 1) - 1 ? 0 : prev + 1)); };
    const closeModal = (e) => { e.stopPropagation(); setShowModal(false); };

    const handleConnect = async () => {
        if (connectStatus !== 'idle' || !currentUserId || !post?.userId?._id) return;
        if (currentUserId === post.userId._id) return;

        setConnectStatus('loading');
        try {
            const response = await axios.post(`/api/user/${post.userId._id}/connect`);
            if (response.data.success) {
                toast.success("Follow request sent!");
                setConnectStatus('pending');
            } else {
                toast.error(response.data.message || "Failed to send request.");
                setConnectStatus('idle');
            }
        } catch (error) {
            console.error("Connection error:", error);
            toast.error(error.response?.data?.message || "An error occurred while connecting.");
            setConnectStatus('idle');
        }
    };

    const renderConnectButton = () => {
        if (!session || connectStatus === 'self') {
            return null;
        }
        let buttonText = "Follow";
        let buttonIcon = <FaUserPlus className="mr-1" size={14}/>;
        let isDisabled = connectStatus === 'loading';
        let buttonClass = "px-4 py-1 text-sm text-black font-semibold border border-black rounded-md hover:bg-black hover:text-white transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed";
        switch (connectStatus) {
            case 'loading':
                buttonText = "Sending...";
                buttonClass = "px-4 py-1 text-sm text-gray-500 font-semibold border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed flex items-center";
                break;
            case 'pending':
                buttonText = "Request Sent";
                buttonIcon = <FaHourglassHalf className="mr-1" size={14} />;
                buttonClass = "px-4 py-1 text-sm text-gray-600 font-semibold border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed flex items-center";
                isDisabled = true;
                break;
            case 'following':
                buttonText = "Following";
                buttonIcon = <FaUserCheck className="mr-1" size={14}/>;
                buttonClass = "px-4 py-1 text-sm text-blue-700 font-semibold border border-blue-300 rounded-md bg-blue-50 cursor-not-allowed flex items-center";
                isDisabled = true;
                break;
            case 'idle':
            default:
                buttonText = "Follow";
                break;
        }

        return (
            <button
                onClick={handleConnect}
                disabled={isDisabled}
                className={buttonClass}
            >
                {buttonIcon}
                {buttonText}
            </button>
        );
    };

    return (
        <div className="max-w-2xl mx-auto my-6 border border-gray-200 shadow-md bg-white rounded-lg overflow-hidden">

            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <Link 
                    href={`/dashboard/profile/${post.userId?._id}`} 
                    className="flex items-center gap-3 group min-w-0"
                >
                    <img src={post.userId?.profilePic || "/profile.jpg"} alt="User Avatar" className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-semibold group-hover:underline truncate text-sm">{post.userId?.name || "User"}</p>
                        <p className="text-gray-500 text-xs truncate">{post.userId?.title || ""}</p>
                        
                        {/* 🌟 OVERALL WORKER RATING SUMMARY DISPLAY - USING WORKER STATE 🌟 */}
                        {liveWorkerOverallRating.totalRatings > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <FaStar size={10} className="text-yellow-500" />
                                <span className="text-xs font-medium text-gray-700">
                                    {liveWorkerOverallRating.averageScore.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({liveWorkerOverallRating.totalRatings} Ratings)
                                </span>
                                <button 
                                    onClick={(e) => { e.preventDefault(); setShowOverallRatingModal(true); }}
                                    className="ml-2 text-blue-600 hover:text-blue-800 transition"
                                    aria-label="View overall worker rating breakdown"
                                >
                                    <FaChartBar size={12} />
                                </button>
                            </div>
                        )}
                        {/* -------------------------------------------------- */}
                    </div>
                </Link>
                {renderConnectButton()}
            </div>

            <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-base mb-1">{post.title}</h3>
                <p className={`text-gray-700 text-sm ${!showFullDesc ? "line-clamp-3" : ""}`}>{post.description}</p>
                {post.description && post.description.length > 150 && (
                    <button
                        className="text-blue-600 hover:underline mt-1 text-xs font-semibold"
                        onClick={() => setShowFullDesc(!showFullDesc)}
                    >
                        {showFullDesc ? "Show Less" : "Show More"}
                    </button>
                )}
            </div>

            {(post.images && post.images.length > 0) || post.video ? (
                <div className="relative w-full bg-gray-100">
                    {post.images && post.images.length > 0 && (
                        <div className="relative aspect-video" onClick={() => openModal(currentImage)}>
                            {imageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
                            <img
                                src={post.images[currentImage]}
                                alt="Post Media"
                                className={`w-full h-full object-cover cursor-pointer ${imageLoading ? "invisible" : "visible"}`}
                                onLoad={() => setImageLoading(false)}
                                onError={() => { setImageLoading(false); console.error("Failed to load image"); }}
                            />
                            {post.images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {e.stopPropagation(); setCurrentImage((prev) => (prev === 0 ? post.images.length - 1 : prev - 1));}}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full hover:bg-opacity-60 transition z-10"
                                        aria-label="Previous image"
                                    >
                                        <FaChevronLeft size={16}/>
                                    </button>
                                    <button
                                        onClick={(e) => {e.stopPropagation(); setCurrentImage((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));}}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full hover:bg-opacity-60 transition z-10"
                                        aria-label="Next image"
                                    >
                                        <FaChevronRight size={16}/>
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                                        {post.images.map((_, idx) => (
                                            <span key={idx} className={`block w-1.5 h-1.5 rounded-full ${idx === currentImage ? "bg-white" : "bg-gray-300 bg-opacity-70"}`}></span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {post.video && (!post.images || post.images.length === 0) && (
                        <div className="aspect-video">
                            <video src={post.video} controls className="w-full h-full bg-black" preload="metadata" />
                        </div>
                    )}
                </div>
            ) : null }

            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
                <div className="flex gap-5 items-center">
                    <button className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-red-500 transition group" onClick={handleLike} aria-label={liked ? 'Unlike post' : 'Like post'}>
                        {liked ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-xl group-hover:text-red-500" />}
                        <span className="text-xs mt-1">{likesCount}</span>
                    </button>
                    <button className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-blue-600 transition group" onClick={() => setShowComments(showComments === "expanded" ? "collapsed" : "expanded")} data-comment-toggle>
                        <FaComment className="text-xl group-hover:text-blue-600" />
                        <span className="text-xs mt-1">{comments?.length || 0}</span>
                    </button>
                    
                    <button className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-blue-600 transition group" onClick={handleSavePost} aria-label={isSaved ? 'Unsave post' : 'Save post'}>
                        {isSaved ? <FaBookmark className="text-blue-600 text-xl" /> : <FaRegBookmark className="text-xl group-hover:text-blue-600" />}
                        <span className="text-xs mt-1">Save</span>
                    </button>
                </div>
                {/* 🌟 FIX: Use livePostAverageRating and livePostTotalRatings for the display 🌟 */}
                <button 
                    className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-yellow-500 transition group" 
                    onClick={() => { 
                        setShowRatings(!showRatings); 
                        setNewRating(userCurrentRating); // Initialize input rating with current user's rating
                    }} 
                    data-rating-toggle
                >
                    <div className="flex gap-0.5">
                        {/* Dynamic Stars */}
                        {Array.from({ length: 5 }, (_, i) => (
                            <FaStar 
                                key={i} 
                                size={14} 
                                className={i < Math.round(livePostAverageRating || 0) ? "text-yellow-400" : "text-gray-300"} 
                            />
                        ))}
                    </div>
                    {/* Average Score and Total Count */}
                    <span className="text-xs mt-1">{(livePostAverageRating || 0).toFixed(1)} ({livePostTotalRatings || 0})</span>
                </button>
            </div>

            {showComments !== "collapsed" && (
                <div ref={commentsRef} className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex gap-2 mb-4">
                        <img src={session?.user?.image || "/profile.jpg"} alt="Your Avatar" className="w-8 h-8 rounded-full object-cover bg-gray-200"/>
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className="px-3 py-1 bg-black text-white rounded-full hover:bg-gray-800 transition flex items-center justify-center"
                            aria-label="Send comment"
                            disabled={!newComment.trim()}
                        >
                            <FaPaperPlane size={14}/>
                        </button>
                    </div>

                    <div className={`space-y-3 ${showComments === "expanded" ? "max-h-64 overflow-auto pr-2" : ""}`}>
                        {(comments && comments.length > 0) ? (
                            (showComments === "expanded" ? comments : comments.slice(0, 2)).map((c, idx) => {
                                const user = c.userId || {};
                                const commentId = c._id || `comment-${idx}`;
                                const userName = user.name || c.name || "User";
                                const userPic = user.profilePic || c.avatar || "/profile.jpg";

                                return (
                                    <div key={commentId} className="flex items-start gap-2">
                                        <Link href={`/dashboard/profile/${user._id || c.userId}`}>
                                            <img src={userPic} alt={userName} className="w-7 h-7 rounded-full object-cover bg-gray-200 flex-shrink-0 mt-1"/>
                                        </Link>
                                        <div className="bg-gray-100 p-2 rounded-lg w-full text-sm">
                                            <Link href={`/dashboard/profile/${user._id || c.userId}`} className="font-semibold text-xs hover:underline">
                                                {userName}
                                            </Link>
                                            <p className="text-gray-800 break-words">{c.text || c.comment || ""}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : <p className="text-xs text-gray-500 text-center">No comments yet.</p>}
                    </div>

                    {comments && comments.length > 2 && (
                        <button
                            onClick={() => setShowComments(showComments === "expanded" ? "collapsed" : "expanded")}
                            className="text-blue-600 text-xs font-semibold hover:underline mt-2"
                        >
                            {showComments === "expanded" ? "Hide comments" : `View all ${comments.length} comments`}
                        </button>
                    )}
                </div>
            )}

            {showRatings && (
            <div ref={ratingsRef} className="border-t border-gray-200 p-4 bg-gray-50">
                {/* 🌟 UPDATED: Header for overwrite logic */}
                <h4 className="text-sm font-semibold mb-3">
                    {userCurrentRating > 0 ? "Update Your Rating" : "Submit Your Rating"}
                </h4>
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Your rating:</span>
                        {/* 🌟 UPDATED: Display user's existing rating or the new one being selected */}
                        {Array.from({ length: 5 }, (_, i) => (
                            <FaStar
                                key={i}
                                className={`text-xl cursor-pointer transition-colors ${i < (newRating || userCurrentRating) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                                onClick={() => setNewRating(i + 1)}
                            />
                        ))}
                    </div>
                    {/* ❌ REMOVED: Feedback Textarea as requested */}
                    <button
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition self-start text-sm font-medium disabled:opacity-50"
                        onClick={handleAddFeedback}
                        // Disable if no new rating is selected, but allow if user is trying to update a non-zero rating
                        disabled={newRating === 0 && userCurrentRating === 0} 
                    >
                        {userCurrentRating > 0 ? "Update Rating" : "Submit Rating"}
                    </button>
                </div>
                {/* ❌ REMOVED: Review/Feedback List as requested */}
            </div>
            )}

            {/* 🌟 OVERALL RATING BREAKDOWN MODAL - USING WORKER STATE 🌟 */}
            {showOverallRatingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm" onClick={() => setShowOverallRatingModal(false)}>
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl rating-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-bold">Overall Worker Rating</h3>
                            <button className="text-gray-500 hover:text-gray-800 transition" onClick={() => setShowOverallRatingModal(false)} aria-label="Close modal">
                                <FaTimes size={20} />
                            </button>
                        </div>
                        
                        <RatingBreakdown 
                            // Using the worker's live state for all rating data
                            averageRating={liveWorkerOverallRating.averageScore}
                            totalRatings={liveWorkerOverallRating.totalRatings}
                            ratingDistribution={liveWorkerOverallRating.distribution}
                            totalReviews={liveWorkerOverallRating.totalRatings}
                        />

                    </div>
                </div>
            )}
            {/* ------------------------------------------- */}


            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={closeModal}>
                    <button className="absolute top-4 right-4 text-white text-3xl hover:opacity-75 transition" onClick={closeModal} aria-label="Close image modal">
                        <FaTimes />
                    </button>
                    <button className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:opacity-75 transition hidden sm:block" onClick={prevImage} aria-label="Previous image">
                        <FaChevronLeft />
                    </button>
                    <img
                        src={post.images?.[modalImageIndex]}
                        alt={`Image ${modalImageIndex + 1} of ${post.images?.length}`}
                        className="max-h-[85vh] max-w-[90vw] object-contain block"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:opacity-75 transition hidden sm:block" onClick={nextImage} aria-label="Next image">
                        <FaChevronRight />
                    </button>
                    {post.images && post.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                            {modalImageIndex + 1} / {post.images.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}