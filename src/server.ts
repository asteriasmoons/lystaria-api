import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import summaryRoute from "./routes/summary";
import recsRoute from "./routes/recs";
import journalRoutes from "./routes/journal";
import astrologyRoutes from "./routes/astrology";
import sharedEventsRouter from "./routes/shared-events-routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("MongoDB Atlas connected");

    app.listen(PORT, () => {
      console.log(`📚 Lystaria Books API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
