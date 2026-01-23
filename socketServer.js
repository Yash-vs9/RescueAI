import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import app from "./server.js";
import User from "./model/User.js";
import Notification from "./model/Notification.js";
import Message from "./model/Message.js";
import Conversation from "./model/Conversation.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://rescueai-rust.vercel.app",
      "https://rescue-ai-theta.vercel.app",
      "https://rescue-sigma.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Attach io to the app so routes can access it
app.set('io', io);

// Socket authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    socket.user = user;
    next();
  } catch {
    next(new Error("Auth failed"));
  }
});

io.on("connection", async (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.user.role})`);

  // Join user-specific room
  socket.join(`user:${socket.user._id}`);

  // Handle existing notifications
  if (socket.user.role === "donor") {
    const pending = await Notification.find({
      donor: socket.user._id,
      isDelivered: false,
    });

    for (let n of pending) {
      socket.emit("blood_request", n);
      n.isDelivered = true;
      await n.save();
    }
  }

  // ========== CHAT FUNCTIONALITY ==========

  // Send a message
  socket.on("send_message", async (data) => {
    try {
      const { receiverId, message } = data;
      const senderId = socket.user._id;

      // Verify receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        socket.emit("error", { message: "Receiver not found" });
        return;
      }

      // Check role compatibility (prevent donor-to-donor chat)
      if (socket.user.role === "donor" && receiver.role === "donor") {
        socket.emit("error", { message: "Donors cannot chat with each other" });
        return;
      }

      const conversationId = Conversation.generateConversationId(
        senderId,
        receiverId
      );

      // Create message
      const newMessage = await Message.create({
        conversationId,
        sender: senderId,
        receiver: receiverId,
        message: message.trim(),
      });

      await newMessage.populate("sender", "name role");
      await newMessage.populate("receiver", "name role");

      // Update or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          unreadCount: {
            [senderId.toString()]: 0,
            [receiverId.toString()]: 1,
          },
        });
      } else {
        const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
        conversation.lastMessage = message.trim();
        conversation.lastMessageTime = new Date();
        conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
        await conversation.save();
      }

      // Emit to sender
      socket.emit("message_sent", newMessage);

      // Emit to receiver
      io.to(`user:${receiverId}`).emit("receive_message", newMessage);

      // Send notification about new message
      io.to(`user:${receiverId}`).emit("new_message_notification", {
        from: socket.user.name,
        fromId: senderId,
        message: message.trim(),
        conversationId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark messages as read
  socket.on("mark_as_read", async (data) => {
    try {
      const { otherUserId } = data;
      const userId = socket.user._id;

      const conversationId = Conversation.generateConversationId(
        userId,
        otherUserId
      );

      await Message.updateMany(
        {
          conversationId,
          receiver: userId,
          isRead: false,
        },
        { isRead: true }
      );

      await Conversation.updateOne(
        { participants: { $all: [userId, otherUserId] } },
        { [`unreadCount.${userId}`]: 0 }
      );

      // Notify the other user that messages were read
      io.to(`user:${otherUserId}`).emit("messages_read", {
        conversationId,
        readBy: userId,
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const { receiverId, isTyping } = data;
    io.to(`user:${receiverId}`).emit("user_typing", {
      userId: socket.user._id,
      userName: socket.user.name,
      isTyping,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.user.name}`);
  });
});

// Only start server if not on Vercel (Vercel uses serverless functions)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Socket server running on port ${PORT}`);
  });
}

export { server, io };