import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Health check
app.get("/api/app/health", (req, res) => {
  res.json({ ok: true });
});

// Routes
app.use("/api/app/auth", authRouter);
app.use("/api/app/me", meRouter);

await connectDb();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
