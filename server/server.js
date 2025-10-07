
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

// ✅ CORS setup (allow both local and deployed frontend)
const allowedOrigins = [
  "http://localhost:5173", // local frontend
  "https://chat-app-frontent-rho.vercel.app" // ✅ your deployed frontend URL (Vercel)
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ✅ Middleware
app.use(express.json({ limit: "4mb" }));

// ✅ Routes
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ✅ Connect DB
await connectDB();

if (process.env.NODE_ENV !== "production") {
  server.listen(5000, () => {
    console.log("Server running on port 5000");
  });
}

// ✅ Export for Vercel
export default server;
