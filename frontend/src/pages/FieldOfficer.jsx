import { useState, useEffect } from "react";
import { Navigation, CheckCircle, Clock, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api.js";
import socket from "../utils/socket.js";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_ACTIONS = {
  dispatched:  { label: "Mark Arrived — Start Repair", next: "in_progress", icon: <Wrench size={15}/>,      color: "bg-amber-600 hover:bg-amber-500" },
  in_progress: { label: "Mark Resolved — Power Restored",next:"resolved",  icon: <CheckCircle size={15}/>,  color: "bg-emerald-600 hover:bg-emerald-500" },
};

export default function FieldOfficer() {
  const { user } = useAuth();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating,setUpdating]= useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/reports");
      setJobs(data.reports.sort((a,b) => {
        const order = { dispatched:0, in_progress:1, resolved:2 };
        return (order[a.status]??9) - (order[b.status]??9);
      }));
    } catch { toast.error("Failed to load jobs"); }
    setLoading(false);
  }

  useEffect(() => {
    load();
    socket.on("report:updated", upd => {
      setJobs(prev => prev.map(j => j._id === upd._id ? upd : j)
        .sort((a,b) => {
          const order = { dispatched:0, in_progress:1, resolved:2 };
          return (order[a.status]??9) - (order[b.status]??9);
        })
      );
    });
    return () => socket.off("report:updated");
  }, []);

  async function updateStatus(job) {
    const action = STATUS_ACTIONS[job.status];
    if (!action) return;
    setUpdating(job._id);
    try {
      const { data } = await api.patch(`/api/reports/${job._id}/status`, { status: action.next });
      setJobs(prev => prev.map(j => j._id === data.report._id ? data.report : j));
      toast.success(action.next === "resolved" ? "✅ Repair marked as resolved!" : "🔧 Repair started");
    } catch { toast.error("Update failed"); }
    setUpdating("");
  }

  const open     = jobs.filter(j => j.status !== "resolved");
  const resolved = jobs.filter(j => j.status === "resolved");

  return (
    <div className="min-h-screen bg-g-950">
      <Navbar title="My Jobs" />

      <div className="max-w-md mx-auto p-4 pb-8 space-y-4">

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 text-center border border-amber-900/50">
            <p className="text-3xl font-black text-amber-400">{open.length}</p>
            <p className="text-slate-400 text-xs mt-1">Open Jobs</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center border border-emerald-900/50">
            <p className="text-3xl font-black text-emerald-400">{resolved.length}</p>
            <p className="text-slate-400 text-xs mt-1">Resolved</p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-slate-500">
            <div className="w-8 h-8 border-2 border-g-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading jobs…
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="glass rounded-2xl py-16 text-center">
            <Wrench size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No jobs assigned yet</p>
            <p className="text-slate-600 text-sm mt-1">Check back after ops dispatches you</p>
          </div>
        )}

        {/* Open jobs */}
        {open.map(job => (
          <div key={job._id} className={`glass rounded-2xl overflow-hidden animate-fade-up border ${
            job.status === "dispatched" ? "border-blue-800" : "border-amber-800"
          }`}>
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${
              job.status === "dispatched" ? "bg-blue-950/50" : "bg-amber-950/50"
            }`}>
              <div>
                <p className="text-white font-bold text-sm">{job.transformerName}</p>
                <p className="text-slate-400 text-xs">{job.ward} · {job.discom || "TSSPDCL"}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`badge badge-${job.severity}`}>{job.severity}</span>
                <span className={`badge badge-${job.status}`}>{job.status.replace("_"," ")}</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <span>Reported by:</span>
                <span className="text-white font-medium">{job.citizenName}</span>
              </div>

              {job.photoUrl && (
                <img src={job.photoUrl} className="w-full h-40 object-cover rounded-xl" alt="evidence" />
              )}

              {job.estimatedRestoration && (
                <div className="flex items-center gap-2 text-blue-300 text-sm bg-blue-950/40 border border-blue-800 rounded-xl px-3 py-2">
                  <Clock size={13} />
                  ERT: {new Date(job.estimatedRestoration).toLocaleString([], { hour:"2-digit", minute:"2-digit", month:"short", day:"numeric" })}
                </div>
              )}

              {/* Navigation */}
              {job.lat && job.lng && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 btn-ghost w-full text-sm py-2.5">
                  <Navigation size={14} />
                  Navigate to Transformer
                </a>
              )}

              {/* Status action */}
              {STATUS_ACTIONS[job.status] && (
                <button onClick={() => updateStatus(job)}
                  disabled={updating === job._id}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-white transition disabled:opacity-60 text-sm ${STATUS_ACTIONS[job.status].color}`}>
                  {STATUS_ACTIONS[job.status].icon}
                  {updating === job._id ? "Updating…" : STATUS_ACTIONS[job.status].label}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Resolved */}
        {resolved.length > 0 && (
          <>
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest pt-2">Completed</p>
            {resolved.map(job => (
              <div key={job._id} className="glass rounded-2xl p-4 border border-emerald-900/30 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{job.transformerName}</p>
                    <p className="text-slate-500 text-xs">{job.ward}</p>
                  </div>
                  <span className="badge badge-resolved">Resolved ✓</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
