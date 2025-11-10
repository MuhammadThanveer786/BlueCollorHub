"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { FaImage } from "react-icons/fa";

// Small component to render each post card
function PostGridItem({ post }) {
  return (
    <Link
      href={`/dashboard/post/${post._id}`}
      className="relative aspect-square rounded-lg overflow-hidden group shadow-md bg-gray-200 block"
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
      <div className="absolute bottom-3 left-3 text-white p-1">
        <h3 className="font-semibold text-sm truncate">{post.title}</h3>
        <p className="text-xs text-gray-200 truncate">
          by {post.userId?.name || "User"}
        </p>
      </div>
    </Link>
  );
}

export default function PostPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // Extract query parameters
  const query = searchParams.get("query") || "";
  const state = searchParams.get("state") || "";
  const district = searchParams.get("district") || "";
  const category = searchParams.get("category") || "";
  const skill = searchParams.get("skill") || "";

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/post/search", {
          params: { query, state, district, category, skill },
        });

        if (data.success) {
          setPosts(data.posts || []);
        } else {
          toast.error(data.message || "Failed to load posts");
          setPosts([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Server error while fetching posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [query, state, district, category, skill]);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading posts...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No posts found matching your criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {posts.map((post) => (
        <PostGridItem key={post._id} post={post} />
      ))}
    </div>
  );
}
