"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import { 
    FaMapPin, FaPhone, FaBriefcase, FaUserPlus, 
    FaUserCheck, FaComments, FaStar 
} from "react-icons/fa";
import { toast } from "sonner";
import ProfileMap from '@/app/components/ProfileMap';
// 🌟 IMPORTS FOR MOVED COMPONENTS
import PostCard from '@/app/components/PostCard'; 
import RatingBreakdown from '@/app/components/RatingBreakdown';


// --- LOADING COMPONENT ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
    </div>
);


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

    return (
        // The main container sets up the two-column layout and constraints the height
        <div className="flex flex-col-reverse md:flex-row gap-6 h-full overflow-hidden">

            {/* 🚀 LEFT SIDE: User's Posts (SCROLLABLE) */}
            <div 
                // This container is the scroll region for posts
                className="w-full md:w-2/3 flex flex-col h-full overflow-y-scroll pr-4"
            >
                {/* Heading fixed in place */}
                <h2 className="text-2xl font-bold mb-4 flex-shrink-0">
                    Projects by {user.name}
                </h2>
                {posts.length > 0 ? (
                    // This post grid takes up all remaining space
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow">
                        {posts.map((post) => (
                            <PostCard key={post._id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow border text-center text-gray-500 flex-grow">
                        <p>{user.name} hasn't posted any projects yet.</p>
                    </div>
                )}
            </div>

            {/* 👤 RIGHT SIDE: Profile Sidebar (SCROLLABLE) */}
            <aside 
                // This is the SCROLLING container for the sidebar.
                className="w-full md:w-1/3 flex flex-col h-full overflow-y-scroll pl-4"
            >
                {/* *** FIX APPLIED HERE: 
                - Removed `flex-grow` so the box doesn't attempt to stretch vertically.
                - Removed `overflow-hidden` so content can push the bottom edge past the viewport.
                This allows the content height to exceed the container, activating the parent <aside>'s scrollbar.
                */}
                <div className="bg-white rounded-lg shadow border border-gray-200">
                    
                    {/* Cover Image */}
                    <div className="h-32 bg-gray-700">
                        <img 
                            src={isValid(user.coverImage) ? user.coverImage : "/cover.jpg"} 
                            alt="Cover" 
                            className="w-full h-full object-cover" 
                        />
                    </div>

                    {/* Profile Info */}
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

                    {/* --- BUTTONS SECTION --- */}
                    <div className="px-4 pb-4">
                        {!isOwner ? (
                            <div className="flex gap-2">
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

                                {/* Message Button */}
                                <Link 
                                    href={`/dashboard/chat?userId=${userId}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    <FaComments /> Message
                                </Link>
                                
                            </div>
                        ) : (
                            // Edit Profile Button
                            <Link 
                                href="/dashboard/profile" 
                                className="w-full block text-center px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-black text-sm font-medium hover:bg-gray-200 transition"
                            >
                                Edit Your Profile
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

                    {/* RatingBreakdown */}
                    <RatingBreakdown 
                        averageRating={user.averageRating}
                        totalRatings={user.totalRatings}
                        totalReviews={user.totalReviews}
                        ratingDistribution={user.ratingDistribution}
                    />
                </div>
            </aside>
        </div>
    );
}