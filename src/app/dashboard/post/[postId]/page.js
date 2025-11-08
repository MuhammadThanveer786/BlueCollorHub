"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import PostCard from '@/app/components/PostCard'; // Import your full PostCard

export default function PostDetailPage({ params }) {
  const { postId } = params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/post/${postId}`);
        if (data.success) {
          setPost(data.post);
        } else {
          toast.error(data.message || "Failed to load post.");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        toast.error("Could not find or load this post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading post...</div>;
  }

  if (!post) {
    return <div className="text-center py-10 text-gray-500">Post not found. It may have been deleted.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PostCard post={post} />
    </div>
  );
}