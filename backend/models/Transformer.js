import mongoose from "mongoose";

const transformerSchema = new mongoose.Schema({
  code:   { type: String, unique: true },
  name:   { type: String, required: true },
  ward:   { type: String },
  discom: { type: String },
  lat:    { type: Number, required: true },
  lng:    { type: Number, required: true },
});

export default mongoose.model("Transformer", transformerSchema);
