import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Check, X, Eye, EyeOff, Lock, Copy, Edit2, Trash2, Smartphone, Mail, 
  ChevronLeft, ChevronRight, Users, ShieldCheck, Activity, Calendar, Zap, MessageSquare, 
  Building2, Briefcase, Clock, Sparkles, RefreshCw, Crown, Award, UserCheck
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = (process.env.REACT_APP_API_URL || "https://goye-backend-bw8t.onrender.com").replace(/\/+$/, "");

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => {
    const cached = sessionStorage.getItem('goye_users');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('goye_users'));
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editRowId, setEditRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [viewUserStats, setViewUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [planModalUser, setPlanModalUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("One Month");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchUsers = async (showAnim = false) => {
    if (showAnim) setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) throw new Error(`Server returned ${response.status}: Please restart your Node.js backend!`);
      const data = await response.json();
      setUsers(data); 
      sessionStorage.setItem('goye_users', JSON.stringify(data));
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (showAnim) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchUsers(false);
    const intervalId = setInterval(() => fetchUsers(false), 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleView = async (user) => {
    setViewUser(user);
    setViewUserStats(null);
    setStatsLoading(true);
    
    if (user.email) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/credits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email })
        });
        if (response.ok) {
          const data = await response.json();
          setViewUserStats({
            credits: data.credits !== undefined ? data.credits : 30,
            totalSent: data.totalSent !== undefined ? data.totalSent : 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch credits", err);
      }
    }
    setStatsLoading(false);
  };

  const handleEditClick = (user) => {
    setEditRowId(user._id);
    setEditFormData({ name: user.name, email: user.email, phone: user.phone || "", password: user.password || "" });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = (id) => {
    const newUsers = [...users];
    const index = users.findIndex(u => u._id === id);
    if(index !== -1) {
      newUsers[index] = { ...newUsers[index], ...editFormData };
      setUsers(newUsers);
      sessionStorage.setItem('goye_users', JSON.stringify(newUsers));
    }
    setEditRowId(null);
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to completely delete this user? This action cannot be undone.")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          const updated = users.filter(u => u._id !== id);
          setUsers(updated);
          sessionStorage.setItem('goye_users', JSON.stringify(updated));
        } else {
          alert("Failed to delete user. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred while deleting the user.");
      }
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
        setPlanSuccessMsg(data.message || "Plan updated successfully!");
        fetchUsers(false);
        if (viewUser && viewUser.email === planModalUser.email) {
          handleView(viewUser);
        }
        setTimeout(() => {
          setPlanModalUser(null);
          setPlanSuccessMsg("");
        }, 1800);
      } else {
        alert(data.message || "Failed to update plan.");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Error contacting server. Please ensure backend is running.");
    } finally {
      setUpdatingPlan(false);
    }
  };

  const sortedUsersAsc = useMemo(() => {
    return [...users].reverse();
  }, [users]);

  const seqIdMap = useMemo(() => {
    const map = {};
    sortedUsersAsc.forEach((u, index) => {
      if (u._id) {
        map[u._id] = `GOYE-S${String(index + 1).padStart(3, '0')}`;
      }
    });
    return map;
  }, [sortedUsersAsc]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const isSub = user.isSubscribed && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > Date.now();
      if (statusFilter === "Active" && !isSub) return false;
      if (statusFilter === "Expired" && isSub) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.phone && user.phone.includes(q)) ||
        (user.businessName && user.businessName.toLowerCase().includes(q)) ||
        (user.businessType && user.businessType.toLowerCase().includes(q))
      );
    });
  }, [users, searchQuery, statusFilter]);

  // Paginated users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const activeSubscribersCount = users.filter(u => 
    u.isSubscribed && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() > Date.now()
  ).length;

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
            <div className="w-11 h-11 rounded-2xl avatar-gradient flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/20">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Subscribed Users</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Crown size={12} className="text-emerald-700" />
                  Premium Members
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">View, edit, monitor credits, and manage subscribed accounts</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchUsers(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              title="Refresh users"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-slate-400 font-medium">Subscribed Pool</p>
              <p className="text-xs font-extrabold text-emerald-700">{users.length} Registered</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{users.length}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Paid & upgraded accounts</p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200/60 shadow-xs">
              <Users size={26} />
            </div>
          </div>

          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-teal-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Subscriptions</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-teal-900 mt-1">{activeSubscribersCount}</h3>
              <p className="text-[11px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                <span>Active validity today</span>
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-200/60 shadow-xs">
              <Activity size={26} />
            </div>
          </div>

          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Members</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-amber-900 mt-1">{Math.max(0, users.length - 1)}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Full service access</p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-200/60 shadow-xs">
              <ShieldCheck size={26} />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-card p-4 md:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, phone, business..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-emerald-200/80 bg-white/90 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { label: "All", count: users.length },
              { label: "Active", count: activeSubscribersCount },
              { label: "Expired", count: Math.max(0, users.length - activeSubscribersCount) }
            ].map(tab => {
              const active = statusFilter === tab.label;
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setStatusFilter(tab.label);
                    setCurrentPage(1);
                  }}
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

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>{error}</span>
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
                  <th className="py-4 pl-4 pr-6 text-right w-[240px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/80 bg-white/70">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-slate-700">Loading Subscribed Users data...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <Users size={28} />
                        </div>
                        <span className="text-base font-bold text-slate-800">No Users Match</span>
                        <p className="text-xs text-slate-400">
                          {searchQuery ? `No users found matching "${searchQuery}".` : "No subscribed user accounts found."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const seqId = seqIdMap[user._id] || "GOYE-S001";
                    const isEditing = editRowId === user._id;

                    return (
                      <tr key={user._id} className="hover:bg-emerald-50/35 transition-all duration-150 group border-b border-slate-100 last:border-none">
                        {isEditing ? (
                          /* Inline Edit Mode */
                          <>
                            <td className="py-3.5 pl-6 pr-4 align-middle">
                              <input 
                                type="text" 
                                name="name" 
                                value={editFormData.name} 
                                onChange={handleEditChange}
                                className="w-full px-3 py-1.5 border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-bold text-slate-800"
                                placeholder="Full Name"
                              />
                            </td>
                            <td className="py-3.5 px-4 space-y-1 align-middle">
                              <input 
                                type="email" 
                                name="email" 
                                value={editFormData.email} 
                                onChange={handleEditChange}
                                className="w-full px-3 py-1.5 border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs"
                                placeholder="Email"
                              />
                              <input 
                                type="text" 
                                name="phone" 
                                value={editFormData.phone} 
                                onChange={handleEditChange}
                                className="w-full px-3 py-1.5 border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs"
                                placeholder="Phone"
                              />
                            </td>
                            <td className="py-3.5 px-4 align-middle">
                              <input 
                                type="text" 
                                name="password" 
                                value={editFormData.password || ""} 
                                onChange={handleEditChange}
                                className="w-full px-3 py-1.5 border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-mono"
                                placeholder="Password"
                              />
                            </td>
                            <td className="py-3.5 px-4 text-xs text-emerald-800 font-bold uppercase tracking-wide align-middle">
                              <p className="truncate max-w-[160px]">{user.businessName || "Not provided"}</p>
                              <p className="text-slate-400 font-medium">{user.businessType || "N/A"}</p>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-amber-700 font-bold uppercase tracking-wide align-middle">
                              Editing Mode
                            </td>
                            <td className="py-3.5 pl-4 pr-6 align-middle text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => handleSaveEdit(user._id)} 
                                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer" 
                                  title="Save Changes"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={handleCancelEdit} 
                                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer" 
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          /* Normal View Mode */
                          <>
                            {/* USER PROFILE */}
                            <td className="py-3.5 pl-6 pr-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <div className="w-10 h-10 rounded-xl avatar-gradient flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-emerald-500/20 transition-transform duration-200 group-hover:scale-105">
                                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <span 
                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" 
                                    title="Active Member"
                                  />
                                </div>
                                <div className="min-w-0 pr-1">
                                  <p className="font-bold text-slate-800 text-[13px] truncate group-hover:text-emerald-700 transition-colors" title={user.name}>
                                    {user.name || "Unnamed"}
                                  </p>
                                  <div className="mt-0.5">
                                    <span className="font-mono-code text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                      ID: {seqId}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* CONTACT INFO */}
                            <td className="py-3.5 px-4 align-middle">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                  <Mail size={12} className="text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[170px]" title={user.email}>{user.email || "No email"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                  <Smartphone size={12} className="text-emerald-600 shrink-0" />
                                  <span>{user.phone || "No phone"}</span>
                                </div>
                              </div>
                            </td>

                            {/* PASSWORD */}
                            <td className="py-3.5 px-4 align-middle">
                              <div className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs">
                                <Lock size={12} className="text-emerald-700 shrink-0" />
                                <span className="font-mono-code text-xs font-semibold text-slate-800 tracking-wider">
                                  {visiblePasswords[user._id] ? (user.password || "••••••••") : "••••••••"}
                                </span>
                                {user.password && (
                                  <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(user._id)}
                                      className="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition-colors cursor-pointer"
                                      title={visiblePasswords[user._id] ? "Hide password" : "Show password"}
                                    >
                                      {visiblePasswords[user._id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => copyPassword(user.password, user._id)}
                                      className="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition-colors cursor-pointer"
                                      title={copiedId === user._id ? "Copied!" : "Copy password"}
                                    >
                                      {copiedId === user._id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* BUSINESS INFO */}
                            <td className="py-3.5 px-4 align-middle">
                              <div className="space-y-1">
                                {user.businessName ? (
                                  <>
                                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate max-w-[170px]" title={user.businessName}>
                                      <Building2 size={13} className="text-emerald-600 shrink-0" />
                                      <span className="truncate">{user.businessName}</span>
                                    </p>
                                    {user.businessType && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80">
                                        <Briefcase size={9} className="text-teal-600" />
                                        {user.businessType}
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
                                <span>
                                  {user._id ? new Date(parseInt(user._id.substring(0,8), 16) * 1000).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : "Unknown"}
                                </span>
                              </div>
                            </td>

                            {/* ACTIONS (5 Clean Icons) */}
                            <td className="py-3.5 pl-4 pr-6 align-middle text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* WhatsApp */}
                                <button 
                                  type="button"
                                  onClick={() => handleOpenWhatsApp(user.phone, user.name)} 
                                  className="p-2 rounded-xl bg-emerald-50 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-emerald-200 hover:border-[#25D366] transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95" 
                                  title="Chat on WhatsApp"
                                >
                                  <FaWhatsapp size={14} />
                                </button>

                                {/* Change / Assign Plan */}
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setPlanModalUser(user);
                                    setSelectedPlan(user.subscriptionPlan || "One Month");
                                    setPlanSuccessMsg("");
                                  }} 
                                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95" 
                                  title="Change / Assign Plan"
                                >
                                  <Zap size={14} />
                                </button>

                                {/* View Profile & Credits */}
                                <button 
                                  onClick={() => handleView(user)} 
                                  className="p-2 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200 hover:border-teal-600 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95" 
                                  title="View Profile & Credits"
                                >
                                  <Eye size={14} />
                                </button>

                                {/* Edit User */}
                                <button 
                                  onClick={() => handleEditClick(user)} 
                                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-500 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95" 
                                  title="Edit User"
                                >
                                  <Edit2 size={14} />
                                </button>

                                {/* Delete User */}
                                <button 
                                  onClick={() => handleDelete(user._id)} 
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95" 
                                  title="Delete User"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="bg-emerald-50/50 px-6 py-3 border-t border-emerald-100/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
            <span>Showing {paginatedUsers.length} of {filteredUsers.length} total subscribers</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 mr-2">Page {currentPage} of {totalPages}</span>
              <button 
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft size={16}/>
              </button>
              <button 
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* User Profile Modal */}
      {viewUser && (
        <div className="fixed inset-0 md:left-[260px] z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 backdrop-blur-md bg-slate-900/50 transition-opacity" onClick={() => setViewUser(null)}></div>
          <div className="relative my-auto bg-white rounded-3xl shadow-2xl w-full max-w-[460px] max-h-[92vh] overflow-y-auto flex flex-col p-6 z-10 border border-emerald-200 [scrollbar-width:none]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl avatar-gradient flex items-center justify-center text-white text-xl font-extrabold shadow-md shadow-emerald-500/25">
                  {viewUser.name ? viewUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{viewUser.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Member since {viewUser._id ? new Date(parseInt(viewUser._id.substring(0,8), 16) * 1000).getFullYear() : "2026"}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewUser(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Profile Info Details */}
            <div className="mt-4 space-y-2 bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Mail size={13} className="text-emerald-600" /> Email
                </span>
                <span className="font-bold text-slate-800">{viewUser.email || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Smartphone size={13} className="text-emerald-600" /> Phone
                </span>
                <span className="font-bold text-slate-800">{viewUser.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Lock size={13} className="text-emerald-600" /> Password
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-800">
                  <span>{visiblePasswords[`modal_${viewUser._id}`] ? (viewUser.password || "Not set") : "••••••••"}</span>
                  {viewUser.password && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(`modal_${viewUser._id}`)}
                      className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer"
                    >
                      {visiblePasswords[`modal_${viewUser._id}`] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 size={13} className="text-emerald-600" /> Business
                </span>
                <span className="font-bold text-slate-800">{viewUser.businessName || "Not provided"} ({viewUser.businessType || "N/A"})</span>
              </div>
            </div>

            {/* Credits & Usage Stats */}
            <div className="mt-5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2.5">Credits & Activity</h4>
              {statsLoading ? (
                <div className="grid grid-cols-3 gap-2 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="h-18 bg-emerald-50/60 rounded-xl"></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center">
                    <p className="text-xl font-extrabold text-emerald-800">{viewUserStats?.credits ?? '0'}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Remaining</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 text-center">
                    <p className="text-xl font-extrabold text-teal-800">{viewUserStats?.totalSent ?? '0'}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Used</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 text-center">
                    <p className="text-xl font-extrabold text-indigo-800">{(viewUserStats?.totalSent || 0) * 2}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Messages</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setPlanModalUser(viewUser);
                  setSelectedPlan(viewUser.subscriptionPlan || "One Month");
                  setPlanSuccessMsg("");
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <Zap size={14} className="fill-white" /> Change Subscription Plan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {planModalUser && (
        <div className="fixed inset-0 md:left-[260px] z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 backdrop-blur-md bg-slate-900/50 transition-opacity" onClick={() => !updatingPlan && setPlanModalUser(null)}></div>
          <div className="relative my-auto bg-white rounded-3xl shadow-2xl w-full max-w-[460px] max-h-[92vh] overflow-y-auto flex flex-col p-6 z-10 border border-emerald-200 [scrollbar-width:none]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                  <Zap size={20} className="fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Manage User Plan</h3>
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

            {/* Current Plan Status Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Active Plan</span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  planModalUser.isSubscribed && planModalUser.subscriptionExpiresAt && new Date(planModalUser.subscriptionExpiresAt).getTime() > Date.now()
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {planModalUser.isSubscribed && planModalUser.subscriptionExpiresAt && new Date(planModalUser.subscriptionExpiresAt).getTime() > Date.now()
                    ? `Active (${planModalUser.subscriptionPlan || "Subscribed"})`
                    : "Expired / Inactive"}
                </span>
              </div>

              {planModalUser.subscriptionExpiresAt && (
                <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                  <Calendar size={12} className="text-emerald-600" />
                  <span>Expires on: <strong>{new Date(planModalUser.subscriptionExpiresAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                </div>
              )}

              {planModalUser.upcomingPlan && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock size={12} className="text-blue-500" /> Queued Next:
                  </span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {planModalUser.upcomingPlan}
                  </span>
                </div>
              )}
            </div>

            {/* Plan Selector */}
            <div className="mt-4 space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Select New Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer"
              >
                <option value="One Day">⚡ One Day (24 Hours)</option>
                <option value="One Week">📅 One Week (7 Days)</option>
                <option value="15 Days">🌟 15 Days Access</option>
                <option value="One Month">💎 One Month (30 Days)</option>
                <option value="3 Months">🚀 3 Months (90 Days)</option>
                <option value="6 Months">👑 6 Months (180 Days)</option>
                <option value="1 Year">🏆 1 Year (365 Days Premium)</option>
              </select>
            </div>

            {/* Dynamic Status / Behavior Banner */}
            <div className="mt-4 p-3.5 rounded-2xl border text-xs leading-relaxed transition-all">
              {planModalUser.isSubscribed && planModalUser.subscriptionExpiresAt && new Date(planModalUser.subscriptionExpiresAt).getTime() > Date.now() ? (
                <div className="bg-blue-50 border-blue-200 text-blue-800 -m-3.5 p-3.5 rounded-2xl">
                  <p className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Clock size={14} className="text-blue-600 shrink-0" />
                    Automatic Queueing Enabled
                  </p>
                  <p className="mt-1 text-blue-700 text-[11px]">
                    This user currently has an active plan. The new <strong>{selectedPlan}</strong> plan will be placed in their queue and will activate automatically when the current plan expires.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border-emerald-200 text-emerald-800 -m-3.5 p-3.5 rounded-2xl">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Sparkles size={14} className="text-emerald-600 shrink-0" />
                    Immediate Activation
                  </p>
                  <p className="mt-1 text-emerald-700 text-[11px]">
                    This user has no active plan. The new <strong>{selectedPlan}</strong> plan will activate immediately today with 99,999 credits and full subscribed features.
                  </p>
                </div>
              )}
            </div>

            {/* Success Feedback */}
            {planSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                <span>{planSuccessMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
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
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} /> Confirm & Apply Plan
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
