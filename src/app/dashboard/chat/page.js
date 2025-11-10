"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import ChatSupport from "@/app/components/ChatSupport";
import { FaUserCircle } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { useNotifications } from "@/app/dashboard/layout"; // context

function ChatContent() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const searchParams = useSearchParams();
  const { clearUnreadSender } = useNotifications();

  useEffect(() => {
    const fetchContactsAndSelectUser = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const { data: fetchedContacts } = await axios.get("/api/user/connections");
          const contactsList = fetchedContacts || [];

          const userIdFromUrl = searchParams.get("userId");

          if (userIdFromUrl) {
            let userToSelect = contactsList.find((c) => c._id === userIdFromUrl);

            if (userToSelect) {
              setContacts(contactsList);
              setSelectedUser(userToSelect);
              clearUnreadSender(userIdFromUrl);
            } else {
              try {
                const { data: newUser } = await axios.get(`/api/user/${userIdFromUrl}`);
                if (newUser) {
                  const newContactsList = [newUser, ...contactsList];
                  setContacts(newContactsList);
                  setSelectedUser(newUser);
                  clearUnreadSender(userIdFromUrl);
                } else {
                  setContacts(contactsList);
                }
              } catch (err) {
                console.error("Failed to fetch user-to-chat", err);
                setContacts(contactsList);
              }
            }
          } else {
            setContacts(contactsList);
          }
        } catch (error) {
          console.error("Failed to fetch contacts", error);
          setContacts([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchContactsAndSelectUser();
  }, [session?.user?.id, searchParams]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    clearUnreadSender(user._id);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading conversations...</div>;
  }

  return (
    <div className="flex h-full max-h-[calc(100vh-128px)]">
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Conversations</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {contacts.length === 0 ? (
            <p className="p-4 text-gray-500">No contacts found. Follow users to chat.</p>
          ) : (
            contacts.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 ${
                  selectedUser?._id === user._id ? "bg-gray-100" : ""
                }`}
              >
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-10 h-10 text-gray-400" />
                )}
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{user.title || "User"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="w-2/3">
        {selectedUser ? (
          <ChatSupport
            key={selectedUser._id}
            senderId={session?.user?.id}
            receiverId={selectedUser._id}
            receiverName={selectedUser.name}
            receiverPic={selectedUser.profilePic}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
