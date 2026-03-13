import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login, register } = useAuth();
  const [mode,     setMode]     = useState("login");   // "login" | "register"
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        await register(name, email, password);
        toast.success("Account created!");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-g-950 grid-bg flex items-center justify-center p-4">

      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-g-blue opacity-5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-500 opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-g-800 border border-g-600 shadow-glow mb-4">
            <Zap size={30} className="text-g-blue" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">GridGuard</h1>
          <p className="text-slate-400 text-sm mt-1">Transformer Failure Reporting System</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 shadow-glow">
          {/* Tab switch */}
          <div className="flex bg-g-900 rounded-xl p-1 mb-6">
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition ${
                  mode === m ? "bg-g-700 text-white" : "text-slate-500 hover:text-slate-300"
                }`}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-10" placeholder="Full name"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}

            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-10" type="email" placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-10 pr-10" type={showPw ? "text" : "password"}
                placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-xl px-3 py-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        {/* Demo credentials box */}
        <div className="mt-4 glass rounded-xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
          {[
            { role:"Citizen",  email:"citizen@gridguard.demo" },
            { role:"Officer",  email:"officer@gridguard.demo" },
            { role:"Manager",  email:"manager@gridguard.demo" },
          ].map(d => (
            <button key={d.role} onClick={() => { setEmail(d.email); setPassword("Demo@1234"); setMode("login"); }}
              className="w-full text-left flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-g-700 transition group">
              <span className="text-slate-300 text-xs group-hover:text-white">{d.email}</span>
              <span className="badge badge-minor text-xs">{d.role}</span>
            </button>
          ))}
          <p className="text-slate-600 text-xs mt-2 text-center">Password: Demo@1234 (tap to autofill)</p>
        </div>
      </div>
    </div>
  );
}
