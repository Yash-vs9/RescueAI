// donorTest.js
import { io } from "socket.io-client";

// Replace with donor JWT from login step
const DONOR_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NmI1NWY2YzVlMDc4MjRkNjk3YzMwOCIsImlhdCI6MTc2ODY0MjEzOCwiZXhwIjoxNzY4NzI4NTM4fQ.ty2OSpAySf2O6ozJVKlUAAOVaOTx7u1c0FFcHgDJsKo";

const socket = io("http://localhost:3000", {
  auth: { token: DONOR_JWT }
});

// Donor connected
socket.on("connect", () => {
  console.log("✅ Donor connected via WebSocket", socket.id);
});

// Listen for blood request notifications
socket.on("blood_request", (data) => {
  console.log("🔔 New Blood Request Received:", data);
});

// Handle disconnect
socket.on("disconnect", () => {
  console.log("Donor disconnected");
});
