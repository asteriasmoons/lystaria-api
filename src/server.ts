import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import summaryRoute from "./routes/summary";
import recsRoute from "./routes/recs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (optional but useful)
app.get("/", (req, res) => {
  res.json({ status: "Lystaria Books API running" });
});

// Routes
app.use("/api/books/summary", summaryRoute);
app.use("/api/books/recs", recsRoute);

// Start server
app.listen(PORT, () => {
  console.log(`📚 Lystaria Books API running on port ${PORT}`);
});
