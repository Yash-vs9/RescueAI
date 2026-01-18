import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import User from "./model/User.js";
import Notification from "./model/Notification.js";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bloodRequestRoutes from "./routes/bloodRequestRoutes.js";

const app = express();

/* =======================
   CORS CONFIG (FIXED)
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://rescue-sigma.vercel.app"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

/* =======================
   DATABASE
======================= */
connectDB();

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json());

/* =======================
   HTTP SERVER & SOCKET.IO
======================= */
const server = http.createServer(app);

const io = new Server(server, {
  transports: ["websocket", "polling"]
});

// Attach IO to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);

app.get("/", (req, res) => {
  res.send("RescueBlood API is live");
});

/* =======================
   SOCKET AUTH
======================= */
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.query.token;

    if (!token) return next(new Error("Auth failed"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

/* =======================
   SOCKET EVENTS
======================= */
io.on("connection", async (socket) => {
  const userIdStr = socket.user._id.toString();

  socket.join(`user:${userIdStr}`);
  socket.join(`role:${socket.user.role}`);

  console.log(
    `📡 Connected: ${socket.user.name} in room user:${userIdStr}`
  );

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

  socket.on("disconnect", () => {
    console.log("🔌 Disconnected:", socket.user.name);
  });
});

/* =======================
   EXPORT FOR VERCEL
======================= */
export default app;

/* =======================
   START SERVER (RENDER)
======================= */
if (process.env.RENDER) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
