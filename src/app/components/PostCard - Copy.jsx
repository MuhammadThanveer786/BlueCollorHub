"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { 
  FaHeart, FaRegHeart, FaComment, FaStar, FaPaperPlane, 
  FaChevronLeft, FaChevronRight, FaTimes 
} from "react-icons/fa";

export default function PostCard({ post }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState("collapsed"); // "collapsed" | "expanded"
  const [showRatings, setShowRatings] = useState(false);
  const [comments, setComments] = useState([...post.comments] || []);
  const [feedbacks, setFeedbacks] = useState([...post.ratings] || []);
  const [newComment, setNewComment] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const commentsRef = useRef(null);
  const ratingsRef = useRef(null);
  // console.log(post);
  // Initialize liked state
  useEffect(() => {
    if (!session) return;
    if (post.likes && Array.isArray(post.likes)) {
      const userLiked = post.likes.some(
        (id) => id === currentUserId || id?._id === currentUserId
      );
      setLiked(userLiked);
      setLikesCount(post.likes.length);
    }
  }, [session, post.likes, currentUserId]);

  // Toggle like
  const handleLike = async () => {
    if (!currentUserId) return alert("Please login to like posts.");
    const prevLiked = liked;
    setLiked(!liked);
    setLikesCount(prevLiked ? likesCount - 1 : likesCount + 1);

    try {
      const { data } = await axios.post(`/api/post/${post._id}/like`);
      if (data.success) setLikesCount(data.likesCount);
      else {
        setLiked(prevLiked);
        setLikesCount(prevLiked ? likesCount + 1 : likesCount - 1);
      }
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevLiked ? likesCount + 1 : likesCount - 1);
      console.error("Error toggling like:", err);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    try {
      const { data } = await axios.post(`/api/post/${post._id}/comment`, {
        comment: newComment,
      });

      if (data.success) {
        // Normalize the new comment
        const normalizedComment = {
          userId: {
            _id: currentUserId,
            name: session.user.name,
            profilePic: session.user.image || "https://i.pravatar.cc/150?img=12",
          },
          text: data.comment?.text || newComment,
          _id: data.comment?._id || Date.now(),
        };

        setComments([normalizedComment, ...comments]);
        setNewComment("");
        setShowComments("expanded");
      } else console.error(data.message);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Add feedback/rating
  const handleAddFeedback = async () => {
    if (!newFeedback.trim() || newRating === 0 || !currentUserId) return;
    const feedbackObj = { value: newRating, feedback: newFeedback };

    try {
      const { data } = await axios.post(`/api/post/${post._id}/rating`, feedbackObj);
      // console.log(data);
      if (data.success) {
        const normalizedFeedback = {
          ...data.rating,
          userName: session.user.name || "User",
        };
        setFeedbacks([normalizedFeedback, ...feedbacks]);
        setNewFeedback("");
        setNewRating(0);
      } else console.error(data.message);
    } catch (err) {
      console.error("Error adding feedback:", err);
    }
  };

// Update outside-click effect
useEffect(() => {
  const handleClickOutside = (e) => {
    if (commentsRef.current && !commentsRef.current.contains(e.target)) setShowComments("collapsed");
    if (ratingsRef.current && !ratingsRef.current.contains(e.target)) setShowRatings(false);
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  const openModal = (index) => {
    setModalImageIndex(index);
    setShowModal(true);
  };
  const prevImage = () => setModalImageIndex((prev) => (prev === 0 ? post.images.length - 1 : prev - 1));
  const nextImage = () => setModalImageIndex((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));

  return (
    <div className="max-w-2xl mx-auto my-6 border shadow-md bg-white rounded-lg overflow-hidden">

      {/* Post Creator */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src={post.userId?.profilePic || "https://i.pravatar.cc/150?img=12"} alt="User Avatar" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <p className="font-semibold">{post.userId?.name || "User"}</p>
            <p className="text-gray-500 text-sm">{post.userId?.title || ""}</p>
          </div>
        </div>
        <button className="px-4 py-1 text-black font-semibold border border-black rounded-md hover:bg-black hover:text-white transition">
          Connect
        </button>
      </div>

      {/* Post Title & Description */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-lg mb-2">{post.title}</h3>
        <p className={`text-gray-700 ${!showFullDesc ? "line-clamp-3" : ""}`}>{post.description}</p>
        {post.description.length > 150 && (
          <button
            className="text-blue-500 mt-1 font-semibold"
            onClick={() => setShowFullDesc(!showFullDesc)}
          >
            {showFullDesc ? "Show Less" : "Show More"}
          </button>
        )}
      </div>

      {/* Post Media */}
      {post.images && post.images.length > 0 && (
        <div className="relative w-full aspect-[16/9] bg-gray-200 cursor-pointer" onClick={() => openModal(currentImage)}>
          {imageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
          <img
            src={post.images[currentImage]}
            alt="Post Media"
            className={`w-full h-full object-cover ${imageLoading ? "hidden" : "block"}`}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          {post.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
              {post.images.map((_, idx) => (
                <span key={idx} className={`w-2 h-2 rounded-full ${idx === currentImage ? "bg-black" : "bg-gray-400"}`}></span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center px-4 py-4 border-t border-gray-200">
        <div className="flex gap-6">
          <div className="flex flex-col items-center cursor-pointer" onClick={handleLike}>
            {liked ? <FaHeart className="text-red-500 text-2xl" /> : <FaRegHeart className="text-2xl" />}
            <span className="text-gray-600 text-sm mt-1">{likesCount} likes</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer" onClick={() => setShowComments(showComments === "expanded" ? "collapsed" : "expanded")}>
            <FaComment className="text-2xl" />
            <span className="text-gray-600 text-sm mt-1">{comments.length} comments</span>
          </div>
        </div>
        <div className="flex flex-col items-center cursor-pointer" onClick={() => setShowRatings(!showRatings)}>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <FaStar key={i} className={i < Math.round(post.averageRating || 0) ? "text-yellow-400" : "text-gray-300"} />
            ))}
          </div>
          <span className="text-gray-600 text-sm mt-1">View Ratings</span>
        </div>
      </div>

      {/* Comments */}
      {showComments !== "collapsed" && (
        <div ref={commentsRef} className="border-t border-gray-200 p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
            >
              <FaPaperPlane />
            </button>
          </div>

          <div className={`space-y-3 ${showComments === "expanded" ? "max-h-64 overflow-auto" : ""}`}>
            {(showComments === "expanded" ? comments : comments.slice(0, 3)).map((c, idx) => {
              const user = c.userId || {};
              return (
                <div key={idx} className="flex items-start gap-3">
                  <img
                    src={user.profilePic || "https://i.pravatar.cc/150?img=12"}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="bg-gray-100 p-2 rounded-lg w-full">
                    <span className="font-semibold">{user.name || "User"}:</span>{" "}
                    {c.text || c.comment || "No comment"}
                  </div>
                </div>
              );
            })}
          </div>

          {comments.length > 3 && (
            <button
              onClick={() => setShowComments(showComments === "expanded" ? "collapsed" : "expanded")}
              className="text-blue-500 text-sm font-semibold hover:underline mt-2"
            >
              {showComments === "expanded" ? "Hide comments" : `View all ${comments.length} comments`}
            </button>
          )}
        </div>
      )}

      {/* Ratings / Feedback */}
      {showRatings && (
      <div ref={ratingsRef} className="border-t border-gray-200 p-4">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span>Rate this post:</span>
            {Array.from({ length: 5 }, (_, i) => (
              <FaStar
                key={i}
                className={`text-2xl cursor-pointer ${i < newRating ? "text-yellow-400" : "text-gray-300"}`}
                onClick={() => setNewRating(i + 1)}
              />
            ))}
          </div>
          <textarea
            rows={2}
            placeholder="Write your feedback..."
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-black"
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition self-start"
            onClick={handleAddFeedback}
            disabled={newRating === 0} // optional: disable button if no rating
          >
            Submit
          </button>
        </div>
      </div>
    )}
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={() => setShowModal(false)}>
            <FaTimes />
          </button>
          <button className="absolute left-4 text-white text-3xl" onClick={prevImage}>
            <FaChevronLeft />
          </button>
          <img
            src={post.images[modalImageIndex]}
            alt="Preview"
            className="max-h-[80vh] max-w-[90vw] object-contain"
          />
          <button className="absolute right-4 text-white text-3xl" onClick={nextImage}>
            <FaChevronRight />
          </button>
          {post.images.length > 1 && (
            <div className="absolute bottom-4 text-white text-sm">
              {modalImageIndex + 1} of {post.images.length} images
            </div>
          )}
        </div>
      )}
    </div>
  );
}
