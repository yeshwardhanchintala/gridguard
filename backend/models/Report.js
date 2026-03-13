import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  citizen:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  citizenName:     { type: String },
  transformer:     { type: mongoose.Schema.Types.ObjectId, ref: "Transformer" },
  transformerName: { type: String },
  ward:            { type: String },
  lat:             { type: Number, required: true },
  lng:             { type: Number, required: true },
  severity:        { type: String, enum: ["minor","moderate","critical"], required: true },
  photoUrl:        { type: String, default: "" },
  status: {
    type: String,
    enum: ["received","dispatched","in_progress","resolved"],
    default: "received"
  },
  assignedOfficer:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  assignedOfficerName:  { type: String, default: "" },
  estimatedRestoration: { type: Date, default: null },
  corroborations:       { type: Number, default: 1 },
  isDuplicate:          { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
