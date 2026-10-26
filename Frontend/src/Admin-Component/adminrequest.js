import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Check, X, Eye, Clock,
  IndianRupee, Crown, Zap, Building2, Smartphone, ChevronLeft, ChevronRight,
  FileText, ShieldCheck, Mail, Calendar, CreditCard, Phone, Image, ZoomIn,
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Sparkles, ExternalLink, Copy
} from "lucide-react";

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://goye-backend-bw8t.onrender.com').replace(/\/+$/, "");

const getPlanMeta = (planName = '') => {
  const lower = (planName || '').toLowerCase();
  if (lower.includes('one day') || lower.includes('1 day') || lower === 'oneday' || lower === 'day') {
    return { label: 'One Day', color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: Zap, price: 49 };
  } else if (lower.includes('one week') || lower.includes('1 week') || lower.includes('week')) {
    return { label: 'One Week', color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", icon: Zap, price: 249 };
  } else if (lower.includes('15') || lower.includes('fifteen')) {
    return { label: '15 Days', color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", icon: Zap, price: 499 };
  } else if (lower.includes('3 month') || lower.includes('three')) {
    return { label: 'Three Months', color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", icon: Crown, price: 1999 };
  } else if (lower.includes('6 month') || lower.includes('six')) {
    return { label: 'Six Months', color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff", icon: Crown, price: 3499 };
  } else if (lower.includes('18 month') || lower.includes('eighteen')) {
    return { label: '18 Months', color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", icon: Crown, price: 7299 };
  } else if (lower.includes('year') || lower.includes('1 yr')) {
    return { label: 'One Year', color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Crown, price: 5999 };
  } else if (lower.includes('month')) {
    return { label: 'One Month', color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: Building2, price: 799 };
  } else if (lower.includes('silver')) {
    return { label: 'Silver', color: "#52525b", bg: "#f4f4f5", border: "#e4e4e7", icon: Zap, price: 299 };
  } else if (lower.includes('gold')) {
    return { label: 'Gold', color: "#b45309", bg: "#fef3c7", border: "#fde68a", icon: Building2, price: 599 };
  } else if (lower.includes('demo')) {
    return { label: 'Demo Access', color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", icon: Zap, price: 0 };
  } else {
    return { label: planName || 'Custom Plan', color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: Crown, price: 49 };
  }
};

const filters = ["All", "Pending", "Approved", "Rejected"];

export default function SubscriptionRequests() {
  const [filter, setFilter] = useState("Pending");
  const [requests, setRequests] = useState(() => {
    try {
      const cached = sessionStorage.getItem("goye_subscription_requests");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [query, setQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(null);
  const [screenshotCache, setScreenshotCache] = useState({});
  const [loadingScreenshots, setLoadingScreenshots] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchScreenshotForRequest = async (id) => {
    if (!id) return null;
    if (screenshotCache[id]) return screenshotCache[id];
    setLoadingScreenshots(prev => ({ ...prev, [id]: true }));
    try {
      let res = await fetch(`${API_BASE_URL}/api/subscription-requests/${id}/screenshot`).catch(() => null);
      if (!res || !res.ok) {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          res = await fetch(`http://localhost:5000/api/subscription-requests/${id}/screenshot`).catch(() => null);
        }
      }
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.screenshot) {
          setScreenshotCache(prev => ({ ...prev, [id]: data.screenshot }));
          setRequests(prev => prev.map(r => r._id === id ? { ...r, screenshot: data.screenshot } : r));
          return data.screenshot;
        }
      }
    } catch (e) {
      console.error("Error loading screenshot:", e);
    } finally {
      setLoadingScreenshots(prev => ({ ...prev, [id]: false }));
    }
    return null;
  };

  const handleOpenScreenshot = async (r) => {
    const existing = r.screenshot || screenshotCache[r._id];
    if (existing) {
      setPreviewImage(existing);
      return;
    }
    const shot = await fetchScreenshotForRequest(r._id);
    if (shot) {
      setPreviewImage(shot);
    }
  };

  useEffect(() => {
    if (selectedRequest && selectedRequest.hasScreenshot && !selectedRequest.screenshot && !screenshotCache[selectedRequest._id]) {
      fetchScreenshotForRequest(selectedRequest._id).then(shot => {
        if (shot) {
          setSelectedRequest(prev => prev && prev._id === selectedRequest._id ? { ...prev, screenshot: shot } : prev);
        }
      });
    }
  }, [selectedRequest]);

  const fetchRequests = async (showAnim = false) => {
    if (showAnim) setIsRefreshing(true);
    try {
      let response = await fetch(`${API_BASE_URL}/api/subscription-requests`).catch(() => null);
      if (!response || !response.ok) {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          response = await fetch(`http://localhost:5000/api/subscription-requests`).catch(() => null);
        }
      }
      if (response && response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.requests)) {
          setRequests(data.requests);
          try {
            sessionStorage.setItem("goye_subscription_requests", JSON.stringify(data.requests));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Error fetching subscription requests:", err);
    } finally {
      if (showAnim) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => fetchRequests(false), 15000);
    const handleFocus = () => fetchRequests(false);
    const handleSync = () => fetchRequests(false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleSync);
    window.addEventListener("gy:subscription-request-created", handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("gy:subscription-request-created", handleSync);
    };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      let response = await fetch(`${API_BASE_URL}/api/subscription-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(() => null);
      if (!response || !response.ok) {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          response = await fetch(`http://localhost:5000/api/subscription-requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          }).catch(() => null);
        }
      }
      if (response && response.ok) {
        const data = await response.json();
        if (data.success) {
          setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status } : r));
          if (selectedRequest && selectedRequest._id === id) {
            setSelectedRequest({ ...selectedRequest, status });
          }
        }
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Connection error.");
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUpi(id);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  // Create sequential IDs based on all requests ordered chronologically
  const sortedByCreatedAtAsc = useMemo(() => {
    return [...requests].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [requests]);

  const seqIdMap = useMemo(() => {
    const map = {};
    sortedByCreatedAtAsc.forEach((req, index) => {
      if (req._id) {
        map[req._id] = `REQ-${String(index + 1).padStart(3, '0')}`;
      }
    });
    return map;
  }, [sortedByCreatedAtAsc]);

  const filtered = useMemo(() => {
    return requests
      .filter((r) => {
        const matchesFilter = filter === "All" || r.status === filter.toLowerCase();
        const matchesQuery = 
          (r.name || "").toLowerCase().includes(query.toLowerCase()) || 
          (r.email || "").toLowerCase().includes(query.toLowerCase()) || 
          (r.plan || "").toLowerCase().includes(query.toLowerCase()) ||
          (r.upiId || "").toLowerCase().includes(query.toLowerCase()) ||
          (r._id && seqIdMap[r._id] && seqIdMap[r._id].toLowerCase().includes(query.toLowerCase()));
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [requests, filter, query, seqIdMap]);

  // Paginated items
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const counts = {
    All: requests.length,
    Pending: requests.filter((r) => r.status === "pending").length,
    Approved: requests.filter((r) => r.status === "approved").length,
    Rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const totalRevenue = useMemo(() => {
    return requests
      .filter(r => r.status === "approved")
      .reduce((sum, r) => sum + getPlanMeta(r.plan).price, 0);
  }, [requests]);

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const approvedTodayCount = requests.filter(r => r.status === "approved" && isToday(r.createdAt)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-[#f8fafc] to-[#ecfdf5] font-sans text-slate-800 relative overflow-x-hidden admin-main-content">
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
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Subscription Requests</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Realtime Payments
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Review UPI payment proofs, verify receipts, and grant plan access</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRequests(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
              title="Refresh requests"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <a 
              href="/messages" 
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1.5"
            >
              <span>Back to App</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Total Requests */}
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Requests</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{requests.length}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">All incoming upgrades</p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200/60 shadow-xs">
              <FileText size={26} />
            </div>
          </div>

          {/* Pending Approval */}
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-amber-900 mt-1">{counts.Pending}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                {counts.Pending > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                <span>Requires verification</span>
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-200/60 shadow-xs">
              <Clock size={26} />
            </div>
          </div>

          {/* Approved Today */}
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-teal-500">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved Today</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-teal-900 mt-1">{approvedTodayCount}</h3>
              <p className="text-[11px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>Completed today</span>
              </p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-200/60 shadow-xs">
              <ShieldCheck size={26} />
            </div>
          </div>

          {/* Revenue (MTD) */}
          <div className="glass-card stat-card-glow p-5 flex items-center justify-between border-l-4 border-l-emerald-600">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved Revenue</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-950 mt-1">₹{totalRevenue.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">Verified upgrade value</p>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center ring-1 ring-emerald-300/60 shadow-xs">
              <IndianRupee size={26} />
            </div>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="glass-card p-4 md:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {filters.map((f) => {
              const active = filter === f;
              const count = counts[f];
              let activeClass = "bg-emerald-600 text-white shadow-md shadow-emerald-600/20";
              let badgeActiveClass = "bg-emerald-800 text-emerald-100";
              
              if (f === "Pending" && active) {
                activeClass = "bg-amber-500 text-white shadow-md shadow-amber-500/20";
                badgeActiveClass = "bg-amber-700 text-amber-100";
              } else if (f === "Rejected" && active) {
                activeClass = "bg-rose-600 text-white shadow-md shadow-rose-600/20";
                badgeActiveClass = "bg-rose-800 text-rose-100";
              }

              return (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? activeClass
                      : "bg-slate-100/90 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <span>{f}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                    active ? badgeActiveClass : "bg-slate-200 text-slate-700"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, plan, UPI, ID..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-emerald-200/80 bg-white/90 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 transition-all shadow-2xs"
            />
            {query && (
              <button 
                onClick={() => setQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Requests Table Container */}
        <div className="glass-card overflow-hidden border border-emerald-200/70 shadow-sm">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border-b border-emerald-100 text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">
                  <th className="py-4 pl-6 pr-4 w-[130px]">Request ID</th>
                  <th className="py-4 px-4 w-[240px]">User Details</th>
                  <th className="py-4 px-4 w-[160px]">Plan & Amount</th>
                  <th className="py-4 px-4 w-[170px]">UPI Ref / ID</th>
                  <th className="py-4 px-4 w-[120px]">Screenshot</th>
                  <th className="py-4 px-4 w-[170px]">Status</th>
                  <th className="py-4 pl-4 pr-6 text-right w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/80 bg-white/70">
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <FileText size={28} />
                        </div>
                        <span className="text-base font-bold text-slate-800">No {filter} Requests</span>
                        <p className="text-xs text-slate-400">
                          {query ? `No requests match "${query}". Try searching another name or UPI ID.` : `There are currently no ${filter.toLowerCase()} subscription requests.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((r) => {
                    const planMeta = getPlanMeta(r.plan);
                    const reqId = r._id && seqIdMap[r._id] ? seqIdMap[r._id] : 'REQ-NEW';
                    const requestDate = r.createdAt 
                      ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A';
                    const requestTime = r.createdAt 
                      ? new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const PlanIcon = planMeta.icon;

                    return (
                      <tr key={r._id} className="hover:bg-emerald-50/35 transition-all duration-150 group border-b border-slate-100 last:border-none">
                        
                        {/* REQUEST ID */}
                        <td className="py-3.5 pl-6 pr-4 align-middle">
                          <span className="font-mono-code text-xs font-extrabold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            {reqId}
                          </span>
                        </td>

                        {/* USER DETAILS */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-xl avatar-gradient flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                {(r.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="min-w-0 pr-1">
                              <p className="font-bold text-slate-800 text-[13px] truncate group-hover:text-emerald-700 transition-colors" title={r.name}>
                                {r.name || "Unnamed"}
                              </p>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 truncate max-w-[170px]" title={r.email}>
                                <Mail size={12} className="text-emerald-600 shrink-0" />
                                <span className="truncate">{r.email}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PLAN & AMOUNT */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="space-y-1">
                            <span 
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md border" 
                              style={{ background: planMeta.bg, color: planMeta.color, borderColor: planMeta.border }}
                            >
                              <PlanIcon size={11} />
                              {planMeta.label}
                            </span>
                            <p className="text-xs font-extrabold text-slate-900 flex items-center">
                              ₹{planMeta.price}
                            </p>
                          </div>
                        </td>

                        {/* UPI ID */}
                        <td className="py-3.5 px-4 align-middle">
                          {r.upiId ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-xl transition-all shadow-2xs group/upi">
                              <CreditCard size={12} className="text-emerald-600 shrink-0" />
                              <span className="font-mono-code text-[11px] font-bold text-slate-800 truncate max-w-[120px]" title={r.upiId}>
                                {r.upiId}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(r.upiId, r._id)}
                                className="text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
                                title={copiedUpi === r._id ? "Copied UPI!" : "Copy UPI ID"}
                              >
                                {copiedUpi === r._id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">N/A</span>
                          )}
                        </td>

                        {/* PAYMENT SCREENSHOT */}
                        <td className="py-3.5 px-4 align-middle">
                          {(r.screenshot || r.hasScreenshot || screenshotCache[r._id]) ? (
                            <button
                              type="button"
                              onClick={() => handleOpenScreenshot(r)}
                              className="relative group/thumb block rounded-xl overflow-hidden border border-emerald-200 hover:border-emerald-500 shadow-2xs transition-all focus:outline-none cursor-pointer"
                              title="Click to view payment screenshot proof"
                            >
                              {(r.screenshot || screenshotCache[r._id]) ? (
                                <img 
                                  src={r.screenshot || screenshotCache[r._id]} 
                                  alt="Payment proof" 
                                  className="w-10 h-10 object-cover rounded-xl group-hover/thumb:scale-110 transition-transform duration-200" 
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 transition">
                                  {loadingScreenshots[r._id] ? (
                                    <RefreshCw size={14} className="animate-spin text-emerald-600" />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </div>
                              )}
                              <div className="hidden w-10 h-10 bg-slate-100 rounded-xl items-center justify-center text-slate-400 text-[9px] font-bold">
                                Invalid
                              </div>
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <ZoomIn size={14} />
                              </div>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic flex items-center gap-1">
                              <Image size={12} className="text-slate-300" /> No image
                            </span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 px-4 align-middle">
                          <div>
                            <StatusBadge status={r.status} />
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              {requestDate} {requestTime && `• ${requestTime}`}
                            </p>
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 pl-4 pr-6 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Modal */}
                            <button 
                              type="button"
                              onClick={() => setSelectedRequest(r)}
                              className="p-2 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200 hover:border-teal-600 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
                              title="View Full Details"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Quick Approve / Reject for Pending */}
                            {r.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setConfirmAction({ id: r._id, status: "approved" })}
                                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
                                  title="Approve Request"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmAction({ id: r._id, status: "rejected" })}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-all duration-200 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
                                  title="Reject Request"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="bg-emerald-50/50 px-6 py-3 border-t border-emerald-100/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
            <span>Showing {paginatedRequests.length} of {filtered.length} total requests</span>
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

      {/* Modal for Request Details */}
      {selectedRequest && (
        <div className="fixed inset-0 md:left-[260px] z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 backdrop-blur-md bg-slate-900/50 transition-opacity" onClick={() => setSelectedRequest(null)}></div>
          <div className="relative my-auto bg-white rounded-3xl shadow-2xl w-full max-w-[500px] max-h-[92vh] overflow-y-auto flex flex-col p-6 z-10 border border-emerald-200 [scrollbar-width:none]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl avatar-gradient flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Request Verification</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedRequest._id && seqIdMap[selectedRequest._id] ? seqIdMap[selectedRequest._id] : 'REQ-NEW'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4">
              
              {/* User Overview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedRequest.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={12}/> {selectedRequest.email}</p>
                </div>
                <div>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>

              {/* Transaction Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan</span>
                  <p className="text-xs font-bold text-emerald-900 mt-0.5">{selectedRequest.plan}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">₹{getPlanMeta(selectedRequest.plan).price}</p>
                </div>
              </div>

              {/* UPI Section */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={11} className="text-emerald-600"/> UPI Reference / ID
                </span>
                <p className="font-mono-code text-xs font-bold text-slate-800 mt-1 break-all">
                  {selectedRequest.upiId || 'Not provided'}
                </p>
              </div>

              {/* Screenshot Proof */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Image size={11} className="text-emerald-600"/> Payment Screenshot
                  </span>
                  {(selectedRequest.screenshot || screenshotCache[selectedRequest._id]) && (
                    <button 
                      type="button"
                      onClick={() => setPreviewImage(selectedRequest.screenshot || screenshotCache[selectedRequest._id])}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <ZoomIn size={12}/> Full Preview
                    </button>
                  )}
                </div>
                {(selectedRequest.screenshot || screenshotCache[selectedRequest._id]) ? (
                  <div 
                    onClick={() => setPreviewImage(selectedRequest.screenshot || screenshotCache[selectedRequest._id])}
                    className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 max-h-56 flex items-center justify-center"
                  >
                    <img 
                      src={selectedRequest.screenshot || screenshotCache[selectedRequest._id]} 
                      alt="Payment Receipt" 
                      className="max-h-56 w-full object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden p-4 text-center text-xs text-slate-400">
                      ⚠️ Image failed to load.
                    </div>
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-bold text-xs gap-1.5">
                      <ZoomIn size={15} /> Click to Enlarge
                    </div>
                  </div>
                ) : (selectedRequest.hasScreenshot || loadingScreenshots[selectedRequest._id]) ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-emerald-100 flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-emerald-600" />
                    <span className="text-xs text-emerald-800 font-semibold">Loading payment proof image...</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-1">No payment screenshot attached.</p>
                )}
              </div>

              {/* Date & Note */}
              {selectedRequest.message && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Note</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1 whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              )}
            </div>

            {/* Modal Actions for Pending Request */}
            {selectedRequest.status === "pending" && (
              <div className="mt-5 flex gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setConfirmAction({ id: selectedRequest._id, status: "rejected" })}
                  className="flex-1 py-2.5 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition text-xs cursor-pointer"
                >
                  Reject Request
                </button>
                <button 
                  type="button"
                  onClick={() => setConfirmAction({ id: selectedRequest._id, status: "approved" })}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/30 transition text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Approve & Activate
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Large Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col items-center cursor-default"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Image size={16} className="text-emerald-400" /> Payment Screenshot Proof
              </h4>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] w-full flex items-center justify-center rounded-2xl bg-black/40 p-2">
              <img 
                src={previewImage} 
                alt="Full Screenshot Proof" 
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-white/60 text-sm py-12">
                ⚠️ Unable to display image preview.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approve / Reject */}
      {confirmAction && (
        <div className="fixed inset-0 md:left-[260px] z-[120] flex items-center justify-center p-4">
          <div className="fixed inset-0 backdrop-blur-md bg-slate-900/50" onClick={() => setConfirmAction(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center z-10 border border-emerald-200">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3.5 ${
              confirmAction.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {confirmAction.status === 'approved' ? <Check size={24} /> : <X size={24} />}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              {confirmAction.status === 'approved' ? 'Approve Subscription Request' : 'Reject Subscription Request'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 font-medium leading-relaxed">
              {confirmAction.status === 'approved' 
                ? "This will activate the user's subscription and award full member benefits immediately." 
                : "This request will be marked as rejected."}
            </p>
            <div className="flex gap-2.5">
              <button 
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const { id, status } = confirmAction;
                  setConfirmAction(null);
                  await updateStatus(id, status);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-white transition text-xs shadow-md cursor-pointer ${
                  confirmAction.status === 'approved' 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                }`}
              >
                {confirmAction.status === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pending", bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" },
    approved: { label: "Approved", bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
    rejected: { label: "Rejected", bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e" },
  };
  const s = map[status] || map.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shadow-xs" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}