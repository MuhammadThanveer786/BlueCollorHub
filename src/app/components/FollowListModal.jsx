"use client";

import Link from "next/link";
import { FaTimes, FaUserCircle } from "react-icons/fa";

export default function FollowListModal({ title, users, actionType, onAction, onClose }) {

  const handleActionClick = (e, userId) => {
    e.stopPropagation(); // Prevent modal from closing if clicking button
    onAction(userId); // Call the parent function (handleRemove or handleUnfollow)
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose} // Close modal on backdrop click
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent modal close on modal click
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users to display.</p>
          ) : (
            users.map(user => (
              <div key={user._id} className="flex items-center justify-between gap-3">
                <Link href={`/dashboard/profile/${user._id}`} legacyBehavior>
                  <a className="flex items-center gap-3 min-w-0" onClick={onClose}>
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                    ) : (
                      <FaUserCircle className="w-10 h-10 text-gray-400" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.title || "User"}</p>
                    </div>
                  </a>
                </Link>
                
                <button
                  onClick={(e) => handleActionClick(e, user._id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    actionType === 'remove' 
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {actionType === 'remove' ? 'Remove' : 'Unfollow'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}