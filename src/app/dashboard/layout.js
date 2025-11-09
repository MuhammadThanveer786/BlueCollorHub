"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  FaBars, FaTimes, FaHome, FaHeart, FaComments, FaUser, FaPlus, FaSignOutAlt, FaBell
} from "react-icons/fa";
import CategoriesDropdown from "../components/CategoriesDropdown";
// ChatSupport is no longer imported or used here
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "../components/SearchBar";
import categoriesWithSkills from "@/data/categoriesWithSkills";
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'sonner';
import Link from 'next/link';

let socket;

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  handleAcceptRequest: async (senderId, notificationId) => {},
  handleDeclineRequest: async (senderId, notificationId) => {},
});

export const useNotifications = () => useContext(NotificationContext);

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const dropdownRef = useRef(null);
  const notificationPanelRef = useRef(null);

  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const activeSection = pathname?.split("/")[2] || "posts";

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadChatSenders, setUnreadChatSenders] = useState(new Set());

  const categories = ["All Categories", ...Object.keys(categoriesWithSkills)];
  const sidebarItems = [
    { key: "posts", label: "Posts", icon: <FaHome size={18} /> },
    { key: "wishlist", label: "Wishlist", icon: <FaHeart size={18} /> },
    { key: "chat", label: "Chat Support", icon: <FaComments size={18} /> },
    { key: "profile", label: "Profile", icon: <FaUser size={18} /> },
  ];

  const fetchNotifications = async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) return;
    try {
      const { data } = await axios.get('/api/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
        const currentUnreadCount = data.filter(n => !n.read).length;
        setUnreadCount(currentUnreadCount);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Could not load notifications.");
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const addNotification = (newNotification) => {
    if (!newNotification || !newNotification._id) return;
    setNotifications(prev => {
        if (prev.some(n => n._id === newNotification._id)) return prev;
        return [newNotification, ...prev];
    });
    if (!newNotification.read) { setUnreadCount(prev => prev + 1); }
    toast.info(`${newNotification.senderId?.name || 'Someone'} ${getNotificationMessage(newNotification)}`, {
        description: `Received just now`,
    });
  };

  const getNotificationMessage = (notif) => {
      switch (notif?.type) {
          case 'like': return `liked your post.`;
          case 'comment': return `commented on your post.`;
          case 'rating': return `rated your post.`;
          case 'connect_request': return `sent you a follow request.`;
          case 'connect_accept': return `started following you.`;
          default: return 'sent you a notification.';
      }
  };

  const markAsRead = async (idsToMark = []) => {
    if (!idsToMark || idsToMark.length === 0) return;
    const unreadIdsInList = idsToMark.filter(id => notifications.find(n => n._id === id && !n.read));
    if (unreadIdsInList.length === 0) return;
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.map(n => unreadIdsInList.includes(n._id) ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - unreadIdsInList.length));
    try {
        await axios.post('/api/notifications/mark-read', { notificationIds: unreadIdsInList });
    } catch (error) {
        console.error("Failed to mark notifications as read:", error);
        toast.error(`Failed to update notification status: ${error.response?.data?.message || error.message}`);
        setNotifications(originalNotifications);
        setUnreadCount(originalNotifications.filter(n => !n.read).length);
    }
  };

  const handleAcceptRequest = async (senderId, notificationId) => {
      if (!senderId) return;
      const originalNotifications = [...notifications];
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      const wasUnread = originalNotifications.find(n => n._id === notificationId && !n.read);
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      try {
          const response = await axios.post(`/api/user/accept/${senderId}`);
          if (response.data.success) {
              toast.success(`Connection accepted!`);
              router.refresh();
          } else {
              toast.error(response.data.message || "Failed to accept connection.");
              setNotifications(originalNotifications);
              if (wasUnread) setUnreadCount(prev => prev + 1);
          }
      } catch (error) {
          console.error("Error accepting connection:", error);
          toast.error(error.response?.data?.message || "Server error accepting connection.");
          setNotifications(originalNotifications);
          if (wasUnread) setUnreadCount(prev => prev + 1);
      }
  };

  const handleDeclineRequest = async (senderId, notificationId) => {
      if (!senderId) return;
      const originalNotifications = [...notifications];
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      const wasUnread = originalNotifications.find(n => n._id === notificationId && !n.read);
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      try {
          const response = await axios.post(`/api/user/decline/${senderId}`);
          if (response.data.success) {
              toast.info("Follow request declined.");
              router.refresh();
          } else {
              toast.error(response.data.message || "Failed to decline request.");
              setNotifications(originalNotifications);
              if (wasUnread) setUnreadCount(prev => prev + 1);
          }
      } catch (error) {
          console.error("Error declining request:", error);
          toast.error(error.response?.data?.message || "Server error declining request.");
          setNotifications(originalNotifications);
          if (wasUnread) setUnreadCount(prev => prev + 1);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAllCategories(false);
      }
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target) && !event.target.closest('[data-notification-bell]')) {
        setShowNotificationPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (userId && sessionStatus === 'authenticated') {
      fetchNotifications();
      if (!socket || socket.disconnected) {
          socket = io();
          socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('register_user', userId);
          });
          socket.on('new_notification', addNotification);
          
          socket.on('receive_private_message', (message) => {
            if (message && message.senderId && !window.location.pathname.includes('/dashboard/chat')) {
                toast.info(`New message from ${message.senderName || 'Someone'}`);
                setUnreadChatSenders(prev => new Set(prev).add(message.senderId));
            }
          });

          socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
          });
          socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
          });
      }
    } else if (sessionStatus !== 'loading') {
        if (socket) { socket.disconnect(); socket = null; }
        setNotifications([]); setUnreadCount(0); setShowNotificationPanel(false);
        setUnreadChatSenders(new Set());
    }
    return () => { if (socket) { socket.disconnect(); socket = null; } };
  }, [sessionStatus, session?.user?.id]);

  const handleCategorySearch = (category, skill = null) => {
    setActiveCategory(category);
    setShowAllCategories(false);
    const params = new URLSearchParams(window.location.search);
    params.set("category", category);
    if (skill) { params.set("skill", skill); } else { params.delete("skill"); }
    router.push(`/dashboard/posts?${params.toString()}`);
  };

  const getNotificationLink = (notif) => {
      if (notif.postId?._id) { return `/dashboard/post/${notif.postId._id}`; }
      if (notif.type === 'connect_request' || notif.type === 'connect_accept') {
          return `/dashboard/profile/${notif.senderId?._id}`;
      }
      return '#';
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, handleAcceptRequest, handleDeclineRequest }}>
      <div className="flex h-screen font-sans bg-gray-50 overflow-hidden">
        <aside
          className={`flex flex-col bg-white text-black border-r border-gray-200 transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-20"
          } flex-shrink-0`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
            <div className={`${sidebarOpen ? "text-black text-2xl font-bold tracking-wide" : "hidden"}`}>
              BlueCollorHub
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded hover:bg-gray-100 transition"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
          <nav className="flex-1 flex flex-col mt-4 gap-2 px-2 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === 'chat') {
                      setUnreadChatSenders(new Set());
                  }
                  router.push(`/dashboard/${item.key}`);
                }}
                className={`flex items-center justify-between gap-3 w-full text-left px-4 py-3 rounded-md transition ${
                  activeSection === item.key
                    ? "bg-black text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-3">
                    {item.icon}
                    <span className={`${sidebarOpen ? "inline" : "hidden"} whitespace-nowrap`}>{item.label}</span>
                </div>
                
                {/* Red button icon/badge for unseen chat messages from others */}
                {item.key === 'chat' && unreadChatSenders.size > 0 && sidebarOpen && (
                    <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                        {unreadChatSenders.size}
                    </span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md transition hover:bg-red-50 hover:text-red-600 ${
                sidebarOpen ? "text-black" : "text-gray-500 justify-center"
              }`}
              title="Logout"
            >
              <FaSignOutAlt size={18} />
              <span className={`${sidebarOpen ? "inline" : "hidden"} whitespace-nowrap`}>Logout</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between px-6 py-3 bg-white text-black shadow-sm flex-shrink-0 h-16 border-b">
            <div className="flex items-center gap-4 flex-1 min-w-0">
         {/* START REVISED LOGO CONTAINER */}
      {/* The logo should be hidden when the sidebar is open */}
      <div className={`flex-shrink-0 ${sidebarOpen ? 'hidden' : 'inline-block'}`}>
          <img
              src="/logo.png"
              alt="BlueCollorHub Logo"
              // The existing classes below might need slight adjustment, but we focus on the display class above
              className="h-18 w-auto object-contain md:hidden lg:inline" 
          />
      </div>
      {/* END REVISED LOGO CONTAINER */}  
              <div className="flex-1 max-w-3xl min-w-[400px]">
                <SearchBar />
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                <div className="relative" ref={notificationPanelRef}>
                    <button
                        onClick={() => {
                            if (!showNotificationPanel && unreadCount > 0) {
                                const unreadIds = notifications.filter(n => !n.read && n.type !== 'connect_request').map(n => n._id);
                                if (unreadIds.length > 0) markAsRead(unreadIds);
                            }
                            setShowNotificationPanel(!showNotificationPanel);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 transition relative text-gray-600 hover:text-black"
                        title={`${unreadCount} unread notifications`}
                        data-notification-bell
                    >
                        <FaBell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotificationPanel && (
                        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-center text-gray-800">Notifications</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-center p-6 text-sm">You have no notifications yet.</p>
                                ) : (
                                    notifications.map(notif => (
                                      <div
                                        key={notif._id}
                                        className={`p-3 flex items-start gap-3 transition duration-150 ease-in-out ${!notif.read ? 'bg-blue-50' : ''}`}
                                      >
                                        <Link href={`/dashboard/profile/${notif.senderId?._id}`} legacyBehavior><a onClick={() => setShowNotificationPanel(false)}><img src={notif.senderId?.profilePic || '/profile.jpg'} alt={notif.senderId?.name || 'User'} className="w-8 h-8 rounded-full flex-shrink-0 object-cover mt-1 bg-gray-200"/></a></Link>
                                        <div className="flex-1 text-sm">
                                            <Link href={getNotificationLink(notif)} legacyBehavior><a onClick={() => {setShowNotificationPanel(false); if (!notif.read && notif.type !== 'connect_request') markAsRead([notif._id]);}} className="hover:no-underline"><span className="font-semibold text-gray-900 hover:underline">{notif.senderId?.name || 'Someone'}</span>{' '}<span className="text-gray-700">{getNotificationMessage(notif)}</span></a></Link>
                                            <div className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            {notif.type === 'connect_request' && !notif.read && (
                                                <div className="mt-2 flex gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); handleAcceptRequest(notif.senderId._id, notif._id); }} className="px-3 py-1 text-xs font-medium rounded bg-green-500 text-white hover:bg-green-600 transition"> Accept </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeclineRequest(notif.senderId._id, notif._id); }} className="px-3 py-1 text-xs font-medium rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition"> Decline </button>
                                                </div>
                                            )}
                                        </div>
                                        {!notif.read && ( <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2 mr-1"></div> )}
                                      </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 border-t border-gray-200 text-center bg-gray-50">
                                    <Link href="/dashboard/notifications" legacyBehavior>
                                        <a onClick={() => setShowNotificationPanel(false)} className="text-sm text-blue-600 hover:underline font-medium">
                                            View all notifications
                                        </a>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              <select className="hidden md:block h-10 border border-gray-300 px-3 py-2 rounded-lg text-black flex-shrink-0 text-sm focus:outline-none focus:ring-1 focus:ring-black" aria-label="Select language">
                <option>EN</option>
              </select>
              <button
                onClick={() => router.push("/dashboard/createpost")}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-black bg-black text-white text-sm flex-shrink-0 hover:bg-white hover:text-black transition duration-200"
                title="Create a new post"
              >
                <FaPlus size={14} className="text-white group-hover:text-black transition" />
                <span className="text-white group-hover:text-black transition font-medium">Create</span>
              </button>
              <Link href="/dashboard/profile">
                <div className="relative w-9 h-9 rounded-full overflow-hidden cursor-pointer flex-shrink-0 bg-gray-200 ring-1 ring-gray-300 hover:ring-black transition" title="View Profile">
                  {user?.image ? (
                    <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </header>

          <div className="flex gap-2 md:gap-3 p-3 bg-gray-100 border-b border-gray-200 px-6 relative flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => { setShowAllCategories((prev) => !prev); setActiveCategory("All Categories"); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeCategory === "All Categories" ? "bg-black text-white" : "bg-white text-black border border-gray-200 hover:bg-gray-100"
                }`}
                aria-haspopup="true"
                aria-expanded={showAllCategories}
              >
                All Categories ▾
              </button>
              {showAllCategories && <CategoriesDropdown onSkillClick={handleCategorySearch} />}
            </div>
            <div className="flex-1 min-w-0 overflow-x-auto">
              <div className="flex gap-2 md:gap-3">
                {categories
                  .filter((cat) => cat !== "All Categories")
                  .map((cat) => (
                    <button key={cat} onClick={() => handleCategorySearch(cat)} className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
                        activeCategory === cat ? "bg-black text-white" : "bg-white text-black border border-gray-200 hover:bg-gray-100"
                      }`}
                    > {cat} </button>
                  ))}
              </div>
            </div>
            <style jsx>{` div::-webkit-scrollbar { display: none; } `}</style>
          </div>
         <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">{children}</main>
        </div>
        
      </div>
    </NotificationContext.Provider>
  );
}