"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
// --- 1. FaComments ADDED HERE ---
import { FaMapPin, FaPhone, FaBriefcase, FaUserPlus, FaUserCheck, FaComments } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import { toast } from "sonner";
import ProfileMap from '@/app/components/ProfileMap';

// --- PLACEHOLDERS ---
// 1. A loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
  </div>
);

// 2. Your project post card component
const PostCard = ({ post }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="h-48 bg-gray-200">
      {post.images && post.images[0] ? (
        <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-300"></div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-bold text-lg">{post.title || "Project Title"}</h3>
      <p className="text-gray-600 text-sm mt-1 mb-3">
        {post.description ? post.description.substring(0, 100) + "..." : "No description."}
      </p>
      <Link href={`/dashboard/post/${post._id}`} legacyBehavior>
        <a className="text-sm font-semibold text-blue-600 hover:underline">
          View Project &rarr;
        </a>
      </Link>
    </div>
  </div>
);
// --- END PLACEHOLDERS ---


export default function UserProfilePage() {
  const params = useParams();
  const { data: session } = useSession(); 
  const userId = params.userId; 

  const [user, setUser] = useState(null); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwner = session?.user?.id === userId;
  const isValid = (value) => value !== null && value !== undefined && value !== "";

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userRes = await axios.get(`/api/user/${userId}`);
        setUser(userRes.data); 

        const postsRes = await axios.get(`/api/user/${userId}/posts`);
        setPosts(postsRes.data || []); 
        
        if (userRes.data.followers && Array.isArray(userRes.data.followers)) {
           setIsFollowing(userRes.data.followers.includes(session?.user?.id));
        } else {
           console.warn("User object does not contain a 'followers' array. Cannot determine follow status.");
        }

      } catch (err) {
        console.error("Failed to fetch user data", err);
        setError("Could not load profile. This user may not exist.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, session]); 

  const handleFollow = async () => {
    try {
      const response = await axios.post(`/api/user/follow/${userId}`); 
      if (response.data.success) {
        setIsFollowing(true);
        toast.success(`You are now following ${user.name}`);
        setUser(prev => ({ 
            ...prev, 
            followerCount: (prev.followerCount || 0) + 1,
            followers: [...(prev.followers || []), session.user.id] 
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to follow user");
    }
  };

  const handleUnfollow = async () => {
     try {
      const response = await axios.post(`/api/user/unfollow/${userId}`); 
      if (response.data.success) {
        setIsFollowing(false);
        toast.info(`You are no longer following ${user.name}`);
         setUser(prev => ({ 
            ...prev, 
            followerCount: Math.max(0, (prev.followerCount || 0) - 1),
            followers: (prev.followers || []).filter(id => id !== session.user.id) 
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unfollow user");
    }
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!user) return <div className="text-center p-4">User not found.</div>;

  const locationString = (isValid(user.location?.town) || isValid(user.location?.district) || isValid(user.location?.state))
    ? [user.location.town, user.location.district, user.location.state].filter(Boolean).join(", ")
    : null; 

  console.log("Sending this location to Google:", locationString);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-6">

      {/* --- LEFT SIDE: User's Posts (No Changes) --- */}
      <div className="w-full md:w-2/3">
        <h2 className="text-2xl font-bold mb-4">
          Projects by {user.name}
        </h2>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow border text-center text-gray-500">
            <p>{user.name} hasn't posted any projects yet.</p>
          </div>
        )}
      </div>

      {/* --- RIGHT SIDE: Profile Sidebar --- */}
      <aside className="w-full md:w-1/3">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          
          <div className="h-32 bg-gray-700">
            <img 
              src={isValid(user.coverImage) ? user.coverImage : "/cover.jpg"} 
              alt="Cover" 
              className="w-full h-full object-cover" 
            />
          </div>

          <div className="flex flex-col items-center -mt-16 p-4">
            <img
              src={isValid(user.profilePic) ? user.profilePic : "/profile.jpg"}
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-gray-200"
            />
            <h1 className="text-2xl font-bold mt-2">
                {isValid(user.name) ? user.name : "User Name"}
            </h1>
            
            <p className="text-gray-600 text-sm text-center mt-1">
              {isValid(user.title) ? user.title : "No bio provided."}
            </p>
          </div>

          {/* --- 2. BUTTONS SECTION UPDATED --- */}
          <div className="px-4 pb-4">
            {!isOwner ? (
              <div className="flex gap-2"> {/* Group buttons in a flex container */}
                {isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-black text-sm font-medium hover:bg-gray-50 transition"
                  >
                    <FaUserCheck /> Following
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-black bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
                  >
                    <FaUserPlus /> Follow
                  </button>
                )}

                {/* --- THIS IS THE NEW BUTTON --- */}
                <Link href={`/dashboard/chat?userId=${userId}`} legacyBehavior>
                  <a className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                     <FaComments /> Message
                  </a>
                </Link>
                {/* --- END OF NEW BUTTON --- */}
                
              </div>
            ) : (
               <Link href="/dashboard/profile" legacyBehavior>
                  <a className="w-full block text-center px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-black text-sm font-medium hover:bg-gray-200 transition">
                    Edit Your Profile
                  </a>
                </Link>
            )}
          </div>
          {/* --- END OF BUTTONS SECTION --- */}


          <div className="p-4 border-t border-gray-200">
            <ul className="space-y-3 text-sm text-gray-800">
              <li className="flex items-center gap-3">
                <FaBriefcase className="text-gray-500 w-4" />
                <span>
                  {Array.isArray(user.skills) && user.skills.length > 0
                    ? user.skills.join(", ")
                    : "No skills listed"}
                </span>
              </li>
               <li className="flex items-center gap-3">
                <FaMapPin className="text-gray-500 w-4" />
                 <span>
                    {locationString || "Unknown location"}
                 </span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-gray-500 w-4" />
                <span>{isValid(user.phone) ? user.phone : "N/A"}</span>
              </li>
            </ul>
          </div>

          <div className="flex p-4 border-t border-gray-200 text-center">
            <div className="w-1/2">
              <span className="font-bold text-lg">{user.followerCount ?? 0}</span>
              <span className="text-gray-600 text-sm block">Followers</span>
            </div>
            <div className="w-1/2">
              <span className="font-bold text-lg">{user.followingCount ?? 0}</span>
              <span className="text-gray-600 text-sm block">Following</span>
            </div>
          </div>
          
          <div className="h-48 bg-gray-100 border-t">
            <ProfileMap locationString={locationString} />
          </div>

        </div>
      </aside>
    </div>
  );
}