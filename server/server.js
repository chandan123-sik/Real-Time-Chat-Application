import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ✅ CORS setup (Render + Vercel frontend + local)
const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-app-frontent-rho.vercel.app", // deployed frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ Socket.io setup (important for Render HTTPS)
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ✅ Middleware
app.use(express.json({ limit: "4mb" }));

// ✅ Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ✅ Connect DB
await connectDB();

// ✅ Always listen (Render handles production automatically)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
