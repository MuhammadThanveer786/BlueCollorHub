// pages/api/socket.js
import { Server } from "socket.io";

// Optional: Store user-socket mapping (limited use in serverless)
const userSockets = {};

// Export a handler function for the API route
const SocketHandler = (req, res) => {
  // Check if Socket.IO server is already attached to the server instance
  if (res.socket.server.io) {
    console.log("Socket.IO server already running.");
  } else {
    console.log("*Creating Socket.IO server (Pages Router)*");
    // Create a new Socket.IO server and attach it to the HTTP server
    const io = new Server(res.socket.server, {
      // No 'path' needed if client connects to default '/socket.io'
      // path: '/api/socket', // Or use a custom path if needed and match on client
      cors: { // ✅ ADDED CORS Configuration
        origin: "http://localhost:3000", // Your frontend URL
        methods: ["GET", "POST"],
        credentials: true // Allow cookies/session info if needed
      }
    });

    // Handle new client connections
    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Listen for user registration
      socket.on('register_user', (userId) => {
        if (userId) {
          console.log(`Registering user ${userId} with socket ${socket.id}`);
          socket.join(userId); // Join room named after userId
          userSockets[userId] = socket.id; // Store mapping (optional)
        }
      });

      // Example: Listener for private messages (can be adapted/removed)
      socket.on("send_private_message", ({ recipientId, message }) => {
         if (recipientId && message) {
            console.log(`Attempting to send message to room ${recipientId}`);
            // Check if recipient is actually in the room (optional but good)
            const roomSockets = io.sockets.adapter.rooms.get(recipientId);
            if (roomSockets && roomSockets.size > 0) {
                io.to(recipientId).emit("receive_private_message", message);
                console.log(`Sent message to room ${recipientId}`);
            } else {
                 console.log(`Recipient ${recipientId} not currently connected.`);
                 // Optional: Handle offline message storage/delivery here
            }
         } else {
             console.log(`Recipient ID or message missing for private message.`);
         }
      });

      // Handle client disconnections
      socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
        // Clean up userSockets map
        for (const userId in userSockets) {
          if (userSockets[userId] === socket.id) {
            delete userSockets[userId];
            console.log(`Unregistered user ${userId}`);
            break;
          }
        }
      });

      // Handle server-side socket errors
      socket.on('error', (err) => {
        console.error("Socket error on server:", err);
      });
    });

    // Store the io instance on the server object so it's available next time
    res.socket.server.io = io;
  }

  // End the HTTP request, as Socket.IO handles the ongoing connection
  res.end();
};

export default SocketHandler;

// Optional: Helper function to get IO instance (still challenging across serverless functions)
// export const getIoInstance = () => res?.socket?.server?.io; // This won't work reliably outside this handler scope