import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io";

// create express app and http server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server-
export const io = new Server(server,{
    cors:{origin:"*"}
})

// store online users-
export const userSocketMap = {}; // {userId:socketId}

// socket.io connection handler-
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User connected",userId);

    if(userId){
        userSocketMap[userId] = socket.id;
    }

    // Emit online users to all connected client-
    io.emit("getonlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getonlineUsers",Object.keys(userSocketMap))
    })
})




// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

// Routes setup
app.use("/api/status",(req,res)=> res.send("server is live"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);

await connectDB();

server.listen(5000,()=>{
    console.log("Server is running on port no: is 5000" );
})
