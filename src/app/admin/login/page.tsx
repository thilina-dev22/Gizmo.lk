"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GizmoLogo } from "@/components/logo/GizmoLogo";
import { Lock, User, KeyRound, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Invalid username or password");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Header Logo */}
        <div className="text-center space-y-3">
          <GizmoLogo size="lg" />
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/30">
              Restricted Admin Security Portal
            </span>
            <h1 className="text-xl font-bold text-white mt-2">Store Management Login</h1>
            <p className="text-xs text-slate-400 mt-1">
              Authorized Gizmo.lk store administrators only.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Username / Email</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full bg-slate-950 text-slate-100 pl-4 pr-4 py-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Security Password</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 text-slate-100 pl-4 pr-4 py-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-xs font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold text-xs py-3.5 rounded-xl shadow-neon transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating Credentials...</span>
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authenticate & Access Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted Session</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Default test login: Username: <strong className="text-cyan-400">admin</strong> | Password: <strong className="text-cyan-400">gizmo2026admin</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
