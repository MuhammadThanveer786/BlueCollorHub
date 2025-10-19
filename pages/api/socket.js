import { Server } from "socket.io";

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Listen for sending messages
      socket.on("send_message", (message) => {
        io.emit("receive_message", message); // broadcast to everyone
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
