import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import summaryRoute from "./routes/summary";
import recsRoute from "./routes/recs";
import journalRoutes from "./routes/journal";
import astrologyRoutes from "./routes/astrology";
import sharedEventsRouter from "./routes/shared-events-routes";
import { createBuddyRouter } from "./routes/buddy-routes";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io — attached to the same HTTP server as Express
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // tighten this to your app's origin if needed
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Lystaria Books API running" });
});

// Routes
app.use("/api/books/summary", summaryRoute);
app.use("/api/books/recs", recsRoute);
app.use("/api/journal", journalRoutes);
app.use("/api/astrology", astrologyRoutes);
app.use("/api/shared-events", sharedEventsRouter);
app.use("/api/buddy", createBuddyRouter(io));

// Socket.io — buddy reading rooms
io.on("connection", (socket) => {
  // Client joins a group room to receive real-time events for that group
  socket.on("buddy:join_room", (groupId: string) => {
    socket.join(groupId);
  });

  // Client leaves a group room (e.g. navigating away from the chat)
  socket.on("buddy:leave_room", (groupId: string) => {
    socket.leave(groupId);
  });

  socket.on("disconnect", () => {});
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("MongoDB Atlas connected");

    httpServer.listen(PORT, () => {
      console.log(`📚 Lystaria Books API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
