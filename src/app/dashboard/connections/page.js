"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { FaUserCircle } from "react-icons/fa";

function ConnectionsContent() {
  const searchParams = useSearchParams();
  const listType = searchParams.get("list"); // 'followers' or 'following'
  const userId = searchParams.get("userId"); // ID of the profile owner

  const [connectionList, setConnectionList] = useState([]);
  const [loading, setLoading] = useState(true);

  const title = listType === "followers" ? "Followers" : "Following";

  useEffect(() => {
    if (
      !userId ||
      !listType ||
      (listType !== "followers" && listType !== "following")
    ) {
      setLoading(false);
      return;
    }

    const fetchConnections = async () => {
      setLoading(true);
      try {
        // Call dynamic API route
        const endpoint = `/api/user/${listType}/${userId}`;
        const { data } = await axios.get(endpoint);

        // API returns { list: [...] }
        setConnectionList(data?.list || []);
      } catch (error) {
        console.error(`Failed to fetch ${listType}:`, error);
        setConnectionList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [userId, listType]);

  if (
    !userId ||
    !listType ||
    (listType !== "followers" && listType !== "following")
  ) {
    return (
      <div className="max-w-xl mx-auto p-4 text-red-500">
        Error: Invalid list request. Please check the URL.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading {title}...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6 border-b pb-2">
        {title} ({connectionList.length})
      </h1>

      {connectionList.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          This user has no {title.toLowerCase()} yet.
        </p>
      ) : (
        <div className="space-y-4">
          {connectionList.map((user) => (
            <Link
              href={`/dashboard/profile/${user._id}`}
              key={user._id}
              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition"
            >
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <FaUserCircle className="w-12 h-12 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-gray-500">
                  {user.title ||
                    user.skillCategories?.[0] ||
                    "Professional Worker"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading connections...</div>}>
      <ConnectionsContent />
    </Suspense>
  );
}
