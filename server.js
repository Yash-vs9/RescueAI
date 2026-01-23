import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bloodRequestRoutes from "./routes/bloodRequestRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import chatRoutes from "./routes/chat.js";

import dotenv from "dotenv";
dotenv.config(); // 👈 MUST be before using process.env

const app = express();

/* ====================== */

/* ======================
   ENV DETECTION
====================== */
const isVercel = !!process.env.VERCEL;

/* ======================
   CORS CONFIG
====================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://rescue-sigma.vercel.app",
  "https://rescueai-rust.vercel.app",
  "https://rescue-ai-theta.vercel.app"
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
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // ✅ CRITICAL: terminate preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());

/* ======================
   ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("RescueBlood API is live");
});

/* ======================
   DATABASE INIT
====================== */
// ✅ On Vercel: connect once per function lifecycle
// ✅ On Render/local: normal startup
connectDB();

/* ======================
   EXPORT FOR VERCEL & SOCKET
====================== */
export default app;