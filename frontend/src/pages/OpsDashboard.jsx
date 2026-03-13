import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { Filter, X, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api.js";
import socket from "../utils/socket.js";
import Navbar from "../components/Navbar.jsx";

const makeIcon = c => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${c}.png`,
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [22,36], iconAnchor: [11,36], popupAnchor: [1,-30],
});
const ICONS = { critical: makeIcon("red"), moderate: makeIcon("orange"), minor: makeIcon("yellow"), resolved: makeIcon("green") };
const CIRCLE_COLOR = { critical:"#ef4444", moderate:"#f97316", minor:"#94a3b8", resolved:"#22c55e" };

const FILTERS = ["all","received","dispatched","in_progress","resolved"];

export default function OpsDashboard() {
  const [reports,   setReports]   = useState([]);
  const [officers,  setOfficers]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [assignTo,  setAssignTo]  = useState("");
  const [ert,       setErt]       = useState("");
  const [saving,    setSaving]    = useState(false);

  async function load() {
    const [rRes, oRes] = await Promise.all([
      api.get("/api/reports"),
      api.get("/api/users/officers"),
    ]);
    setReports(rRes.data.reports);
    setOfficers(oRes.data.officers);
  }

  useEffect(() => {
    load();
    socket.on("report:new",     r  => { setReports(p => [r, ...p]); toast("🆕 New report arrived!", { icon:"🚨" }); });
    socket.on("report:updated", upd => setReports(p => p.map(r => r._id === upd._id ? upd : r)));
    return () => { socket.off("report:new"); socket.off("report:updated"); };
  }, []);

  async function dispatch() {
    if (!assignTo) { toast.error("Select an officer first"); return; }
    setSaving(true);
    try {
      const officer = officers.find(o => o._id === assignTo);
      const { data } = await api.patch(`/api/reports/${selected._id}/status`, {
        status: "dispatched",
        assignedOfficer:     assignTo,
        assignedOfficerName: officer?.name || "",
        estimatedRestoration: ert || undefined,
      });
      setReports(p => p.map(r => r._id === data.report._id ? data.report : r));
      setSelected(null); setAssignTo(""); setErt("");
      toast.success(`Officer ${officer?.name} dispatched!`);
    } catch { toast.error("Dispatch failed"); }
    setSaving(false);
  }

  const displayed = filter === "all" ? reports : reports.filter(r => r.status === filter);

  const stats = {
    total:    reports.length,
    critical: reports.filter(r => r.severity === "critical" && r.status !== "resolved").length,
    open:     reports.filter(r => r.status !== "resolved").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };

  return (
    <div className="h-screen bg-g-950 flex flex-col overflow-hidden">
      <Navbar title="Operations Dashboard" liveCount={stats.open} />

      {/* Stats */}
      <div className="grid grid-cols-4 border-b border-g-700 flex-shrink-0">
        {[
          { label:"Total",         val: stats.total,    color:"text-white" },
          { label:"Critical Open", val: stats.critical, color:"text-red-400" },
          { label:"Open",          val: stats.open,     color:"text-amber-400" },
          { label:"Resolved",      val: stats.resolved, color:"text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="py-3 text-center border-r border-g-700 last:border-0 bg-g-900">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="w-72 flex-shrink-0 border-r border-g-700 flex flex-col bg-g-900">
          {/* Filter */}
          <div className="p-2 border-b border-g-700 flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded-lg text-xs font-medium capitalize transition ${
                  filter === f ? "bg-g-blue text-white" : "text-slate-500 hover:text-slate-300 bg-g-800"
                }`}>
                {f === "all" ? "All" : f.replace("_"," ")}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1">
            {displayed.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-10">No reports</p>
            )}
            {displayed.map(r => (
              <button key={r._id} onClick={() => { setSelected(r); setAssignTo(""); setErt(""); }}
                className={`w-full text-left p-3 border-b border-g-800 hover:bg-g-800 transition ${
                  selected?._id === r._id ? "bg-blue-950/40 border-l-2 border-l-g-blue" : ""
                }`}>
                <div className="flex items-start gap-2 justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-semibold truncate">{r.transformerName}</p>
                    <p className="text-slate-500 text-xs truncate">{r.citizenName} · {r.ward}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`badge badge-${r.severity}`}>{r.severity}</span>
                    <span className={`badge badge-${r.status}`}>{r.status.replace("_"," ")}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs mt-1">
                  {new Date(r.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                  {r.corroborations > 1 && ` · ${r.corroborations} reports`}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={[17.4374, 78.4487]} zoom={12} style={{ height:"100%", width:"100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {reports.map(r => r.lat && (
              <span key={r._id}>
                <Circle center={[r.lat, r.lng]} radius={200}
                  pathOptions={{ color: CIRCLE_COLOR[r.severity] || "#94a3b8", fillOpacity: 0.12, weight: 1 }} />
                <Marker position={[r.lat, r.lng]}
                  icon={r.status === "resolved" ? ICONS.resolved : (ICONS[r.severity] || ICONS.minor)}
                  eventHandlers={{ click: () => { setSelected(r); setAssignTo(""); setErt(""); } }}>
                  <Popup>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold">{r.transformerName}</p>
                      <p>{r.ward} · {r.severity}</p>
                      <p>Status: {r.status}</p>
                      <p>By: {r.citizenName}</p>
                    </div>
                  </Popup>
                </Marker>
              </span>
            ))}
          </MapContainer>

          {/* Dispatch panel */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl p-4 shadow-glow z-[1000] animate-fade-up">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold">{selected.transformerName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge badge-${selected.severity}`}>{selected.severity}</span>
                    <span className={`badge badge-${selected.status}`}>{selected.status.replace("_"," ")}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-g-700 transition">
                  <X size={16} />
                </button>
              </div>

              {selected.photoUrl && (
                <img src={selected.photoUrl} className="w-full h-32 object-cover rounded-xl mb-3" alt="evidence" />
              )}

              {selected.status !== "resolved" ? (
                <div className="space-y-2">
                  <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className="input text-sm py-2.5">
                    <option value="">— Assign Field Officer —</option>
                    {officers.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                  </select>
                  <input type="datetime-local" value={ert} onChange={e => setErt(e.target.value)}
                    className="input text-sm py-2.5" placeholder="Estimated Restoration Time (optional)" />
                  <button onClick={dispatch} disabled={saving || !assignTo}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
                    <Send size={14} />
                    {saving ? "Dispatching…" : "Dispatch Officer"}
                  </button>
                </div>
              ) : (
                <p className="text-emerald-400 text-sm font-semibold text-center py-2">
                  ✓ Resolved by {selected.assignedOfficerName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
