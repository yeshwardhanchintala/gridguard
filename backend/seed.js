import "dotenv/config";
import mongoose      from "mongoose";
import User          from "./models/User.js";
import Transformer   from "./models/Transformer.js";

const TRANSFORMERS = [
  { code:"T001", name:"Ameerpet Substation",   ward:"Ameerpet",     discom:"TSSPDCL", lat:17.4374, lng:78.4487 },
  { code:"T002", name:"Kukatpally Grid",        ward:"Kukatpally",   discom:"TSSPDCL", lat:17.4849, lng:78.4138 },
  { code:"T003", name:"LB Nagar Junction",      ward:"LB Nagar",     discom:"TSSPDCL", lat:17.3467, lng:78.5523 },
  { code:"T004", name:"Madhapur IT Corridor",   ward:"Madhapur",     discom:"TSSPDCL", lat:17.4478, lng:78.3924 },
  { code:"T005", name:"Secunderabad Station",   ward:"Secunderabad", discom:"TSNPDCL", lat:17.4399, lng:78.4983 },
  { code:"T006", name:"Begumpet Main",          ward:"Begumpet",     discom:"TSSPDCL", lat:17.4433, lng:78.4672 },
];

const USERS = [
  { name:"Demo Citizen",  email:"citizen@gridguard.demo",  password:"Demo@1234", role:"citizen",  ward:"Ameerpet" },
  { name:"Demo Officer",  email:"officer@gridguard.demo",  password:"Demo@1234", role:"officer",  ward:"Ameerpet" },
  { name:"Demo Manager",  email:"manager@gridguard.demo",  password:"Demo@1234", role:"manager",  ward:"Hyderabad" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  // Transformers
  console.log("Seeding transformers...");
  for (const t of TRANSFORMERS) {
    await Transformer.findOneAndUpdate({ code: t.code }, t, { upsert: true, new: true });
    console.log(`  ✓ ${t.name}`);
  }

  // Users
  console.log("\nSeeding demo users...");
  for (const u of USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`  ⚠ ${u.email} already exists — skipping`);
      continue;
    }
    await User.create(u);
    console.log(`  ✓ ${u.name} (${u.role}) — password: ${u.password}`);
  }

  console.log("\n✅ Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  citizen@gridguard.demo  / Demo@1234");
  console.log("  officer@gridguard.demo  / Demo@1234");
  console.log("  manager@gridguard.demo  / Demo@1234");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
