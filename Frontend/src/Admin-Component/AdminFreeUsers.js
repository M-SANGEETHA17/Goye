import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Building2, Phone, MapPin, Calendar, Filter, Mail, Smartphone, 
  Briefcase, Activity, UserX, Lock, Eye, EyeOff, Copy, Check, Zap, 
  Clock, Sparkles, X, RefreshCw, ShieldCheck, ArrowUpRight, MoreVertical 
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "https://goye-backend-bw8t.onrender.com").replace(/\/+$/, "");

export default function AdminFreeUsers() {
  const [freeUsers, setFreeUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionError, setActionError] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [planModalUser, setPlanModalUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("One Month");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsApp = (phone, name) => {
    if (!phone) {
      alert("No phone number registered for this user.");
      return;
    }
    let cleanPhone = String(phone).replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const message = encodeURIComponent(`Hello ${name || "User"}, this is Goye Support.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const fetchFreeUsers = async (showRefreshAnim = false) => {
    if (showRefreshAnim) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/free-users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFreeUsers(data);
          sessionStorage.setItem("goye_free_users", JSON.stringify(data));
          setError("");
        }
      } else {
        setError("Could not load Free User details.");
      }
    } catch (err) {
      console.error("Free users fetch error:", err);
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
      if (showRefreshAnim) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchFreeUsers();
    const intervalId = setInterval(() => fetchFreeUsers(false), 60000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredUsers = useMemo(() => {
    return freeUsers.filter((u) => {
      const matchesStatus = statusFilter === "All" || 
        (statusFilter === "Active" && (u.status === "active" || !u.status)) ||
        (statusFilter === "Blocked" && u.status === "blocked");
      if (!matchesStatus) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.businessName || "").toLowerCase().includes(q) ||
        (u.businessType || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q)
      );
    });
  }, [freeUsers, search, statusFilter]);

  const sortedFreeUsersAsc = useMemo(() => {
    return [...freeUsers].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [freeUsers]);

  const seqIdMap = useMemo(() => {
    const map = {};
    sortedFreeUsersAsc.forEach((u, index) => {
      if (u._id) {
        map[u._id] = `GOYE-F${String(index + 1).padStart(3, '0')}`;
      }
    });
    return map;
  }, [sortedFreeUsersAsc]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const changeStatus = async (user, nextStatus) => {
    if (nextStatus === user.status) return;
    setActioningId(user._id);
    setActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/free-users/${user._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.message || "Could not update user status.");
        return;
      }
      setFreeUsers((prev) => {
        const updated = prev.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u));
        sessionStorage.setItem("goye_free_users", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Free user status update error:", err);
      setActionError("Could not reach the server.");
    } finally {
      setActioningId(null);
    }
  };

  const handleApplyPlan = async () => {
    if (!planModalUser || !planModalUser.email) return;
    setUpdatingPlan(true);
    setPlanSuccessMsg("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/change-user-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: planModalUser.email,
          plan: selectedPlan
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPlanSuccessMsg(data.message || "Plan assigned successfully!");
        fetchFreeUsers(false);
        setTimeout(() => {
          setPlanModalUser(null);
          setPlanSuccessMsg("");
        }, 1800);
      } else {
        alert(data.message || "Failed to assign plan.");
      }
    } catch (err) {
      console.error("Error assigning plan:", err);
      alert("Error contacting server. Please ensure backend is running.");
    } finally {
      setUpdatingPlan(false);
    }
  };

  // Counts
  const totalCount = freeUsers.length;
  const activeCount = freeUsers.filter(u => u.status === 'active' || !u.status).length;
  const blockedCount = freeUsers.filter(u => u.status === 'blocked').length;

  return (
    <div className="admin-main-content min-h-screen bg-gradient-to-br from-[#f0fdf4] via-[#f8fafc] to-[#ecfdf5] font-sans text-slate-800 relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono-code { font-family: 'JetBrains Mono', monospace; }

        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(16, 185, 129, 0.16);
          box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03);
          border-radius: 20px;
        }

        .stat-card-glow {
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stat-card-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 34px -8px rgba(16, 185, 129, 0.16);
        }

        .custom-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #a7f3d0;
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #10B981;
        }

        .avatar-gradient {
          background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%);
        }
      `}</style>

      {/* Top Banner / Header */}
      <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-md border-b border-emerald-100/80 px-4 md:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl avatar-gradient flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/20">
              <Building2 className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Free User Directory</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Accounts
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage, monitor, and upgrade registered free users to subscribed plans</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchFreeUsers(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              title="Refresh users"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-slate-400 font-medium">Platform Free Pool</p>
              <p className="text-xs font-extrabold text-emerald-700">{totalCount} Registered</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          {/* Total Free Users */}
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Free Users</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{totalCount}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <span>Free tier active pool</span>
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200/60 shadow-xs">
              <Building2 size={26} />
            </div>
          </div>

          {/* Active Users */}
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-teal-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Accounts</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-teal-900 mt-1">{activeCount}</h3>
              <p className="text-[11px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                <span>Normal access enabled</span>
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-200/60 shadow-xs">
              <Activity size={26} />
            </div>
          </div>

          {/* Blocked Users */}
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-rose-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Blocked / Restricted</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-rose-900 mt-1">{blockedCount}</h3>
              <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <span>Access restricted</span>
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center ring-1 ring-rose-200/60 shadow-xs">
              <UserX size={26} />
            </div>
          </div>
        </div>

        {/* Search, Status Filters & Tools */}
        <div className="glass-card p-4 md:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, business, location..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-emerald-200/80 bg-white/90 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 transition-all shadow-2xs"
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { label: "All", count: totalCount },
              { label: "Active", count: activeCount },
              { label: "Blocked", count: blockedCount },
            ].map(tab => {
              const active = statusFilter === tab.label;
              return (
                <button
                  key={tab.label}
                  onClick={() => setStatusFilter(tab.label)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "bg-slate-100/90 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                    active ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alerts / Error Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <UserX size={16} />
            <span>{error}</span>
          </div>
        )}
        {actionError && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <span>{actionError}</span>
          </div>
        )}

        {/* Modern Table Container */}
        <div className="glass-card overflow-hidden border border-emerald-200/70 shadow-sm">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border-b border-emerald-100 text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">
                  <th className="py-4 pl-6 pr-4 w-[240px]">User Profile</th>
                  <th className="py-4 px-4 w-[210px]">Contact Info</th>
                  <th className="py-4 px-4 w-[165px]">Password</th>
                  <th className="py-4 px-4 w-[180px]">Business Info</th>
                  <th className="py-4 px-4 w-[130px]">Joined Date</th>
                  <th className="py-4 pl-4 pr-6 text-right w-[240px]">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/80 bg-white/70">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-slate-700">Loading Free User details...</span>
                        <span className="text-xs text-slate-400">Fetching latest database records</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <Building2 size={28} />
                        </div>
                        <span className="text-base font-bold text-slate-800">No Free Users Found</span>
                        <p className="text-xs text-slate-400">
                          {search ? `No accounts match "${search}". Try searching another name or email.` : "There are currently no free user accounts in the database."}
                        </p>
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            Clear search filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isBlocked = u.status === 'blocked';
                    const seqId = seqIdMap[u._id] || "GOYE-FREE";
                    const isUpdatingThis = actioningId === u._id;

                    return (
                      <tr
                        key={u._id}
                        className="hover:bg-emerald-50/35 transition-all duration-150 group border-b border-slate-100 last:border-none"
                      >
                        {/* USER PROFILE */}
                        <td className="py-3.5 pl-6 pr-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                                isBlocked 
                                  ? "bg-gradient-to-tr from-rose-500 to-rose-700" 
                                  : "avatar-gradient shadow-emerald-500/20"
                              }`}>
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <span 
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                  isBlocked ? 'bg-rose-500' : 'bg-emerald-500'
                                }`} 
                                title={isBlocked ? "Blocked User" : "Active User"}
                              />
                            </div>
                            <div className="min-w-0 pr-1">
                              <p className="font-bold text-slate-800 text-[13px] truncate group-hover:text-emerald-700 transition-colors" title={u.name}>
                                {u.name || "Unnamed User"}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="font-mono-code text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                  {seqId}
                                </span>
                                {isBlocked && (
                                  <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                                    Blocked
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT INFO */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              <Mail size={12} className="text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[170px]" title={u.email}>{u.email || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              <Smartphone size={12} className="text-emerald-600 shrink-0" />
                              <span>{u.phone || "—"}</span>
                            </div>
                          </div>
                        </td>

                        {/* PASSWORD */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs">
                            <Lock size={12} className="text-emerald-700 shrink-0" />
                            <span className="font-mono-code text-xs font-semibold text-slate-800 tracking-wider">
                              {visiblePasswords[u._id] ? (u.password || "••••••••") : "••••••••"}
                            </span>
                            {u.password && (
                              <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(u._id)}
                                  className="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition-colors cursor-pointer"
                                  title={visiblePasswords[u._id] ? "Hide password" : "Show password"}
                                >
                                  {visiblePasswords[u._id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyPassword(u.password, u._id)}
                                  className="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition-colors cursor-pointer"
                                  title={copiedId === u._id ? "Copied!" : "Copy password"}
                                >
                                  {copiedId === u._id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* BUSINESS INFO */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="space-y-1">
                            {u.businessName ? (
                              <>
                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate max-w-[170px]" title={u.businessName}>
                                  <Building2 size={13} className="text-emerald-600 shrink-0" />
                                  <span className="truncate">{u.businessName}</span>
                                </p>
                                {u.businessType && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80">
                                    <Briefcase size={9} className="text-teal-600" />
                                    {u.businessType}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic flex items-center gap-1">
                                <Building2 size={12} className="text-slate-300" /> Not provided
                              </span>
                            )}
                          </div>
                        </td>

                        {/* JOINED ON */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Calendar size={12} className="text-emerald-600 shrink-0" />
                            <span>{formatDate(u.createdAt)}</span>
                          </div>
                        </td>

                        {/* QUICK ACTIONS */}
                        <td className="py-3.5 pl-4 pr-6 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Direct Chat */}
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(u.phone, u.name)}
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-emerald-200 hover:border-[#25D366] transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
                              title="Chat with user on WhatsApp"
                            >
                              <FaWhatsapp size={14} />
                            </button>

                            {/* Assign Plan */}
                            <button
                              type="button"
                              onClick={() => {
                                setPlanModalUser(u);
                                setSelectedPlan("One Month");
                                setPlanSuccessMsg("");
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md hover:shadow-emerald-600/20 flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-95"
                              title="Upgrade to Subscribed Plan"
                            >
                              <Zap size={12} className="text-amber-200 fill-amber-200" />
                              <span>Assign Plan</span>
                            </button>

                            {/* Status Control Toggle / Select */}
                            <div className="relative inline-block text-left">
                              <select
                                value={u.status === "blocked" ? "blocked" : "active"}
                                disabled={isUpdatingThis}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  changeStatus(u, val === "blocked" ? "blocked" : "active");
                                }}
                                className={`text-[11px] font-extrabold px-2 py-1.5 rounded-xl border outline-none cursor-pointer transition-all ${
                                  isBlocked
                                    ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                              >
                                <option value="active">● Active</option>
                                <option value="blocked">● Block</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Summary Bar */}
          <div className="bg-emerald-50/50 px-6 py-3 border-t border-emerald-100/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
            <span>Showing {filteredUsers.length} of {freeUsers.length} total free user accounts</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Blocked
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Plan Assignment Modal */}
      {planModalUser && (
        <div className="fixed inset-0 md:left-[260px] z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 backdrop-blur-md bg-slate-900/50 transition-opacity" 
            onClick={() => !updatingPlan && setPlanModalUser(null)}
          ></div>
          <div className="relative my-auto bg-white rounded-3xl shadow-2xl w-full max-w-[460px] max-h-[92vh] overflow-y-auto flex flex-col p-6 z-10 border border-emerald-200 [scrollbar-width:none]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                  <Zap size={20} className="fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Assign Subscription Plan</h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">{planModalUser.name} • {planModalUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => !updatingPlan && setPlanModalUser(null)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Plan Picker */}
            <div className="mt-5 space-y-2">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Select Target Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-emerald-300 bg-emerald-50/40 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer"
              >
                <option value="One Day">⚡ One Day (24 Hours)</option>
                <option value="One Week">📅 One Week (7 Days)</option>
                <option value="15 Days">🌟 15 Days Access</option>
                <option value="One Month">💎 One Month (30 Days) - Recommended</option>
                <option value="3 Months">🚀 3 Months (90 Days)</option>
                <option value="6 Months">👑 6 Months (180 Days)</option>
                <option value="1 Year">🏆 1 Year (365 Days Premium)</option>
              </select>
            </div>

            {/* Plan Perks Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Sparkles size={14} className="text-emerald-600" />
                <span>Instant Account Elevation</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Upgrading to <strong>{selectedPlan}</strong> activates full member privileges, adds <strong>99,999 marketing credits</strong>, and lifts free plan limits immediately.
              </p>
            </div>

            {/* Success Feedback */}
            {planSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span>{planSuccessMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPlanModalUser(null)}
                disabled={updatingPlan}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPlan}
                disabled={updatingPlan}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {updatingPlan ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Activating...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm & Upgrade</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}