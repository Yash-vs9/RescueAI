import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import app from "./server.js";
import User from "./model/User.js";
import Notification from "./model/Notification.js";

const server = http.createServer(app);

const io = new Server(server, {
  transports: ["websocket", "polling"]
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.query.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    socket.user = user;
    next();
  } catch {
    next(new Error("Auth failed"));
  }
});

io.on("connection", async (socket) => {
  socket.join(`user:${socket.user._id}`);

  if (socket.user.role === "donor") {
    const pending = await Notification.find({
      donor: socket.user._id,
      isDelivered: false
    });

    for (let n of pending) {
      socket.emit("blood_request", n);
      n.isDelivered = true;
      await n.save();
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Socket server running on ${PORT}`)
);
