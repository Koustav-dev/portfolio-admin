import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  LayoutDashboard, FolderOpen, Briefcase, MessageSquare,
  LogOut, Menu, X, Plus, Pencil, Trash2, Star, Mail,
  MailOpen, Eye, EyeOff, ChevronRight, AlertCircle,
  CheckCircle, Loader2, Search, Filter, ExternalLink,
  Github, RefreshCw, Lock, User, Shield
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3001/api";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Admin   { id: string; email: string; name: string; }
interface Project {
  id: string; title: string; slug: string; description: string;
  longDescription: string | null; coverImage: string | null;
  liveUrl: string | null; githubUrl: string | null;
  techStack: string[]; category: "WEB"|"MOBILE"|"DESIGN"|"AI";
  featured: boolean; order: number; createdAt: string;
}
interface Experience {
  id: string; company: string; role: string; description: string;
  startDate: string; endDate: string | null; techUsed: string[];
  companyLogo: string | null; order: number;
}
interface Message {
  id: string; name: string; email: string; message: string;
  read: boolean; starred: boolean; createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// AUTH CONTEXT
// ═══════════════════════════════════════════════════════════════
const AuthCtx = createContext<{
  admin: Admin|null; token: string|null;
  login: (e:string,p:string) => Promise<void>;
  logout: () => void; loading: boolean;
} | null>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin,   setAdmin]   = useState<Admin|null>(null);
  const [token,   setToken]   = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("ap_token");
    const a = localStorage.getItem("ap_admin");
    if (t && a) { setToken(t); setAdmin(JSON.parse(a)); }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const r = await fetch(`${BASE}/admin/login`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!j.success) throw new Error(j.error || "Invalid credentials");
    setAdmin(j.data.admin); setToken(j.data.accessToken);
    localStorage.setItem("ap_token",   j.data.accessToken);
    localStorage.setItem("ap_refresh", j.data.refreshToken);
    localStorage.setItem("ap_admin",   JSON.stringify(j.data.admin));
  };

  const logout = useCallback(() => {
    setAdmin(null); setToken(null);
    ["ap_token","ap_refresh","ap_admin"].forEach(k => localStorage.removeItem(k));
  }, []);

  return <AuthCtx.Provider value={{ admin, token, login, logout, loading }}>{children}</AuthCtx.Provider>;
};

const useAuth = () => { const c = useContext(AuthCtx); if(!c) throw new Error("no auth"); return c; };

// ═══════════════════════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════════════════════
async function api<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${token}`, ...opts?.headers },
    ...opts,
  });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "Request failed");
  return j.data;
}

async function apiForm<T>(path: string, token: string, method: string, body: FormData): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { "Authorization":`Bearer ${token}` }, body,
  });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "Request failed");
  return j.data;
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
const Spinner = ({ size=16 }: { size?: number }) => (
  <Loader2 size={size} className="animate-spin" />
);

const Badge = ({ children, color="default" }: { children: ReactNode; color?: string }) => {
  const colors: Record<string,string> = {
    default: "bg-white/8 text-white/60 border-white/10",
    primary: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    green:   "bg-green-500/15 text-green-300 border-green-500/25",
    amber:   "bg-amber-500/15 text-amber-300 border-amber-500/25",
    red:     "bg-red-500/15 text-red-300 border-red-500/25",
    blue:    "bg-blue-500/15 text-blue-300 border-blue-500/25",
    pink:    "bg-pink-500/15 text-pink-300 border-pink-500/25",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border ${colors[color] ?? colors.default}`}>
      {children}
    </span>
  );
};

const CAT_COLOR: Record<string,string> = { WEB:"primary", MOBILE:"blue", DESIGN:"pink", AI:"amber" };
const CAT_LABEL: Record<string,string> = { WEB:"Web App", MOBILE:"Mobile", DESIGN:"Design", AI:"AI/SaaS" };

// Toast
let _toast: ((msg:string,type?:"success"|"error") => void) | null = null;
const toast = (msg:string, type:"success"|"error"="success") => _toast?.(msg,type);

const ToastContainer = () => {
  const [toasts, setToasts] = useState<{id:number;msg:string;type:string}[]>([]);
  useEffect(() => {
    _toast = (msg,type="success") => {
      const id = Date.now();
      setToasts(p => [...p, {id,msg,type}]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
    };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] font-medium shadow-xl backdrop-blur-xl pointer-events-auto
          ${t.type==="success" ? "bg-green-500/15 border-green-500/25 text-green-300" : "bg-red-500/15 border-red-500/25 text-red-300"}`}>
          {t.type==="success" ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
          {t.msg}
        </div>
      ))}
    </div>
  );
};

// Confirm dialog
const ConfirmDialog = ({ message, onConfirm, onCancel }: { message:string; onConfirm:()=>void; onCancel:()=>void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}/>
    <div className="relative bg-[#13131f] border border-white/10 rounded-2xl p-6 w-[360px] shadow-2xl">
      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle size={18} className="text-red-400"/>
      </div>
      <p className="text-[14px] text-white/80 mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-[13px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-all">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl text-[13px] bg-red-500/20 hover:bg-red-500/30 border border-red-500/25 text-red-300 transition-all font-medium">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// Input
const Input = ({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">{label}</label>}
    <input {...props} className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all ${error ? "border-red-500/40" : "border-white/10 focus:border-violet-500/30"} ${props.className??""}`}/>
    {error && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle size={10}/>{error}</p>}
  </div>
);

const Textarea = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">{label}</label>}
    <textarea {...props} className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 resize-none transition-all ${props.className??""}`}/>
  </div>
);

const Select = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">{label}</label>}
    <select {...props} className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1a2e] border border-white/10 text-[13px] text-white/90 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all">
      {children}
    </select>
  </div>
);

// Tag input for techStack / techUsed
const TagInput = ({ label, tags, onChange }: { label:string; tags:string[]; onChange:(t:string[])=>void }) => {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) { onChange([...tags, v]); setInput(""); }
  };
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300">
            {t}
            <button onClick={() => onChange(tags.filter(x=>x!==t))} className="text-violet-400/60 hover:text-red-400 transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); add(); }}}
          placeholder="Type and press Enter"
          className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
        />
        <button onClick={add} className="px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/25 text-violet-300 text-[12px] transition-all">Add</button>
      </div>
    </div>
  );
};

// Modal wrapper
const Modal = ({ title, onClose, children, wide=false }: { title:string; onClose:()=>void; children:ReactNode; wide?:boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}/>
    <div className={`relative bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <h3 className="text-[15px] font-semibold text-white/90">{title}</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition-all">
          <X size={14}/>
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">{children}</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════
const LoginPage = () => {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try { await login(email, password); }
    catch(err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-violet-600/8 blur-[100px]"/>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-blue-600/6 blur-[80px]"/>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize:"28px 28px" }}
        />
      </div>

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 mb-4">
            <Shield size={20} className="text-violet-400"/>
          </div>
          <h1 className="text-xl font-bold text-white/90 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-[13px] text-white/35 mt-1">
            Koustav Paul · Portfolio CMS
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">Email</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="hello@eraf.dev"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"/>
              <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
              />
              <button type="button" onClick={()=>setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400">
              <AlertCircle size={13}/> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30 text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Spinner size={14}/>Signing in...</> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[11px] text-white/20 mt-5">
          Admin access only · Portfolio CMS v1.0
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
type Page = "dashboard" | "projects" | "experience" | "messages";

const Sidebar = ({ page, setPage, open, setOpen }: {
  page: Page; setPage: (p:Page)=>void; open:boolean; setOpen:(v:boolean)=>void;
}) => {
  const { admin, logout } = useAuth();

  const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { id:"dashboard",  label:"Dashboard",  icon:LayoutDashboard },
    { id:"projects",   label:"Projects",   icon:FolderOpen      },
    { id:"experience", label:"Experience", icon:Briefcase       },
    { id:"messages",   label:"Messages",   icon:MessageSquare   },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={()=>setOpen(false)}/>}

      <aside className={`fixed left-0 top-0 bottom-0 z-40 w-56 bg-[#0a0a14] border-r border-white/8 flex flex-col transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Shield size={13} className="text-violet-400"/>
            </div>
            <div>
              <p className="text-[13px] font-bold text-white/90 leading-none">Portfolio</p>
              <p className="text-[10px] text-white/35 mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ id, label, icon:Icon }) => (
            <button key={id} onClick={() => { setPage(id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group
                ${page===id
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"}`}>
              <Icon size={15} className={page===id ? "text-violet-400" : "text-white/30 group-hover:text-white/60"}/>
              {label}
              {page===id && <ChevronRight size={12} className="ml-auto text-violet-400/60"/>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-white/8 pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8 mb-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/25 flex items-center justify-center text-[11px] font-bold text-violet-400">
              {admin?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/80 truncate">{admin?.name}</p>
              <p className="text-[10px] text-white/30 truncate">{admin?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-all">
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════
const DashboardPage = ({ setPage }: { setPage:(p:Page)=>void }) => {
  const { token, admin } = useAuth();
  const [stats, setStats] = useState({ projects:0, experience:0, messages:0, unread:0 });
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${BASE}/projects?limit=1`, { headers:{"Authorization":`Bearer ${token}`} }).then(r=>r.json()),
      fetch(`${BASE}/experience?limit=1`, { headers:{"Authorization":`Bearer ${token}`} }).then(r=>r.json()),
      fetch(`${BASE}/contact?limit=5`, { headers:{"Authorization":`Bearer ${token}`} }).then(r=>r.json()),
      fetch(`${BASE}/contact?read=false&limit=1`, { headers:{"Authorization":`Bearer ${token}`} }).then(r=>r.json()),
    ]).then(([p, e, m, u]) => {
      setStats({
        projects:   p.meta?.total ?? 0,
        experience: e.meta?.total ?? 0,
        messages:   m.meta?.total ?? 0,
        unread:     u.meta?.total ?? 0,
      });
      setRecentMessages(m.data?.slice(0,4) ?? []);
    }).finally(() => setLoading(false));
  }, [token]);

  const statCards = [
    { label:"Projects",   value:stats.projects,   icon:FolderOpen,    color:"violet", page:"projects"   as Page },
    { label:"Experience", value:stats.experience, icon:Briefcase,     color:"blue",   page:"experience" as Page },
    { label:"Messages",   value:stats.messages,   icon:MessageSquare, color:"green",  page:"messages"   as Page },
    { label:"Unread",     value:stats.unread,     icon:Mail,          color:"amber",  page:"messages"   as Page },
  ];

  const colorMap: Record<string,string> = {
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    blue:   "bg-blue-500/10   border-blue-500/20   text-blue-400",
    green:  "bg-green-500/10  border-green-500/20  text-green-400",
    amber:  "bg-amber-500/10  border-amber-500/20  text-amber-400",
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white/90 tracking-tight">
          Welcome back, {admin?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-[13px] text-white/35 mt-1">Here's what's happening with your portfolio.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon:Icon, color, page }) => (
          <button key={label} onClick={() => setPage(page)}
            className={`p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/15 hover:bg-white/[0.05] transition-all text-left group`}>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon size={16}/>
            </div>
            <p className="text-2xl font-bold text-white/90">
              {loading ? <span className="inline-block w-8 h-6 bg-white/8 rounded animate-pulse"/> : value}
            </p>
            <p className="text-[12px] text-white/35 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Recent messages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white/80">Recent Messages</h2>
          <button onClick={() => setPage("messages")}
            className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors">
            View all →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse"/>)}
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-white/25">No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {recentMessages.map(msg => (
              <div key={msg.id} onClick={() => setPage("messages")}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 cursor-pointer transition-all group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5
                  ${msg.read ? "bg-white/5 text-white/30" : "bg-violet-500/20 text-violet-400"}`}>
                  {msg.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] font-medium truncate ${msg.read ? "text-white/50" : "text-white/85"}`}>{msg.name}</p>
                    <p className="text-[10px] text-white/25 shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-[12px] text-white/35 truncate mt-0.5">{msg.message}</p>
                </div>
                {!msg.read && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0"/>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROJECT FORM MODAL
// ═══════════════════════════════════════════════════════════════
const ProjectModal = ({ project, onClose, onSaved }: {
  project?: Project; onClose:()=>void; onSaved:()=>void;
}) => {
  const { token } = useAuth();
  const isEdit = !!project;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title:           project?.title           ?? "",
    slug:            project?.slug            ?? "",
    description:     project?.description     ?? "",
    longDescription: project?.longDescription ?? "",
    liveUrl:         project?.liveUrl         ?? "",
    githubUrl:       project?.githubUrl       ?? "",
    category:        project?.category        ?? "WEB",
    order:           String(project?.order    ?? 0),
    featured:        project?.featured        ?? false,
    techStack:       project?.techStack       ?? [],
  });

  const set = (k: string, v: any) => setForm(p => ({...p, [k]:v}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => {
        if (k === "techStack") (v as string[]).forEach(t => fd.append("techStack", t));
        else if (k === "featured") fd.append(k, String(v));
        else fd.append(k, String(v));
      });
      const url    = isEdit ? `${BASE}/projects/${project!.id}` : `${BASE}/projects`;
      const method = isEdit ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers:{"Authorization":`Bearer ${token}`}, body:fd });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      toast(isEdit ? "Project updated!" : "Project created!");
      onSaved();
    } catch(err:any) {
      toast(err.message, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal title={isEdit ? "Edit Project" : "New Project"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Title" value={form.title} onChange={e=>set("title",e.target.value)} required placeholder="Aura Motion Portfolio"/>
          <Input label="Slug" value={form.slug} onChange={e=>set("slug",e.target.value)} required placeholder="aura-motion-portfolio"/>
        </div>
        <Textarea label="Short Description" value={form.description} onChange={e=>set("description",e.target.value)} required rows={2} placeholder="A brief description..."/>
        <Textarea label="Long Description (optional)" value={form.longDescription??""} onChange={e=>set("longDescription",e.target.value)} rows={3} placeholder="Full details..."/>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Live URL" value={form.liveUrl??""} onChange={e=>set("liveUrl",e.target.value)} placeholder="https://..."/>
          <Input label="GitHub URL" value={form.githubUrl??""} onChange={e=>set("githubUrl",e.target.value)} placeholder="https://github.com/..."/>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Select label="Category" value={form.category} onChange={e=>set("category",e.target.value)}>
            <option value="WEB">Web App</option>
            <option value="MOBILE">Mobile</option>
            <option value="DESIGN">Design</option>
            <option value="AI">AI / SaaS</option>
          </Select>
          <Input label="Order" type="number" value={form.order} onChange={e=>set("order",e.target.value)} min="0"/>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">Featured</label>
            <button type="button" onClick={() => set("featured", !form.featured)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition-all text-left
                ${form.featured ? "bg-violet-500/15 border-violet-500/25 text-violet-300" : "bg-white/5 border-white/10 text-white/40"}`}>
              {form.featured ? "✓ Featured" : "Not Featured"}
            </button>
          </div>
        </div>
        <TagInput label="Tech Stack" tags={form.techStack} onChange={t=>set("techStack",t)}/>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-[13px] text-white/50 transition-all">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30 text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <><Spinner size={13}/> Saving...</> : isEdit ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROJECTS PAGE
// ═══════════════════════════════════════════════════════════════
const ProjectsPage = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<"create"|Project|null>(null);
  const [confirm,  setConfirm]  = useState<string|null>(null);
  const [search,   setSearch]   = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/projects?limit=50`, { headers:{"Authorization":`Bearer ${token}`} });
      const j = await r.json();
      setProjects(j.data ?? []);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api(`/projects/${id}`, token, { method:"DELETE" });
      toast("Project deleted");
      load();
    } catch(err:any) { toast(err.message,"error"); }
    setConfirm(null);
  };

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Projects</h1>
          <p className="text-[13px] text-white/35 mt-0.5">{projects.length} total projects</p>
        </div>
        <button onClick={() => setModal("create")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30 text-[13px] font-semibold text-white transition-all">
          <Plus size={14}/> New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/80"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-[13px] text-black/80 placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/25 transition-all"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i=><div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-white/25">No projects found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(project => (
            <div key={project.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/12 transition-all group">
              {/* Cover thumb */}
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden">
                {project.coverImage
                  ? <img src={project.coverImage} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-transparent"/>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-medium text-white/85 truncate">{project.title}</p>
                  {project.featured && <Badge color="amber">Featured</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={CAT_COLOR[project.category]}>{CAT_LABEL[project.category]}</Badge>
                  <span className="text-[11px] text-white/25 truncate hidden sm:block">{project.slug}</span>
                </div>
              </div>

              {/* Tech tags */}
              <div className="hidden lg:flex items-center gap-1.5 flex-wrap max-w-[200px]">
                {project.techStack.slice(0,3).map(t=>(
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/8">{t}</span>
                ))}
                {project.techStack.length > 3 && <span className="text-[10px] text-white/25">+{project.techStack.length-3}</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/8 transition-all">
                    <ExternalLink size={13}/>
                  </a>
                )}
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/8 transition-all">
                    <Github size={13}/>
                  </a>
                )}
                <button onClick={() => setModal(project)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                  <Pencil size={13}/>
                </button>
                <button onClick={() => setConfirm(project.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          project={modal === "create" ? undefined : modal as Project}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message="Are you sure you want to delete this project? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXPERIENCE FORM MODAL
// ═══════════════════════════════════════════════════════════════
const ExperienceModal = ({ exp, onClose, onSaved }: {
  exp?: Experience; onClose:()=>void; onSaved:()=>void;
}) => {
  const { token } = useAuth();
  const isEdit = !!exp;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company:     exp?.company     ?? "",
    role:        exp?.role        ?? "",
    description: exp?.description ?? "",
    startDate:   exp?.startDate   ? exp.startDate.slice(0,10) : "",
    endDate:     exp?.endDate     ? exp.endDate.slice(0,10)   : "",
    isCurrent:   !exp?.endDate,
    order:       String(exp?.order ?? 0),
    techUsed:    exp?.techUsed    ?? [],
  });

  const set = (k: string, v: any) => setForm(p => ({...p, [k]:v}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("company",     form.company);
      fd.append("role",        form.role);
      fd.append("description", form.description);
      fd.append("startDate",   form.startDate);
      fd.append("order",       form.order);
      if (!form.isCurrent && form.endDate) fd.append("endDate", form.endDate);
      form.techUsed.forEach(t => fd.append("techUsed", t));

      const url    = isEdit ? `${BASE}/experience/${exp!.id}` : `${BASE}/experience`;
      const method = isEdit ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers:{"Authorization":`Bearer ${token}`}, body:fd });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      toast(isEdit ? "Experience updated!" : "Experience created!");
      onSaved();
    } catch(err:any) {
      toast(err.message, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal title={isEdit ? "Edit Experience" : "New Experience"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company" value={form.company} onChange={e=>set("company",e.target.value)} required placeholder="Google"/>
          <Input label="Role / Title" value={form.role} onChange={e=>set("role",e.target.value)} required placeholder="Senior Frontend Engineer"/>
        </div>
        <Textarea label="Description" value={form.description} onChange={e=>set("description",e.target.value)} required rows={3} placeholder="What you did here..."/>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} required/>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-white/40 tracking-wider uppercase">End Date</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isCurrent} onChange={e=>set("isCurrent",e.target.checked)} className="rounded accent-violet-500"/>
                <span className="text-[12px] text-white/50">Currently working here</span>
              </label>
              {!form.isCurrent && (
                <input type="date" value={form.endDate} onChange={e=>set("endDate",e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all"
                />
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Display Order" type="number" value={form.order} onChange={e=>set("order",e.target.value)} min="0"/>
        </div>
        <TagInput label="Technologies Used" tags={form.techUsed} onChange={t=>set("techUsed",t)}/>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-[13px] text-white/50 transition-all">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30 text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <><Spinner size={13}/> Saving...</> : isEdit ? "Save Changes" : "Add Experience"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXPERIENCE PAGE
// ═══════════════════════════════════════════════════════════════
const ExperiencePage = () => {
  const { token } = useAuth();
  const [items,   setItems]   = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<"create"|Experience|null>(null);
  const [confirm, setConfirm] = useState<string|null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/experience?limit=50`, { headers:{"Authorization":`Bearer ${token}`} });
      const j = await r.json();
      setItems(j.data ?? []);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api(`/experience/${id}`, token, { method:"DELETE" });
      toast("Experience deleted");
      load();
    } catch(err:any) { toast(err.message,"error"); }
    setConfirm(null);
  };

  const formatPeriod = (start: string, end: string|null) =>
    `${new Date(start).getFullYear()} — ${end ? new Date(end).getFullYear() : "Present"}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Experience</h1>
          <p className="text-[13px] text-white/35 mt-0.5">{items.length} entries</p>
        </div>
        <button onClick={() => setModal("create")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30 text-[13px] font-semibold text-white transition-all">
          <Plus size={14}/> Add Experience
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 rounded-xl bg-white/3 animate-pulse"/>)}</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-white/25">No experience entries yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id}
              className="p-5 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/12 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[14px] font-semibold text-white/85">{item.role}</p>
                    {!item.endDate && <Badge color="green">Current</Badge>}
                  </div>
                  <p className="text-[13px] text-violet-400/80 font-medium mb-1">{item.company}</p>
                  <p className="text-[11px] text-white/30 mb-2">{formatPeriod(item.startDate, item.endDate)}</p>
                  <p className="text-[12px] text-white/45 leading-relaxed line-clamp-2">{item.description}</p>
                  {item.techUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.techUsed.map(t=>(
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/35 border border-white/8">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setModal(item)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                    <Pencil size={14}/>
                  </button>
                  <button onClick={() => setConfirm(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ExperienceModal
          exp={modal === "create" ? undefined : modal as Experience}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message="Delete this experience entry? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MESSAGE DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
const MessageModal = ({ msg, onClose, onUpdate }: {
  msg: Message; onClose:()=>void; onUpdate:(m:Message)=>void;
}) => {
  const { token } = useAuth();

  const markRead = async () => {
    if (!token) return;
    try {
      await api(`/contact/${msg.id}`, token, { method:"PATCH", body:JSON.stringify({read:true}) });
      onUpdate({ ...msg, read:true });
    } catch {}
  };

  useEffect(() => { if (!msg.read) markRead(); }, []);

  const toggleStar = async () => {
    if (!token) return;
    try {
      await api(`/contact/${msg.id}`, token, { method:"PATCH", body:JSON.stringify({starred:!msg.starred}) });
      onUpdate({ ...msg, starred:!msg.starred });
    } catch(err:any) { toast(err.message,"error"); }
  };

  return (
    <Modal title="Message" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-white/90">{msg.name}</p>
            <a href={`mailto:${msg.email}`} className="text-[13px] text-violet-400 hover:text-violet-300 transition-colors">{msg.email}</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleStar}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${msg.starred ? "text-amber-400 bg-amber-500/10" : "text-white/25 hover:text-amber-400 hover:bg-amber-500/10"}`}>
              <Star size={14} fill={msg.starred ? "currentColor" : "none"}/>
            </button>
            <a href={`mailto:${msg.email}?subject=Re: Your message`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/20 text-[12px] text-violet-300 transition-all">
              Reply <ExternalLink size={11}/>
            </a>
          </div>
        </div>

        <div className="text-[11px] text-white/25">
          {new Date(msg.createdAt).toLocaleString("en-IN", { dateStyle:"long", timeStyle:"short" })}
        </div>

        <div className="p-4 rounded-xl bg-white/3 border border-white/8">
          <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        </div>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// MESSAGES PAGE
// ═══════════════════════════════════════════════════════════════
const MessagesPage = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all"|"unread"|"starred">("all");
  const [selected, setSelected] = useState<Message|null>(null);
  const [confirm,  setConfirm]  = useState<string|null>(null);
  const [total,    setTotal]    = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit:"50" });
      if (filter === "unread")  params.set("read","false");
      if (filter === "starred") params.set("starred","true");
      const r = await fetch(`${BASE}/contact?${params}`, { headers:{"Authorization":`Bearer ${token}`} });
      const j = await r.json();
      setMessages(j.data ?? []);
      setTotal(j.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api(`/contact/${id}`, token, { method:"DELETE" });
      toast("Message deleted");
      setMessages(p => p.filter(m=>m.id!==id));
    } catch(err:any) { toast(err.message,"error"); }
    setConfirm(null);
  };

  const updateMessage = (updated: Message) => {
    setMessages(p => p.map(m => m.id===updated.id ? updated : m));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const toggleStar = async (msg: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await api(`/contact/${msg.id}`, token, { method:"PATCH", body:JSON.stringify({starred:!msg.starred}) });
      updateMessage({ ...msg, starred:!msg.starred });
    } catch(err:any) { toast(err.message,"error"); }
  };

  const filterBtns: { id:"all"|"unread"|"starred"; label:string }[] = [
    { id:"all",     label:"All"     },
    { id:"unread",  label:"Unread"  },
    { id:"starred", label:"Starred" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Messages</h1>
          <p className="text-[13px] text-white/35 mt-0.5">{total} total messages</p>
        </div>
        <button onClick={load} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/6 border border-white/8 transition-all">
          <RefreshCw size={13}/>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-white/3 rounded-xl border border-white/8 w-fit">
        {filterBtns.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              filter===id ? "bg-violet-500/20 text-violet-300 border border-violet-500/20" : "text-white/35 hover:text-white/60"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse"/>)}</div>
      ) : messages.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-white/25">No messages here.</div>
      ) : (
        <div className="space-y-1.5">
          {messages.map(msg => (
            <div key={msg.id} onClick={() => setSelected(msg)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all group
                ${msg.read ? "bg-white/[0.02] border-white/6 hover:border-white/12" : "bg-violet-500/[0.04] border-violet-500/12 hover:border-violet-500/20"}`}>

              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5
                ${msg.read ? "bg-white/6 text-white/35" : "bg-violet-500/20 text-violet-400"}`}>
                {msg.name[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className={`text-[13px] font-medium truncate ${msg.read ? "text-white/55" : "text-white/90"}`}>{msg.name}</p>
                  <p className="text-[10px] text-white/25 shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-[11px] text-white/30 truncate mb-0.5">{msg.email}</p>
                <p className={`text-[12px] truncate ${msg.read ? "text-white/30" : "text-white/55"}`}>{msg.message}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e=>toggleStar(msg,e)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${msg.starred?"text-amber-400":"text-white/25 hover:text-amber-400"}`}>
                  <Star size={12} fill={msg.starred?"currentColor":"none"}/>
                </button>
                <button onClick={e=>{e.stopPropagation();setConfirm(msg.id)}}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={12}/>
                </button>
              </div>

              {!msg.read && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"/>}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <MessageModal
          msg={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateMessage}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message="Delete this message permanently?"
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════════════════════════════
const AdminLayout = () => {
  const [page,       setPage]       = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageComponents: Record<Page, ReactNode> = {
    dashboard:  <DashboardPage setPage={setPage}/>,
    projects:   <ProjectsPage/>,
    experience: <ExperiencePage/>,
    messages:   <MessagesPage/>,
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen}/>

      {/* Main content */}
      <div className="md:pl-56">
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#080810]/80 backdrop-blur sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/8 transition-all">
            <Menu size={16}/>
          </button>
          <p className="text-[14px] font-semibold text-white/80 capitalize">{page}</p>
        </div>

        <main className="px-6 py-8 max-w-5xl">
          {pageComponents[page]}
        </main>
      </div>

      <ToastContainer/>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
const AdminApp = () => {
  const { admin, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-violet-400"/>
    </div>
  );

  return admin ? <AdminLayout/> : <LoginPage/>;
};

export default function App() {
  return (
    <AuthProvider>
      <AdminApp/>
    </AuthProvider>
  );
}
