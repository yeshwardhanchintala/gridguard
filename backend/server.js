import "dotenv/config";
import express         from "express";
import { createServer } from "http";
import { Server }      from "socket.io";
import cors            from "cors";
import mongoose        from "mongoose";

import authRoutes      from "./routes/auth.js";
import reportRoutes, { setIo } from "./routes/reports.js";
import userRoutes      from "./routes/users.js";

const app    = express();
const server = createServer(app);

// ── Socket.io setup ────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "*", methods: ["GET","POST","PATCH"] }
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`❌ Client disconnected: ${socket.id}`));
});

setIo(io);   // Inject into reports router

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users",   userRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok", app: "GridGuard API v2" }));

// ── MongoDB connection ─────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => console.log(`⚡ GridGuard API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
