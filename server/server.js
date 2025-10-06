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

// ✅ Setup Socket.IO with proper CORS for Vercel
export const io = new Server(server, {
  cors: {
    origin: ["https://your-frontend.vercel.app"], // <-- change this
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Store online users
export const userSocketMap = {}; // { userId: socketId }

// ✅ Socket connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ✅ Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(
  cors({
    origin: "https://your-frontend.vercel.app", // <-- same domain
    credentials: true,
  })
);

// ✅ Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

await connectDB();

// ✅ Local development mode
if (process.env.NODE_ENV !== "production") {
  server.listen(5000, () => {
    console.log("Server is running on port 5000");
  });
}

// ✅ Export server for Vercel
export default server;
