import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Banknote,
  Package,
  AlertTriangle,
  AlertOctagon,
  Star,
  CheckCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface AdminNotification {
  id: string;
  type: "BANK_SLIP" | "ORDER" | "LOW_STOCK" | "OUT_OF_STOCK" | "REVIEW" | "PAYMENT_FAILED";
  category: "orders" | "inventory" | "reviews";
  severity: "critical" | "urgent" | "warning" | "action" | "info";
  title: string;
  message: string;
  timestamp: string;
  link: string;
  actionLabel: string;
  orderNumber?: string;
  sku?: string;
}

export function AdminNotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "inventory" | "reviews">("all");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("gizmotek_admin_sound") === "true";
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gizmotek_admin_read_notifications");
      if (saved) {
        setReadIds(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        const incoming: AdminNotification[] = data.notifications || [];
        setNotifications(incoming);

        // Check if new notifications arrived to trigger sound
        if (soundEnabled && incoming.length > prevCountRef.current && prevCountRef.current !== 0) {
          playNotificationSound();
        }
        prevCountRef.current = incoming.length;
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("gizmotek_admin_sound", String(next));
    if (next) playNotificationSound();
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    localStorage.setItem("gizmotek_admin_read_notifications", JSON.stringify(Array.from(allIds)));
  };

  const handleNotificationClick = (n: AdminNotification) => {
    const updated = new Set(readIds);
    updated.add(n.id);
    setReadIds(updated);
    localStorage.setItem("gizmotek_admin_read_notifications", JSON.stringify(Array.from(updated)));
    setIsOpen(false);
    navigate(n.link);
  };

  const unreadNotifications = notifications.filter((n) => !readIds.has(n.id));
  const unreadCount = unreadNotifications.length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.category === activeTab;
  });

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "BANK_SLIP":
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case "ORDER":
        return <Package className="w-4 h-4 text-cyan-400" />;
      case "LOW_STOCK":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "OUT_OF_STOCK":
        return <AlertOctagon className="w-4 h-4 text-red-400" />;
      case "REVIEW":
        return <Star className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getSeverityBadge = (severity: AdminNotification["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "urgent":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "action":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      default:
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const then = new Date(isoString);
      const diffSecs = Math.floor((now.getTime() - then.getTime()) / 1000);

      if (diffSecs < 60) return "Just now";
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return `${Math.floor(diffSecs / 86400)}d ago`;
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer ${
          isOpen
            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-neon"
            : unreadCount > 0
            ? "bg-slate-900 hover:bg-slate-850 border-cyan-500/40 text-cyan-400 shadow-sm"
            : "bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200"
        }`}
        title="Store Notifications & Action Alerts"
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${unreadCount > 0 ? "animate-wiggle" : ""}`} />

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flyout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 sm:right-auto sm:left-auto mt-2 w-[340px] sm:w-[420px] max-w-[92vw] bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Flyout Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                    <span>Store Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 font-extrabold px-1.5 py-0.2 rounded-full border border-red-500/30">
                        {unreadCount} New
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleSound}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    soundEnabled
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  }`}
                  title={soundEnabled ? "Audio chime ON" : "Audio chime OFF"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Refresh alerts"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
                </button>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 p-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Read All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Category Tabs */}
            <div className="grid grid-cols-4 p-1.5 bg-slate-900/40 border-b border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "all"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Orders ({notifications.filter((n) => n.category === "orders").length})
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Stock ({notifications.filter((n) => n.category === "inventory").length})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-1 rounded-lg transition-colors cursor-pointer ${
                  activeTab === "reviews"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Reviews ({notifications.filter((n) => n.category === "reviews").length})
              </button>
            </div>

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5 touch-scroll max-h-[380px]">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <CheckCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">All Caught Up!</h4>
                  <p className="text-[11px] text-slate-400">
                    No active action alerts in this category right now.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const isRead = readIds.has(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 rounded-xl transition-all cursor-pointer border flex items-start gap-3 group ${
                        isRead
                          ? "bg-slate-950/40 border-slate-800/40 opacity-70 hover:opacity-100 hover:bg-slate-900/60"
                          : "bg-slate-900/90 border-slate-800 hover:border-cyan-500/40 shadow-sm"
                      }`}
                    >
                      {/* Category Icon */}
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        {getIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formatRelativeTime(n.timestamp)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                          {n.message}
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getSeverityBadge(
                              n.severity
                            )}`}
                          >
                            {n.severity}
                          </span>

                          <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            <span>{n.actionLabel}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-neon"></span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Flyout Footer */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Auto-syncing every 30s</span>
              </span>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin/orders");
                }}
                className="font-semibold text-cyan-400 hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <span>View All Orders</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
