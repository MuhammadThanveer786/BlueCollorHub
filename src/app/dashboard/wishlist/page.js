// src/app/dashboard/wishlist/page.js

"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { FaImage } from "react-icons/fa"; // Placeholder icon

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/user/wishlist");
        setWishlistItems(data || []);
      } catch (error) {
        console.error("Failed to fetch wishlist", error);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading wishlist...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {wishlistItems.length === 0 ? (
        <p className="text-gray-500">You haven't saved any posts yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlistItems.map((post) => (
            // **FIX APPLIED HERE:**
            // 1. Removed 'legacyBehavior' prop.
            // 2. Moved the styling className from the <a> tag to the <Link> component.
            <Link 
              href={`/dashboard/post/${post._id}`} 
              key={post._id} 
              className="relative aspect-square rounded-lg overflow-hidden group shadow-md bg-gray-200"
            >
              {post.images?.[0] ? (
                <img
                  src={post.images[0]}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaImage className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-3 left-3 text-white">
                <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                <p className="text-xs text-gray-200 truncate">by {post.userId?.name || 'User'}</p>
              </div>
            </Link>
            // 3. The <a> tag that was here is now completely removed.
          ))}
        </div>
      )}
    </div>
  );
}