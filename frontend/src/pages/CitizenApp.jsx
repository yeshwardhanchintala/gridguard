import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Camera, AlertTriangle, CheckCircle, RefreshCw, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api.js";
import { getNearestTransformer, TRANSFORMERS } from "../utils/geo.js";
import socket from "../utils/socket.js";
import Navbar from "../components/Navbar.jsx";
import StatusStepper from "../components/StatusStepper.jsx";

// Map icons
const makeIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30],
});
const RED_ICON  = makeIcon("red");
const BLUE_ICON = makeIcon("blue");

function MapClickHandler({ onPinMove }) {
  useMapEvents({ click: e => onPinMove([e.latlng.lat, e.latlng.lng]) });
  return null;
}

const SEVERITY_OPTIONS = [
  { val:"minor",    emoji:"🟡", label:"Flickering",     desc:"Lights flickering / partial power" },
  { val:"moderate", emoji:"🟠", label:"Full Outage",    desc:"No power in the area" },
  { val:"critical", emoji:"🔴", label:"Visible Damage", desc:"Smoke, fire or explosion" },
];

export default function CitizenApp() {
  const [tab,          setTab]          = useState("report");
  const [position,     setPosition]     = useState(null);
  const [nearest,      setNearest]      = useState(null);
  const [severity,     setSeverity]     = useState("");
  const [photo,        setPhoto]        = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [gpsLoading,   setGpsLoading]   = useState(false);
  const [myReports,    setMyReports]    = useState([]);
  const [reportsLoading,setReportsLoading] = useState(false);
  const fileRef = useRef();

  // Load my reports
  async function loadReports() {
    setReportsLoading(true);
    try {
      const { data } = await api.get("/api/reports");
      setMyReports(data.reports);
    } catch { toast.error("Failed to load reports"); }
    setReportsLoading(false);
  }

  useEffect(() => {
    loadReports();
    // Real-time: when ops updates a report, refresh
    socket.on("report:updated", (updated) => {
      setMyReports(prev => prev.map(r => r._id === updated._id ? updated : r));
      toast.success(`Report ${updated._id.slice(-4)} → ${updated.status.replace("_"," ")}`);
    });
    return () => socket.off("report:updated");
  }, []);

  function getGPS() {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition([lat, lng]);
        setNearest(getNearestTransformer(lat, lng));
        setGpsLoading(false);
      },
      () => {
        // Fallback to Ameerpet
        setPosition([17.4374, 78.4487]);
        setNearest(TRANSFORMERS[0]);
        setGpsLoading(false);
        toast("Using default location — GPS unavailable", { icon:"📍" });
      }
    );
  }

  function handlePinMove(coords) {
    setPosition(coords);
    setNearest(getNearestTransformer(coords[0], coords[1]));
  }

  function handlePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("Photo must be under 10MB"); return; }
    setPhoto(f); setPreview(URL.createObjectURL(f));
  }

  async function submitReport() {
    if (!nearest || !severity) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("lat",             position[0]);
      form.append("lng",             position[1]);
      form.append("severity",        severity);
      form.append("transformerName", nearest.name);
      form.append("ward",            nearest.ward);
      if (photo) form.append("photo", photo);

      const { data } = await api.post("/api/reports", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (data.isDuplicate) {
        toast("Your report was merged with a nearby existing report.", { icon: "🔀" });
      } else {
        toast.success("Report submitted! We'll track it for you.");
        setMyReports(prev => [data.report, ...prev]);
      }

      // Reset form
      setSeverity(""); setPhoto(null); setPreview(null); setPosition(null); setNearest(null);
      setTab("track");
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed");
    }
    setSubmitting(false);
  }

  const canSubmit = nearest && severity && !submitting;

  return (
    <div className="min-h-screen bg-g-950">
      <Navbar title="Citizen Portal" />

      {/* Tab bar */}
      <div className="flex border-b border-g-700 bg-g-900">
        {[
          { key:"report", icon:<Zap size={14}/>,         label:"Report Failure" },
          { key:"track",  icon:<RefreshCw size={14}/>,   label:`My Reports (${myReports.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
              tab === t.key
                ? "text-g-blue border-b-2 border-g-blue bg-blue-950/20"
                : "text-slate-500 hover:text-slate-300"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto p-4 pb-8 space-y-4">

        {/* ── REPORT TAB ── */}
        {tab === "report" && (
          <>
            {/* Step 1 — Location */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-g-700">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${position ? "bg-emerald-600 text-white" : "bg-g-600 text-slate-300"}`}>
                  {position ? "✓" : "1"}
                </span>
                <span className="font-semibold text-white text-sm">Locate the Transformer</span>
              </div>
              <div className="p-4 space-y-3">
                <button onClick={getGPS} disabled={gpsLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  <MapPin size={15} />
                  {gpsLoading ? "Getting location…" : "Use My GPS Location"}
                </button>

                {position && (
                  <div className="rounded-xl overflow-hidden border border-g-600" style={{ height: 200 }}>
                    <MapContainer center={position} zoom={15} style={{ height:"100%", width:"100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {TRANSFORMERS.map(t => (
                        <Marker key={t.code} position={[t.lat, t.lng]} icon={BLUE_ICON}>
                          <Popup className="text-xs">{t.name}<br/>{t.ward}</Popup>
                        </Marker>
                      ))}
                      <Marker position={position} icon={RED_ICON} />
                      <MapClickHandler onPinMove={handlePinMove} />
                    </MapContainer>
                  </div>
                )}

                {nearest && (
                  <div className="bg-blue-950/60 border border-blue-800 rounded-xl p-3">
                    <p className="text-blue-400 text-xs font-semibold mb-0.5">🔌 Auto-detected Transformer</p>
                    <p className="text-white font-bold text-sm">{nearest.name}</p>
                    <p className="text-slate-400 text-xs">{nearest.ward} · {nearest.distanceM}m away · {nearest.discom}</p>
                  </div>
                )}

                {!position && (
                  <p className="text-slate-600 text-xs text-center">
                    Tap GPS button, or tap anywhere on the map to pin your location
                  </p>
                )}
              </div>
            </div>

            {/* Step 2 — Severity */}
            {nearest && (
              <div className="glass rounded-2xl overflow-hidden animate-fade-up">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-g-700">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${severity ? "bg-emerald-600 text-white" : "bg-g-600 text-slate-300"}`}>
                    {severity ? "✓" : "2"}
                  </span>
                  <span className="font-semibold text-white text-sm">Select Severity</span>
                </div>
                <div className="p-4 space-y-2">
                  {SEVERITY_OPTIONS.map(s => (
                    <button key={s.val} onClick={() => setSeverity(s.val)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                        severity === s.val
                          ? "border-g-blue bg-blue-950/40"
                          : "border-g-700 hover:border-g-500 bg-g-800/50"
                      }`}>
                      <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{s.label}</p>
                        <p className="text-slate-400 text-xs">{s.desc}</p>
                      </div>
                      {severity === s.val && <CheckCircle size={16} className="ml-auto text-g-blue flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Photo */}
            {severity && (
              <div className="glass rounded-2xl overflow-hidden animate-fade-up">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-g-700">
                  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 bg-g-600 text-slate-300">3</span>
                  <span className="font-semibold text-white text-sm">Attach Photo</span>
                  <span className="text-slate-500 text-xs ml-auto">Optional</span>
                </div>
                <div className="p-4">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  {preview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={preview} className="w-full h-44 object-cover" alt="preview" />
                      <button onClick={() => { setPhoto(null); setPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold transition">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current.click()}
                      className="w-full border-2 border-dashed border-g-600 hover:border-g-blue rounded-xl py-10 flex flex-col items-center gap-2 text-slate-500 hover:text-g-blue transition">
                      <Camera size={24} />
                      <span className="text-sm">Tap to attach photo evidence</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            {canSubmit && (
              <button onClick={submitReport}
                className="w-full py-4 rounded-2xl font-black text-lg text-white transition animate-fade-up shadow-glow-red
                           bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 disabled:opacity-60"
                disabled={submitting}>
                {submitting ? "Submitting…" : "🚨 Report Transformer Failure"}
              </button>
            )}
          </>
        )}

        {/* ── TRACK TAB ── */}
        {tab === "track" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">Your reports update in real-time</p>
              <button onClick={loadReports} disabled={reportsLoading}
                className="text-g-blue text-xs flex items-center gap-1 hover:text-g-glow transition disabled:opacity-50">
                <RefreshCw size={12} className={reportsLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {reportsLoading && (
              <div className="text-center py-8 text-slate-500">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Loading…
              </div>
            )}

            {!reportsLoading && myReports.length === 0 && (
              <div className="glass rounded-2xl py-16 text-center">
                <AlertTriangle size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No reports yet</p>
                <p className="text-slate-600 text-sm mt-1">Submit a failure report to start tracking</p>
              </div>
            )}

            {myReports.map(r => (
              <div key={r._id} className="glass rounded-2xl overflow-hidden animate-fade-up">
                <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-bold text-sm">{r.transformerName}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{r.ward} · #{r._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <span className={`badge badge-${r.severity} flex-shrink-0`}>{r.severity}</span>
                </div>

                <div className="px-4 pb-4">
                  <StatusStepper status={r.status} />

                  {r.estimatedRestoration && (
                    <p className="text-blue-400 text-xs text-center mt-3">
                      ⏱ ERT: {new Date(r.estimatedRestoration).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                    </p>
                  )}

                  {r.assignedOfficerName && (
                    <p className="text-slate-400 text-xs text-center mt-1">
                      Officer: <span className="text-white">{r.assignedOfficerName}</span>
                    </p>
                  )}
                </div>

                {r.photoUrl && (
                  <img src={r.photoUrl} className="w-full h-32 object-cover" alt="evidence" />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
