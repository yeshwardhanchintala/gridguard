# ⚡ GridGuard v2 — MongoDB Edition
**React + Vite + Tailwind · Node/Express · MongoDB Atlas · Socket.io · Cloudinary**

---

## Project Structure

```
gridguard2/
├── frontend/     ← React app  → deploy to Vercel
└── backend/      ← Express API → deploy to Render
```

---

## STEP 1 — MongoDB Atlas Setup (10 min)

1. Go to **https://cloud.mongodb.com** → Create free account
2. Create a FREE shared cluster (M0 tier) → choose **Mumbai (ap-south-1)** region
3. **Database Access** → Add new database user:
   - Username: `gridguard`
   - Password: (generate a strong one, copy it)
   - Role: **Atlas Admin**
4. **Network Access** → Add IP Address → **Allow access from anywhere** (0.0.0.0/0)
5. **Connect** → Drivers → copy the connection string:
   ```
   mongodb+srv://gridguard:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password, and add `/gridguard` before `?`:
   ```
   mongodb+srv://gridguard:YOURPASS@cluster0.xxxxx.mongodb.net/gridguard?retryWrites=true&w=majority
   ```

---

## STEP 2 — Cloudinary Setup (5 min)

1. Go to **https://cloudinary.com** → Free account
2. Dashboard → copy these 3 values:
   - Cloud name
   - API Key
   - API Secret

---

## STEP 3 — Backend Setup (Local)

```bash
cd gridguard2/backend
npm install
cp .env.example .env
```

Edit `.env` with your real values:
```
PORT=3001
MONGO_URI=mongodb+srv://gridguard:YOURPASS@cluster0.xxxxx.mongodb.net/gridguard?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_keep_it_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

Seed the database (creates 3 demo accounts + 6 transformers):
```bash
node seed.js
```

Expected output:
```
✅ Connected to MongoDB
Seeding transformers...
  ✓ Ameerpet Substation ... (x6)
Seeding demo users...
  ✓ Demo Citizen   (citizen)  — password: Demo@1234
  ✓ Demo Officer   (officer)  — password: Demo@1234
  ✓ Demo Manager   (manager)  — password: Demo@1234
✅ Seed complete!
```

Start backend:
```bash
npm run dev
# → ✅ MongoDB connected
# → ⚡ GridGuard API running on port 3001
```

---

## STEP 4 — Frontend Setup (Local)

```bash
cd gridguard2/frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:3001
```

Start frontend:
```bash
npm run dev
# → Local: http://localhost:5173
```

---

## STEP 5 — Test Full Demo Loop Locally

Open **3 browser windows:**

| Window | URL | Sign in as |
|--------|-----|-----------|
| 1 | localhost:5173 | citizen@gridguard.demo / Demo@1234 |
| 2 | localhost:5173 | manager@gridguard.demo / Demo@1234 |
| 3 | localhost:5173 | officer@gridguard.demo / Demo@1234 |

**Flow:**
1. Citizen → Report Transformer Failure → GPS pin → Critical → Submit
2. Manager → Red pin appears on map live → Assign to Officer → Dispatch
3. Officer → Job appears → Navigate → Mark Resolved
4. Citizen → Status updates to "Resolved" in real-time

If this works, you're ready to deploy.

---

## STEP 6 — Push to GitHub

```bash
cd gridguard2
git init
git add .
git commit -m "GridGuard v2 — MongoDB + Socket.io"
```

Go to **https://github.com/new** → create repo `gridguard2` → then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/gridguard2.git
git push -u origin main
```

---

## STEP 7 — Deploy Backend to Render

1. **https://render.com** → New → Web Service
2. Connect GitHub → select `gridguard2` repo
3. Root Directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Region: **Singapore**
7. Add Environment Variables (same as your `.env` but change FRONTEND_URL to placeholder):
   ```
   PORT                   = 3001
   MONGO_URI              = mongodb+srv://...
   JWT_SECRET             = your_secret
   CLOUDINARY_CLOUD_NAME  = your_name
   CLOUDINARY_API_KEY     = your_key
   CLOUDINARY_API_SECRET  = your_secret
   FRONTEND_URL           = https://gridguard2.vercel.app   ← update after next step
   ```
8. Deploy → wait ~3 min → copy URL: `https://gridguard-api-xxxx.onrender.com`
9. Test: open `https://gridguard-api-xxxx.onrender.com/health` → should return `{"status":"ok"}`

---

## STEP 8 — Deploy Frontend to Vercel

1. **https://vercel.com** → New Project → import `gridguard2`
2. Root Directory: `frontend`
3. Framework: **Vite**
4. Environment Variables:
   ```
   VITE_API_URL = https://gridguard-api-xxxx.onrender.com
   ```
5. Deploy → copy URL: `https://gridguard2.vercel.app`
6. Go back to **Render** → update `FRONTEND_URL` to this Vercel URL → Save (auto-redeploys)

---

## STEP 9 — Before the Demo (3 quick checks)

```bash
# 1. Wake up Render (does this 10 min before demo)
curl https://gridguard-api-xxxx.onrender.com/health

# 2. Re-run seed if you wiped the DB
node seed.js   # (backend folder, with .env set)

# 3. Open all 3 demo accounts in separate browser profiles
```

---

## Demo Flow Script (3.5 min)

### Screen 1 — Citizen (phone or laptop, 90 sec)
- Login → citizen@gridguard.demo / Demo@1234
- Tap **Report Transformer Failure**
- Tap **Use My GPS Location** → map pin drops, Ameerpet transformer auto-detected
- Select **Critical (🔴 Visible Damage)**
- Attach a photo (pre-prepare one)
- Tap **Report Transformer Failure** → confirmation toast

### Screen 2 — Manager (laptop, 60 sec)
- Login → manager@gridguard.demo / Demo@1234
- Red pin appears live on Hyderabad heatmap
- Click the pin → dispatch panel opens
- Select Demo Officer → set ERT → **Dispatch Officer**

### Screen 3 — Officer (second phone, 60 sec)
- Login → officer@gridguard.demo / Demo@1234
- Job card appears with photo + Navigate button
- Tap **Navigate to Transformer** → Google Maps opens
- Tap **Mark Resolved → Power Restored**
- Switch to Citizen window → status shows **Resolved ✓** in real-time

**← This is the wow moment judges remember.**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot connect to MongoDB" | Check MONGO_URI has `/gridguard?` not just `/?` |
| Photo upload fails | Check all 3 Cloudinary env vars are set in Render |
| CORS error on Vercel | Make sure FRONTEND_URL in Render = exact Vercel URL |
| Socket.io not updating live | Render free tier may sleep — hit /health first |
| Login says "Invalid credentials" | Run `node seed.js` again — DB may have been reset |
| Map not loading | The Leaflet CSS link in index.html must stay intact |
