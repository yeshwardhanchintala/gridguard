import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login        from "./pages/Login.jsx";
import CitizenApp   from "./pages/CitizenApp.jsx";
import OpsDashboard from "./pages/OpsDashboard.jsx";
import FieldOfficer from "./pages/FieldOfficer.jsx";

function Splash() {
  return (
    <div className="flex items-center justify-center h-screen bg-g-950 grid-bg">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse-slow">⚡</div>
        <p className="text-g-glow font-bold text-lg tracking-widest">GRIDGUARD</p>
        <p className="text-slate-500 text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
}

function Home({ user }) {
  if (user.role === "manager") return <Navigate to="/ops" replace />;
  if (user.role === "officer") return <Navigate to="/officer" replace />;
  return <Navigate to="/report" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Splash />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Home user={user} />} />
        <Route path="/"      element={user  ? <Home user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/report"  element={user ? <CitizenApp />   : <Navigate to="/login" replace />} />
        <Route path="/ops"     element={user?.role === "manager" ? <OpsDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/officer" element={user?.role === "officer" ? <FieldOfficer /> : <Navigate to="/login" replace />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
