"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import PostCard from "../../components/PostCard";
import { toast } from "sonner";

export default function Post() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const query = searchParams.get("query") || "";
  const location = searchParams.get("location") || "";

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/post/search", {
          params: { query, location },
        });

        if (data.success) {
          const clonedPosts = data.posts.map((p) => ({
            ...p,
            comments: [...(p.comments || [])],
            ratings: [...(p.ratings || [])],
            likes: [...(p.likes || [])],
          }));
          setPosts(clonedPosts);
        } else {
          toast.error(data.message || "Failed to load posts");
        }
      } catch (err) {
        console.error(err);
        toast.error("Server error while fetching posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [query, location]);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading posts...</div>;
  }

  if (posts.length === 0) {
    return <div className="text-center py-10 text-gray-500">No posts available.</div>;
  }

  return (
    <div className="mt-4 flex flex-col gap-6 px-4 sm:px-6 md:px-8">
      {posts.map((post) => (
        <div key={post._id} className="w-full max-w-md mx-auto">
          <PostCard 
            post={{
              ...post,
              comments: [...post.comments],
              ratings: [...post.ratings],
              likes: [...post.likes],
            }} 
          />
        </div>
      ))}
    </div>
  );
}
