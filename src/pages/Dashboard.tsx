import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Bot,
    MessageCircle,
    Settings,
    ShieldAlert,
    SignalHigh,
    User,
    Power,
    Plus,
    Trash2,
    Save,
    Link2,
    Users,
    Send,
    Eye,
    EyeOff,
    RefreshCw,
    X,
    Check,
    AlertTriangle,
} from "lucide-react";

/* ────────────────────────── Types ────────────────────────── */
interface Trigger {
    id: number;
    keyword: string;
    replyMessage: string;
    enabled: boolean;
}

interface Stats {
    followers: number;
    totalDmsSent: number;
    totalLinksSent: number;
    totalPublicReplies: number;
    dmsSentToday: number;
    failedDms: number;
}

interface LogEntry {
    id: number;
    user: string;
    keyword: string;
    time: string;
    status: string;
    trigger: string;
}

interface SettingsData {
    botEnabled: boolean;
    instagramHandle: string;
    instagramAccountId: string;
    pageAccessToken: string;
    appSecret: string;
    verifyToken: string;
    defaultReplyMessage: string;
    fallbackPublicReply: string;
    successPublicReply: string;
    replyDelay: number;
    timezone: string;
}

type Tab = "overview" | "autoreplies" | "settings";

/* ────────────────────────── Helpers ─────────────────────── */
const inputCls =
    "w-full border border-border rounded-xl px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/40 transition-shadow text-sm";

/* ════════════════════════ Component ═════════════════════════ */
export default function Dashboard() {
    const navigate = useNavigate();

    const [tab, setTab] = useState<Tab>("overview");
    const [loading, setLoading] = useState(true);

    // Data
    const [stats, setStats] = useState<Stats | null>(null);
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [activity, setActivity] = useState<LogEntry[]>([]);
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [botEnabled, setBotEnabled] = useState(true);
    const [connected, setConnected] = useState(false);

    // UI states
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [addingTrigger, setAddingTrigger] = useState(false);
    const [newKeyword, setNewKeyword] = useState("");
    const [newReply, setNewReply] = useState("");
    const [showToken, setShowToken] = useState(false);
    const [syncing, setSyncing] = useState(false);

    /* ── Auth helper ─────────────────────────────────────────── */
    const { signOut, session } = useAuth();
    const authFetch = useCallback((url: string, options: RequestInit = {}) => {
        const token = session?.access_token;
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
        });
    }, [session]);

    /* ── Fetch all ───────────────────────────────────────────── */
    const fetchAll = useCallback(async () => {
        try {
            const [dashRes, settingsRes] = await Promise.all([
                authFetch("/api/dashboard").then((r) => r.json()),
                authFetch("/api/settings").then((r) => r.json()),
            ]);
            setStats(dashRes.stats);
            setTriggers(dashRes.triggers);
            setActivity(dashRes.activityLog);
            setBotEnabled(dashRes.botEnabled);
            setConnected(dashRes.connected);
            setSettings(settingsRes);
        } catch (e) {
            console.error("Fetch failed", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Handle Instagram OAuth callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const igStatus = params.get("instagram");
        if (igStatus === "connected") {
            const handle = params.get("handle") || "";
            setConnected(true);
            fetchAll();
            window.history.replaceState({}, "", "/dashboard");
        } else if (igStatus === "error") {
            const reason = params.get("reason") || "unknown";
            // auth error logged server-side
            window.history.replaceState({}, "", "/dashboard");
        }
    }, []);

    /* ── Handlers ────────────────────────────────────────────── */
    const handleLogout = async () => {
        await signOut();
        navigate("/signup");
    };

    const toggleBot = async () => {
        const next = !botEnabled;
        setBotEnabled(next);
        await authFetch("/api/settings", {
            method: "PUT",
            body: JSON.stringify({ botEnabled: next }),
        });
    };

    const saveSettings = async () => {
        if (!settings) return;
        await authFetch("/api/settings", {
            method: "PUT",
            body: JSON.stringify(settings),
        });
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
    };

    const addTrigger = async () => {
        if (!newKeyword.trim()) return;
        const res = await authFetch("/api/triggers", {
            method: "POST",
            body: JSON.stringify({ keyword: newKeyword.trim(), replyMessage: newReply.trim() }),
        });
        const t = await res.json();
        setTriggers((prev) => [...prev, t]);
        setNewKeyword("");
        setNewReply("");
        setAddingTrigger(false);
    };

    const deleteTrigger = async (id: number) => {
        await authFetch(`/api/triggers/${id}`, { method: "DELETE" });
        setTriggers((prev) => prev.filter((t) => t.id !== id));
    };

    const toggleTrigger = async (id: number) => {
        const t = triggers.find((t) => t.id === id);
        if (!t) return;
        const res = await authFetch(`/api/triggers/${id}`, {
            method: "PUT",
            body: JSON.stringify({ enabled: !t.enabled }),
        });
        const updated = await res.json();
        setTriggers((prev) => prev.map((t) => (t.id === id ? updated : t)));
    };

    const connectInstagram = async () => {
        try {
            const res = await authFetch("/auth/instagram");
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) {
            console.error("Connect failed", e);
        }
    };

    const disconnectInstagram = async () => {
        if (!confirm("Disconnect your Instagram account? The bot will stop working.")) return;
        await authFetch("/auth/instagram/disconnect", { method: "POST" });
        setConnected(false);
        if (settings) setSettings({ ...settings, instagramAccountId: "", instagramHandle: "", pageAccessToken: "" });
    };

    const syncProfile = async () => {
        setSyncing(true);
        try {
            const res = await authFetch("/api/instagram/profile");
            if (res.ok) {
                const profile = await res.json();
                if (settings) {
                    setSettings({ ...settings, instagramHandle: `@${profile.username}` });
                }
                setStats((prev) => prev ? { ...prev, followers: profile.followers_count || 0 } : prev);
            }
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setSyncing(false);
        }
    };

    /* ── Loading screen ──────────────────────────────────────── */
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-accent-blue border-t-transparent animate-spin"></div>
            </div>
        );
    }

    /* ── Sidebar nav items ───────────────────────────────────── */
    const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "overview", label: "Overview", icon: <Activity className="w-5 h-5" /> },
        { key: "autoreplies", label: "Auto-Replies", icon: <MessageCircle className="w-5 h-5" /> },
        { key: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
    ];

    /* ════════════════════════ Render ══════════════════════════ */
    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* ── Sidebar ────────────────────────────────────────── */}
            <aside className="w-full md:w-64 bg-card border-r border-border md:min-h-screen flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-border">
                    <Link to="/" className="inline-flex items-center gap-2.5 group">
                      <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="10" fill="#5b5ef4" fillOpacity="0.15" />
                        <path d="M10 27 L19 13" stroke="#5b5ef4" strokeWidth="3.8" strokeLinecap="round" />
                        <path d="M17 27 L26 13" stroke="#5b5ef4" strokeWidth="3.8" strokeLinecap="round" />
                        <circle cx="29" cy="27" r="3" fill="#5b5ef4" />
                      </svg>
                      <span className="text-lg font-extrabold tracking-tight text-foreground group-hover:text-accent-blue transition-colors">
                        DM<span className="text-accent-blue">Genie</span>
                      </span>
                    </Link
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key)}
                            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium transition-colors text-left cursor-pointer ${tab === item.key
                                ? "bg-accent-blue/10 text-accent-blue"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                        <User className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main Content ───────────────────────────────────── */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                {tab === "overview" && "Dashboard Overview"}
                                {tab === "autoreplies" && "Auto-Reply Configuration"}
                                {tab === "settings" && "Settings"}
                            </h1>
                            <p className="text-muted-foreground">
                                {tab === "overview" && "Your Instagram DM automation at a glance."}
                                {tab === "autoreplies" && "Add and manage keyword triggers and custom replies."}
                                {tab === "settings" && "Configure your Meta API connection and preferences."}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl shadow-sm">
                            <div className={`w-3 h-3 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`}></div>
                            <span className="text-sm font-medium">{connected ? "Meta API Connected" : "Meta API Disconnected"}</span>
                        </div>
                    </div>

                    {/* ═══════════════ OVERVIEW TAB ═══════════════════ */}
                    {tab === "overview" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            {!connected && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-amber-700 dark:text-amber-400">Action Required: Connect Instagram</h3>
                                        <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                                            Go to Settings → connect your Instagram account to activate automated DMs.
                                        </p>
                                        <button onClick={() => setTab("settings")} className="mt-3 bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors cursor-pointer">
                                            Go to Settings
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <StatCard icon={<Users className="w-6 h-6 text-accent-blue" />} bg="bg-accent-blue/10" label="Followers" value={stats?.followers.toLocaleString() ?? "0"} />
                                <StatCard icon={<Send className="w-6 h-6 text-emerald-500" />} bg="bg-emerald-500/10" label="Total DMs Sent" value={stats?.totalDmsSent.toLocaleString() ?? "0"} />
                                <StatCard icon={<Link2 className="w-6 h-6 text-purple-500" />} bg="bg-purple-500/10" label="Links Sent" value={stats?.totalLinksSent.toLocaleString() ?? "0"} />
                                <StatCard icon={<AlertTriangle className="w-6 h-6 text-amber-500" />} bg="bg-amber-500/10" label="Failed (Closed DMs)" value={stats?.failedDms.toLocaleString() ?? "0"} />
                            </div>

                            {/* Bot + Triggers quick card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-accent-blue/10 rounded-xl"><Bot className="w-6 h-6 text-accent-blue" /></div>
                                            <div>
                                                <p className="text-sm text-muted-foreground font-medium">Automation Status</p>
                                                <h3 className="text-xl font-bold">{botEnabled ? "Active" : "Paused"}</h3>
                                            </div>
                                        </div>
                                        <button onClick={toggleBot} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${botEnabled ? "bg-accent-blue" : "bg-muted"}`}>
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${botEnabled ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">DMs sent today: <strong>{stats?.dmsSentToday ?? 0}</strong></p>
                                </div>

                                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-purple-500/10 rounded-xl"><Power className="w-6 h-6 text-purple-500" /></div>
                                            <div>
                                                <p className="text-sm text-muted-foreground font-medium">Active Triggers</p>
                                                <h3 className="text-xl font-bold">{triggers.filter((t) => t.enabled).length} keywords</h3>
                                            </div>
                                        </div>
                                        <button onClick={() => setTab("autoreplies")} className="text-xs font-medium text-accent-blue hover:underline cursor-pointer">Manage →</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {triggers.filter((t) => t.enabled).map((t) => (
                                            <span key={t.id} className="px-2.5 py-1 bg-accent-blue/10 text-accent-blue text-xs rounded-full font-medium">{t.keyword}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-border flex justify-between items-center">
                                    <h2 className="text-xl font-bold">Recent Activity</h2>
                                    <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline cursor-pointer">
                                        <RefreshCw className="w-4 h-4" /> Refresh
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-muted/50">
                                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {activity.map((a) => (
                                                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium">{a.user}</td>
                                                    <td className="px-6 py-4"><span className="text-xs bg-accent/50 px-2 py-0.5 rounded-full font-medium">{a.trigger}</span></td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">{a.time}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {a.status === "sent" ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"><Check className="w-3 h-3" />Sent</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"><X className="w-3 h-3" />DMs Closed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {activity.length === 0 && (
                                                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">No recent activity.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════ AUTO-REPLIES TAB ═══════════════ */}
                    {tab === "autoreplies" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <p className="text-muted-foreground text-sm">When a user comments a keyword on your post, DMGenie automatically DMs them the configured reply.</p>
                                <button onClick={() => setAddingTrigger(true)} className="flex items-center gap-2 bg-accent-blue text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
                                    <Plus className="w-4 h-4" /> Add Trigger
                                </button>
                            </div>

                            {/* Add trigger inline form */}
                            <AnimatePresence>
                                {addingTrigger && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-card border border-accent-blue/30 rounded-2xl p-6 shadow-sm space-y-4 overflow-hidden">
                                        <h3 className="text-lg font-bold">New Trigger</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Keyword</label>
                                                <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="e.g. link, price, info" className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">DM Reply Message</label>
                                                <input value={newReply} onChange={(e) => setNewReply(e.target.value)} placeholder="e.g. Here is the link! 🔗 https://..." className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={addTrigger} className="flex items-center gap-2 bg-accent-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                                                <Check className="w-4 h-4" /> Save Trigger
                                            </button>
                                            <button onClick={() => { setAddingTrigger(false); setNewKeyword(""); setNewReply(""); }} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">Cancel</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Triggers list */}
                            <div className="space-y-4">
                                {triggers.map((t) => (
                                    <div key={t.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold">Keyword:</span>
                                                <span className="px-2.5 py-0.5 bg-accent-blue/10 text-accent-blue text-xs rounded-full font-bold">{t.keyword}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{t.replyMessage}</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <button onClick={() => toggleTrigger(t.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${t.enabled ? "bg-accent-blue" : "bg-muted"}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${t.enabled ? "translate-x-6" : "translate-x-1"}`} />
                                            </button>
                                            <button onClick={() => deleteTrigger(t.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {triggers.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">No triggers configured yet. Click "Add Trigger" to get started.</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════ SETTINGS TAB ═══════════════════ */}
                    {tab === "settings" && settings && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            {/* Connection */}
                            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold flex items-center gap-2"><SignalHigh className="w-5 h-5 text-accent-blue" /> Instagram Connection</h2>
                                    {connected && (
                                        <button onClick={syncProfile} disabled={syncing} className="flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline cursor-pointer disabled:opacity-50">
                                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Profile'}
                                        </button>
                                    )}
                                </div>

                                {connected ? (
                                    /* ── Connected State ── */
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {(settings.instagramHandle || '@').replace('@','').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-foreground">{settings.instagramHandle || 'Instagram Account'}</p>
                                                <p className="text-xs text-muted-foreground truncate">ID: {settings.instagramAccountId}</p>
                                                <p className="text-xs text-emerald-600 font-medium mt-0.5">✓ Connected via Meta OAuth</p>
                                            </div>
                                            <button
                                                onClick={disconnectInstagram}
                                                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium cursor-pointer border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" /> Disconnect
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Your Page Access Token is securely stored. To switch accounts, disconnect and reconnect.</p>
                                    </div>
                                ) : (
                                    /* ── Not Connected State ── */
                                    <div className="space-y-4">
                                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                            <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">Instagram not connected</p>
                                            <p className="text-xs text-muted-foreground">Connect your Instagram Professional account to start automating DMs. You'll be redirected to Meta to authorise DMGenie.</p>
                                        </div>
                                        <button
                                            onClick={connectInstagram}
                                            className="flex items-center gap-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                            Connect Instagram Account
                                        </button>
                                        <p className="text-xs text-muted-foreground">Requires a Professional (Business or Creator) Instagram account linked to a Facebook Page.</p>
                                    </div>
                                )}

                                {/* Webhook verify token — always visible */}
                                <div className="pt-2 border-t border-border">
                                    <label className="block text-sm font-medium mb-1">Webhook Verify Token</label>
                                    <input value={settings.verifyToken} onChange={(e) => setSettings({ ...settings, verifyToken: e.target.value })} className={inputCls} />
                                    <p className="text-xs text-muted-foreground mt-1">Use this when registering your webhook in the Meta Developer Dashboard.</p>
                                </div>
                            </section>

                            {/* Reply Messages */}
                            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                                <h2 className="text-lg font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5 text-purple-500" /> Default Reply Messages</h2>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Default DM Reply</label>
                                    <input value={settings.defaultReplyMessage} onChange={(e) => setSettings({ ...settings, defaultReplyMessage: e.target.value })} className={inputCls} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Success Public Reply</label>
                                    <input value={settings.successPublicReply} onChange={(e) => setSettings({ ...settings, successPublicReply: e.target.value })} className={inputCls} />
                                    <p className="text-xs text-muted-foreground mt-1">Posted as a comment after a successful DM.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Fallback Public Reply (Closed DMs)</label>
                                    <input value={settings.fallbackPublicReply} onChange={(e) => setSettings({ ...settings, fallbackPublicReply: e.target.value })} className={inputCls} />
                                    <p className="text-xs text-muted-foreground mt-1">Posted when the user's DMs are closed.</p>
                                </div>
                            </section>

                            {/* Preferences */}
                            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                                <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-500" /> Preferences</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Reply Delay (seconds)</label>
                                        <input type="number" min={0} max={60} value={settings.replyDelay} onChange={(e) => setSettings({ ...settings, replyDelay: Number(e.target.value) })} className={inputCls} />
                                        <p className="text-xs text-muted-foreground mt-1">Add a natural delay before sending the DM.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Timezone</label>
                                        <input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className={inputCls} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Automation Enabled</p>
                                        <p className="text-xs text-muted-foreground">Globally enable or disable automated DMs.</p>
                                    </div>
                                    <button onClick={() => setSettings({ ...settings, botEnabled: !settings.botEnabled })} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${settings.botEnabled ? "bg-accent-blue" : "bg-muted"}`}>
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${settings.botEnabled ? "translate-x-6" : "translate-x-1"}`} />
                                    </button>
                                </div>
                            </section>

                            {/* Save button */}
                            <div className="flex items-center gap-4">
                                <button onClick={saveSettings} className="flex items-center gap-2 bg-accent-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer">
                                    <Save className="w-5 h-5" /> Save Settings
                                </button>
                                {settingsSaved && (
                                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-500 font-medium text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Saved!</motion.span>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}

/* ── Stat Card Sub-Component ───────────────────────────────── */
function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string }) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className={`inline-flex p-3 rounded-xl mb-3 ${bg}`}>{icon}</div>
            <p className="text-muted-foreground text-sm font-medium mb-0.5">{label}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
        </div>
    );
}
