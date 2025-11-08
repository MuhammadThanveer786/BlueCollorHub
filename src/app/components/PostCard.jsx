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
    FaBookmark, FaRegBookmark
} from "react-icons/fa";
import Link from 'next/link';

export default function PostCard({ post }) {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
    const [isSaved, setIsSaved] = useState(false);
    const [showComments, setShowComments] = useState("collapsed");
    const [showRatings, setShowRatings] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    const [feedbacks, setFeedbacks] = useState(post.ratings || []);
    const [newComment, setNewComment] = useState("");
    const [newFeedback, setNewFeedback] = useState("");
    const [newRating, setNewRating] = useState(0);
    const [currentImage, setCurrentImage] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [connectStatus, setConnectStatus] = useState('idle');

    const commentsRef = useRef(null);
    const ratingsRef = useRef(null);

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

    const handleAddFeedback = async () => {
        if (newRating === 0) return toast.warn("Please select a rating.");
        if (!newFeedback.trim()) return toast.warn("Please provide feedback.");
        if (!currentUserId) return toast.error("Please login to rate.");
        const feedbackObj = { value: newRating, feedback: newFeedback };
        try {
            const { data } = await axios.post(`/api/post/${post._id}/rating`, feedbackObj);
            if (data.success && data.rating) {
                const addedFeedback = { ...data.rating, userName: session?.user?.name || "User" };
                setFeedbacks(prev => [addedFeedback, ...prev]);
                setNewFeedback("");
                setNewRating(0);
                toast.success("Feedback submitted!");
            } else {
                toast.error(data.message || "Failed to submit feedback.");
            }
        } catch (err) {
            console.error("Error adding feedback:", err);
            toast.error(err.response?.data?.message || "Error submitting feedback.");
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (commentsRef.current && !commentsRef.current.contains(e.target) && !e.target.closest('[data-comment-toggle]')) {
                setShowComments("collapsed");
            }
            if (ratingsRef.current && !ratingsRef.current.contains(e.target) && !e.target.closest('[data-rating-toggle]')) {
                setShowRatings(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                {/* FIX 1: Post Author Link */}
                <Link 
                    href={`/dashboard/profile/${post.userId?._id}`} 
                    className="flex items-center gap-3 group min-w-0" // Class moved from <a>
                >
                    <img src={post.userId?.profilePic || "/profile.jpg"} alt="User Avatar" className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="font-semibold group-hover:underline truncate text-sm">{post.userId?.name || "User"}</p>
                        <p className="text-gray-500 text-xs truncate">{post.userId?.title || ""}</p>
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
                                        onClick={(e) => prevImage(e)}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full hover:bg-opacity-60 transition z-10"
                                        aria-label="Previous image"
                                    >
                                        <FaChevronLeft size={16}/>
                                    </button>
                                    <button
                                        onClick={(e) => nextImage(e)}
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
                <button className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-yellow-500 transition group" onClick={() => setShowRatings(!showRatings)} data-rating-toggle>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                            <FaStar key={i} size={14} className={i < Math.round(post.averageRating || 0) ? "text-yellow-400" : "text-gray-300"} />
                        ))}
                    </div>
                    <span className="text-xs mt-1">{(post.averageRating || 0).toFixed(1)} ({post.ratings?.length || 0})</span>
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
                                        {/* FIX 2: Commenter Avatar Link */}
                                        <Link href={`/dashboard/profile/${user._id || c.userId}`}>
                                            <img src={userPic} alt={userName} className="w-7 h-7 rounded-full object-cover bg-gray-200 flex-shrink-0 mt-1"/>
                                        </Link>
                                        <div className="bg-gray-100 p-2 rounded-lg w-full text-sm">
                                            {/* FIX 3: Commenter Name Link */}
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
                <h4 className="text-sm font-semibold mb-3">Rate and Review</h4>
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Your rating:</span>
                        {Array.from({ length: 5 }, (_, i) => (
                            <FaStar
                                key={i}
                                className={`text-xl cursor-pointer transition-colors ${i < newRating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                                onClick={() => setNewRating(i + 1)}
                            />
                        ))}
                    </div>
                    <textarea
                        rows={2}
                        placeholder="Write your feedback (optional)..."
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                    />
                    <button
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition self-start text-sm font-medium disabled:opacity-50"
                        onClick={handleAddFeedback}
                        disabled={newRating === 0}
                    >
                        Submit Review
                    </button>
                </div>
                <div className="space-y-3 max-h-48 overflow-auto pr-2">
                    <h5 className="text-xs font-semibold text-gray-500 border-b pb-1 mb-2">Reviews ({feedbacks?.length || 0})</h5>
                    {(feedbacks && feedbacks.length > 0) ? (
                        feedbacks.map((fb, idx) => {
                            const ratingUserId = fb.userId || {};
                            const ratingUserName = ratingUserId.name || fb.userName || "User";
                            const ratingUserPic = ratingUserId.profilePic || "/profile.jpg";
                            return (
                                <div key={fb._id || `feedback-${idx}`} className="flex items-start gap-2 text-sm">
                                    {/* FIX 4A: Reviewer Avatar Link */}
                                    <Link href={`/dashboard/profile/${ratingUserId._id || fb.userId}`}>
                                        <img src={ratingUserPic} alt={ratingUserName} className="w-7 h-7 rounded-full object-cover bg-gray-200 flex-shrink-0"/>
                                    </Link>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1">
                                            {/* FIX 4B: Reviewer Name Link */}
                                            <Link href={`/dashboard/profile/${ratingUserId._id || fb.userId}`} className="font-semibold text-xs hover:underline">
                                                {ratingUserName}
                                            </Link>
                                            <div className="flex">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <FaStar key={i} size={10} className={i < (fb.value || 0) ? "text-yellow-400" : "text-gray-300"} />
                                                ))}
                                            </div>
                                        </div>
                                        {fb.feedback && <p className="text-gray-700 text-xs mt-0.5 break-words">{fb.feedback}</p>}
                                    </div>
                                </div>
                            );
                        })
                    ) : <p className="text-xs text-gray-500 text-center">No reviews yet.</p>}
                </div>
            </div>
            )}

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