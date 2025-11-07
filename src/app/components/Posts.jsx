"use client";
import { useState } from "react";

export default function Posts() {
  const [posts, setPosts] = useState([
    { id: 1, title: "Post 1", liked: false },
    { id: 2, title: "Post 2", liked: false },
    { id: 3, title: "Post 3", liked: false },
  ]);

  const toggleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked } : p))
    );
  };

  return (
    <div className="p-4 space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="p-4 border rounded-md shadow-sm flex justify-between items-center"
        >
          <h2 className="font-semibold">{post.title}</h2>
          <button
            onClick={() => toggleLike(post.id)}
            className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {post.liked ? "❤️ Liked" : "♡ Like"}
          </button>
        </div>
      ))}
    </div>
  );
}
