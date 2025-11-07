"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { FiMapPin } from "react-icons/fi";
import EditProfileModal from "@/app/components/EditProfileModal";
import PostCard from "@/app/components/PostCard";

async function fetchData(userId, setUserDetails, setPostsData, setLoading) {
  setLoading(true);
  try {
    if (!userId) {
      setLoading(false);
      return;
    }
    const [profileResponse, postsResponse] = await Promise.allSettled([
      axios.get(`/api/user/${userId}`),
      axios.get(`/api/user/${userId}/posts`)
    ]);

    if (profileResponse.status === 'fulfilled') {
      setUserDetails(profileResponse.value.data);
    } else {
      console.error("Error fetching profile:", profileResponse.reason);
      setUserDetails(null);
    }

    if (postsResponse.status === 'fulfilled') {
      setPostsData(postsResponse.value.data || []);
    } else {
      console.warn("No posts found or error fetching posts:", postsResponse.reason);
      setPostsData([]);
    }
  } catch (err) {
    console.error("Error in fetchData function:", err);
    setUserDetails(null);
    setPostsData([]);
  } finally {
    setLoading(false);
  }
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [userDetails, setUserDetails] = useState(null);
  const [postsData, setPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("posts");
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    const currentUserId = session?.user?.id;
    if (currentUserId) {
      fetchData(currentUserId, setUserDetails, setPostsData, setLoading);
    } else if (session === null) {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const handleProfileUpdate = (updatedUser) => {
    setUserDetails(updatedUser);
    setIsEditing(false);
  };

  const isValid = (value) => value !== null && value !== undefined && value !== "";

  const mediaPosts = postsData.filter(post => post.images && Array.isArray(post.images) && post.images.length > 0);

  if (loading) return <div className="text-center p-10">Loading profile...</div>;
  if (!session) return <div className="text-center p-10">Please log in to view your profile.</div>;
  if (!userDetails) return <div className="text-center p-10">Could not load user data. Try refreshing.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative p-4 md:p-0">
      <div className="bg-white shadow-md rounded-lg overflow-hidden relative">
        <div className="relative h-48 bg-gray-200">
          <img
            src={isValid(userDetails.coverImage) ? userDetails.coverImage : "/cover.jpg"}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute -bottom-16 left-6">
            <img
              src={isValid(userDetails.profilePic) ? userDetails.profilePic : "/profile.jpg"}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-white object-cover bg-gray-300"
            />
          </div>
        </div>

        <div className="pt-20 px-6 pb-6 ">
           <div className="flex justify-end mb-4">
             <button
               onClick={() => setIsEditing(true)}
               className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition text-sm font-medium"
             >
               Edit Profile
             </button>
           </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-semibold truncate">
              {isValid(userDetails.name) ? userDetails.name : "User Name"}
            </h1>
            <p className="text-gray-600 mt-1 break-words">
              {isValid(userDetails.title) ? userDetails.title : "No bio provided"}
            </p>
             <p className="text-gray-700 mt-2 text-sm">
                <span className="font-semibold">Mobile: </span>
                 {isValid(userDetails.phone) ? userDetails.phone : "N/A"}
             </p>
             <p className="text-gray-700 mt-1 text-sm">
                <span className="font-semibold">Skill Category: </span>
                {Array.isArray(userDetails.skillCategories) && userDetails.skillCategories.length > 0
                  ? userDetails.skillCategories.join(", ")
                  : "N/A"}
             </p>
             <p className="text-gray-700 mt-1 text-sm">
                <span className="font-semibold">Skill: </span>
                {Array.isArray(userDetails.skills) && userDetails.skills.length > 0
                  ? userDetails.skills.join(", ")
                  : "N/A"}
            </p>
            <p className="text-gray-500 mt-2 flex items-center gap-1 text-sm">
              <FiMapPin className="text-gray-500" />
              {isValid(userDetails.location?.town) || isValid(userDetails.location?.district) || isValid(userDetails.location?.state)
                ? [userDetails.location.town, userDetails.location.district, userDetails.location.state].filter(Boolean).join(", ")
                : "Unknown location"}
            </p>
            <hr className="my-4 border-gray-300" />
            <div className="flex justify-start space-x-12">
              <div>
                <p className="font-bold text-lg">{userDetails?.postsCount ?? 0}</p>
                <p className="text-gray-500 text-sm">Posts</p>
              </div>
              <div>
                <p className="font-bold text-lg">{userDetails?.followerCount ?? 0}</p>
                <p className="text-gray-500 text-sm">Followers</p>
              </div>
              <div>
                <p className="font-bold text-lg">{userDetails?.followingCount ?? 0}</p>
                <p className="text-gray-500 text-sm">Following</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-center space-x-8 border-b border-gray-300 mb-4">
          <button
            className={`px-4 py-2 font-semibold ${
              selectedTab === "posts" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"
            } transition-colors duration-150`}
            onClick={() => setSelectedTab("posts")}
          >
            Posts
          </button>
          <button
            className={`px-4 py-2 font-semibold ${
              selectedTab === "media" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"
            } transition-colors duration-150`}
            onClick={() => setSelectedTab("media")}
          >
            Media
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
             <div className="text-center text-gray-500">Loading {selectedTab}...</div>
          ) : (
            <>
              {selectedTab === "posts" && (
                postsData.length === 0 ? (
                  <p className="text-gray-500 text-center">No posts available</p>
                ) : (
                  <div className="flex flex-col space-y-6">
                    {postsData.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                )
              )}

              {selectedTab === "media" && (
                 mediaPosts.length === 0 ? (
                  <p className="text-gray-500 text-center">No media available</p>
                 ) : (
                    <div className="grid grid-cols-3 gap-1 md:gap-2">
                      {mediaPosts.map((post) => (
                        post.images?.[0] && (
                           <div key={post._id} className="cursor-pointer aspect-square relative group overflow-hidden rounded">
                              <img
                                src={post.images[0]}
                                alt="Post media"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onClick={() => setModalImage(post.images[0])}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300"></div>
                           </div>
                        )
                      ))}
                    </div>
                 )
              )}
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <EditProfileModal
          user={userDetails}
          onSave={handleProfileUpdate}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            alt="Media preview"
            className="max-h-[90vh] max-w-[90vw] rounded shadow-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
           <button
             className="absolute top-4 right-4 text-white text-3xl font-bold hover:opacity-75 transition"
             onClick={() => setModalImage(null)}
            >
              &times;
            </button>
        </div>
      )}
    </div>
  );
}