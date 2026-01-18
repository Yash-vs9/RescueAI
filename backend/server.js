// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./model/User.js";
import Notification from "./model/Notification.js"; // ✅ Add this

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bloodRequestRoutes from "./routes/bloodRequestRoutes.js";


dotenv.config();
connectDB();

const app = express();

// ------------------ MIDDLEWARES ------------------
app.use(cors());
app.use(express.json());

// ------------------ ATTACH IO TO REQ ------------------
// This allows controllers to emit events
let io; // declare globally for later use

app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(cors({
  origin: "http://localhost:5173", // Replace with your frontend URL (e.g., 3000 or 5173)
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// ------------------ ROUTES ------------------
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);

// ------------------ TEST ROUTE ------------------
app.get("/", (req, res) => {
  res.send("GDC Backend + MongoDB running");
});

// ------------------ CREATE HTTP SERVER ------------------
const server = http.createServer(app);

// ------------------ ATTACH SOCKET.IO ------------------
// server.js
io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Use your specific frontend URL
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Allow fallback to polling if WS fails
});

// ------------------ SOCKET AUTHENTICATION ------------------
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("User not found"));

    socket.user = user; // attach user info to socket
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// ------------------ SOCKET CONNECTION ------------------
io.on("connection", async (socket) => {
  const user = socket.user;

  // Force .toString() to ensure the room name is a valid string
  const userIdStr = user._id.toString(); 
  socket.join(`user:${userIdStr}`);
  socket.join(`role:${user.role}`);

  console.log(`✅ Socket joined room: user:${userIdStr}`);

  // 2️⃣ Send unread notifications if donor
  if (user.role === "donor") {
    const pendingNotifications = await Notification.find({
      donor: user._id,
      isDelivered: false
    });

    for (let n of pendingNotifications) {
      socket.emit("blood_request", {
        requestId: n.bloodRequest,
        hospital: n.hospital,
        bloodGroup: n.bloodGroup,
        units: n.units,
        urgency: n.urgency
      });

      // Mark as delivered
      n.isDelivered = true;
      await n.save();
    }
  }

  // 3️⃣ Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id} | User: ${user.name}`);
  });
});


// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});