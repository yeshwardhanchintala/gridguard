import { Router } from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

// GET /api/users/officers — manager uses this to assign jobs
router.get("/officers", auth, async (req, res) => {
  if (req.user.role !== "manager")
    return res.status(403).json({ error: "Managers only" });
  try {
    const officers = await User.find({ role: "officer" }).select("-password");
    res.json({ officers });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
