import { LogOut, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_STYLE = {
  citizen: "text-emerald-400 border-emerald-800 bg-emerald-950",
  officer: "text-amber-400  border-amber-800  bg-amber-950",
  manager: "text-blue-400   border-blue-800   bg-blue-950",
};

export default function Navbar({ title, liveCount }) {
  const { user, logout } = useAuth();

  return (
    <nav className="glass border-b border-g-700 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Zap size={18} className="text-g-blue" fill="currentColor" />
          <span className="font-black text-white text-lg tracking-tight">GridGuard</span>
        </div>
        {title && (
          <span className="hidden sm:flex items-center gap-1.5 text-slate-500 text-sm">
            <span>/</span>
            <span>{title}</span>
          </span>
        )}
        {liveCount !== undefined && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="live-dot" />
            <span className="text-emerald-400 text-xs font-semibold">{liveCount} live</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className={`badge border ${ROLE_STYLE[user?.role] || "text-slate-400 border-slate-700 bg-slate-900"}`}>
          {user?.role}
        </span>
        <span className="text-slate-400 text-sm hidden sm:block truncate max-w-[120px]">{user?.name}</span>
        <button
          onClick={logout}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950 rounded-lg transition"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}
