"use client";

import { useState, useEffect, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { FiPaperclip, FiSend } from "react-icons/fi";
import { uploadFiles } from "../../../lib/uploadthingClient";
 // UploadThing helper
import { io } from "socket.io-client";

let socket;

export default function ChatSupport({
  senderId,
  receiverId,
  receiverName,
  receiverPic,
  sidebarOpen = true,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [leftOffset, setLeftOffset] = useState(sidebarOpen ? 256 : 80);
  const messagesEndRef = useRef(null);

  // Adjust sidebar offset
  useEffect(() => {
    setLeftOffset(sidebarOpen ? 256 : 80);
  }, [sidebarOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Socket.IO
  useEffect(() => {
    fetch("/api/socket"); // ensure server socket is created
    socket = io();

    // Listen for incoming messages
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() && !mediaFile) return;

    const newMessage = {
      _id: Date.now(),
      senderId,
      receiverId,
      senderName: "You",
      content: input || "",
      media: mediaFile || null,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMessage]);

    // Emit via socket
    socket.emit("send_message", newMessage);

    // Optionally save to database
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }

    setInput("");
    setMediaFile(null);
  };

  // Handle file uploads
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploaded = await uploadFiles({ endpoint: "chatMedia", files: [file] });
    if (uploaded.length > 0) {
      setMediaFile(uploaded[0].fileUrl);
    }
  };

  return (
    <div
      className="fixed top-0 bottom-0 z-50 flex flex-col bg-gray-100 shadow-lg transition-all duration-300"
      style={{
        left: `${leftOffset}px`,
        width: `calc(100vw - ${leftOffset}px)`,
        height: "100vh",
      }}
    >
      {/* Header */}
      <div className="flex-none flex items-center gap-4 p-4 bg-indigo-600 text-white shadow-md rounded-b-xl">
        {receiverPic ? (
          <img
            src={receiverPic}
            alt={receiverName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white"
          />
        ) : (
          <FaUserCircle className="w-12 h-12 text-white" />
        )}
        <h2 className="text-lg font-semibold">{receiverName}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          const isSender = msg.senderId === senderId;
          return (
            <div
              key={msg._id}
              className={`flex items-start max-w-[70%] ${
                isSender ? "ml-auto justify-end" : "justify-start"
              }`}
            >
              {!isSender && (
                receiverPic ? (
                  <img
                    src={receiverPic}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full mr-2 object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-8 h-8 text-gray-400 mr-2" />
                )
              )}
              <div
                className={`p-3 rounded-2xl break-words shadow-sm ${
                  isSender
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                {!isSender && (
                  <strong className="block mb-1 text-sm text-gray-700">
                    {msg.senderName || "User"}
                  </strong>
                )}
                {msg.content && <span className="text-gray-800">{msg.content}</span>}
                {msg.media && (
                  <div className="mt-2">
                    {msg.media.endsWith(".mp4") || msg.media.endsWith(".mov") ? (
                      <video controls className="max-w-xs rounded-lg">
                        <source src={msg.media} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={msg.media} alt="media" className="max-w-xs rounded-lg" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-none flex items-center gap-2 p-4 bg-white border-t shadow-inner rounded-t-xl">
        <label className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer">
          <FiPaperclip className="w-6 h-6 text-gray-600" />
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition flex items-center justify-center"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
