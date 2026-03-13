import { Router } from "express";
import cloudinary from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Report from "../models/Report.js";
import Transformer from "../models/Transformer.js";
import auth from "../middleware/auth.js";

const router = Router();

// ── Cloudinary upload setup ────────────────────────────────────
cloudinary.v2.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: { folder: "gridguard", allowed_formats: ["jpg","jpeg","png","webp"], transformation: [{ width: 800, crop: "limit" }] },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Haversine ──────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Inject io instance
export function setIo(ioInstance) { router.io = ioInstance; }

// ── GET /api/reports ───────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    // Citizens only see their own reports
    if (req.user.role === "citizen") filter.citizen = req.user._id;
    // Officers only see assigned reports
    if (req.user.role === "officer") filter.assignedOfficer = req.user._id;

    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/reports ──────────────────────────────────────────
router.post("/", auth, upload.single("photo"), async (req, res) => {
  try {
    const { lat, lng, severity, transformerId, transformerName, ward } = req.body;
    if (!lat || !lng || !severity)
      return res.status(400).json({ error: "lat, lng, severity required" });

    // Duplicate check — find open report within 50m in last 4 hours
    const since = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const recentReports = await Report.find({
      status: { $ne: "resolved" },
      createdAt: { $gte: since }
    });

    let existingReport = null;
    for (const r of recentReports) {
      if (haversine(parseFloat(lat), parseFloat(lng), r.lat, r.lng) <= 50) {
        existingReport = r;
        break;
      }
    }

    if (existingReport) {
      await Report.findByIdAndUpdate(existingReport._id, { $inc: { corroborations: 1 } });
      return res.json({
        isDuplicate: true,
        existingReportId: existingReport._id,
        message: "Merged with existing nearby report"
      });
    }

    const report = await Report.create({
      citizen:         req.user._id,
      citizenName:     req.user.name,
      transformer:     transformerId || null,
      transformerName: transformerName || "Unknown Transformer",
      ward:            ward || "Hyderabad",
      lat:             parseFloat(lat),
      lng:             parseFloat(lng),
      severity,
      photoUrl:        req.file?.path || "",
      isDuplicate:     false,
    });

    // Emit to all connected ops managers
    router.io?.emit("report:new", report);

    res.status(201).json({ report, isDuplicate: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PATCH /api/reports/:id/status ─────────────────────────────
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (!["officer","manager"].includes(req.user.role))
      return res.status(403).json({ error: "Not authorized" });

    const { status, assignedOfficer, assignedOfficerName, estimatedRestoration } = req.body;
    const allowed = ["received","dispatched","in_progress","resolved"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const update = {
      status,
      ...(assignedOfficer     && { assignedOfficer, assignedOfficerName }),
      ...(estimatedRestoration && { estimatedRestoration: new Date(estimatedRestoration) }),
    };

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Emit to citizen and ops dashboard
    router.io?.emit("report:updated", report);

    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/transformers/nearest ─────────────────────
router.get("/transformers/nearest", auth, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

    const transformers = await Transformer.find();
    let nearest = null, minDist = Infinity;
    for (const t of transformers) {
      const d = haversine(parseFloat(lat), parseFloat(lng), t.lat, t.lng);
      if (d < minDist) { minDist = d; nearest = { ...t.toObject(), distanceM: Math.round(d) }; }
    }
    res.json({ transformer: nearest });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
