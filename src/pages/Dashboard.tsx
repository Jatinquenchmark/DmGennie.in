import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ErrorState, LoadingCard, SkeletonCard } from "@/components/Loading";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    AtSign,
    BarChart3,
    Bell,
    Bot,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CircleHelp,
    ClipboardList,
    Copy,
    CreditCard,
    Crown,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    Gift,
    GripVertical,
    Hash,
    Headphones,
    Home,
    Image as ImageIcon,
    Inbox,
    Instagram,
    KeyRound,
    LayoutGrid,
    LifeBuoy,
    Link2,
    Lock,
    LogOut,
    Mail,
    MessageCircle,
    MessageSquare,
    MoreHorizontal,
    MousePointerClick,
    Pause,
    PenLine,
    Plus,
    Power,
    Radio,
    RefreshCw,
    Search,
    Send,
    Settings,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Trash2,
    TrendingUp,
    Wand2,
    X,
    User,
    UserPlus,
    Users,
} from "lucide-react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface Trigger {
    id: number;
    keyword: string;
    replyMessage: string;
    enabled: boolean;
    dmsSent?: number;
    triggerType?: string;
    status?: string;
    modifiedAt?: string | null;
}

interface Stats {
    followers: number | null;
    totalDmsSent: number;
    totalLinksSent: number;
    totalPublicReplies: number;
    dmsSentToday: number;
    failedDms: number;
    failedDmsThisMonth?: number;
    leadsCollected: number;
}

interface LogEntry {
    id: number;
    user: string;
    keyword: string;
    time: string;
    status: string;
    trigger: string;
    createdAt?: string | null;
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

interface UsageData {
    dmsThisMonth: number;
    dmLimit: number;
    contactsThisMonth: number;
    contactLimit: number;
    automationLimit?: number;
    instagramAccountLimit?: number;
    planName: string;
    plan?: "starter" | "pro";
    subscriptionStatus?: string;
    isPro?: boolean;
}

type FeatureAccess = {
    reTrigger: boolean;
    askForFollow: boolean;
    leadGen: boolean;
    advancedAnalytics: boolean;
    exportCsv: boolean;
    autoReply: boolean;
    growFollowers: boolean;
    leadGeneration: boolean;
    advancedFilters: boolean;
    prioritySupport: boolean;
};

type AccountPlanState = {
    plan: "starter" | "pro";
    planName: string;
    subscriptionStatus: string;
    isPro: boolean;
    currentPeriodEnd?: string | null;
    limits: {
        dmLimit: number;
        contactLimit: number;
        automationLimit: number;
        instagramAccountLimit: number;
    };
    featureAccess: FeatureAccess;
};

interface ProOfferData {
    amountInr: number;
    renewalMonthlyPriceInr: number;
    eligible: boolean;
    disclaimer: string;
    reason: string;
}

type Tab = "home" | "automations" | "contacts" | "inbox" | "analytics" | "referral" | "settings" | "help";
type SettingsTab = "profile" | "instagram" | "billing" | "security" | "notifications";
type AutomationDraft = {
    keyword: string;
    replyMessage: string;
    triggerType?: string;
    feature?: keyof FeatureAccess;
};
type InstagramMedia = {
    id: string;
    title: string;
    type: "Post" | "Reel" | "Carousel";
    caption: string;
    color: string;
    metric: string;
};
type ContactRecord = {
    id: string;
    name: string;
    username: string;
    email: string;
    source: string;
    sourceType: "Direct DM" | "Automation name" | "Comment keyword" | "Story reply" | "Live comment" | "Unknown source";
    relationship: "You Follow" | "Follows You" | "Mutual" | "Unknown";
    joined: string;
    joinedDate: string;
    lastInteraction: string;
    lastInteractionLabel: string;
    lastInteractionAt?: string;
    automation: string;
    keyword: string;
    avatar?: string;
    profileUrl?: string;
    capturedFields: Array<{ label: string; value: string }>;
    timeline: Array<{ label: string; time: string; tone: "purple" | "green" | "amber" | "slate" }>;
};
type ContactMetrics = {
    totalContacts: number;
    withEmail: number;
    activeToday: number;
    newThisWeek: number;
    fromAutomations: number;
};
type PreviewTab = "Post" | "Comments" | "Story" | "Live" | "DM";
type AutomationTemplate = {
    title: string;
    description: string;
    category: string;
    trigger: string;
    keyword: string;
    replyMessage: string;
    badge?: "Popular" | "Pro";
    icon: ReactNode;
};
type QuickAction = {
    title: string;
    copy: string;
    icon: ReactNode;
    cta: string;
    badge?: string;
    featured?: boolean;
    intent: string;
    setup: string;
    feature?: keyof FeatureAccess;
};
type ResponseConfig = {
    type: string;
    title: string;
    summary: string;
    fields?: string[];
};

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400";

const goldCtaCls =
    "bg-[linear-gradient(135deg,#FFF7DA_0%,#E8C56C_48%,#B9832B_100%)] text-[#2F2108] ring-1 ring-[#D9B760]/70 shadow-[0_10px_22px_rgba(120,83,20,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(120,83,20,0.20)]";

const goldCrownCls = "fill-[#8A5D17] text-[#6F4B12]";

const zeroStats: Stats = {
    followers: null,
    totalDmsSent: 0,
    totalLinksSent: 0,
    totalPublicReplies: 0,
    dmsSentToday: 0,
    failedDms: 0,
    failedDmsThisMonth: 0,
    leadsCollected: 0,
};

const zeroUsage: UsageData = {
    dmsThisMonth: 0,
    dmLimit: 1000,
    contactsThisMonth: 0,
    contactLimit: 1000,
    automationLimit: 999999,
    instagramAccountLimit: 1,
    planName: "Starter",
    plan: "starter",
    subscriptionStatus: "inactive",
    isPro: false,
};

const starterFeatureAccess: FeatureAccess = {
    reTrigger: false,
    askForFollow: false,
    leadGen: false,
    advancedAnalytics: false,
    exportCsv: false,
    autoReply: false,
    growFollowers: false,
    leadGeneration: false,
    advancedFilters: false,
    prioritySupport: false,
};

const starterAccountPlan: AccountPlanState = {
    plan: "starter",
    planName: "Starter",
    subscriptionStatus: "inactive",
    isPro: false,
    limits: {
        dmLimit: 1000,
        contactLimit: 1000,
        automationLimit: 999999,
        instagramAccountLimit: 1,
    },
    featureAccess: starterFeatureAccess,
};

const zeroContactMetrics: ContactMetrics = {
    totalContacts: 0,
    withEmail: 0,
    activeToday: 0,
    newThisWeek: 0,
    fromAutomations: 0,
};

const defaultProOffer: ProOfferData = {
    amountInr: 1,
    renewalMonthlyPriceInr: 499,
    eligible: false,
    disclaimer: "₹1 for the first month. Renews at the regular Pro price unless cancelled.",
    reason: "Checking offer eligibility",
};

const previewStats: Stats = {
    followers: 12470,
    totalDmsSent: 3824,
    totalLinksSent: 2916,
    totalPublicReplies: 1184,
    dmsSentToday: 148,
    failedDms: 23,
    failedDmsThisMonth: 23,
    leadsCollected: 2916,
};

const previewTriggers: Trigger[] = [
    { id: 1, keyword: "guide", replyMessage: "Here is the creator growth guide you asked for: https://dmgennie.in/guide", enabled: true },
    { id: 2, keyword: "price", replyMessage: "Thanks for asking. Here is the pricing link: https://dmgennie.in/pricing", enabled: true },
    { id: 3, keyword: "demo", replyMessage: "Book a quick demo here: https://dmgennie.in/demo", enabled: true },
];

const previewActivity: LogEntry[] = [
    { id: 1, user: "@creator.alpha", keyword: "guide", time: "2 min ago", status: "sent", trigger: "guide" },
    { id: 2, user: "@growth.creator", keyword: "price", time: "9 min ago", status: "sent", trigger: "price" },
    { id: 3, user: "@reels.studio", keyword: "demo", time: "18 min ago", status: "sent", trigger: "demo" },
    { id: 4, user: "@creatorlab.in", keyword: "guide", time: "31 min ago", status: "closed", trigger: "guide" },
];

const previewContacts: ContactRecord[] = previewActivity.map((item) => ({
    id: `preview-${item.id}`,
    name: item.user.replace("@", "").replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    username: item.user,
    email: "No email captured",
    source: item.trigger ? `Keyword: ${item.trigger}` : "Instagram automation",
    sourceType: "Comment keyword",
    relationship: "Unknown",
    joined: item.time,
    joinedDate: "",
    lastInteraction: item.status === "sent" ? "DM sent" : "Follow-up needed",
    lastInteractionLabel: item.time,
    lastInteractionAt: "",
    automation: item.trigger ? `Keyword: ${item.trigger}` : "Instagram automation",
    keyword: item.keyword || "link",
    profileUrl: `https://www.instagram.com/${item.user.replace("@", "")}/`,
    capturedFields: [
        { label: "Keyword", value: item.keyword || "Unknown" },
        { label: "Source", value: item.trigger ? `Keyword: ${item.trigger}` : "Instagram automation" },
        { label: "Status", value: item.status === "sent" ? "Delivered" : "Needs follow-up" },
    ],
    timeline: [
        { label: `Commented keyword: ${item.keyword || "link"}`, time: item.time, tone: "purple" },
        { label: "Received welcome DM", time: item.time, tone: "green" },
        { label: "Added to contacts", time: item.time, tone: "slate" },
    ],
}));

const previewContactMetrics: ContactMetrics = {
    totalContacts: previewContacts.length,
    withEmail: previewContacts.filter((contact) => contact.email !== "No email captured").length,
    activeToday: 1,
    newThisWeek: previewContacts.length,
    fromAutomations: previewContacts.length,
};

const suggestedKeywords = ["link", "send", "price", "info", "demo", "guide", "offer", "course", "ebook", "discount", "buy", "join"];
const defaultCommentReplies = ["Got it, check your inbox! 📬", "Great! Check your messages 💌", "Sent :)", "Check your DM"];

const normalizeKeyword = (keyword: string) => keyword.replace("+", "").trim().toLowerCase();

const isValidHttpUrl = (value: string) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const fallbackInstagramMedia: InstagramMedia[] = [
    {
        id: "all",
        title: "All posts & reels",
        type: "Carousel",
        caption: "Listen for keywords across every connected post and reel.",
        color: "from-slate-100 via-white to-[#EEF0FF]",
        metric: "All content",
    },
    {
        id: "creator-growth-reel",
        title: "Creator growth reel",
        type: "Reel",
        caption: "Comment GUIDE and I will send the free resource.",
        color: "from-[#5B4DFF] via-[#8A3FFC] to-[#F05A8A]",
        metric: "12.4K plays",
    },
    {
        id: "pricing-carousel",
        title: "Pricing carousel",
        type: "Carousel",
        caption: "Want the exact pricing? Drop PRICE below.",
        color: "from-[#2B1635] via-[#7A2E57] to-[#F3B8D0]",
        metric: "1.8K saves",
    },
    {
        id: "launch-announcement",
        title: "Launch announcement",
        type: "Post",
        caption: "DM automation is live. Comment LINK for early access.",
        color: "from-[#111827] via-[#4C1D95] to-[#5B4DFF]",
        metric: "3.2K likes",
    },
    {
        id: "client-result-reel",
        title: "Client result reel",
        type: "Reel",
        caption: "How we captured 247 leads from one reel.",
        color: "from-emerald-900 via-teal-600 to-cyan-300",
        metric: "8.6K plays",
    },
    {
        id: "lead-magnet-post",
        title: "Lead magnet post",
        type: "Post",
        caption: "Free checklist for creators. Comment CHECKLIST.",
        color: "from-amber-100 via-white to-[#FFF7DA]",
        metric: "984 clicks",
    },
];

const automationTemplates: AutomationTemplate[] = [
    {
        title: "Auto-DM links from comments",
        description: "Send a link instantly when someone comments a keyword on your post or reel.",
        category: "Drive traffic",
        trigger: "Post or Reel comment",
        keyword: "link",
        replyMessage: "Hey @username, here is the link you asked for.",
        badge: "Popular",
        icon: <MessageCircle className="h-5 w-5" />,
    },
    {
        title: "Generate leads with stories",
        description: "Collect emails from story replies before sending a resource or offer.",
        category: "Collect leads",
        trigger: "Story reply",
        keyword: "guide",
        replyMessage: "Thanks for replying. Drop your email and I will send the guide.",
        badge: "Pro",
        icon: <UserPlus className="h-5 w-5" />,
    },
    {
        title: "Respond to all your DMs",
        description: "Auto-reply to incoming DMs with a friendly first response and next step.",
        category: "Engage audience",
        trigger: "DM keyword",
        keyword: "hello",
        replyMessage: "Hey, thanks for reaching out. How can I help you today?",
        icon: <Bot className="h-5 w-5" />,
    },
    {
        title: "Grow followers from comments",
        description: "Ask users to follow before delivering links, guides, or bonuses.",
        category: "Grow followers",
        trigger: "Post or Reel comment",
        keyword: "follow",
        replyMessage: "Please follow this account first and I will send the link right away.",
        badge: "Pro",
        icon: <TrendingUp className="h-5 w-5" />,
    },
    {
        title: "Send affiliate product links",
        description: "Reply with product links and track clicks from creator campaigns.",
        category: "Drive traffic",
        trigger: "Post or Reel comment",
        keyword: "shop",
        replyMessage: "Here is the product link you asked for. Happy shopping.",
        icon: <Link2 className="h-5 w-5" />,
    },
    {
        title: "Collect emails before sending link",
        description: "Capture contact details from Instagram conversations before the final DM.",
        category: "Collect leads",
        trigger: "DM keyword",
        keyword: "resource",
        replyMessage: "Share your email and I will send the resource instantly.",
        badge: "Popular",
        icon: <ClipboardList className="h-5 w-5" />,
    },
];

const previewSettings: SettingsData = {
    botEnabled: true,
    instagramHandle: "@dmgennie.in",
    instagramAccountId: "17841400000000000",
    pageAccessToken: "EAAG...preview-token",
    appSecret: "preview-app-secret",
    verifyToken: "dmgennie-webhook-verify",
    defaultReplyMessage: "Hey! Here is the link you asked for.",
    fallbackPublicReply: "Please open your DMs and comment again so we can send the link.",
    successPublicReply: "Sent. Please check your DMs.",
    replyDelay: 2,
    timezone: "Asia/Kolkata",
};

const chartData = [
    { day: "Mon", dms: 82, leads: 18 },
    { day: "Tue", dms: 126, leads: 27 },
    { day: "Wed", dms: 154, leads: 34 },
    { day: "Thu", dms: 141, leads: 29 },
    { day: "Fri", dms: 198, leads: 46 },
    { day: "Sat", dms: 176, leads: 39 },
    { day: "Sun", dms: 224, leads: 52 },
];

const navItems: Array<{ key: Tab; label: string; icon: ReactNode }> = [
    { key: "home", label: "Home", icon: <Home className="h-4 w-4" /> },
    { key: "automations", label: "Automations", icon: <Bot className="h-4 w-4" /> },
    { key: "contacts", label: "Contacts", icon: <Users className="h-4 w-4" /> },
    { key: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "referral", label: "Refer & Earn", icon: <Gift className="h-4 w-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { key: "help", label: "Help", icon: <CircleHelp className="h-4 w-4" /> },
];

export default function Dashboard({ preview = false }: { preview?: boolean } = {}) {
    const navigate = useNavigate();
    const { signOut, session } = useAuth();

    const [tab, setTab] = useState<Tab>("home");
    const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [usage, setUsage] = useState<UsageData>(zeroUsage);
    const [accountPlan, setAccountPlan] = useState<AccountPlanState>(starterAccountPlan);
    const [dashboardDeliveryRate, setDashboardDeliveryRate] = useState<number | null>(null);
    const [proOffer, setProOffer] = useState<ProOfferData>(defaultProOffer);
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [activity, setActivity] = useState<LogEntry[]>([]);
    const [contacts, setContacts] = useState<ContactRecord[]>([]);
    const [contactMetrics, setContactMetrics] = useState<ContactMetrics>(zeroContactMetrics);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [botEnabled, setBotEnabled] = useState(true);
    const [connected, setConnected] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [addingTrigger, setAddingTrigger] = useState(false);
    const [newKeyword, setNewKeyword] = useState("");
    const [newReply, setNewReply] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [automationSearch, setAutomationSearch] = useState("");
    const [automationStatus, setAutomationStatus] = useState("all");
    const [contactSearch, setContactSearch] = useState("");
    const [analyticsRange, setAnalyticsRange] = useState("Last 7 days");
    const [helpQuery, setHelpQuery] = useState("");
    const [openFaq, setOpenFaq] = useState(0);
    const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);
    const [dashboardToast, setDashboardToast] = useState("");
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const showDashboardToast = useCallback((message: string) => {
        setDashboardToast(message);
        window.setTimeout(() => setDashboardToast(""), 2400);
    }, []);

    const authFetch = useCallback((url: string, options: RequestInit = {}) => {
        const token = session?.access_token;
        return fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            },
        });
    }, [session]);

    const loadContacts = useCallback(async () => {
        if (preview) {
            setContacts(previewContacts);
            setContactMetrics(previewContactMetrics);
            return true;
        }

        setContactsLoading(true);
        try {
            const response = await authFetch("/api/contacts");
            if (!response.ok) throw new Error("Contacts request failed");
            const data = await response.json();
            setContacts(Array.isArray(data.contacts) ? data.contacts : []);
            setContactMetrics({ ...zeroContactMetrics, ...(data.metrics || {}) });
            return true;
        } catch (error) {
            console.error("Contacts fetch failed", error);
            setContacts([]);
            setContactMetrics(zeroContactMetrics);
            return false;
        } finally {
            setContactsLoading(false);
        }
    }, [authFetch, preview]);

    const fetchAll = useCallback(async () => {
        setLoadError(false);
        if (preview) {
            setStats(previewStats);
            setUsage({
                dmsThisMonth: 5,
                dmLimit: 1000,
                contactsThisMonth: 1,
                contactLimit: 1000,
                automationLimit: 999999,
                instagramAccountLimit: 1,
                planName: "Starter",
                plan: "starter",
                subscriptionStatus: "inactive",
                isPro: false,
            });
            setAccountPlan(starterAccountPlan);
            setDashboardDeliveryRate(98);
            setProOffer(defaultProOffer);
            setTriggers(previewTriggers);
            setActivity(previewActivity);
            setContacts(previewContacts);
            setContactMetrics(previewContactMetrics);
            setBotEnabled(previewSettings.botEnabled);
            setConnected(true);
            setSettings(previewSettings);
            setLoading(false);
            return;
        }

        try {
            const [dashRes, settingsRes, pricingRes] = await Promise.all([
                authFetch("/api/dashboard"),
                authFetch("/api/me?action=settings"),
                authFetch("/api/billing?action=pricing").catch(() => null),
            ]);
            if (!dashRes.ok || !settingsRes.ok) throw new Error("Dashboard data request failed");

            const [dashData, settingsData, pricingData] = await Promise.all([
                dashRes.json(),
                settingsRes.json(),
                pricingRes?.ok ? pricingRes.json() : Promise.resolve(null),
            ]);
            setStats({ ...zeroStats, ...(dashData.stats || {}) });
            setUsage({ ...zeroUsage, ...(dashData.usage || {}) });
            setAccountPlan({
                plan: dashData.subscription?.plan || dashData.usage?.plan || "starter",
                planName: dashData.subscription?.planName || dashData.usage?.planName || "Starter",
                subscriptionStatus: dashData.subscription?.subscriptionStatus || dashData.usage?.subscriptionStatus || "inactive",
                isPro: Boolean(dashData.subscription?.isPro || dashData.usage?.isPro),
                currentPeriodEnd: dashData.subscription?.currentPeriodEnd || null,
                limits: {
                    dmLimit: safeNumber(dashData.limits?.dmLimit || dashData.usage?.dmLimit || zeroUsage.dmLimit),
                    contactLimit: safeNumber(dashData.limits?.contactLimit || dashData.usage?.contactLimit || zeroUsage.contactLimit),
                    automationLimit: safeNumber(dashData.limits?.automationLimit || dashData.usage?.automationLimit || zeroUsage.automationLimit || 999999),
                    instagramAccountLimit: safeNumber(dashData.limits?.instagramAccountLimit || dashData.usage?.instagramAccountLimit || zeroUsage.instagramAccountLimit || 1),
                },
                featureAccess: { ...starterFeatureAccess, ...(dashData.featureAccess || {}) },
            });
            setDashboardDeliveryRate(typeof dashData.deliveryRate === "number" ? dashData.deliveryRate : null);
            if (pricingData?.plans?.pro) {
                setProOffer({
                    amountInr: safeNumber(pricingData.proIntroOffer?.amountInr || pricingData.plans.pro.introOffer?.amountInr || 1),
                    renewalMonthlyPriceInr: safeNumber(pricingData.plans.pro.monthlyPriceInr || 499),
                    eligible: Boolean(pricingData.proIntroOffer?.eligible),
                    disclaimer: pricingData.proIntroOffer?.disclaimer || `₹1 for the first month. Renews at ₹${pricingData.plans.pro.monthlyPriceInr}/month unless cancelled.`,
                    reason: pricingData.proIntroOffer?.reason || "",
                });
            }
            setTriggers(dashData.triggers || []);
            setActivity(dashData.activityLog || []);
            await loadContacts();
            setBotEnabled(Boolean(dashData.botEnabled));
            setConnected(Boolean(dashData.connected));
            setSettings(settingsData);
        } catch (e) {
            console.error("Fetch failed", e);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, [authFetch, loadContacts, preview]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (preview) return;
        const params = new URLSearchParams(window.location.search);
        const igStatus = params.get("instagram");
        if (igStatus === "connected") {
            setConnected(true);
            fetchAll();
            window.history.replaceState({}, "", "/dashboard");
        } else if (igStatus === "error") {
            window.history.replaceState({}, "", "/dashboard");
        }
    }, [fetchAll, preview]);

    const displayStats = { ...zeroStats, ...(stats || {}) };
    const ownerName = preview
        ? "Prince"
        : String(session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Creator").split(" ")[0] || "Creator";
    const activeTriggers = triggers.filter((t) => t.enabled).length;
    const leadsCollected = safeNumber(displayStats.leadsCollected);
    const attemptedMessages = safeNumber(displayStats.totalDmsSent) + safeNumber(displayStats.failedDms);
    const deliveryRate = dashboardDeliveryRate ?? (attemptedMessages > 0
        ? Math.max(0, Math.round((safeNumber(displayStats.totalDmsSent) / attemptedMessages) * 100))
        : null);

    const filteredTriggers = triggers.filter((trigger) => {
        const matchesSearch = `${trigger.keyword} ${trigger.replyMessage}`.toLowerCase().includes(automationSearch.toLowerCase());
        const status = trigger.enabled ? "live" : "paused";
        return matchesSearch && (automationStatus === "all" || automationStatus === status);
    });

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/signup");
        } catch {
            showDashboardToast("Something went wrong. Please try again.");
        }
    };

    const startProCheckout = useCallback(async () => {
        if (preview) {
            navigate("/pricing");
            return;
        }
        try {
            const res = await authFetch("/api/billing?action=checkout", {
                method: "POST",
                body: JSON.stringify({ plan: "pro", billingCycle: "monthly" }),
            });
            const data = await res.json();
            if (res.ok && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
                return;
            }
            showDashboardToast(data.message || "Checkout is not ready yet. Please contact support.");
        } catch {
            showDashboardToast("Unable to start checkout. Please try again.");
        }
    }, [authFetch, navigate, preview, showDashboardToast]);

    const openUpgradeModal = useCallback(() => setUpgradeModalOpen(true), []);

    const toggleBot = async () => {
        const next = !botEnabled;
        setBotEnabled(next);
        if (preview) {
            showDashboardToast(next ? "Automation enabled" : "Automation paused");
            return;
        }
        try {
            const res = await authFetch("/api/me?action=settings", {
                method: "PUT",
                body: JSON.stringify({ botEnabled: next }),
            });
            if (!res.ok) throw new Error("Unable to update automation status");
            showDashboardToast(next ? "Automation enabled" : "Automation paused");
        } catch {
            setBotEnabled(!next);
            showDashboardToast("Unable to update automation status.");
        }
    };

    const saveSettings = async () => {
        if (!settings) return;
        try {
            if (!preview) {
                const res = await authFetch("/api/me?action=settings", {
                    method: "PUT",
                    body: JSON.stringify(settings),
                });
                if (!res.ok) throw new Error("Unable to save settings");
            }
            setSettingsSaved(true);
            showDashboardToast("Settings saved successfully");
            setTimeout(() => setSettingsSaved(false), 2500);
        } catch {
            showDashboardToast("Unable to save settings.");
        }
    };

    const addTrigger = async (draft?: AutomationDraft) => {
        const keyword = (draft?.keyword ?? newKeyword).trim();
        const replyMessage = (draft?.replyMessage ?? newReply).trim();
        if (!keyword) return;
        if (preview) {
            setTriggers((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    keyword,
                    replyMessage: replyMessage || "Thanks for commenting. Here is the link.",
                    enabled: true,
                },
            ]);
        } else {
            try {
                const res = await authFetch("/api/triggers", {
                    method: "POST",
                    body: JSON.stringify({
                        keyword,
                        replyMessage,
                        triggerType: draft?.triggerType,
                        feature: draft?.feature,
                    }),
                });
                const trigger = await res.json();
                if (!res.ok) {
                    if (trigger?.error === "PRO_REQUIRED" || trigger?.error === "PLAN_LIMIT_REACHED") {
                        openUpgradeModal();
                    }
                    showDashboardToast(trigger?.message || "Unable to create automation.");
                    return;
                }
                setTriggers((prev) => [...prev, trigger]);
                showDashboardToast("Automation launched");
            } catch {
                showDashboardToast("Unable to save automation.");
                return;
            }
        }
        setNewKeyword("");
        setNewReply("");
        setAddingTrigger(false);
    };

    const deleteTrigger = async (id: number) => {
        try {
            if (!preview) {
                const res = await authFetch(`/api/triggers?id=${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Unable to delete automation");
            }
            setTriggers((prev) => prev.filter((t) => t.id !== id));
            showDashboardToast("Automation deleted successfully");
        } catch {
            showDashboardToast("Unable to delete automation.");
        }
    };

    const toggleTrigger = async (id: number) => {
        const trigger = triggers.find((t) => t.id === id);
        if (!trigger) return;
        if (preview) {
            setTriggers((prev) => prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
            showDashboardToast(!trigger.enabled ? "Automation resumed" : "Automation paused");
            return;
        }
        try {
            const res = await authFetch(`/api/triggers?id=${id}`, {
                method: "PUT",
                body: JSON.stringify({ enabled: !trigger.enabled }),
            });
            if (!res.ok) throw new Error("Unable to update automation");
            const updated = await res.json();
            setTriggers((prev) => prev.map((item) => item.id === id ? updated : item));
            showDashboardToast(updated.enabled ? "Automation resumed" : "Automation paused");
        } catch {
            showDashboardToast("Unable to update automation.");
        }
    };

    const connectInstagram = async () => {
        if (preview) {
            setConnected(true);
            showDashboardToast("Instagram connected");
            return;
        }
        try {
            const res = await authFetch("/api/auth?action=instagram");
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else showDashboardToast("Instagram connection could not be started.");
        } catch (e) {
            console.error("Connect failed", e);
            showDashboardToast("Instagram content could not be loaded.");
        }
    };

    const performDisconnectInstagram = async () => {
        try {
            if (!preview) {
                const res = await authFetch("/api/auth?action=disconnect", { method: "POST" });
                if (!res.ok) throw new Error("Unable to disconnect Instagram");
            }
            setConnected(false);
            if (settings) setSettings({ ...settings, instagramAccountId: "", instagramHandle: "", pageAccessToken: "" });
            showDashboardToast("Instagram disconnected");
        } catch {
            showDashboardToast("Unable to disconnect Instagram.");
        }
    };

    const disconnectInstagram = async () => {
        if (preview) {
            await performDisconnectInstagram();
            return;
        }
        setDisconnectConfirmOpen(true);
    };

    const syncProfile = async () => {
        setSyncing(true);
        if (preview) {
            setTimeout(() => {
                setStats((prev) => prev ? { ...prev, followers: 12890 } : prev);
                setSyncing(false);
                showDashboardToast("Instagram profile refreshed");
            }, 700);
            return;
        }
        try {
            const res = await authFetch("/api/auth?action=profile");
            if (res.ok) {
                const profile = await res.json();
                if (settings) setSettings({ ...settings, instagramHandle: `@${profile.username}` });
                setStats((prev) => prev ? { ...prev, followers: profile.followers_count || 0 } : prev);
                showDashboardToast("Instagram profile refreshed");
            } else {
                showDashboardToast("Please reconnect Instagram.");
            }
        } catch (e) {
            console.error("Sync failed", e);
            showDashboardToast("Instagram content could not be loaded.");
        } finally {
            setSyncing(false);
        }
    };

    const updatePassword = async (password: string) => {
        if (preview) {
            showDashboardToast("Password updated successfully");
            return;
        }
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            showDashboardToast("Password updated successfully");
        } catch {
            showDashboardToast("Unable to update password. Please try again.");
            throw new Error("Unable to update password");
        }
    };

    if (loading) {
        return <DashboardLoadingState />;
    }

    if (loadError) {
        return (
            <ErrorState
                title="Something went wrong"
                text="We couldn’t load your dashboard. Please refresh or try again."
                onRetry={() => {
                    setLoading(true);
                    setLoadError(false);
                    fetchAll();
                }}
            />
        );
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#F7F7FB] text-slate-950">
            <div className="mx-auto w-full max-w-[1440px] p-3 sm:p-4 xl:p-5">
                <Sidebar
                    activeTab={tab}
                    connected={connected}
                    stats={displayStats}
                    usage={usage}
                    accountPlan={accountPlan}
                    proOffer={proOffer}
                    settings={settings}
                    onNavigate={setTab}
                    onLogout={handleLogout}
                    onUpgrade={openUpgradeModal}
                />

                <main className="mt-3 min-w-0 overflow-x-hidden lg:ml-[276px] lg:mt-0 xl:ml-[280px]">
                    <div className="mx-auto w-full max-w-[1180px] space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                            >
                                {tab === "home" && (
                                    <HomePage
                                        connected={connected}
                                        stats={displayStats}
                                        activeTriggers={activeTriggers}
                                        leadsCollected={leadsCollected}
                                        deliveryRate={deliveryRate}
                                        ownerName={ownerName}
                                        proOffer={proOffer}
                                        activity={activity}
                                        triggers={triggers}
                                        accountPlan={accountPlan}
                                        onNavigate={setTab}
                                        onToggleBot={toggleBot}
                                        botEnabled={botEnabled}
                                        onUpgrade={openUpgradeModal}
                                    />
                                )}
                                {tab === "automations" && (
                                    <AutomationsPage
                                        triggers={filteredTriggers}
                                        search={automationSearch}
                                        status={automationStatus}
                                        addingTrigger={addingTrigger}
                                        newKeyword={newKeyword}
                                        newReply={newReply}
                                        onSearch={setAutomationSearch}
                                        onStatus={setAutomationStatus}
                                        onAddOpen={() => setAddingTrigger(true)}
                                        onAddCancel={() => { setAddingTrigger(false); setNewKeyword(""); setNewReply(""); }}
                                        onKeyword={setNewKeyword}
                                        onReply={setNewReply}
                                        onAdd={addTrigger}
                                        onToggle={toggleTrigger}
                                        onDelete={deleteTrigger}
                                        onNavigate={setTab}
                                        onUpgrade={openUpgradeModal}
                                        proOffer={proOffer}
                                        accountPlan={accountPlan}
                                        automationCount={triggers.length}
                                    />
                                )}
                                {tab === "contacts" && (
                                    <ContactsPage
                                        contacts={contacts}
                                        metrics={contactMetrics}
                                        loading={contactsLoading}
                                        search={contactSearch}
                                        onSearch={setContactSearch}
                                        onNavigate={setTab}
                                        onRefresh={loadContacts}
                                        accountPlan={accountPlan}
                                        onUpgrade={openUpgradeModal}
                                    />
                                )}
                                {tab === "inbox" && <InboxPage activity={activity} />}
                                {tab === "analytics" && (
                                    <AnalyticsPage
                                        stats={displayStats}
                                        leadsCollected={leadsCollected}
                                        deliveryRate={deliveryRate}
                                        range={analyticsRange}
                                        onRange={setAnalyticsRange}
                                        triggers={triggers}
                                        activity={activity}
                                        onNavigate={setTab}
                                        accountPlan={accountPlan}
                                        onUpgrade={openUpgradeModal}
                                    />
                                )}
                                {tab === "referral" && <ReferralPage preview={preview} />}
                                {tab === "settings" && settings && (
                                    <SettingsPage
                                        settings={settings}
                                        settingsTab={settingsTab}
                                        connected={connected}
                                        syncing={syncing}
                                        saved={settingsSaved}
                                        botEnabled={botEnabled}
                                        ownerEmail={preview ? "prince@dmgennie.in" : session?.user?.email || "No email available"}
                                        ownerName={preview ? "Prince Saini" : String(session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Creator")}
                                        stats={displayStats}
                                        usage={usage}
                                        onSettingsTab={setSettingsTab}
                                        onSettings={setSettings}
                                        onConnect={connectInstagram}
                                        onDisconnect={disconnectInstagram}
                                        onSync={syncProfile}
                                        onSave={saveSettings}
                                        onToggleBot={toggleBot}
                                        onPasswordUpdate={updatePassword}
                                        onToast={showDashboardToast}
                                    />
                                )}
                                {tab === "help" && <HelpPage query={helpQuery} openFaq={openFaq} onQuery={setHelpQuery} onOpenFaq={setOpenFaq} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
            {disconnectConfirmOpen && (
                <ConfirmInstagramDisconnectModal
                    onCancel={() => setDisconnectConfirmOpen(false)}
                    onConfirm={async () => {
                        await performDisconnectInstagram();
                        setDisconnectConfirmOpen(false);
                    }}
                />
            )}
            {upgradeModalOpen && (
                <UpgradeModal
                    proOffer={proOffer}
                    onClose={() => setUpgradeModalOpen(false)}
                    onUpgrade={startProCheckout}
                />
            )}
            {dashboardToast && <ReferralToast message={dashboardToast} />}
        </div>
    );
}

function DashboardLoadingState() {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#F7F7FB] p-3 text-slate-950 sm:p-4 xl:p-5">
            <div className="mx-auto flex w-full max-w-[1440px] gap-4">
                <aside className="hidden h-[calc(100vh-2rem)] w-[264px] shrink-0 rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] lg:block">
                    <div className="flex items-center gap-3">
                        <div className="dmgenie-shimmer h-11 w-11 rounded-2xl" />
                        <div className="space-y-2">
                            <div className="dmgenie-shimmer h-3 w-24 rounded-full" />
                            <div className="dmgenie-shimmer h-2 w-20 rounded-full" />
                        </div>
                    </div>
                    <div className="mt-5 rounded-[18px] border border-[#E5E7EB] p-3">
                        <div className="dmgenie-shimmer h-9 w-full rounded-2xl" />
                        <div className="mt-3 space-y-2">
                            <div className="dmgenie-shimmer h-2 w-28 rounded-full" />
                            <div className="dmgenie-shimmer h-2 w-36 rounded-full" />
                        </div>
                    </div>
                    <div className="mt-6 space-y-3">
                        {Array.from({ length: 7 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="dmgenie-shimmer h-9 w-9 rounded-full" />
                                <div className="dmgenie-shimmer h-3 w-28 rounded-full" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 rounded-[18px] border border-[#E5E7EB] p-4">
                        <div className="dmgenie-shimmer h-3 w-28 rounded-full" />
                        <div className="mt-4 space-y-3">
                            <div className="dmgenie-shimmer h-2 w-full rounded-full" />
                            <div className="dmgenie-shimmer h-2 w-4/5 rounded-full" />
                        </div>
                    </div>
                </aside>

                <main className="min-w-0 flex-1 lg:ml-0">
                    <div className="mx-auto w-full max-w-[1180px] space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
                            <LoadingCard
                                title="Loading DMGennie"
                                subtitle="Preparing your Instagram automation workspace..."
                                detail="Loading your automation data..."
                                className="max-w-none"
                            />
                            <div className="hidden rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.04)] lg:block">
                                <div className="dmgenie-shimmer h-4 w-44 rounded-full" />
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <SkeletonCard rows={2} showIcon />
                                    <SkeletonCard rows={2} showIcon />
                                </div>
                            </div>
                        </div>

                        <section aria-label="Loading metric cards" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <SkeletonCard key={index} rows={3} showIcon className="min-h-[118px]" />
                            ))}
                        </section>

                        <section aria-label="Loading quick actions" className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <SkeletonCard key={index} rows={4} showIcon className="min-h-[150px]" />
                            ))}
                        </section>

                        <section aria-label="Loading automation cards" className="grid gap-4 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <SkeletonCard key={index} rows={4} className="min-h-[156px]" />
                            ))}
                        </section>

                        <section aria-label="Loading recent activity">
                            <SkeletonCard rows={5} showIcon className="min-h-[220px]" />
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

function Sidebar({
    activeTab,
    connected,
    stats,
    usage,
    accountPlan,
    proOffer,
    settings,
    onNavigate,
    onLogout,
    onUpgrade,
}: {
    activeTab: Tab;
    connected: boolean;
    stats: Stats;
    usage: UsageData;
    accountPlan: AccountPlanState;
    proOffer: ProOfferData;
    settings: SettingsData | null;
    onNavigate: (tab: Tab) => void;
    onLogout: () => void;
    onUpgrade: () => void;
}) {
    const handle = settings?.instagramHandle || "@dmgennie.in";
    const { session } = useAuth();

    return (
        <aside className="shrink-0 rounded-[26px] border border-white bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] lg:fixed lg:left-[max(1rem,calc((100vw-1440px)/2+1rem))] lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[272px] lg:max-w-[272px] xl:left-[max(1.25rem,calc((100vw-1440px)/2+1.25rem))] xl:top-5 xl:h-[calc(100vh-2.5rem)]">
            <div className="flex h-full min-h-0 flex-col p-3.5">
                <Link to="/" className="mb-3 flex items-center gap-2.5 rounded-2xl px-1 py-0.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B4DFF] text-white shadow-[0_12px_26px_rgba(91,77,255,0.22)]">
                        <svg width="19" height="19" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                            <path d="M10 27 L19 13" stroke="white" strokeWidth="4" strokeLinecap="round" />
                            <path d="M17 27 L26 13" stroke="white" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="29" cy="27" r="3" fill="#cfd1ff" />
                        </svg>
                    </span>
                    <span>
                        <span className="block text-[18px] font-black leading-5 tracking-tight text-[#0F172A]">DMGennie</span>
                        <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Creator Dashboard</span>
                    </span>
                </Link>

                <div className="mb-3 rounded-[16px] border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-400 text-sm font-black text-white shadow-[0_8px_18px_rgba(217,70,239,0.12)]">
                            {handle.replace("@", "").charAt(0).toUpperCase() || "D"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1.5 leading-4">
                                <span className="truncate text-[13px] font-black leading-4 text-[#0F172A]">{session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || handle}</span>
                                <span
                                    title={connected ? "Connected" : "Disconnected"}
                                    className={cx(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 transition",
                                        connected ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-rose-50 text-rose-600 ring-rose-100"
                                    )}
                                >
                                    <Power className="h-3.5 w-3.5 stroke-[3]" />
                                </span>
                            </div>
                            <div className="truncate text-[11px] font-bold leading-4 text-[#64748B]">{session?.user?.email}</div>
                        </div>
                    </div>
                </div>

                <nav className="grid min-h-0 flex-1 content-start gap-1.5 pr-1">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => onNavigate(item.key)}
                            className={cx(
                                "flex min-h-[38px] w-full items-center gap-2.5 rounded-full px-3 text-left text-[14px] font-black transition-all",
                                activeTab === item.key
                                    ? "bg-[#0F172A] text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
                                    : "text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]"
                            )}
                        >
                            <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", activeTab === item.key ? "bg-white/10 text-white" : "bg-[#F1F5F9] text-[#475569]")}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-2 space-y-1.5">
                    <SidebarPlanCompact usage={usage} accountPlan={accountPlan} proOffer={proOffer} onUpgrade={onUpgrade} />
                    <button onClick={onLogout} className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 text-[13px] font-black text-[#475569] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                        <LogOut className="h-4 w-4" /> Logout
                    </button>
                    <button onClick={() => onNavigate("help")} className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#10B981] px-4 text-[13px] font-black text-white shadow-[0_12px_26px_rgba(16,185,129,0.16)] transition hover:-translate-y-0.5 hover:bg-emerald-600">
                        <Headphones className="h-4 w-4" /> Support/Feedback
                    </button>
                </div>
            </div>
        </aside>
    );
}

function SidebarPlanCompact({ usage, accountPlan, proOffer, onUpgrade }: { usage: UsageData; accountPlan: AccountPlanState; proOffer: ProOfferData; onUpgrade: () => void }) {
    const dmsProgress = usagePercent(usage.dmsThisMonth, usage.dmLimit);
    const contactsProgress = usagePercent(usage.contactsThisMonth, usage.contactLimit);
    const isPro = accountPlan.isPro;
    const isPaymentPending = accountPlan.subscriptionStatus === "payment_pending";
    const renewalLabel = accountPlan.currentPeriodEnd ? new Date(accountPlan.currentPeriodEnd).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : null;
    const planLabel = isPro ? "Pro" : isPaymentPending ? "Payment pending" : "Starter";

    return (
        <div className="rounded-[16px] border border-[#E5E7EB] bg-[#F8FAFC] p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                    <p className="text-[12px] font-black leading-4 text-[#0F172A]">{planLabel} plan</p>
                    <p className="text-[10px] font-bold leading-3 text-[#64748B]">Plan & usage</p>
                </div>
                <span className={cx("inline-flex h-6 items-center rounded-full bg-white px-2 text-[10px] font-black ring-1", isPro ? "text-emerald-700 ring-emerald-100" : isPaymentPending ? "text-amber-700 ring-amber-100" : "text-[#64748B] ring-[#E5E7EB]")}>{planLabel}</span>
            </div>

            <div className="space-y-1.5">
                <CompactUsageLine icon={<Send className="h-3.5 w-3.5" />} label="DMs" value={formatUsage(usage.dmsThisMonth, usage.dmLimit)} progress={dmsProgress} />
                <CompactUsageLine icon={<User className="h-3.5 w-3.5" />} label="Contacts" value={formatUsage(usage.contactsThisMonth, usage.contactLimit)} progress={contactsProgress} />
            </div>

            {isPro ? (
                <div className="mt-2 rounded-[0.85rem] bg-emerald-50 px-2.5 py-2 text-[10.5px] font-bold leading-4 text-emerald-700 ring-1 ring-emerald-100">
                    <span className="font-black">Pro active.</span> {renewalLabel ? `Renews on ${renewalLabel}.` : "All Pro features unlocked."}
                </div>
            ) : (
                <>
                    <p className="mt-2 text-[10.5px] font-bold leading-4 text-[#64748B]">
                        <span className="font-black text-[#0F172A]">{isPaymentPending ? "Payment pending." : "Unlock Pro."}</span> {isPaymentPending ? "Complete payment to unlock Pro." : `${proOffer.eligible ? `First month ₹${proOffer.amountInr}. ` : ""}More DMs, unlimited contacts & Pro tools.`}
                    </p>

                    <button
                        onClick={onUpgrade}
                        className={cx("mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-black", goldCtaCls)}
                    >
                        <Crown className={cx("h-3.5 w-3.5", goldCrownCls)} />
                        {isPaymentPending ? "Complete payment" : proOffer.eligible ? `Start Pro for ₹${proOffer.amountInr}` : "Upgrade now"}
                    </button>
                </>
            )}
        </div>
    );
}

function CompactUsageLine({ icon, label, value, progress }: { icon: ReactNode; label: string; value: string; progress: number }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-[#64748B]">
                <span className="inline-flex items-center gap-1.5">
                    <span className="text-[#5B4DFF]">{icon}</span>
                    {label}
                </span>
                <span className="font-black text-[#0F172A]">{value}</span>
            </div>
            <div className="h-1 rounded-full bg-white">
                <div className="h-full rounded-full bg-[#5B4DFF]" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

function PlanUsageCard({ usage = zeroUsage, proOffer = defaultProOffer, onUpgrade }: { usage?: UsageData; proOffer?: ProOfferData; onUpgrade?: () => void }) {
    const dmsProgress = usagePercent(usage.dmsThisMonth, usage.dmLimit);
    const contactsProgress = usagePercent(usage.contactsThisMonth, usage.contactLimit);

    return (
        <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[14px] font-black leading-5 text-[#0F172A]">Plan & Usage</p>
                    <p className="text-[11px] font-bold leading-4 text-[#64748B]">{usage.planName || "Starter"} workspace</p>
                </div>
                <span className="inline-flex h-7 items-center rounded-full bg-[#F1F5F9] px-3 text-[12px] font-black text-slate-600">{usage.planName || "Starter"}</span>
            </div>

            <UsageLine icon={<Send className="h-4 w-4" />} label="DMs sent" value={formatUsage(usage.dmsThisMonth, usage.dmLimit)} progress={dmsProgress} />
            <UsageLine icon={<User className="h-4 w-4" />} label="Contacts" value={formatUsage(usage.contactsThisMonth, usage.contactLimit)} progress={contactsProgress} />

            <div className="mt-3 rounded-[16px] border border-[#FDE68A] bg-[#FFF8E1] p-2.5">
                <div className="mb-2 flex items-start gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#F59E0B] shadow-sm">
                        <Crown className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                    </span>
                    <p className="text-[11px] font-bold leading-4 text-[#64748B]">
                        <span className="block text-[13px] font-black leading-4 text-[#0F172A]">Unlock Pro</span>
                        {proOffer.eligible ? `Get your first month for ₹${proOffer.amountInr}. ` : ""}Unlock 20,000 DMs, unlimited contacts & Pro tools.
                    </p>
                </div>
                <button
                    onClick={onUpgrade}
                    className={cx("flex h-9 w-full items-center justify-center gap-2 rounded-full px-3 text-[13px] font-black", goldCtaCls)}
                >
                    <Crown className={cx("h-4 w-4", goldCrownCls)} />
                    {proOffer.eligible ? `Start Pro for ₹${proOffer.amountInr}` : "Upgrade now"}
                </button>
            </div>
        </div>
    );
}

function UsageLine({ icon, label, value, progress }: { icon: ReactNode; label: string; value: string; progress: number }) {
    return (
        <div className="mb-2.5 last:mb-0">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px] font-bold text-slate-700">
                <span className="inline-flex min-w-0 items-center gap-2.5">
                    <span className="text-[#5B4DFF]">{icon}</span>
                    <span className="font-black text-[#0F172A]">{value}</span>
                    <span className="text-[#64748B]">{label}</span>
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F1F5F9]">
                <div className="h-full rounded-full bg-[#5B4DFF]" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

function HomePage({
    connected,
    stats,
    activeTriggers,
    leadsCollected,
    deliveryRate,
    ownerName,
    proOffer,
    activity,
    triggers,
    accountPlan,
    botEnabled,
    onNavigate,
    onToggleBot,
    onUpgrade,
}: {
    connected: boolean;
    stats: Stats;
    activeTriggers: number;
    leadsCollected: number;
    deliveryRate: number | null;
    ownerName: string;
    proOffer: ProOfferData;
    activity: LogEntry[];
    triggers: Trigger[];
    accountPlan: AccountPlanState;
    botEnabled: boolean;
    onNavigate: (tab: Tab) => void;
    onToggleBot: () => void;
    onUpgrade: () => void;
}) {
    const actions = [
        { title: "Auto DM from Comments", copy: "Send DMs to users who comment on your posts.", icon: <MessageCircle className="h-6 w-6" />, cta: "Create workflow", badge: "Popular", intent: "Best for links", setup: "2 min setup" },
        { title: "Grow Followers", copy: "Ask users to follow before delivering links.", icon: <TrendingUp className="h-6 w-6" />, cta: "Grow audience", badge: "Trending", featured: true, intent: "Audience growth", setup: "Ready flow", feature: "growFollowers" as const },
        { title: "Generate Leads", copy: "Capture emails and phone numbers from Instagram conversations.", icon: <UserPlus className="h-6 w-6" />, cta: "Build lead flow", intent: "Lead capture", setup: "Ready flow", feature: "leadGen" as const },
        { title: "Auto-reply DMs", copy: "Reply faster with simple message automation.", icon: <Bot className="h-6 w-6" />, cta: "Set replies", intent: "Inbox replies", setup: "3 min setup", feature: "autoReply" as const },
    ];

    return (
        <div className="space-y-4">
            <section className="relative overflow-hidden rounded-[22px] border border-white bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.055)]">
                <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#5B4DFF]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-fuchsia-300/10 blur-3xl" />
                <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px] xl:items-stretch">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <StatusPill icon={<Instagram className="h-3.5 w-3.5" />} label={connected ? "Instagram connected" : "Instagram not connected"} tone={connected ? "green" : "red"} />
                            <StatusPill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Meta API active" tone="indigo" title="Connected through official Meta APIs and secure OAuth." />
                        </div>
                        <h1 className="text-[24px] font-black tracking-tight text-slate-950 sm:text-[30px]">Welcome back, {ownerName} 👋</h1>
                        <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#64748B]">
                            Launch flows, monitor delivery, and turn Instagram comments into leads from one calm workspace.
                        </p>
                        <div className="mt-4 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
                            <HomeHeroStat label="DMs today" value={stats.dmsSentToday.toLocaleString()} tone="purple" />
                            <HomeHeroStat label="Live flows" value={activeTriggers.toLocaleString()} tone="green" />
                            <HomeHeroStat label="Delivery" value={formatPercent(deliveryRate)} tone="blue" />
                        </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-100 bg-white/80 p-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] backdrop-blur">
                        <div className="mb-3 flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[#EEF0FF] text-[#5B4DFF]">
                                <Sparkles className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#94A3B8]">Recommended next step</p>
                                <h2 className="mt-1 text-sm font-black text-[#0F172A]">Create a comment-to-DM workflow</h2>
                                <p className="mt-1 text-xs font-semibold leading-5 text-[#64748B]">Start with a keyword and send the right link automatically.</p>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <PrimaryButton compact onClick={() => onNavigate("automations")}><Plus className="h-4 w-4" /> New Automation</PrimaryButton>
                            <button onClick={onToggleBot} className={cx("inline-flex h-9 items-center justify-center gap-2 rounded-[0.9rem] px-3 text-[13px] font-black transition", botEnabled ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50")}>
                                {botEnabled ? <Power className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                {botEnabled ? "Automation active" : "Automation paused"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {!accountPlan.isPro && <HomeUpgradeBanner accountPlan={accountPlan} proOffer={proOffer} onUpgrade={onUpgrade} />}

            <StartHereStrip connected={connected} activeTriggers={activeTriggers} onNavigate={onNavigate} />

            <MetricGrid stats={stats} activeTriggers={activeTriggers} leadsCollected={leadsCollected} deliveryRate={deliveryRate} />

            <QuickActionGrid actions={actions} featureAccess={accountPlan.featureAccess} onNavigate={onNavigate} onUpgrade={onUpgrade} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
                <RecentActivity activity={activity} onNavigate={onNavigate} />
                <HomeAutomationPanel triggers={triggers} onNavigate={onNavigate} />
            </div>
        </div>
    );
}

function HomeHeroStat({ label, value, tone }: { label: string; value: string; tone: "purple" | "green" | "blue" }) {
    const tones: Record<typeof tone, string> = {
        purple: "bg-[#EEF0FF] text-[#5B4DFF] ring-indigo-100",
        green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        blue: "bg-sky-50 text-sky-700 ring-sky-100",
    };

    return (
        <div className={cx("rounded-[16px] px-3 py-2 ring-1", tones[tone])}>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-70">{label}</p>
            <p className="mt-0.5 text-lg font-black leading-6">{value}</p>
        </div>
    );
}

function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="text-[18px] font-black tracking-tight text-[#0F172A]">{title}</h2>
                {subtitle && <p className="mt-0.5 text-[13px] font-semibold leading-5 text-[#64748B]">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

function HomeUpgradeBanner({ accountPlan, proOffer, onUpgrade }: { accountPlan: AccountPlanState; proOffer: ProOfferData; onUpgrade: () => void }) {
    const isPaymentPending = accountPlan.subscriptionStatus === "payment_pending";
    return (
        <section className="overflow-hidden rounded-[20px] border border-indigo-200/70 bg-[linear-gradient(135deg,#F8F7FF_0%,#EEF0FF_48%,#FFF8FE_100%)] p-3.5 shadow-[0_12px_34px_rgba(91,77,255,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-white text-[#5B4DFF] shadow-sm ring-1 ring-indigo-100">
                        <Crown className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="text-base font-black tracking-tight text-[#0F172A]">Unlock Pro Power</h2>
                        <p className="mt-0.5 text-sm font-semibold leading-5 text-[#64748B]">
                        {isPaymentPending ? "Payment pending. Complete payment to unlock Pro." : proOffer.eligible ? `First month only. Then ₹${proOffer.renewalMonthlyPriceInr}/month.` : "Get 20,000 DMs, exports & advanced analytics."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onUpgrade}
                    className={cx("inline-flex items-center justify-center gap-2 rounded-[0.9rem] px-4 py-2.5 text-sm font-black", goldCtaCls)}
                >
                    <Crown className={cx("h-4 w-4", goldCrownCls)} />
                    {isPaymentPending ? "Complete payment" : proOffer.eligible ? `Start Pro for ₹${proOffer.amountInr}` : "Upgrade to Pro"}
                </button>
            </div>
        </section>
    );
}

function QuickActionGrid({
    actions,
    featureAccess,
    onNavigate,
    onUpgrade,
}: {
    actions: QuickAction[];
    featureAccess: FeatureAccess;
    onNavigate: (tab: Tab) => void;
    onUpgrade: () => void;
}) {
    return (
        <section className="space-y-3">
            <SectionHeading
                title="Quick Actions"
                subtitle="Choose the outcome you want, then launch the right Instagram automation."
                action={<span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[11px] font-black text-[#64748B] ring-1 ring-slate-200">4 starter flows</span>}
            />

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {actions.map((action) => {
                    const locked = Boolean(action.feature && !featureAccess[action.feature]);
                    return (
                    <button
                        key={action.title}
                        onClick={() => locked ? onUpgrade() : onNavigate("automations")}
                        className={cx(
                            "group relative flex min-h-[132px] flex-col overflow-hidden rounded-[18px] bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5",
                            action.featured
                                ? "border border-[#E8C56C]/70 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFDF7_100%)] shadow-[0_10px_24px_rgba(120,83,20,0.045)] hover:border-[#E8C56C]/80 hover:shadow-[0_15px_30px_rgba(120,83,20,0.09)]"
                                : "border border-[#E5E7EB] shadow-[0_10px_24px_rgba(15,23,42,0.035)] hover:border-indigo-100 hover:shadow-[0_15px_30px_rgba(79,70,229,0.08)]",
                            locked && "border-[#FDE68A] bg-[#FFFDF6]"
                        )}
                    >
                        <span className={cx("pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full blur-2xl transition group-hover:opacity-100", action.featured ? "bg-amber-200/20 opacity-50" : "bg-[#5B4DFF]/10 opacity-40")} />
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <span className={cx(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] transition",
                                action.featured ? "bg-[#FFF7DA] text-[#9A6A1E] ring-1 ring-[#FDE68A]/70" : "bg-[#EEF0FF] text-[#5B4DFF] group-hover:bg-[#5B4DFF] group-hover:text-white"
                            )}>
                                {action.icon}
                            </span>

                            <span className="flex items-center gap-1.5">
                                {action.badge && (
                                    <span className={cx(
                                        "inline-flex h-5 items-center rounded-full px-2 text-[9px] font-black uppercase tracking-[0.06em] ring-1",
                                        action.badge === "Popular"
                                            ? "bg-orange-50 text-orange-600 ring-orange-100"
                                            : "bg-pink-50 text-pink-600 ring-pink-100"
                                    )}>
                                        {action.badge}
                                    </span>
                                )}
                                {locked && <SmallBadge label="Pro" tone="gold" />}
                            </span>
                        </div>

                        <div className="min-h-0 flex-1">
                            <h3 className="text-[16px] font-black leading-5 tracking-tight text-[#0F172A]">{action.title}</h3>
                            <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-5 text-[#64748B]">{action.copy}</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                <span className="inline-flex h-6 items-center rounded-full bg-slate-50 px-2 text-[10px] font-black text-slate-500 ring-1 ring-slate-100">{action.intent}</span>
                                <span className={cx("inline-flex h-6 items-center rounded-full px-2 text-[10px] font-black ring-1", action.featured ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-indigo-50 text-[#5B4DFF] ring-indigo-100")}>{action.setup}</span>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-black text-[#5B4DFF]">
                                {locked ? "Upgrade to Pro" : action.cta}
                                {locked ? <Lock className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />}
                            </span>
                        </div>
                    </button>
                    );
                })}
            </div>
        </section>
    );
}

function StartHereStrip({ connected, activeTriggers, onNavigate }: { connected: boolean; activeTriggers: number; onNavigate: (tab: Tab) => void }) {
    const steps = [
        { label: "Connect Instagram", done: connected },
        { label: "Create automation", done: activeTriggers > 0 },
        { label: "Send test DM", done: activeTriggers > 0 },
        { label: "Collect first lead", done: false },
    ];
    const complete = steps.filter((step) => step.done).length;
    const progress = (complete / steps.length) * 100;

    return (
        <section className="rounded-[20px] border border-white bg-white p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-[210px]">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-indigo-50 text-[#5B4DFF]">
                            <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-black text-slate-950">Start Here</h2>
                            <p className="text-xs font-bold text-slate-500">{complete} of {steps.length} completed · {Math.round(progress)}%</p>
                        </div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#5B4DFF]" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(135px,1fr))] gap-2">
                    {steps.map((step) => (
                        <div key={step.label} className="flex items-center gap-2 rounded-[0.85rem] bg-slate-50 px-2.5 py-2">
                            <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", step.done ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400 ring-1 ring-slate-200")}>
                                {step.done ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                            </span>
                            <span className="truncate text-xs font-black text-slate-700">{step.label}</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => onNavigate("automations")} className="inline-flex items-center justify-center gap-1 rounded-[0.85rem] bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </section>
    );
}

function MetricGrid({ stats, activeTriggers, leadsCollected, deliveryRate }: { stats: Stats; activeTriggers: number; leadsCollected: number; deliveryRate: number | null }) {
    const metrics = [
        { label: "DMs Sent Today", value: stats.dmsSentToday.toLocaleString(), icon: <Send className="h-5 w-5" />, tone: "indigo" },
        { label: "Active Automations", value: activeTriggers.toLocaleString(), icon: <Bot className="h-5 w-5" />, tone: "purple" },
        { label: "Leads Collected", value: leadsCollected.toLocaleString(), icon: <UserPlus className="h-5 w-5" />, tone: "green" },
        { label: "Followers", value: typeof stats.followers === "number" ? stats.followers.toLocaleString() : "—", icon: <Users className="h-5 w-5" />, tone: "blue", muted: true, tooltip: typeof stats.followers === "number" ? undefined : "Connect Instagram to sync follower count." },
        { label: "Failed Messages", value: stats.failedDms.toLocaleString(), icon: <AlertTriangle className="h-5 w-5" />, tone: "amber", muted: true },
        { label: "Delivery Rate", value: formatPercent(deliveryRate), icon: <CheckCircle2 className="h-5 w-5" />, tone: "green", tooltip: deliveryRate === null ? "No messages sent yet." : "Successful sends divided by total DM attempts." },
    ];

    return (
        <section className="space-y-3">
            <SectionHeading title="Performance snapshot" subtitle="The numbers that matter most for your Instagram automation today." />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(145px,1fr))] gap-3">
                {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
            </div>
        </section>
    );
}

function MetricCard({ label, value, icon, tone, muted, tooltip }: { label: string; value: string; icon: ReactNode; tone: string; muted?: boolean; tooltip?: string }) {
    const tones: Record<string, string> = {
        indigo: "bg-indigo-50 text-[#5B4DFF]",
        purple: "bg-purple-50 text-purple-600",
        green: "bg-emerald-50 text-emerald-600",
        blue: "bg-sky-50 text-sky-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div title={tooltip} className={cx("rounded-[18px] border border-white bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]", muted && "bg-white/85", tooltip && "cursor-help")}>
            <div className={cx("mb-2.5 flex items-center justify-between gap-2", muted && "mb-2")}>
                <div className={cx("flex items-center justify-center rounded-[0.9rem]", muted ? "h-8 w-8" : "h-9 w-9", tones[tone])}>{icon}</div>
                {muted && <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Monitor</span>}
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <h3 className={cx("mt-1 font-black tracking-tight text-slate-950", muted ? "text-lg" : "text-xl")}>{value}</h3>
        </div>
    );
}

function HomeAutomationPanel({ triggers, onNavigate }: { triggers: Trigger[]; onNavigate: (tab: Tab) => void }) {
    const rows = triggers;

    return (
        <Panel
            title="Automations"
            action={<button onClick={() => onNavigate("automations")} className="inline-flex items-center gap-1 text-[11px] font-black text-[#5B4DFF]/90 transition hover:text-[#4738E8]">View all <ArrowRight className="h-3.5 w-3.5" /></button>}
        >
            {rows.length ? (
                <>
                    <div className="mb-3 flex items-center justify-between rounded-[16px] bg-slate-50 px-3 py-2.5">
                        <div>
                            <p className="text-[12px] font-black text-[#0F172A]">Live workflow preview</p>
                            <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">Your latest automations by real message volume.</p>
                        </div>
                        <span className="inline-flex h-6 items-center rounded-full bg-emerald-50 px-2.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">{rows.filter((item) => item.enabled).length} live</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                    {rows.map((trigger) => (
                        <button
                            key={trigger.id}
                            onClick={() => onNavigate("automations")}
                            className="group flex rounded-[16px] border border-slate-100 bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_14px_30px_rgba(79,70,229,0.08)]"
                        >
                            <span className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-[#EEF0FF] text-[#5B4DFF]">
                                    <MessageCircle className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="truncate text-[13px] font-black leading-5 text-slate-950">Auto DM for "{trigger.keyword}"</h3>
                                    <span
                                        className={cx(
                                            "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-black",
                                            trigger.enabled
                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                                        )}
                                    >
                                        {trigger.enabled ? "Live" : "Paused"}
                                    </span>
                                </div>
                                <p className="mt-1 line-clamp-1 text-[12px] font-medium leading-5 text-slate-500">{trigger.replyMessage}</p>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-black text-slate-500">{safeNumber(trigger.dmsSent).toLocaleString()} DMs sent</span>
                                    <span className="text-[11px] font-black text-indigo-600 transition group-hover:translate-x-0.5">Manage</span>
                                </div>
                            </div>
                        </button>
                    ))}
                    </div>
                </>
            ) : (
                <EmptyState icon={<Bot className="h-6 w-6" />} title="No automations yet" copy="Create your first Instagram DM automation." action="Create Automation" onAction={() => onNavigate("automations")} />
            )}
        </Panel>
    );
}

function OnboardingCard({ connected, activeTriggers, onNavigate }: { connected: boolean; activeTriggers: number; onNavigate: (tab: Tab) => void }) {
    const steps = [
        { label: "Connect Instagram", done: connected },
        { label: "Create automation", done: activeTriggers > 0 },
        { label: "Send first auto DM", done: activeTriggers > 0 },
        { label: "Collect first lead", done: false },
    ];
    const complete = steps.filter((step) => step.done).length;
    const progress = (complete / steps.length) * 100;

    return (
        <Panel title="Next best steps" action={<button onClick={() => onNavigate("automations")} className="text-xs font-black text-[#5B4DFF]/90 transition hover:text-[#4738E8]">Continue</button>}>
            <div className="mb-4">
                <div className="mb-2 flex justify-between text-sm font-bold text-slate-500">
                    <span>{complete} of {steps.length} completed</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <div className="space-y-2.5">
                {steps.map((step) => (
                    <div key={step.label} className="flex items-center gap-3 rounded-[1rem] bg-slate-50 px-4 py-2.5">
                        <span className={cx("flex h-7 w-7 items-center justify-center rounded-full", step.done ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-400 ring-1 ring-slate-200")}>
                            {step.done ? <Check className="h-4 w-4 stroke-[3]" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                        </span>
                        <span className="text-sm font-black text-slate-700">{step.label}</span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function RecentActivity({ activity, onNavigate }: { activity: LogEntry[]; onNavigate: (tab: Tab) => void }) {
    const rows = activity;

    return (
        <Panel title="Recent activity" action={<button onClick={() => onNavigate("inbox")} className="text-xs font-black text-[#5B4DFF]/90 transition hover:text-[#4738E8]">View inbox</button>}>
            {rows.length ? (
                <div className="space-y-2.5">
                    <div className="rounded-[16px] bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF0FF_100%)] px-3.5 py-3 ring-1 ring-indigo-100/70">
                        <p className="text-[12px] font-black text-[#0F172A]">Latest automation events</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">Recent DMs, leads, and failed sends in one place.</p>
                    </div>
                    {rows.map((item, index) => (
                        <div key={item.id} className="relative flex items-start gap-3 rounded-[1rem] border border-slate-100 bg-white px-3.5 py-3">
                            {index < rows.length - 1 && <span className="absolute left-[31px] top-12 h-[calc(100%-18px)] w-px bg-slate-100" />}
                            <span className={cx("flex h-9 w-9 items-center justify-center rounded-[1rem]", item.status === "sent" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                {item.status === "sent" ? <Send className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-black text-slate-950">{item.status === "sent" ? "DM sent" : "Failed DM"} to {item.user}</p>
                                    <span className={cx("inline-flex h-5 items-center rounded-full px-2 text-[10px] font-black", item.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                                        {item.status === "sent" ? "Delivered" : "Needs review"}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-xs font-semibold text-slate-500">Keyword trigger: <span className="font-black text-slate-700">{item.trigger || item.keyword}</span></p>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-slate-400">{item.time}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<Activity className="h-6 w-6" />} title="No activity yet" copy="Once your automation sends DMs, activity will appear here." action="Create automation" onAction={() => onNavigate("automations")} />
            )}
        </Panel>
    );
}

function AutomationsPage(props: {
    triggers: Trigger[];
    search: string;
    status: string;
    addingTrigger: boolean;
    newKeyword: string;
    newReply: string;
    onSearch: (value: string) => void;
    onStatus: (value: string) => void;
    onAddOpen: () => void;
    onAddCancel: () => void;
    onKeyword: (value: string) => void;
    onReply: (value: string) => void;
    onAdd: (draft?: AutomationDraft) => void | Promise<void>;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
    onNavigate: (tab: Tab) => void;
    onUpgrade: () => void;
    proOffer: ProOfferData;
    accountPlan: AccountPlanState;
    automationCount: number;
}) {
    const [templateOpen, setTemplateOpen] = useState(false);
    const [builderOpen, setBuilderOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
    const [triggerFilter, setTriggerFilter] = useState("All triggers");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [launchSuccess, setLaunchSuccess] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Trigger | null>(null);
    const automationLimitReached = !props.accountPlan.isPro && props.automationCount >= props.accountPlan.limits.automationLimit;

    const openTemplates = () => {
        if (automationLimitReached) {
            props.onUpgrade();
            return;
        }
        props.onAddOpen();
        setTemplateOpen(true);
    };

    const openBuilder = (template?: AutomationTemplate) => {
        setSelectedTemplate(template || null);
        setTemplateOpen(false);
        setBuilderOpen(true);
    };

    const openExistingBuilder = (trigger: Trigger) => {
        openBuilder({
            title: `Auto DM for "${trigger.keyword}"`,
            description: trigger.replyMessage,
            category: "Engage audience",
            trigger: "Post or Reel comment",
            keyword: trigger.keyword,
            replyMessage: trigger.replyMessage,
            icon: <MessageCircle className="h-5 w-5" />,
        });
    };

    const closeBuilder = () => {
        setBuilderOpen(false);
        setSelectedTemplate(null);
        props.onAddCancel();
    };

    const saveBuilder = async (draft: AutomationDraft) => {
        await props.onAdd(draft);
        setBuilderOpen(false);
        setSelectedTemplate(null);
        props.onAddCancel();
        setLaunchSuccess(true);
    };

    const visibleTriggers = props.triggers.filter((trigger) => {
        if (triggerFilter === "All triggers") return true;
        const triggerLabel = "Post or Reel comment";
        return triggerFilter === triggerLabel || trigger.keyword.toLowerCase().includes(triggerFilter.toLowerCase());
    });

    if (builderOpen) {
        return (
            <AutomationBuilder
                template={selectedTemplate}
                initialKeyword={props.newKeyword}
                initialReply={props.newReply}
                onCancel={closeBuilder}
                onSave={saveBuilder}
                accountPlan={props.accountPlan}
                onUpgrade={props.onUpgrade}
            />
        );
    }

    return (
            <PageShell
                title="Automations"
                subtitle="Create, manage, and track your Instagram automation flows."
            action={<PrimaryButton onClick={openTemplates}><Plus className="h-4 w-4" /> {automationLimitReached ? "Upgrade to Pro" : "New Automation"}</PrimaryButton>}
        >
            {!props.accountPlan.isPro && <AutomationMiniUpgradeStrip onUpgrade={props.onUpgrade} proOffer={props.proOffer} />}
            {automationLimitReached && (
                <div className="rounded-[18px] border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm font-bold text-amber-800">
                    You’ve reached your Starter automation limit. Upgrade to Pro to create more.
                </div>
            )}

            <section className="rounded-[20px] border border-white bg-white p-3.5 shadow-[0_14px_42px_rgba(15,23,42,0.045)]">
                <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_180px_160px_auto] xl:items-center">
                    <SearchBox value={props.search} onChange={props.onSearch} placeholder="Search automations..." />
                    <SelectBox value={triggerFilter} onChange={setTriggerFilter} options={["All triggers", "Post or Reel comment", "DM keyword", "Story reply", "Live comment"]} />
                    <SelectBox value={props.status} onChange={props.onStatus} options={["all", "live", "paused", "draft"]} />
                    <div className="flex rounded-[0.95rem] border border-slate-200 bg-slate-50 p-1">
                        {[
                            { key: "list" as const, label: "List", icon: <FileText className="h-3.5 w-3.5" /> },
                            { key: "grid" as const, label: "Grid", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setViewMode(item.key)}
                                className={cx(
                                    "inline-flex h-9 items-center gap-1.5 rounded-[0.75rem] px-3 text-xs font-black transition",
                                    viewMode === item.key ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <Panel title="Workflows" action={<button onClick={openTemplates} className="inline-flex items-center gap-1.5 text-xs font-black text-[#5B4DFF] transition hover:text-[#4738E8]"><Plus className="h-3.5 w-3.5" /> New flow</button>}>
                {visibleTriggers.length ? (
                    viewMode === "list" ? (
                        <div className="space-y-2.5">
                            {visibleTriggers.map((trigger, index) => (
                                <AutomationListRow
                                    key={trigger.id}
                                    trigger={trigger}
                                    index={index}
                                    onToggle={() => props.onToggle(trigger.id)}
                                    onEdit={() => openExistingBuilder(trigger)}
                                    onDuplicate={() => props.onAdd({ keyword: `${trigger.keyword}-copy`, replyMessage: trigger.replyMessage })}
                                    onAnalytics={() => props.onNavigate("analytics")}
                                    onDelete={() => setDeleteTarget(trigger)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {visibleTriggers.map((trigger, index) => (
                                <AutomationGridCard
                                    key={trigger.id}
                                    trigger={trigger}
                                    index={index}
                                    onToggle={() => props.onToggle(trigger.id)}
                                    onEdit={() => openExistingBuilder(trigger)}
                                    onDuplicate={() => props.onAdd({ keyword: `${trigger.keyword}-copy`, replyMessage: trigger.replyMessage })}
                                    onAnalytics={() => props.onNavigate("analytics")}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState icon={<Bot className="h-6 w-6" />} title="No automations yet" copy="Start with a template and launch your first Instagram automation in minutes." action="New Automation" onAction={openTemplates} />
                )}
            </Panel>

            {templateOpen && (
                <TemplateSelectionModal
                    onClose={() => { setTemplateOpen(false); props.onAddCancel(); }}
                    onScratch={() => openBuilder()}
                    onSelect={openBuilder}
                    accountPlan={props.accountPlan}
                    onUpgrade={props.onUpgrade}
                />
            )}
            {launchSuccess && <AutomationSuccessModal onClose={() => setLaunchSuccess(false)} />}
            {deleteTarget && (
                <ConfirmAutomationDeleteModal
                    trigger={deleteTarget}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => {
                        props.onDelete(deleteTarget.id);
                        setDeleteTarget(null);
                    }}
                />
            )}
        </PageShell>
    );
}

function ConfirmAutomationDeleteModal({ trigger, onCancel, onConfirm }: { trigger: Trigger; onCancel: () => void; onConfirm: () => void }) {
    return (
        <ModalShell onClose={onCancel}>
            <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                    <Trash2 className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-2xl font-black text-[#0F172A]">Delete automation?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#64748B]">
                    Auto DM for “{trigger.keyword}” will be removed from this dashboard preview. This action cannot be undone here.
                </p>
                <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
                    <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
                    <button onClick={onConfirm} className="inline-flex h-11 items-center justify-center gap-2 rounded-[0.95rem] bg-rose-600 px-5 text-sm font-black text-white transition hover:bg-rose-700">
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function ConfirmInstagramDisconnectModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void | Promise<void> }) {
    return (
        <ModalShell onClose={onCancel}>
            <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                    <Instagram className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-2xl font-black text-[#0F172A]">Disconnect Instagram?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#64748B]">
                    DMGennie will stop sending automation messages until you reconnect this Instagram account.
                </p>
                <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
                    <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
                    <button onClick={onConfirm} className="inline-flex h-11 items-center justify-center gap-2 rounded-[0.95rem] bg-rose-600 px-5 text-sm font-black text-white transition hover:bg-rose-700">
                        Disconnect
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function UpgradeModal({ proOffer, onClose, onUpgrade }: { proOffer: ProOfferData; onClose: () => void; onUpgrade: () => void }) {
    const isPaymentPending = proOffer.reason.toLowerCase().includes("payment pending");
    return (
        <ModalShell onClose={onClose}>
            <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[#FFF7DA] text-[#8A5D17] ring-1 ring-[#E8C56C]/50">
                    <Crown className="h-8 w-8 fill-[#8A5D17]" />
                </span>
                <h2 className="mt-5 text-2xl font-black text-[#0F172A]">Unlock Pro</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#64748B]">
                    Get 20,000 DMs, unlimited contacts, exports, and advanced analytics.
                </p>
                <div className="mx-auto mt-5 max-w-md rounded-[18px] border border-amber-100 bg-amber-50/70 p-3 text-left">
                    <p className="text-sm font-black text-[#0F172A]">{isPaymentPending ? "Payment pending" : proOffer.eligible ? `Start Pro for ₹${proOffer.amountInr}` : "Upgrade to Pro"}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
                        {isPaymentPending ? "Complete payment to unlock Pro features." : proOffer.eligible ? `First month only. Then ₹${proOffer.renewalMonthlyPriceInr}/month.` : "Unlock higher DM limits and Pro-only workflows."}
                    </p>
                </div>
                <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
                    <SecondaryButton onClick={onClose}>Maybe later</SecondaryButton>
                    <PrimaryButton onClick={onUpgrade}>
                        <Crown className="h-4 w-4" />
                        {isPaymentPending ? "Complete payment" : proOffer.eligible ? `Start Pro for ₹${proOffer.amountInr}` : "Upgrade to Pro"}
                    </PrimaryButton>
                </div>
            </div>
        </ModalShell>
    );
}

function AutomationMiniUpgradeStrip({ onUpgrade, proOffer }: { onUpgrade: () => void; proOffer: ProOfferData }) {
    const isPaymentPending = proOffer.reason.toLowerCase().includes("payment pending");
    return (
        <section className="rounded-[18px] border border-indigo-200/60 bg-gradient-to-r from-[#EEF0FF] via-white to-[#F8EEFF] p-3.5 shadow-[0_12px_32px_rgba(91,77,255,0.07)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-white text-[#5B4DFF] shadow-sm ring-1 ring-indigo-100">
                        <Sparkles className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="text-sm font-black text-[#0F172A]">Unlock Pro Power</h2>
                        <p className="text-xs font-semibold text-[#64748B]">{isPaymentPending ? "Payment pending. Complete payment to unlock Pro." : proOffer.eligible ? `First month only. Then ₹${proOffer.renewalMonthlyPriceInr}/month.` : "Get 20,000 DMs, exports, and advanced analytics."}</p>
                    </div>
                </div>
                <button onClick={onUpgrade} className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#5B4DFF] px-4 text-xs font-black text-white shadow-[0_10px_22px_rgba(91,77,255,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4738E8]">
                    <Crown className="h-3.5 w-3.5" />
                    {isPaymentPending ? "Complete payment" : proOffer.eligible ? `Start Pro for ₹${proOffer.amountInr}` : "Upgrade to Pro"}
                </button>
            </div>
        </section>
    );
}

function AutomationListRow({
    trigger,
    index,
    onToggle,
    onEdit,
    onDuplicate,
    onAnalytics,
    onDelete,
}: {
    trigger: Trigger;
    index: number;
    onToggle: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onAnalytics: () => void;
    onDelete: () => void;
}) {
    const dms = safeNumber(trigger.dmsSent);
    const clicks = 0;
    const ctr = dms > 0 ? Math.max(0, Math.round((clicks / dms) * 100)) : 0;
    const modifiedLabel = trigger.modifiedAt ? new Date(trigger.modifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Unknown";

    return (
        <div className="grid gap-3 rounded-[18px] border border-slate-100 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_16px_34px_rgba(79,70,229,0.07)] xl:grid-cols-[minmax(280px,1.4fr)_140px_120px_78px_78px_68px_84px_92px_auto] xl:items-center">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#EEF0FF] via-white to-[#F8EEFF] text-[#5B4DFF] ring-1 ring-indigo-100">
                    <MessageCircle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-[#0F172A]">Auto DM for "{trigger.keyword}"</h3>
                    <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{trigger.replyMessage}</p>
                </div>
            </div>
            <AutomationDataPill label="Trigger" value={trigger.triggerType || "Comment keyword"} />
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Keywords</p>
                <div className="mt-1 flex min-w-0 flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#EEF0FF] px-2 py-1 text-[10px] font-black text-[#5B4DFF] ring-1 ring-indigo-100">+{trigger.keyword}</span>
                </div>
            </div>
            <AutomationDataPill label="DMs" value={dms.toLocaleString()} />
            <AutomationDataPill label="Clicks" value={clicks.toLocaleString()} />
            <AutomationDataPill label="CTR" value={`${ctr}%`} muted />
            <StatusBadge status={trigger.enabled ? "Live" : "Paused"} />
            <span className="text-xs font-bold text-[#64748B]">{modifiedLabel}</span>
            <div className="flex justify-end gap-1.5">
                <IconButton title={trigger.enabled ? "Pause automation" : "Resume automation"} onClick={onToggle}>{trigger.enabled ? <Pause className="h-4 w-4" /> : <Power className="h-4 w-4" />}</IconButton>
                <IconButton title="Edit automation" onClick={onEdit}><PenLine className="h-4 w-4" /></IconButton>
                <IconButton title="Duplicate automation" onClick={onDuplicate}><ClipboardList className="h-4 w-4" /></IconButton>
                <IconButton title="View analytics" onClick={onAnalytics}><BarChart3 className="h-4 w-4" /></IconButton>
                <IconButton title="Delete automation" danger onClick={onDelete}><Trash2 className="h-4 w-4" /></IconButton>
                <IconButton title="More actions"><MoreHorizontal className="h-4 w-4" /></IconButton>
            </div>
        </div>
    );
}

function AutomationGridCard({
    trigger,
    index,
    onToggle,
    onEdit,
    onDuplicate,
    onAnalytics,
}: {
    trigger: Trigger;
    index: number;
    onToggle: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onAnalytics: () => void;
}) {
    const dms = safeNumber(trigger.dmsSent);
    const clicks = 0;
    const ctr = dms > 0 ? Math.max(0, Math.round((clicks / dms) * 100)) : 0;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onEdit}
            onKeyDown={(event) => event.key === "Enter" && onEdit()}
            className="group flex min-h-[178px] flex-col rounded-[18px] border border-slate-100 bg-white p-4 text-left shadow-[0_10px_26px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_16px_34px_rgba(79,70,229,0.08)]"
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-[#EEF0FF] text-[#5B4DFF]">
                    <MessageCircle className="h-5 w-5" />
                </span>
                <StatusBadge status={trigger.enabled ? "Live" : "Paused"} />
            </div>
            <h3 className="text-sm font-black text-[#0F172A]">Auto DM for "{trigger.keyword}"</h3>
            <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-[#64748B]">{trigger.replyMessage}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#EEF0FF] px-2 py-1 text-[10px] font-black text-[#5B4DFF] ring-1 ring-indigo-100">+{trigger.keyword}</span>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-100">{trigger.triggerType || "Comment keyword"}</span>
            </div>
            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                <AutomationDataPill label="DMs" value={dms.toLocaleString()} />
                <AutomationDataPill label="Clicks" value={clicks.toLocaleString()} />
                <AutomationDataPill label="CTR" value={`${ctr}%`} muted />
            </div>
            <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-black text-[#5B4DFF]">Edit flow</span>
                <div className="flex gap-1">
                    <button onClick={(event) => { event.stopPropagation(); onAnalytics(); }} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600 transition hover:bg-slate-100">Analytics</button>
                    <button onClick={(event) => { event.stopPropagation(); onDuplicate(); }} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600 transition hover:bg-slate-100">Duplicate</button>
                    <button onClick={(event) => { event.stopPropagation(); onToggle(); }} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600 transition hover:bg-slate-100">
                        {trigger.enabled ? "Pause" : "Resume"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AutomationDataPill({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className={cx("mt-0.5 truncate text-xs font-black", muted ? "text-[#64748B]" : "text-[#0F172A]")}>{value}</p>
        </div>
    );
}

function TemplateSelectionModal({
    onClose,
    onScratch,
    onSelect,
    accountPlan,
    onUpgrade,
}: {
    onClose: () => void;
    onScratch: () => void;
    onSelect: (template: AutomationTemplate) => void;
    accountPlan: AccountPlanState;
    onUpgrade: () => void;
}) {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All templates");
    const categories = [
        "All templates",
        "Grow followers",
        "Engage audience",
        "Drive traffic",
        "Collect leads",
        "Post or Reel comment",
        "DM keyword",
        "Story reply",
        "Live comment",
    ];
    const filtered = automationTemplates.filter((template) => {
        const matchesQuery = `${template.title} ${template.description} ${template.trigger}`.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "All templates" || template.category === category || template.trigger === category;
        return matchesQuery && matchesCategory;
    });

    return (
        <ModalShell onClose={onClose} wide>
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5B4DFF]">Template library</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0F172A]">Choose an automation template</h2>
                        <p className="mt-1 text-sm font-semibold text-[#64748B]">Start with a ready-made flow or build from scratch.</p>
                    </div>
                    <div className="flex gap-2">
                        <SecondaryButton onClick={onScratch}><Wand2 className="h-4 w-4" /> Start from Scratch</SecondaryButton>
                        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <SearchBox value={query} onChange={setQuery} placeholder="Search Instagram templates..." />

                <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <aside className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-2">
                        <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Categories</p>
                        <div className="space-y-1">
                            {categories.map((item, index) => (
                                <button
                                    key={item}
                                    onClick={() => setCategory(item)}
                                    className={cx(
                                        "flex w-full items-center gap-2 rounded-[0.9rem] px-3 py-2 text-left text-xs font-black transition",
                                        category === item ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:bg-white/80 hover:text-[#0F172A]",
                                        index === 5 && "mt-3"
                                    )}
                                >
                                    {index >= 5 ? <Filter className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    {item}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                        {filtered.map((template) => (
                            <TemplateCard key={template.title} template={template} accountPlan={accountPlan} onSelect={onSelect} onUpgrade={onUpgrade} />
                        ))}
                        {!filtered.length && (
                            <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center sm:col-span-2">
                                <p className="text-sm font-black text-[#0F172A]">No matching templates</p>
                                <p className="mt-1 text-xs font-semibold text-[#64748B]">Try another keyword or start from scratch.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

function TemplateCard({ template, accountPlan, onSelect, onUpgrade }: { template: AutomationTemplate; accountPlan: AccountPlanState; onSelect: (template: AutomationTemplate) => void; onUpgrade: () => void }) {
    const isAdvanced = template.badge === "Pro";
    const requiredFeature = templateRequiredFeature(template);
    const locked = Boolean(requiredFeature && !accountPlan.featureAccess[requiredFeature]);

    return (
        <button
            key={template.title}
            onClick={() => locked ? onUpgrade() : onSelect(template)}
            className={cx(
                "group relative rounded-[18px] border bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.025)] transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_16px_34px_rgba(79,70,229,0.08)]",
                isAdvanced ? "border-[#FDE68A] bg-[#FFFDF6]" : "border-slate-100"
            )}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-[0.9rem]", isAdvanced ? "bg-[#FFF7DA] text-[#8A5D17]" : "bg-[#EEF0FF] text-[#5B4DFF]")}>{template.icon}</span>
                <div className="flex gap-1.5">
                    {template.badge && <SmallBadge label={isAdvanced ? "Advanced" : template.badge} tone={isAdvanced ? "gold" : "purple"} />}
                    {locked && <SmallBadge label="Pro" tone="gold" />}
                </div>
            </div>
            <h3 className="text-sm font-black text-[#0F172A]">{template.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-[#64748B]">{template.description}</p>
            {locked && <p className="mt-2 text-[11px] font-bold text-[#8A5D17]">Upgrade to Pro to use this template.</p>}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">{template.trigger}</span>
                {locked ? <Lock className="h-4 w-4 text-[#8A5D17]" /> : <ArrowRight className="h-4 w-4 text-[#5B4DFF] transition group-hover:translate-x-0.5" />}
            </div>
        </button>
    );
}

function templateRequiredFeature(template: AutomationTemplate): keyof FeatureAccess | undefined {
    if (template.category === "Collect leads") return "leadGen";
    if (template.category === "Grow followers") return "growFollowers";
    if (template.trigger === "DM keyword") return "autoReply";
    return undefined;
}

function AutomationBuilder({
    template,
    initialKeyword,
    initialReply,
    onCancel,
    onSave,
    accountPlan,
    onUpgrade,
}: {
    template: AutomationTemplate | null;
    initialKeyword: string;
    initialReply: string;
    onCancel: () => void;
    onSave: (draft: AutomationDraft) => void | Promise<void>;
    accountPlan: AccountPlanState;
    onUpgrade: () => void;
}) {
    const [step, setStep] = useState(1);
    const [automationName, setAutomationName] = useState(template?.title || "Auto DM from comments");
    const [triggerType, setTriggerType] = useState(template?.trigger || "Post or Reel comment");
    const [selectedPost, setSelectedPost] = useState("All posts & reels");
    const [mediaQuery, setMediaQuery] = useState("");
    const [mediaFilter, setMediaFilter] = useState("All");
    const [storyReplyMode, setStoryReplyMode] = useState("Specific keyword in story reply");
    const [liveCommentMode, setLiveCommentMode] = useState("Specific live comment keyword");
    const [keywords, setKeywords] = useState<string[]>(() => Array.from(new Set([normalizeKeyword(template?.keyword || initialKeyword || "link"), "send", "price"].filter(Boolean))));
    const [anyKeyword, setAnyKeyword] = useState(false);
    const [welcomeEnabled, setWelcomeEnabled] = useState(true);
    const [welcomeDm, setWelcomeDm] = useState("Hey @username, thanks for commenting.");
    const [finalDm, setFinalDm] = useState(template?.replyMessage || initialReply || "Here is the link you asked for.");
    const [linkEnabled, setLinkEnabled] = useState(true);
    const [buttonText, setButtonText] = useState("Open Link");
    const [linkUrl, setLinkUrl] = useState("https://dmgennie.in/guide");
    const [commentReplies, setCommentReplies] = useState(defaultCommentReplies);
    const [openingMessageEnabled, setOpeningMessageEnabled] = useState(true);
    const [previewTab, setPreviewTab] = useState<PreviewTab>("Post");
    const [postModalOpen, setPostModalOpen] = useState(false);
    const [keywordsModalOpen, setKeywordsModalOpen] = useState(false);
    const [repliesModalOpen, setRepliesModalOpen] = useState(false);
    const [responseModalOpen, setResponseModalOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [builderError, setBuilderError] = useState("");
    const [saving, setSaving] = useState(false);
    const [askFollowFirst, setAskFollowFirst] = useState(false);
    const [askEmailFirst, setAskEmailFirst] = useState(template?.category === "Collect leads");
    const [followUpEnabled, setFollowUpEnabled] = useState(false);
    const [followUpDelay, setFollowUpDelay] = useState("1 day");
    const [followUpMessage, setFollowUpMessage] = useState("Just checking in. Did you get the guide?");
    const [responses, setResponses] = useState<ResponseConfig[]>([]);
    const [builderToast, setBuilderToast] = useState("");
    const finalDmRef = useRef<HTMLTextAreaElement | null>(null);

    const primaryKeyword = keywords[0] || "link";
    const selectedMedia = fallbackInstagramMedia.find((media) => media.title === selectedPost) || fallbackInstagramMedia[0];
    const contentSource = triggerType === "Live comment" ? "live" : triggerType === "Story reply" ? "story" : triggerType === "DM keyword" ? "dm" : "post";
    const safeWelcomeDm = welcomeDm.trim() || "Hey @username, thanks for commenting.";
    const safeFinalDm = finalDm.trim() || "Hey @username, here is the link you asked for.";
    const keywordText = anyKeyword ? "Any keyword" : keywords.length ? keywords.map((item) => `+${item}`).join(", ") : "+link";
    const repliesCount = commentReplies.filter((reply) => reply.trim()).length;
    const mediaItemsCount = fallbackInstagramMedia.filter((media) => media.id !== "all").length;
    const keywordRequired = contentSource === "post" || contentSource === "dm" || (contentSource === "story" && storyReplyMode === "Specific keyword in story reply") || (contentSource === "live" && liveCommentMode === "Specific live comment keyword");
    const beforeFinalDmItems = [askFollowFirst ? "Follow confirmation" : "", askEmailFirst ? "Email capture" : ""].filter(Boolean);
    const visibleMedia = fallbackInstagramMedia.filter((media) => {
        const matchesQuery = `${media.title} ${media.caption} ${media.metric}`.toLowerCase().includes(mediaQuery.toLowerCase());
        const matchesType = media.id === "all" || mediaFilter === "All" || (mediaFilter === "Posts" && media.type === "Post") || (mediaFilter === "Reels" && media.type === "Reel") || (mediaFilter === "Carousels" && media.type === "Carousel");
        return matchesQuery && matchesType;
    });

    const addKeyword = (keyword: string) => {
        const cleanKeyword = normalizeKeyword(keyword);
        if (!cleanKeyword) return;
        setBuilderError("");
        setKeywords((prev) => prev.some((item) => item.toLowerCase() === cleanKeyword) ? prev : [...prev, cleanKeyword]);
    };
    const removeKeyword = (keyword: string) => setKeywords((prev) => prev.filter((item) => item !== keyword));
    const showBuilderToast = (message: string) => {
        setBuilderToast(message);
        window.setTimeout(() => setBuilderToast(""), 2200);
    };
    const requireBuilderFeature = (feature: keyof FeatureAccess, message: string) => {
        if (accountPlan.featureAccess[feature]) return true;
        showBuilderToast(message);
        onUpgrade();
        return false;
    };
    const toggleAskFollowFirst = () => {
        if (!requireBuilderFeature("askForFollow", "Upgrade to Pro to unlock Ask For Follow.")) return;
        setAskFollowFirst((current) => {
            const next = !current;
            showBuilderToast(next ? "Follow request enabled" : "Follow request disabled");
            return next;
        });
    };
    const toggleAskEmailFirst = () => {
        if (!requireBuilderFeature("leadGen", "Upgrade to Pro to unlock Lead Gen.")) return;
        setAskEmailFirst((current) => {
            const next = !current;
            showBuilderToast(next ? "Email capture enabled" : "Email capture disabled");
            return next;
        });
    };
    const toggleFollowUp = () => {
        if (!requireBuilderFeature("autoReply", "Upgrade to Pro to unlock this feature.")) return;
        setFollowUpEnabled((current) => {
            const next = !current;
            showBuilderToast(next ? "Follow-up message enabled" : "Follow-up message disabled");
            return next;
        });
    };
    const handleReTrigger = () => {
        if (!requireBuilderFeature("reTrigger", "Upgrade to Pro to unlock Re-trigger.")) return;
        showBuilderToast("Re-trigger is ready for this automation.");
    };

    const getStepError = (targetStep = step) => {
        if (targetStep === 1) {
            if (!automationName.trim()) return "Please name this automation.";
            if (!triggerType) return "Please choose a trigger.";
            if (contentSource === "post" && !selectedMedia) return "Please choose a post, reel, or All posts & reels.";
        }
        if (targetStep === 2 && keywordRequired && !anyKeyword && keywords.length === 0) return "Add at least one keyword or enable Any keyword.";
        if (targetStep === 3 && linkEnabled) {
            if (!buttonText.trim()) return "Button text is required.";
            if (!linkUrl.trim() || !isValidHttpUrl(linkUrl)) return "Enter a valid link URL.";
        }
        return "";
    };

    useEffect(() => {
        if (step === 1) {
            if (contentSource === "story") setPreviewTab("Story");
            else if (contentSource === "live") setPreviewTab("Live");
            else if (contentSource === "dm") setPreviewTab("DM");
            else setPreviewTab("Post");
        }
        if (step === 2) {
            if (contentSource === "story") setPreviewTab("Story");
            else if (contentSource === "live") setPreviewTab("Live");
            else if (contentSource === "dm") setPreviewTab("DM");
            else setPreviewTab("Comments");
        }
        if (step === 3 || step === 4) setPreviewTab("DM");
    }, [step, contentSource]);

    const chooseTrigger = (type: string) => {
        if (type === "DM keyword" && !requireBuilderFeature("autoReply", "Upgrade to Pro to unlock DM keyword automations.")) return;
        setTriggerType(type);
        setBuilderError("");
    };

    const goToStep = (nextStep: number) => {
        setBuilderError("");
        setStep(nextStep);
    };

    const goNext = () => {
        const error = getStepError(step);
        if (error) {
            setBuilderError(error);
            return;
        }
        setBuilderError("");
        setStep((current) => Math.min(4, current + 1));
    };

    const insertFinalToken = (token: string) => {
        const textarea = finalDmRef.current;
        if (!textarea) {
            setFinalDm((current) => `${current}${current ? " " : ""}${token}`);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const next = `${finalDm.slice(0, start)}${token}${finalDm.slice(end)}`;
        setFinalDm(next);
        window.requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const completeSave = async () => {
        for (let index = 1; index <= 4; index += 1) {
            const error = getStepError(index);
            if (error) {
                setStep(index);
                setBuilderError(error);
                return;
            }
        }
        setSaving(true);
        try {
            const feature: keyof FeatureAccess | undefined = askEmailFirst || template?.category === "Collect leads"
                ? "leadGen"
                : askFollowFirst || template?.category === "Grow followers"
                    ? "askForFollow"
                    : triggerType === "DM keyword" || followUpEnabled || responses.some((response) => response.type !== "lead")
                        ? "autoReply"
                        : undefined;
            await onSave({ keyword: anyKeyword ? "any" : primaryKeyword, replyMessage: safeFinalDm, triggerType, feature });
        } finally {
            setSaving(false);
        }
    };

    const openReviewLaunch = () => {
        for (let index = 1; index <= 4; index += 1) {
            const error = getStepError(index);
            if (error) {
                setStep(index);
                setBuilderError(error);
                return;
            }
        }
        setBuilderError("");
        setReviewOpen(true);
    };

    const reviewItems = [
        { label: "Instagram account", value: "@dmgennie.in" },
        { label: "Trigger", value: triggerType },
        { label: "Selected content", value: contentSource === "post" ? selectedMedia.title : contentSource === "story" ? storyReplyMode : contentSource === "live" ? liveCommentMode : "DM keyword" },
        { label: "Keywords", value: keywordText },
        { label: "Welcome DM", value: welcomeEnabled ? safeWelcomeDm : "Off" },
        { label: "Final DM", value: safeFinalDm },
        { label: "Button", value: linkEnabled ? `${buttonText || "Open Link"} · ${linkUrl || "Missing URL"}` : "No button" },
        { label: "Comment replies", value: `${repliesCount} saved` },
        { label: "Before final DM", value: beforeFinalDmItems.length ? beforeFinalDmItems.join(", ") : "None" },
        { label: "Response flow", value: `${responses.length} response${responses.length === 1 ? "" : "s"}${followUpEnabled ? ` · Follow-up after ${followUpDelay}` : ""}` },
    ];
    const stepLabels = ["Trigger & content", "Keywords", "Final DM", "Review"];

    return (
        <div className="space-y-4">
            <section className="sticky top-3 z-20 rounded-[20px] border border-white bg-white/95 p-3 shadow-[0_16px_44px_rgba(15,23,42,0.07)] backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <button onClick={onCancel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                            <ArrowRight className="h-4 w-4 rotate-180" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#94A3B8]">Automation builder</p>
                            <h1 className="truncate text-lg font-black text-[#0F172A]">{automationName}</h1>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button className="inline-flex h-9 items-center gap-2 rounded-full bg-emerald-50 px-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live ready
                        </button>
                        <SecondaryButton onClick={handleReTrigger}><RefreshCw className="h-4 w-4" /> Re-trigger</SecondaryButton>
                        <PrimaryButton onClick={openReviewLaunch}><Check className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}</PrimaryButton>
                    </div>
                </div>
            </section>

            <BuilderStepIndicator step={step} onStep={goToStep} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">
                    {step === 1 && (
                        <BuilderCard title="Choose trigger and content" subtitle="Choose where DMGennie should listen, then pick the content or trigger condition.">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                                <div>
                                    <Label>Automation name</Label>
                                    <input className={inputCls} value={automationName} onChange={(event) => setAutomationName(event.target.value)} />
                                </div>
                                <div>
                                    <Label>Connected Instagram</Label>
                                    <div className="flex h-[46px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3">
                                        <span className="flex min-w-0 items-center gap-2 text-sm font-black text-[#0F172A]">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5B4DFF] to-[#F05A8A] text-xs text-white">D</span>
                                            <span className="truncate">@dmgennie.in</span>
                                        </span>
                                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="mb-3">
                                    <h3 className="text-sm font-black text-[#0F172A]">Choose how this automation starts</h3>
                                    <p className="mt-0.5 text-xs font-semibold text-[#64748B]">Pick the Instagram action that should start this flow.</p>
                                </div>
                                <div className="grid gap-3 lg:grid-cols-2">
                                    <ContentSourceCard
                                        title="When someone comments on a specific post or reel"
                                        copy="Select one post, one reel, or listen across all connected media."
                                        icon={<MessageCircle className="h-5 w-5" />}
                                        selected={contentSource === "post"}
                                        action="Choose media"
                                        onClick={() => chooseTrigger("Post or Reel comment")}
                                    />
                                    <ContentSourceCard
                                        title="User comments on your live"
                                        copy="Create a live-comment trigger and send an automated DM from live engagement."
                                        icon={<Radio className="h-5 w-5" />}
                                        selected={contentSource === "live"}
                                        action="Create trigger"
                                        onClick={() => chooseTrigger("Live comment")}
                                    />
                                    <ContentSourceCard
                                        title="User replies to your story"
                                        copy="Set up a story reply trigger for reactions, replies, and story conversations."
                                        icon={<MessageSquare className="h-5 w-5" />}
                                        selected={contentSource === "story"}
                                        action="Setup trigger"
                                        onClick={() => chooseTrigger("Story reply")}
                                    />
                                    <ContentSourceCard
                                        title="DM keyword"
                                        copy="Start a flow when someone sends a keyword in DM."
                                        icon={<KeyRound className="h-5 w-5" />}
                                        selected={contentSource === "dm"}
                                        action="Setup DM keyword"
                                        onClick={() => chooseTrigger("DM keyword")}
                                    />
                                </div>
                            </div>

                            {contentSource === "post" && (
                                <div className="mt-6 rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5B4DFF]">Choose content</p>
                                            <h3 className="mt-1 text-lg font-black text-[#0F172A]">Connected posts & reels</h3>
                                            <p className="mt-1 text-sm font-semibold text-[#64748B]">Choose where DMGennie should listen for comment keywords.</p>
                                        </div>
                                        <span className="inline-flex h-7 w-fit items-center rounded-full bg-white px-3 text-[11px] font-black text-slate-500 ring-1 ring-slate-100">{mediaItemsCount} media items</span>
                                    </div>
                                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                        <SearchBox value={mediaQuery} onChange={setMediaQuery} placeholder="Search posts or reels..." />
                                        <div className="flex flex-wrap gap-2">
                                            {["All", "Posts", "Reels", "Carousels"].map((item) => (
                                                <button key={item} onClick={() => setMediaFilter(item)} className={cx("h-9 rounded-full px-3 text-xs font-black transition", mediaFilter === item ? "bg-[#0F172A] text-white" : "bg-white text-slate-500 ring-1 ring-slate-100 hover:bg-slate-50")}>{item}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {visibleMedia.length ? (
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {visibleMedia.map((media) => (
                                                <PostSelectionCard key={media.id} media={media} selected={selectedMedia.id === media.id} onClick={() => setSelectedPost(media.title)} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white p-6 text-center">
                                            <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
                                            <h4 className="mt-3 text-sm font-black text-[#0F172A]">No posts or reels found</h4>
                                            <p className="mt-1 text-xs font-semibold text-[#64748B]">Refresh your Instagram content or choose All posts & reels.</p>
                                            <button onClick={() => { setMediaQuery(""); setMediaFilter("All"); setSelectedPost("All posts & reels"); }} className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-[#5B4DFF] px-4 text-xs font-black text-white transition hover:bg-[#4738E8]">
                                                <RefreshCw className="h-3.5 w-3.5" /> Refresh content
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {contentSource === "story" && (
                                <TriggerSetupPanel title="Story reply trigger" subtitle="Choose how DMGennie should respond when someone replies to your story.">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {["Any story reply", "Specific keyword in story reply", "Emoji/reaction reply", "Story mention"].map((item) => (
                                            <TriggerSetupOption key={item} label={item} selected={storyReplyMode === item} onClick={() => setStoryReplyMode(item)} />
                                        ))}
                                    </div>
                                    {storyReplyMode === "Story mention" && <p className="rounded-[14px] bg-white px-3 py-2 text-xs font-bold text-[#64748B] ring-1 ring-indigo-100">This trigger UI is ready. Backend support may require API integration.</p>}
                                    {storyReplyMode === "Specific keyword in story reply" && (
                                        <InlineKeywordSetup keywords={keywords} anyKeyword={anyKeyword} onAdd={addKeyword} onRemove={removeKeyword} onAnyKeyword={setAnyKeyword} suggestions={["link", "send", "price", "info", "demo", "guide"]} helper="Automation will trigger on any story reply." />
                                    )}
                                </TriggerSetupPanel>
                            )}

                            {contentSource === "live" && (
                                <TriggerSetupPanel title="Live comment trigger" subtitle="Send automated DMs when people comment keywords during your Instagram Live.">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {["Any live comment", "Specific live comment keyword"].map((item) => (
                                            <TriggerSetupOption key={item} label={item} selected={liveCommentMode === item} onClick={() => setLiveCommentMode(item)} />
                                        ))}
                                    </div>
                                    {liveCommentMode === "Specific live comment keyword" && (
                                        <InlineKeywordSetup keywords={keywords} anyKeyword={anyKeyword} onAdd={addKeyword} onRemove={removeKeyword} onAnyKeyword={setAnyKeyword} suggestions={["link", "price", "join", "offer", "course", "demo"]} helper="Automation will trigger on any live comment." />
                                    )}
                                </TriggerSetupPanel>
                            )}

                            {contentSource === "dm" && (
                                <TriggerSetupPanel title="DM keyword trigger" subtitle="Start an automation when someone sends a keyword in your DMs.">
                                    <InlineKeywordSetup keywords={keywords} anyKeyword={anyKeyword} onAdd={addKeyword} onRemove={removeKeyword} onAnyKeyword={setAnyKeyword} helper="Automation will trigger on any DM." />
                                </TriggerSetupPanel>
                            )}
                        </BuilderCard>
                    )}

                    {step === 2 && (
                        <BuilderCard title="Keywords & welcome DM" subtitle="Add the words people will comment and the first message they receive.">
                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-black text-[#0F172A]">{contentSource === "dm" ? "DM keywords" : contentSource === "story" ? "Story reply keywords" : contentSource === "live" ? "Live comment keywords" : "Comment keywords"}</h3>
                                            <p className="text-xs font-semibold text-[#64748B]">Type a keyword and press Enter.</p>
                                        </div>
                                        <button onClick={() => setKeywordsModalOpen(true)} className="text-xs font-black text-[#5B4DFF]">Setup</button>
                                    </div>
                                    <InlineKeywordSetup keywords={keywords} anyKeyword={anyKeyword} onAdd={addKeyword} onRemove={removeKeyword} onAnyKeyword={setAnyKeyword} />
                                </div>

                                <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-black text-[#0F172A]">Welcome DM</h3>
                                            <p className="text-xs font-semibold text-[#64748B]">Blank = use default safe template.</p>
                                        </div>
                                        <ToggleSwitch active={welcomeEnabled} onClick={() => setWelcomeEnabled(!welcomeEnabled)} />
                                    </div>
                                    <textarea className={`${inputCls} min-h-[128px] resize-none`} placeholder="Hey @username, thanks for commenting." value={welcomeDm} onChange={(event) => setWelcomeDm(event.target.value)} />
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                        <button onClick={() => setRepliesModalOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-black text-[#5B4DFF]"><MessageSquare className="h-3.5 w-3.5" /> Setup Comment Replies</button>
                                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-100">{repliesCount} saved replies</span>
                                    </div>
                                </div>
                            </div>
                        </BuilderCard>
                    )}

                    {step === 3 && (
                        <BuilderCard title="Final DM & optional link" subtitle="Write the message they receive and add an optional button.">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
                                <div className="space-y-4">
                                    <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-[#0F172A]">Main DM message</h3>
                                            <SmallBadge label="Auto-template active" tone="green" />
                                        </div>
                                        <textarea ref={finalDmRef} className={`${inputCls} min-h-[140px] resize-none`} placeholder="Hey @username, here is the link you asked for." value={finalDm} onChange={(event) => setFinalDm(event.target.value)} />
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button onClick={() => insertFinalToken("@username")} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-indigo-50 hover:text-[#5B4DFF]">@username</button>
                                            <button onClick={() => insertFinalToken("first name")} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-indigo-50 hover:text-[#5B4DFF]">first name</button>
                                        </div>
                                    </div>
                                    <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-[#0F172A]">Optional link button</h3>
                                            <ToggleSwitch active={linkEnabled} onClick={() => setLinkEnabled(!linkEnabled)} />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Field label="Button text" value={buttonText} onChange={setButtonText} />
                                            <Field label="Link URL" value={linkUrl} onChange={setLinkUrl} />
                                        </div>
                                        {linkEnabled && (
                                            <div className="mt-3 space-y-1.5 text-xs font-bold">
                                                {!buttonText.trim() && <p className="text-rose-600">Button text is required.</p>}
                                                {linkUrl.trim() && !isValidHttpUrl(linkUrl) && <p className="text-rose-600">Enter a valid link URL starting with https://</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-[18px] border border-slate-100 bg-white p-4">
                                        <h3 className="text-sm font-black text-[#0F172A]">Before final DM</h3>
                                        <div className="mt-3 space-y-2">
                                            <BuilderOptionRow title="Ask them to follow first" copy="Deliver links only after follow confirmation." active={askFollowFirst} onClick={toggleAskFollowFirst} badge={accountPlan.featureAccess.askForFollow ? "Included" : "Pro"} />
                                            <BuilderOptionRow title="Ask for email first" copy="Capture leads before sending the final link." active={askEmailFirst} onClick={toggleAskEmailFirst} badge={accountPlan.featureAccess.leadGen ? "Included" : "Pro"} />
                                        </div>
                                        {(askFollowFirst || askEmailFirst) && (
                                            <div className="mt-3 rounded-[14px] bg-[#EEF0FF] px-3 py-2 text-xs font-bold text-[#5B4DFF]">
                                                {beforeFinalDmItems.join(" and ")} will appear before the final DM in the preview.
                                            </div>
                                        )}
                                    </div>
                                    <div className="rounded-[18px] border border-slate-100 bg-slate-50 p-4">
                                        <h3 className="text-sm font-black text-[#0F172A]">Quick summary</h3>
                                        <div className="mt-3 space-y-2 text-xs font-bold text-[#64748B]">
                                            <p>Selected content: {contentSource === "post" ? selectedMedia.title : triggerType}</p>
                                            <p>Keyword: {keywordText}</p>
                                            <p>Welcome DM: {welcomeEnabled ? "Enabled" : "Off"}</p>
                                            <p>Final DM: {safeFinalDm.slice(0, 42)}...</p>
                                            <p>Button: {linkEnabled ? buttonText : "No button"}</p>
                                            {linkEnabled && <p>Button URL: {linkUrl || "Missing URL"}</p>}
                                            <p>Comment replies: {repliesCount}</p>
                                            <p>Before final DM: {beforeFinalDmItems.length ? beforeFinalDmItems.join(", ") : "None"}</p>
                                            <p>Responses: {responses.length ? responses.map((response) => response.title).join(", ") : "None"}</p>
                                            <p>Follow-up: {followUpEnabled ? `${followUpDelay} · ${followUpMessage}` : "Off"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ResponseFlowBlock
                                active={openingMessageEnabled}
                                onToggle={() => setOpeningMessageEnabled(!openingMessageEnabled)}
                                onAdd={() => setResponseModalOpen(true)}
                                followUpEnabled={followUpEnabled}
                                followUpDelay={followUpDelay}
                                followUpMessage={followUpMessage}
                                onToggleFollowUp={toggleFollowUp}
                                onFollowUpDelay={setFollowUpDelay}
                                onFollowUpMessage={setFollowUpMessage}
                            />
                        </BuilderCard>
                    )}

                    {step === 4 && (
                        <BuilderCard title="Review and launch" subtitle="Review before going live. DMGennie will only respond when this setup is matched.">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                                <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                                    <div className="space-y-3">
                                        {reviewItems.map((item, index) => (
                                            <div key={item.label} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#5B4DFF] ring-1 ring-indigo-100">{index + 1}</span>
                                                <div className="rounded-[16px] bg-white p-3 ring-1 ring-slate-100">
                                                    <p className="text-xs font-black text-[#0F172A]">{item.label}</p>
                                                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#64748B]">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-[20px] border border-indigo-100 bg-[#EEF0FF]/60 p-4">
                                    <ShieldCheck className="h-8 w-8 text-[#5B4DFF]" />
                                    <h3 className="mt-4 text-lg font-black text-[#0F172A]">Launch flow</h3>
                                    <div className="mt-3 space-y-2 text-xs font-bold leading-5 text-[#64748B]">
                                        <p>When someone matches <span className="text-[#0F172A]">{triggerType}</span>,</p>
                                        <p>{anyKeyword ? "any keyword is accepted," : `if their message includes ${keywordText},`}</p>
                                        <p>DMGennie sends the welcome DM, then delivers your final DM.</p>
                                    </div>
                                    <button onClick={openReviewLaunch} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#5B4DFF] text-xs font-black text-white shadow-[0_10px_22px_rgba(91,77,255,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4738E8]">
                                        Review & launch <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </BuilderCard>
                    )}
                </div>

                <InstagramPreviewPanel
                    step={step}
                    previewTab={previewTab}
                    onPreviewTab={setPreviewTab}
                    triggerType={triggerType}
                    keyword={primaryKeyword}
                    anyKeyword={anyKeyword}
                    selectedMedia={selectedMedia}
                    username="@dmgennie.in"
                    finalDm={safeFinalDm}
                    welcomeDm={safeWelcomeDm}
                    welcomeEnabled={welcomeEnabled}
                    buttonText={buttonText}
                    linkEnabled={linkEnabled}
                    linkUrl={linkUrl}
                    commentReplies={commentReplies}
                    askFollowFirst={askFollowFirst}
                    askEmailFirst={askEmailFirst}
                    followUpEnabled={followUpEnabled}
                    followUpMessage={followUpMessage}
                    responseCount={responses.length}
                />
            </div>

            <div className="sticky bottom-3 z-20 rounded-[20px] border border-white bg-white/95 p-3 shadow-[0_18px_46px_rgba(15,23,42,0.10)] backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold text-[#64748B]">Step {step}/4 · {stepLabels[step - 1]}</p>
                        {builderError && <p className="mt-1 text-xs font-black text-rose-600">{builderError}</p>}
                    </div>
                    <div className="flex gap-2">
                        <SecondaryButton onClick={step === 1 ? onCancel : () => goToStep(step - 1)}>{step === 1 ? "Back to list" : "Back"}</SecondaryButton>
                        {step < 4 ? (
                            <PrimaryButton onClick={goNext}>Next Step <ArrowRight className="h-4 w-4" /></PrimaryButton>
                        ) : (
                            <PrimaryButton onClick={openReviewLaunch}><Check className="h-4 w-4" /> Activate Automation</PrimaryButton>
                        )}
                    </div>
                </div>
            </div>

            {postModalOpen && <PostSelectionModal selected={selectedPost} onClose={() => setPostModalOpen(false)} onSelect={(post) => { setSelectedPost(post); setPostModalOpen(false); }} />}
            {keywordsModalOpen && <KeywordsModal keywords={keywords} anyKeyword={anyKeyword} onAnyKeyword={setAnyKeyword} onClose={() => setKeywordsModalOpen(false)} onConfirm={(next) => { setKeywords(next.length ? next : ["link"]); setBuilderError(""); setKeywordsModalOpen(false); }} />}
            {repliesModalOpen && <CommentRepliesModal replies={commentReplies} onClose={() => setRepliesModalOpen(false)} onConfirm={(next) => { setCommentReplies(next); setRepliesModalOpen(false); }} />}
            {responseModalOpen && (
                <AddResponseModal
                    openingMessageEnabled={openingMessageEnabled}
                    featureAccess={accountPlan.featureAccess}
                    onUpgrade={onUpgrade}
                    onClose={() => setResponseModalOpen(false)}
                    onAdd={(response) => {
                        const feature: keyof FeatureAccess = response.type === "lead"
                            ? "leadGen"
                            : response.type === "follow"
                                ? "askForFollow"
                                : "autoReply";
                        if (!requireBuilderFeature(feature, "Upgrade to Pro to unlock this response type.")) return;
                        setResponses((current) => [...current, response]);
                        setResponseModalOpen(false);
                        showBuilderToast(response.type === "lead" ? "Lead form added" : "Response added");
                    }}
                />
            )}
            {builderToast && <ReferralToast message={builderToast} />}
            {reviewOpen && (
                <ReviewLaunchModal
                    saving={saving}
                    profile="@dmgennie.in"
                    selectedMedia={selectedMedia}
                    triggerType={triggerType}
                    keywords={keywords}
                    anyKeyword={anyKeyword}
                    welcomeEnabled={welcomeEnabled}
                    welcomeDm={safeWelcomeDm}
                    commentReplies={commentReplies}
                    finalDm={safeFinalDm}
                    linkEnabled={linkEnabled}
                    buttonText={buttonText}
                    linkUrl={linkUrl}
                    askFollowFirst={askFollowFirst}
                    askEmailFirst={askEmailFirst}
                    followUpEnabled={followUpEnabled}
                    followUpDelay={followUpDelay}
                    responseCount={responses.length}
                    onBack={() => setReviewOpen(false)}
                    onConfirm={completeSave}
                />
            )}
        </div>
    );
}

function ReviewLaunchModal({
    saving,
    profile,
    selectedMedia,
    triggerType,
    keywords,
    anyKeyword,
    welcomeEnabled,
    welcomeDm,
    commentReplies,
    finalDm,
    linkEnabled,
    buttonText,
    linkUrl,
    askFollowFirst,
    askEmailFirst,
    followUpEnabled,
    followUpDelay,
    responseCount,
    onBack,
    onConfirm,
}: {
    saving: boolean;
    profile: string;
    selectedMedia: InstagramMedia;
    triggerType: string;
    keywords: string[];
    anyKeyword: boolean;
    welcomeEnabled: boolean;
    welcomeDm: string;
    commentReplies: string[];
    finalDm: string;
    linkEnabled: boolean;
    buttonText: string;
    linkUrl: string;
    askFollowFirst: boolean;
    askEmailFirst: boolean;
    followUpEnabled: boolean;
    followUpDelay: string;
    responseCount: number;
    onBack: () => void;
    onConfirm: () => void;
}) {
    const keywordText = anyKeyword ? "Any keyword" : keywords.map((item) => `+${item}`).join(", ");
    const repliesCount = commentReplies.filter((reply) => reply.trim()).length;
    const triggerLine = triggerType === "Live comment"
        ? "When someone comments during your Instagram Live"
        : triggerType === "Story reply"
            ? "When someone replies to your story"
            : triggerType === "DM keyword"
                ? "When someone sends a DM keyword"
                : selectedMedia.id === "all"
                    ? "When someone comments on any post or reel"
                    : "When someone comments on selected post/reel";
    const timeline = [
        { title: "Instagram profile", copy: `${profile} is connected and ready.` },
        { title: "Selected content", copy: selectedMedia.title },
        { title: "When someone comments...", copy: triggerLine },
        { title: "If keyword matches...", copy: anyKeyword ? "DMGennie responds to any matched message." : `Their message includes ${keywordText || "+link"}.` },
        { title: "DMGennie sends welcome DM", copy: welcomeEnabled ? welcomeDm : "Welcome DM is turned off." },
        { title: "Comment replies", copy: repliesCount ? `${repliesCount} public replies saved.` : "No public replies saved." },
        { title: "Before final DM", copy: [askFollowFirst ? "Follow confirmation" : "", askEmailFirst ? "Email capture" : ""].filter(Boolean).join(", ") || "No extra step before final DM." },
        { title: "Then final DM is sent", copy: finalDm },
        { title: "Optional button/link", copy: linkEnabled ? `${buttonText} · ${linkUrl}` : "No link button will be sent." },
        { title: "Response flow", copy: `${responseCount} extra response${responseCount === 1 ? "" : "s"}${followUpEnabled ? ` and follow-up after ${followUpDelay}` : ""}.` },
    ];

    return (
        <ModalShell onClose={onBack} wide>
            <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5B4DFF]">Final check</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0F172A]">Review & launch automation</h2>
                        <p className="mt-1 text-sm font-semibold text-[#64748B]">Confirm your setup before turning this automation live.</p>
                    </div>
                    <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                        <div className="space-y-3">
                            {timeline.map((item, index) => (
                                <div key={item.title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#5B4DFF] ring-1 ring-indigo-100">{index + 1}</span>
                                    <div className="rounded-[16px] border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
                                        <p className="text-xs font-black text-[#0F172A]">{item.title}</p>
                                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#64748B]">{item.copy}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-[22px] border border-indigo-100 bg-[#EEF0FF]/50 p-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white text-[#5B4DFF] shadow-sm ring-1 ring-indigo-100">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <h3 className="mt-4 text-lg font-black text-[#0F172A]">Ready to go live</h3>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">DMGennie will respond only when the selected trigger matches your setup.</p>
                        <div className="mt-4 space-y-2">
                            <ReviewPill label="Status" value="Live after launch" />
                            <ReviewPill label="Source" value={selectedMedia.type} />
                            <ReviewPill label="Trigger" value={triggerType} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <SecondaryButton onClick={onBack}>Back</SecondaryButton>
                    <PrimaryButton onClick={onConfirm}><Check className="h-4 w-4" /> {saving ? "Launching..." : "Confirm & Launch"}</PrimaryButton>
                </div>
            </div>
        </ModalShell>
    );
}

function ReviewPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white px-3 py-2 ring-1 ring-indigo-100">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
            <span className="truncate text-xs font-black text-[#0F172A]">{value}</span>
        </div>
    );
}

function AutomationSuccessModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalShell onClose={onClose}>
            <div className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-8 w-8" />
                </span>
                <h2 className="mt-5 text-2xl font-black text-[#0F172A]">Automation is live</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#64748B]">DMGennie will now respond when your trigger is matched.</p>
                <div className="mt-6 flex justify-center">
                    <PrimaryButton onClick={onClose}>View automation</PrimaryButton>
                </div>
            </div>
        </ModalShell>
    );
}

function BuilderStepIndicator({ step, onStep }: { step: number; onStep: (step: number) => void }) {
    const steps = ["Trigger & content", "Keywords", "Final DM", "Review"];
    return (
        <section className="rounded-[18px] border border-white bg-white p-3 shadow-[0_12px_34px_rgba(15,23,42,0.045)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                    {steps.map((item, index) => {
                        const number = index + 1;
                        const active = step === number;
                        const done = step > number;
                        return (
                            <button key={item} onClick={() => onStep(number)} className={cx("inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-black transition", active ? "bg-[#5B4DFF] text-white shadow-[0_10px_22px_rgba(91,77,255,0.18)]" : done ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                                <span className={cx("flex h-5 w-5 items-center justify-center rounded-full", active ? "bg-white/20" : done ? "bg-emerald-100" : "bg-white")}>{done ? <Check className="h-3.5 w-3.5" /> : number}</span>
                                {item}
                            </button>
                        );
                    })}
                </div>
                <span className="inline-flex h-8 w-fit items-center rounded-full bg-slate-50 px-3 text-xs font-black text-slate-500">{step}/4</span>
            </div>
        </section>
    );
}

function BuilderCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
    return (
        <section className="rounded-[22px] border border-white bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-5">
            <div className="mb-4">
                <h2 className="text-xl font-black tracking-tight text-[#0F172A]">{title}</h2>
                <p className="mt-1 text-sm font-semibold text-[#64748B]">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}

function TriggerChoiceCard({ title, value, copy, icon, selected, disabled, onClick }: { title: string; value: string; copy: string; icon: ReactNode; selected: boolean; disabled?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cx(
                "rounded-[18px] border p-4 text-left transition",
                selected ? "border-[#5B4DFF] bg-[#EEF0FF] shadow-[0_12px_28px_rgba(91,77,255,0.10)]" : "border-slate-100 bg-white hover:border-indigo-100 hover:bg-indigo-50/30",
                disabled && "cursor-not-allowed opacity-55"
            )}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-[0.9rem]", selected ? "bg-white text-[#5B4DFF]" : "bg-slate-50 text-slate-500")}>{icon}</span>
                {disabled ? <SmallBadge label="Coming Soon" tone="gray" /> : selected && <CheckCircle2 className="h-5 w-5 text-[#5B4DFF]" />}
            </div>
            <h3 className="text-sm font-black text-[#0F172A]">{title}</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#64748B]">{copy}</p>
        </button>
    );
}

function ContentSourceCard({ title, copy, icon, selected, action, onClick }: { title: string; copy: string; icon: ReactNode; selected: boolean; action: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cx(
                "group flex min-h-[156px] flex-col rounded-[18px] border p-4 text-left transition hover:-translate-y-0.5",
                selected
                    ? "border-[#5B4DFF] bg-[#EEF0FF] shadow-[0_14px_30px_rgba(91,77,255,0.12)]"
                    : "border-slate-100 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.025)] hover:border-indigo-100 hover:shadow-[0_14px_30px_rgba(79,70,229,0.07)]"
            )}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-[0.9rem] transition", selected ? "bg-white text-[#5B4DFF]" : "bg-slate-50 text-slate-500 group-hover:bg-[#EEF0FF] group-hover:text-[#5B4DFF]")}>
                    {icon}
                </span>
                {selected && <CheckCircle2 className="h-5 w-5 text-[#5B4DFF]" />}
            </div>
            <h3 className="text-sm font-black leading-5 text-[#0F172A]">{title}</h3>
            <p className="mt-1.5 line-clamp-3 text-xs font-semibold leading-5 text-[#64748B]">{copy}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-black text-[#5B4DFF]">
                {action}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
        </button>
    );
}

function TriggerSetupPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
    return (
        <div className="mt-6 rounded-[20px] border border-indigo-100 bg-[#EEF0FF]/45 p-4">
            <div className="mb-4">
                <h3 className="text-lg font-black text-[#0F172A]">{title}</h3>
                <p className="mt-1 text-sm font-semibold text-[#64748B]">{subtitle}</p>
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function TriggerSetupOption({ label, selected, disabled, onClick }: { label: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={cx(
                "flex h-12 items-center justify-between rounded-[16px] border px-3 text-left text-xs font-black transition",
                selected ? "border-[#5B4DFF] bg-white text-[#0F172A] shadow-[0_10px_22px_rgba(91,77,255,0.08)]" : "border-slate-100 bg-white/70 text-[#64748B] hover:border-indigo-100 hover:bg-white",
                disabled && "cursor-not-allowed opacity-50"
            )}
        >
            <span>{label}</span>
            {disabled ? <SmallBadge label="Coming soon" tone="gray" /> : selected && <CheckCircle2 className="h-4 w-4 text-[#5B4DFF]" />}
        </button>
    );
}

function InlineKeywordSetup({
    keywords,
    anyKeyword,
    onAdd,
    onRemove,
    onAnyKeyword,
    suggestions = suggestedKeywords,
    helper = "Automation will trigger on any comment.",
}: {
    keywords: string[];
    anyKeyword: boolean;
    onAdd: (keyword: string) => void;
    onRemove: (keyword: string) => void;
    onAnyKeyword: (active: boolean) => void;
    suggestions?: string[];
    helper?: string;
}) {
    const [draftKeyword, setDraftKeyword] = useState("");
    const submitKeyword = () => {
        if (!draftKeyword.trim()) return;
        onAdd(draftKeyword);
        setDraftKeyword("");
    };

    return (
        <div className="space-y-3">
            {keywords.length > 0 && (
                <div className={cx("flex flex-wrap gap-2", anyKeyword && "opacity-45")}>
                    {keywords.map((keyword) => (
                        <button key={keyword} type="button" onClick={() => onRemove(keyword)} className="transition hover:-translate-y-0.5">
                            <KeywordChip>+{keyword} ×</KeywordChip>
                        </button>
                    ))}
                </div>
            )}
            <div className={cx("flex flex-wrap gap-2", anyKeyword && "pointer-events-none opacity-45")}>
                {suggestions.map((keyword) => (
                    <SuggestedKeywordButton key={keyword} keyword={keyword} selected={keywords.includes(keyword)} onClick={() => onAdd(keyword)} />
                ))}
            </div>
            <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed"
                placeholder="Type a keyword and press Enter"
                disabled={anyKeyword}
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        submitKeyword();
                    }
                }}
            />
            <ToggleMini label="Any keyword" active={anyKeyword} onClick={() => onAnyKeyword(!anyKeyword)} />
            {anyKeyword && <p className="rounded-[14px] bg-indigo-50 px-3 py-2 text-xs font-bold text-[#5B4DFF]">{helper}</p>}
        </div>
    );
}

function PostSelectionCard({ media, selected, onClick }: { media: InstagramMedia; selected: boolean; onClick: () => void }) {
    const isAll = media.id === "all";

    return (
        <button onClick={onClick} className={cx("group rounded-[18px] border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(79,70,229,0.07)]", selected ? "border-[#5B4DFF] bg-[#EEF0FF] shadow-[0_12px_26px_rgba(91,77,255,0.10)]" : "border-slate-100 bg-white hover:border-indigo-100")}>
            <div className={cx("relative mb-3 flex h-28 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br text-slate-400", media.color)}>
                <div className={cx("absolute inset-0", isAll ? "bg-white/40" : "bg-black/10")} />
                {isAll ? <LayoutGrid className="relative h-8 w-8" /> : <Instagram className="relative h-8 w-8 text-white/90" />}
                <span className={cx("absolute right-2 top-2 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] ring-1", isAll ? "bg-white text-slate-500 ring-slate-100" : "bg-black/25 text-white ring-white/20")}>
                    {media.type}
                </span>
                {selected && (
                    <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#5B4DFF] shadow-sm">
                        <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                )}
            </div>
            <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-black text-[#0F172A]">{media.title}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5B4DFF]" />}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[#64748B]">{media.caption}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{media.metric}</p>
            </div>
        </button>
    );
}

function InstagramPreviewPanel({
    step,
    previewTab,
    onPreviewTab,
    triggerType,
    keyword,
    anyKeyword,
    selectedMedia,
    username,
    finalDm,
    welcomeDm,
    welcomeEnabled,
    buttonText,
    linkEnabled,
    linkUrl,
    commentReplies,
    askFollowFirst,
    askEmailFirst,
    followUpEnabled,
    followUpMessage,
    responseCount,
}: {
    step: number;
    previewTab: PreviewTab;
    onPreviewTab: (tab: PreviewTab) => void;
    triggerType: string;
    keyword: string;
    anyKeyword: boolean;
    selectedMedia: InstagramMedia;
    username: string;
    finalDm: string;
    welcomeDm: string;
    welcomeEnabled: boolean;
    buttonText: string;
    linkEnabled: boolean;
    linkUrl: string;
    commentReplies: string[];
    askFollowFirst: boolean;
    askEmailFirst: boolean;
    followUpEnabled: boolean;
    followUpMessage: string;
    responseCount: number;
}) {
    const subtitle = previewTab === "Story" ? "Story reply" : previewTab === "Live" ? "Live comment" : previewTab === "DM" ? "DM response" : previewTab === "Comments" ? "Keyword trigger" : step === 1 ? "Connected profile" : "Selected post or reel";
    const previewKeyword = anyKeyword ? "Any keyword matched" : keyword || "link";
    const triggerCopy = triggerType === "DM keyword"
        ? anyKeyword ? previewKeyword : `User sends “${previewKeyword}”`
        : triggerType === "Story reply"
            ? anyKeyword ? previewKeyword : `Story reply contains “${previewKeyword}”`
            : triggerType === "Live comment"
                ? anyKeyword ? previewKeyword : `Live comment says “${previewKeyword}”`
                : anyKeyword ? previewKeyword : `Commented “${previewKeyword}”`;

    return (
        <aside className="xl:sticky xl:top-28 xl:self-start">
            <section className="rounded-[24px] border border-white bg-white p-4 shadow-[0_18px_54px_rgba(15,23,42,0.06)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-[#0F172A]">Live Instagram preview</h3>
                        <p className="text-xs font-semibold text-[#64748B]">{subtitle}</p>
                    </div>
                    <SmallBadge label="Live" tone="green" />
                </div>
                <div className="mx-auto w-full max-w-[290px] rounded-[34px] border-[8px] border-slate-950 bg-slate-950 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <div className="min-h-[520px] overflow-hidden rounded-[25px] bg-[#0B1020] text-white">
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                            <span className="flex min-w-0 items-center gap-2 text-xs font-black">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#5B4DFF] to-[#F05A8A] text-[11px] text-white">D</span>
                                <span className="truncate">{username}</span>
                            </span>
                            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-300">Active</span>
                        </div>
                        <div className="space-y-3 p-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${previewTab}-${selectedMedia.id}-${triggerType}-${previewKeyword}-${welcomeDm}-${finalDm}-${buttonText}-${linkUrl}-${commentReplies.length}-${askFollowFirst}-${askEmailFirst}-${followUpEnabled}-${responseCount}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                    className="space-y-3"
                                >
                                    {previewTab === "Post" && (
                                        <>
                                            <div className={cx("relative h-56 overflow-hidden rounded-[20px] bg-gradient-to-br p-4", selectedMedia.color)}>
                                                <div className="absolute inset-0 bg-black/10" />
                                                <div className="relative flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-[11px] font-black">
                                                        <span className="h-5 w-5 rounded-full bg-white/90" />
                                                        {username}
                                                    </span>
                                                    <span className="rounded-full bg-black/30 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em]">{selectedMedia.type}</span>
                                                </div>
                                                <p className="relative mt-20 max-w-[190px] text-lg font-black leading-6">{selectedMedia.id === "all" ? "Listening across all posts & reels" : selectedMedia.caption}</p>
                                            </div>
                                            <div className="rounded-2xl bg-white/10 p-3">
                                                <div className="flex items-center gap-3 text-white/70">
                                                    <MessageCircle className="h-4 w-4" />
                                                    <span className="text-xs font-bold">Comment area</span>
                                                </div>
                                                <p className="mt-2 text-xs font-semibold text-white">{triggerCopy}</p>
                                            </div>
                                        </>
                                    )}
                                    {previewTab === "Comments" && (
                                        <>
                                            <PreviewMiniPost media={selectedMedia} username={username} />
                                            <ChatBubble side="left" text={triggerCopy} />
                                            {welcomeEnabled && <ChatBubble side="right" text={welcomeDm || "Hey @username, thanks for commenting."} />}
                                            {askFollowFirst && <ChatBubble side="right" text={`Please follow ${username} first, then I will send the link.`} />}
                                            {askEmailFirst && <ChatBubble side="right" text="Share your email and I will send the resource instantly." />}
                                            <div className="grid grid-cols-2 gap-2">
                                                <PreviewStat label="Matched keyword" value={anyKeyword ? "Any keyword" : `+${previewKeyword}`} />
                                                <PreviewStat label="Extras" value={`${commentReplies.filter((reply) => reply.trim()).length + responseCount} saved`} />
                                            </div>
                                        </>
                                    )}
                                    {previewTab === "Story" && (
                                        <>
                                            <div className="relative h-64 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#2B1635] via-[#7A2E57] to-[#F3B8D0] p-4">
                                                <div className="absolute inset-0 bg-black/15" />
                                                <div className="relative flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-[11px] font-black">
                                                        <span className="h-5 w-5 rounded-full bg-white/90" />
                                                        {username}
                                                    </span>
                                                    <span className="rounded-full bg-white/20 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em]">Story</span>
                                                </div>
                                                <div className="relative mt-32 rounded-2xl bg-black/28 p-3">
                                                    <p className="text-xs font-semibold text-white/80">Reply field</p>
                                                    <p className="mt-1 text-sm font-black text-white">{anyKeyword ? "Any keyword matched" : previewKeyword}</p>
                                                </div>
                                            </div>
                                            <ChatBubble side="left" text={triggerCopy} />
                                            {welcomeEnabled && <ChatBubble side="right" text={welcomeDm || "Hey @username, thanks for commenting."} />}
                                            {askFollowFirst && <ChatBubble side="right" text={`Please follow ${username} first, then I will send the link.`} />}
                                            {askEmailFirst && <ChatBubble side="right" text="Share your email and I will send the resource instantly." />}
                                            <ChatBubble side="right" text={finalDm || "Here is the link you asked for."} />
                                        </>
                                    )}
                                    {previewTab === "Live" && (
                                        <>
                                            <div className="relative h-64 overflow-hidden rounded-[22px] bg-gradient-to-br from-slate-950 via-[#251033] to-[#5B4DFF] p-4">
                                                <div className="absolute inset-0 bg-black/20" />
                                                <div className="relative flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-[11px] font-black">
                                                        <span className="h-5 w-5 rounded-full bg-white/90" />
                                                        {username}
                                                    </span>
                                                    <span className="rounded-full bg-pink-500 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em]">Live</span>
                                                </div>
                                                <div className="relative mt-24 space-y-2">
                                                    <p className="rounded-full bg-white/12 px-3 py-2 text-xs font-semibold text-white/85">@creator.alpha 🔥🔥🔥</p>
                                                    <p className="rounded-full bg-white/18 px-3 py-2 text-xs font-black text-white">@arjun: {anyKeyword ? "Any keyword matched" : previewKeyword}</p>
                                                    <p className="rounded-full bg-white/12 px-3 py-2 text-xs font-semibold text-white/85">@reels.studio love this</p>
                                                </div>
                                            </div>
                                            <ChatBubble side="left" text={triggerCopy} />
                                            {welcomeEnabled && <ChatBubble side="right" text={welcomeDm || "Hey @username, thanks for commenting."} />}
                                            {askFollowFirst && <ChatBubble side="right" text={`Please follow ${username} first, then I will send the link.`} />}
                                            {askEmailFirst && <ChatBubble side="right" text="Share your email and I will send the resource instantly." />}
                                            <ChatBubble side="right" text={finalDm || "Here is the link you asked for."} />
                                        </>
                                    )}
                                    {previewTab === "DM" && (
                                        <>
                                            <PreviewMiniPost media={selectedMedia} username={username} />
                                            <ChatBubble side="left" text={triggerCopy} />
                                            {welcomeEnabled && <ChatBubble side="right" text={welcomeDm || "Hey @username, thanks for commenting."} />}
                                            {askFollowFirst && <ChatBubble side="right" text={`Please follow ${username} first, then I will send the link.`} />}
                                            {askEmailFirst && <ChatBubble side="right" text="Share your email and I will send the resource instantly." />}
                                            <ChatBubble side="right" text={finalDm || "Here is the link you asked for."} />
                                            {linkEnabled && (
                                                <button className="w-full rounded-2xl bg-[#5B4DFF] py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(91,77,255,0.22)]">
                                                    {buttonText || "Open Link"}
                                                </button>
                                            )}
                                            {linkEnabled && <PreviewStat label="Button URL" value={linkUrl || "https://dmgennie.in/guide"} />}
                                            {followUpEnabled && <ChatBubble side="right" text={`Follow-up: ${followUpMessage || "Just checking in."}`} />}
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                    {(["Post", "Comments", "Story", "Live", "DM"] as PreviewTab[]).map((tab) => (
                        <button key={tab} onClick={() => onPreviewTab(tab)} className={cx("h-9 rounded-full text-[11px] font-black transition", previewTab === tab ? "bg-[#5B4DFF] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>{tab}</button>
                    ))}
                </div>
            </section>
        </aside>
    );
}

function ChatBubble({ text, side }: { text: string; side: "left" | "right" }) {
    return <div className={cx("max-w-[88%] rounded-2xl px-3 py-2 text-xs font-semibold leading-5", side === "right" ? "ml-auto bg-[#5B4DFF] text-white" : "bg-white/10 text-white/85")}>{text}</div>;
}

function PreviewStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">{label}</p>
            <p className="mt-1 text-sm font-black text-white">{value}</p>
        </div>
    );
}

function PreviewMiniPost({ media, username }: { media: InstagramMedia; username: string }) {
    return (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-black text-white/85">
                    <span className="h-5 w-5 rounded-full bg-white/80" />
                    {username}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-white/70">{media.type}</span>
            </div>
            <div className={cx("h-24 rounded-[14px] bg-gradient-to-br", media.color)} />
            <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-4 text-white/70">{media.caption}</p>
        </div>
    );
}

function PostSelectionModal({ selected, onClose, onSelect }: { selected: string; onClose: () => void; onSelect: (post: string) => void }) {
    const [query, setQuery] = useState("");
    const [tab, setTab] = useState("All");
    const [draftSelection, setDraftSelection] = useState(selected);
    const filtered = fallbackInstagramMedia.filter((media) => {
        const matchesQuery = `${media.title} ${media.caption}`.toLowerCase().includes(query.toLowerCase());
        const matchesTab = media.id === "all" || tab === "All" || (tab === "Posts" && media.type === "Post") || (tab === "Reels" && media.type === "Reel") || (tab === "Carousels" && media.type === "Carousel");
        return matchesQuery && matchesTab;
    });

    return (
        <ModalShell onClose={onClose}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#0F172A]">Select Post or Reel</h2>
                    <p className="mt-1 text-sm font-semibold text-[#64748B]">Choose where this automation should listen for comments.</p>
                </div>
                <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 space-y-4">
                <SearchBox value={query} onChange={setQuery} placeholder="Search posts or reels..." />
                <div className="flex flex-wrap gap-2">
                    {["All", "Posts", "Reels", "Carousels"].map((item) => (
                        <button key={item} onClick={() => setTab(item)} className={cx("rounded-full px-4 py-2 text-xs font-black transition", tab === item ? "bg-[#0F172A] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>{item}</button>
                    ))}
                </div>
                {filtered.length ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                        {filtered.map((media) => <PostSelectionCard key={media.id} media={media} selected={draftSelection === media.title} onClick={() => setDraftSelection(media.title)} />)}
                    </div>
                ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
                        <h3 className="mt-3 text-sm font-black text-[#0F172A]">No posts or reels found</h3>
                        <p className="mt-1 text-xs font-semibold text-[#64748B]">Try another search or filter.</p>
                    </div>
                )}
                <div className="flex justify-end">
                    <PrimaryButton onClick={() => onSelect(draftSelection)}>Confirm</PrimaryButton>
                </div>
            </div>
        </ModalShell>
    );
}

function KeywordsModal({ keywords, anyKeyword, onAnyKeyword, onClose, onConfirm }: { keywords: string[]; anyKeyword: boolean; onAnyKeyword: (active: boolean) => void; onClose: () => void; onConfirm: (keywords: string[]) => void }) {
    const [nextKeywords, setNextKeywords] = useState(keywords);
    const [nextAnyKeyword, setNextAnyKeyword] = useState(anyKeyword);
    const [value, setValue] = useState("");
    const addNextKeyword = (keyword: string) => {
        const cleanKeyword = normalizeKeyword(keyword);
        if (!cleanKeyword) return;
        setNextKeywords((prev) => prev.some((item) => item.toLowerCase() === cleanKeyword) ? prev : [...prev, cleanKeyword]);
    };

    return (
        <ModalShell onClose={onClose}>
            <h2 className="text-2xl font-black text-[#0F172A]">Setup Keywords</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Keywords are not case-sensitive. Example: “Link” and “link” are recognized as the same.</p>
            <div className="mt-5 rounded-[18px] border border-slate-100 bg-slate-50 p-4">
                <input
                    className={inputCls}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Type and press Enter to add keyword"
                    disabled={nextAnyKeyword}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && value.trim()) {
                            addNextKeyword(value);
                            setValue("");
                        }
                    }}
                />
                <div className={cx("mt-4 flex flex-wrap gap-2", nextAnyKeyword && "pointer-events-none opacity-45")}>
                    {suggestedKeywords.map((keyword) => (
                        <SuggestedKeywordButton key={keyword} keyword={keyword} selected={nextKeywords.includes(keyword)} onClick={() => addNextKeyword(keyword)} />
                    ))}
                </div>
                <div className={cx("mt-4 flex flex-wrap gap-2", nextAnyKeyword && "opacity-45")}>
                    {nextKeywords.map((keyword) => (
                        <button key={keyword} onClick={() => setNextKeywords((prev) => prev.filter((item) => item !== keyword))}>
                            <KeywordChip>+{keyword} ×</KeywordChip>
                        </button>
                    ))}
                </div>
                <ToggleMini label="Any keyword" active={nextAnyKeyword} onClick={() => setNextAnyKeyword(!nextAnyKeyword)} />
                {nextAnyKeyword && <p className="mt-2 text-xs font-bold text-[#5B4DFF]">Automation will trigger on any comment.</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
                <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                <PrimaryButton onClick={() => { onAnyKeyword(nextAnyKeyword); onConfirm(nextKeywords); }}>Confirm</PrimaryButton>
            </div>
        </ModalShell>
    );
}

function CommentRepliesModal({ replies, onClose, onConfirm }: { replies: string[]; onClose: () => void; onConfirm: (replies: string[]) => void }) {
    const [nextReplies, setNextReplies] = useState(replies.length ? replies : defaultCommentReplies);
    return (
        <ModalShell onClose={onClose}>
            <h2 className="text-2xl font-black text-[#0F172A]">Setup Comment Replies</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Add random public replies to make responses feel natural.</p>
            <div className="mt-5 space-y-2.5">
                {nextReplies.map((reply, index) => (
                    <div key={`${reply}-${index}`} className="flex items-center gap-2 rounded-[16px] border border-slate-100 bg-white p-2.5">
                        <GripVertical className="h-4 w-4 text-slate-300" />
                        <input className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0F172A] outline-none" value={reply} onChange={(event) => setNextReplies((prev) => prev.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />
                        <button onClick={() => setNextReplies((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                ))}
                <button onClick={() => setNextReplies((prev) => [...prev, ""])} className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-slate-200 text-sm font-black text-slate-500 transition hover:border-indigo-200 hover:text-[#5B4DFF]">
                    <Plus className="h-4 w-4" /> Add New Reply
                </button>
            </div>
            <div className="mt-5 flex justify-end">
                <PrimaryButton onClick={() => onConfirm(nextReplies.map((reply) => reply.trim()).filter(Boolean))}>Confirm</PrimaryButton>
            </div>
        </ModalShell>
    );
}

function AddResponseModal({
    openingMessageEnabled,
    featureAccess,
    onUpgrade,
    onClose,
    onAdd,
}: {
    openingMessageEnabled: boolean;
    featureAccess: FeatureAccess;
    onUpgrade: () => void;
    onClose: () => void;
    onAdd: (response: ResponseConfig) => void;
}) {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [title, setTitle] = useState("Creator resource");
    const [description, setDescription] = useState("A quick next step for your audience.");
    const [message, setMessage] = useState("Here is the extra detail you asked for.");
    const [imageUrl, setImageUrl] = useState("");
    const [buttonLabel, setButtonLabel] = useState("Open");
    const [buttonUrl, setButtonUrl] = useState("https://dmgennie.in/guide");
    const [leadFields, setLeadFields] = useState(["Name", "Email"]);
    const [customQuestion, setCustomQuestion] = useState("What are you building?");
    const options = [
        { id: "follow", title: "Ask For Follow", copy: "Ask users to follow before sending the link.", icon: <TrendingUp className="h-4 w-4" />, feature: "askForFollow" as const },
        { id: "card", title: "Card Message", copy: "Send a rich card with title, image, and button.", icon: <ClipboardList className="h-4 w-4" />, feature: "autoReply" as const },
        { id: "text", title: "Text Message", copy: "Send a simple text reply.", icon: <MessageSquare className="h-4 w-4" />, feature: "autoReply" as const },
        { id: "image", title: "Image Message", copy: "Send a visual response in the DM.", icon: <ImageIcon className="h-4 w-4" />, feature: "autoReply" as const },
        { id: "lead", title: "Lead Forms", copy: "Collect email or phone before final delivery.", icon: <UserPlus className="h-4 w-4" />, feature: "leadGen" as const },
    ];
    const selectedOption = options.find((option) => option.id === selectedType);
    const toggleLeadField = (field: string) => {
        setLeadFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
    };
    const saveResponse = () => {
        if (!selectedOption) return;
        const summary = selectedOption.id === "lead"
            ? `Collect ${leadFields.join(", ") || "lead details"}${customQuestion.trim() ? ` · ${customQuestion.trim()}` : ""}`
            : selectedOption.id === "card"
                ? `${title} · ${buttonLabel || "Open"}`
                : selectedOption.id === "image"
                    ? `${imageUrl ? "Image URL added" : "Image placeholder"}${message.trim() ? ` · ${message.trim()}` : ""}`
                    : selectedOption.id === "follow"
                        ? "Ask user to follow before delivery"
                        : message || "Text response";
        onAdd({ type: selectedOption.id, title: selectedOption.title, summary, fields: selectedOption.id === "lead" ? leadFields : undefined });
    };

    return (
        <ModalShell onClose={onClose}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-black text-[#0F172A]">Add Response</h2>
                    <p className="mt-1 text-sm font-semibold text-[#64748B]">{selectedOption ? selectedOption.copy : "Choose a response type and configure it for this demo flow."}</p>
                </div>
                {selectedOption && <button onClick={() => setSelectedType(null)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500 transition hover:bg-slate-100">Back</button>}
            </div>
            {!openingMessageEnabled && (
                <div className="mt-4 rounded-[16px] border border-amber-100 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                    Opening message is turned off. Some response types require it.
                </div>
            )}
            {openingMessageEnabled && (
                <div className="mt-4 rounded-[16px] border border-indigo-100 bg-indigo-50 p-3 text-xs font-bold leading-5 text-[#5B4DFF]">
                    Add one response at a time to keep your flow easy to understand.
                </div>
            )}
            {!selectedOption ? (
                <div className="mt-4 space-y-2">
                    {options.map((option) => {
                        const locked = !featureAccess[option.feature];
                        return (
                        <button key={option.title} onClick={() => locked ? onUpgrade() : setSelectedType(option.id)} className={cx("flex w-full items-center gap-3 rounded-[16px] border bg-white p-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/30", locked ? "border-[#FDE68A] bg-[#FFFDF6]" : "border-slate-100")}>
                            <span className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-slate-50 text-[#5B4DFF]">{option.icon}</span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2 text-sm font-black text-[#0F172A]">{option.title}<SmallBadge label={locked ? "Pro" : "Included"} tone={locked ? "gold" : "green"} /></span>
                                <span className="block text-xs font-semibold text-[#64748B]">{option.copy}</span>
                                {locked && <span className="mt-1 block text-[11px] font-bold text-[#8A5D17]">Upgrade to Pro to unlock this response.</span>}
                            </span>
                            {locked ? <Lock className="h-4 w-4 text-[#8A5D17]" /> : <ChevronDown className="h-4 w-4 -rotate-90 text-slate-300" />}
                        </button>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-4 space-y-3 rounded-[18px] border border-slate-100 bg-slate-50 p-4">
                    {selectedOption.id === "follow" && (
                        <div>
                            <Label>Follow request message</Label>
                            <textarea className={`${inputCls} min-h-[110px] resize-none`} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Please follow @dmgennie.in first and I will send the link." />
                        </div>
                    )}
                    {selectedOption.id === "card" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Card title" value={title} onChange={setTitle} />
                            <Field label="Button text" value={buttonLabel} onChange={setButtonLabel} />
                            <div className="sm:col-span-2">
                                <Field label="Description" value={description} onChange={setDescription} />
                            </div>
                            <Field label="Image URL" value={imageUrl} onChange={setImageUrl} />
                            <Field label="Button URL" value={buttonUrl} onChange={setButtonUrl} />
                        </div>
                    )}
                    {selectedOption.id === "text" && (
                        <div className="space-y-3">
                            <div>
                                <Label>Message text</Label>
                                <textarea className={`${inputCls} min-h-[110px] resize-none`} value={message} onChange={(event) => setMessage(event.target.value)} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Optional button text" value={buttonLabel} onChange={setButtonLabel} />
                                <Field label="Optional button URL" value={buttonUrl} onChange={setButtonUrl} />
                            </div>
                        </div>
                    )}
                    {selectedOption.id === "image" && (
                        <div className="space-y-3">
                            <Field label="Image URL or upload placeholder" value={imageUrl} onChange={setImageUrl} />
                            <Field label="Optional caption" value={message} onChange={setMessage} />
                        </div>
                    )}
                    {selectedOption.id === "lead" && (
                        <div className="space-y-3">
                            <div>
                                <Label>Lead fields</Label>
                                <div className="flex flex-wrap gap-2">
                                    {["Name", "Email", "Phone", "Custom question"].map((field) => (
                                        <button key={field} onClick={() => toggleLeadField(field)} className={cx("rounded-full px-3 py-2 text-xs font-black ring-1 transition", leadFields.includes(field) ? "bg-[#5B4DFF] text-white ring-[#5B4DFF]" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50")}>{field}</button>
                                    ))}
                                </div>
                            </div>
                            {leadFields.includes("Custom question") && <Field label="Custom question" value={customQuestion} onChange={setCustomQuestion} />}
                        </div>
                    )}
                    <p className="text-xs font-bold text-[#64748B]">This setting is saved locally until backend support is connected.</p>
                </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
                <SecondaryButton onClick={onClose}>Close</SecondaryButton>
                {selectedOption && <PrimaryButton onClick={saveResponse}><Check className="h-4 w-4" /> Add response</PrimaryButton>}
            </div>
        </ModalShell>
    );
}

function ResponseFlowBlock({
    active,
    onToggle,
    onAdd,
    followUpEnabled,
    followUpDelay,
    followUpMessage,
    onToggleFollowUp,
    onFollowUpDelay,
    onFollowUpMessage,
}: {
    active: boolean;
    onToggle: () => void;
    onAdd: () => void;
    followUpEnabled: boolean;
    followUpDelay: string;
    followUpMessage: string;
    onToggleFollowUp: () => void;
    onFollowUpDelay: (value: string) => void;
    onFollowUpMessage: (value: string) => void;
}) {
    return (
        <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 p-4">
            <h3 className="text-sm font-black text-[#0F172A]">Response Flow</h3>
            <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between rounded-[16px] bg-white px-3 py-3 ring-1 ring-slate-100">
                    <span>
                        <span className="block text-sm font-black text-[#0F172A]">Opening Message</span>
                        <span className="text-xs font-semibold text-[#64748B]">Send the welcome DM before the final response.</span>
                    </span>
                    <ToggleSwitch active={active} onClick={onToggle} />
                </div>
                <button onClick={onAdd} className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-[#5B4DFF] text-sm font-black text-white shadow-[0_12px_26px_rgba(91,77,255,0.16)] transition hover:-translate-y-0.5 hover:bg-[#4738E8]">
                    <Plus className="h-4 w-4" /> Add Response
                </button>
                <div className="rounded-[16px] bg-white px-3 py-3 ring-1 ring-slate-100">
                    <div className="flex items-center justify-between gap-3">
                        <span>
                            <span className="block text-sm font-black text-[#0F172A]">Follow-up Message</span>
                            <span className="text-xs font-semibold text-[#64748B]">Send one more message after a delay.</span>
                        </span>
                        <ToggleSwitch active={followUpEnabled} onClick={onToggleFollowUp} />
                    </div>
                    {followUpEnabled && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                            <input className={inputCls} value={followUpDelay} onChange={(event) => onFollowUpDelay(event.target.value)} placeholder="1 day" />
                            <input className={inputCls} value={followUpMessage} onChange={(event) => onFollowUpMessage(event.target.value)} placeholder="Follow-up message" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function BuilderOptionRow({ title, copy, active, onClick, badge }: { title: string; copy: string; active: boolean; onClick: () => void; badge?: string }) {
    const badgeTone: "green" | "gold" | "gray" = active ? "green" : badge === "Pro" ? "gold" : "gray";
    return (
        <button onClick={onClick} className={cx("flex w-full items-center gap-3 rounded-[16px] border p-3 text-left transition hover:bg-white", active ? "border-indigo-200 bg-[#EEF0FF]" : "border-slate-100 bg-slate-50")}>
            <span className={cx("flex h-8 w-8 items-center justify-center rounded-[0.75rem] ring-1", active ? "bg-white text-[#5B4DFF] ring-indigo-100" : "bg-white text-[#5B4DFF] ring-slate-100")}>
                {active ? <Check className="h-4 w-4" /> : <MousePointerClick className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-xs font-black text-[#0F172A]">{title}{badge && <SmallBadge label={active ? "Enabled" : badge} tone={badgeTone} />}</span>
                <span className="block text-[11px] font-semibold text-[#64748B]">{copy}</span>
            </span>
        </button>
    );
}

function KeywordChip({ children }: { children: ReactNode }) {
    return <span className="inline-flex h-8 items-center rounded-full bg-[#EEF0FF] px-3 text-xs font-black text-[#5B4DFF] ring-1 ring-indigo-100">{children}</span>;
}

function SuggestedKeywordButton({ keyword, selected, onClick }: { keyword: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cx(
                "inline-flex h-8 items-center rounded-full px-3 text-xs font-black ring-1 transition hover:-translate-y-0.5",
                selected ? "bg-[#5B4DFF] text-white ring-[#5B4DFF]" : "bg-white text-[#5B4DFF] ring-indigo-100 hover:bg-[#EEF0FF]"
            )}
        >
            +{keyword}
        </button>
    );
}

function ToggleMini({ label, active, onClick }: { label: string; active: boolean; onClick?: () => void }) {
    return (
        <button type="button" onClick={onClick} className="mt-3 flex w-full items-center justify-between rounded-[14px] bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100">
            <span className="text-xs font-black text-slate-600">{label}</span>
            <span className={cx("h-5 w-9 rounded-full p-0.5 transition", active ? "bg-[#5B4DFF]" : "bg-slate-200")}>
                <span className={cx("block h-4 w-4 rounded-full bg-white transition", active && "translate-x-4")} />
            </span>
        </button>
    );
}

function ToggleSwitch({ active, onClick, label = "Toggle setting" }: { active: boolean; onClick: () => void; label?: string }) {
    return (
        <button type="button" aria-label={label} onClick={onClick} className={cx("h-6 w-11 rounded-full p-0.5 transition", active ? "bg-[#5B4DFF]" : "bg-slate-200")}>
            <span className={cx("block h-5 w-5 rounded-full bg-white shadow transition", active && "translate-x-5")} />
        </button>
    );
}

function SmallBadge({ label, tone }: { label: string; tone: "purple" | "gold" | "green" | "gray" }) {
    const tones = {
        purple: "bg-[#EEF0FF] text-[#5B4DFF] ring-indigo-100",
        gold: "bg-[#FFF7DA] text-[#8A5D17] ring-[#E8C56C]/50",
        green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        gray: "bg-slate-100 text-slate-500 ring-slate-200",
    };
    return <span className={cx("inline-flex h-5 items-center rounded-full px-2 text-[9px] font-black uppercase tracking-[0.08em] ring-1", tones[tone])}>{label}</span>;
}

function ModalShell({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
            <button aria-label="Close modal" className="fixed inset-0 cursor-default" onClick={onClose} />
            <div className={cx("relative mx-auto my-8 rounded-[26px] border border-white bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.25)]", wide ? "max-w-5xl" : "max-w-3xl")}>
                {children}
            </div>
        </div>
    );
}

function ContactsPage({
    contacts,
    metrics,
    loading,
    search,
    onSearch,
    onNavigate,
    onRefresh,
    accountPlan,
    onUpgrade,
}: {
    contacts: ContactRecord[];
    metrics: ContactMetrics;
    loading: boolean;
    search: string;
    onSearch: (value: string) => void;
    onNavigate: (tab: Tab) => void;
    onRefresh: () => Promise<boolean>;
    accountPlan: AccountPlanState;
    onUpgrade: () => void;
}) {
    const [sourceFilter, setSourceFilter] = useState("All sources");
    const [relationshipFilter, setRelationshipFilter] = useState("All relationships");
    const [dateFilter, setDateFilter] = useState("All dates");
    const [emailFilter, setEmailFilter] = useState("All emails");
    const [segment, setSegment] = useState("All contacts");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [toastMessage, setToastMessage] = useState("");

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        window.setTimeout(() => setToastMessage(""), 2200);
    }, []);

    const stats = useMemo(() => [
        { label: "Total Contacts", value: safeNumber(metrics.totalContacts).toLocaleString(), helper: "Captured leads", icon: <Users className="h-4 w-4" />, tone: "purple" },
        { label: "With Email", value: safeNumber(metrics.withEmail).toLocaleString(), helper: "Ready to export", icon: <Mail className="h-4 w-4" />, tone: "green" },
        { label: "Active Today", value: safeNumber(metrics.activeToday).toLocaleString(), helper: "Recent interactions", icon: <Activity className="h-4 w-4" />, tone: "blue" },
        { label: "New This Week", value: safeNumber(metrics.newThisWeek).toLocaleString(), helper: "Fresh contacts", icon: <UserPlus className="h-4 w-4" />, tone: "indigo" },
        { label: "From Automations", value: safeNumber(metrics.fromAutomations).toLocaleString(), helper: "Workflow sourced", icon: <Bot className="h-4 w-4" />, tone: "amber" },
    ], [metrics]);

    const filteredContacts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return contacts.filter((contact) => {
            const searchText = `${safeText(contact.name)} ${safeText(contact.username)} ${safeText(contact.email)}`.toLowerCase();
            const matchesQuery = !query || searchText.includes(query);
            const matchesSource = sourceFilter === "All sources"
                || contact.sourceType === sourceFilter
                || (sourceFilter === "Automation name" && contact.source !== "Unknown source");
            const matchesRelationship = relationshipFilter === "All relationships" || contact.relationship === relationshipFilter;
            const matchesEmail = emailFilter === "All emails"
                || (emailFilter === "Has email" && hasCapturedEmail(contact))
                || (emailFilter === "No email" && !hasCapturedEmail(contact));
            const lastInteractionDate = contact.lastInteractionAt || contact.joinedDate;
            const matchesDate = dateFilter === "All dates" || isContactWithin(lastInteractionDate, dateFilter);
            const matchesSegment = segment === "All contacts"
                || (segment === "New contacts" && isContactWithin(contact.joinedDate, "This week"))
                || (segment === "With email" && hasCapturedEmail(contact))
                || (segment === "From automations" && contact.sourceType !== "Direct DM")
                || (segment === "Active today" && isContactWithin(lastInteractionDate, "Today"))
                || (segment === "No email" && !hasCapturedEmail(contact));
            return matchesQuery && matchesSource && matchesRelationship && matchesEmail && matchesDate && matchesSegment;
        });
    }, [contacts, dateFilter, emailFilter, relationshipFilter, search, segment, sourceFilter]);

    useEffect(() => {
        setPage(1);
    }, [search, sourceFilter, relationshipFilter, dateFilter, emailFilter, segment, rowsPerPage]);

    useEffect(() => {
        setSelectedIds((current) => {
            const available = new Set(filteredContacts.map((contact) => contact.id));
            const next = new Set(Array.from(current).filter((id) => available.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [filteredContacts]);

    const totalPages = Math.max(1, Math.ceil(filteredContacts.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const pageContacts = filteredContacts.slice(startIndex, startIndex + rowsPerPage);
    const rangeStart = filteredContacts.length ? startIndex + 1 : 0;
    const rangeEnd = Math.min(startIndex + rowsPerPage, filteredContacts.length);
    const pageSelected = pageContacts.length > 0 && pageContacts.every((contact) => selectedIds.has(contact.id));

    const resetFilters = () => {
        onSearch("");
        setSourceFilter("All sources");
        setRelationshipFilter("All relationships");
        setDateFilter("All dates");
        setEmailFilter("All emails");
        setSegment("All contacts");
        setSelectedIds(new Set<string>());
        showToast("Filters cleared");
    };

    const toggleContactSelection = (id: string) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleVisibleSelection = () => {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (pageSelected) pageContacts.forEach((contact) => next.delete(contact.id));
            else pageContacts.forEach((contact) => next.add(contact.id));
            return next;
        });
    };

    const exportContacts = (scope: "filtered" | "selected" | "all" = "filtered") => {
        if (!accountPlan.featureAccess.exportCsv) {
            showToast("Upgrade to Pro to unlock this feature.");
            onUpgrade();
            return;
        }
        const rows = scope === "selected"
            ? contacts.filter((contact) => selectedIds.has(contact.id))
            : scope === "all"
                ? contacts
                : filteredContacts;
        if (!rows.length) {
            showToast("No contacts available to export");
            return;
        }
        const csv = buildContactsCsv(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dmgennie-contacts-${scope}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast("Contacts exported successfully");
    };

    const exportContact = (contact: ContactRecord) => {
        if (!accountPlan.featureAccess.exportCsv) {
            showToast("Upgrade to Pro to unlock this feature.");
            onUpgrade();
            return;
        }
        const csv = buildContactsCsv([contact]);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dmgennie-contact-${contact.username.replace("@", "") || contact.id}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast("Contact exported successfully");
    };

    const copyText = async (value: string, label: string) => {
        if (!value || value === "No email captured" || value === "Unknown Instagram user") {
            showToast(`${label} is not available`);
            return;
        }
        try {
            await navigator.clipboard.writeText(value);
            showToast(`${label} copied`);
        } catch {
            showToast(`Could not copy ${label.toLowerCase()}`);
        }
    };

    const selectedCount = selectedIds.size;
    const hasFilters = Boolean(search.trim()) || sourceFilter !== "All sources" || relationshipFilter !== "All relationships" || dateFilter !== "All dates" || emailFilter !== "All emails" || segment !== "All contacts";
    const refreshContacts = async () => {
        const refreshed = await onRefresh();
        if (refreshed) {
            showToast("Contacts refreshed");
        } else {
            showToast("Unable to refresh contacts");
        }
    };

    return (
        <PageShell
            title="Contacts"
            subtitle="Manage leads captured from your Instagram automations."
            action={
                <div className="flex flex-col gap-2 sm:flex-row">
                    <SecondaryButton onClick={refreshContacts}>
                        <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
                        {loading ? "Refreshing..." : "Refresh Contacts"}
                    </SecondaryButton>
                    <PrimaryButton onClick={() => exportContacts("filtered")}>
                        {accountPlan.featureAccess.exportCsv ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {accountPlan.featureAccess.exportCsv ? "Export CSV" : "Upgrade to Pro"}
                    </PrimaryButton>
                </div>
            }
        >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
                {stats.map((stat) => <ContactStatCard key={stat.label} {...stat} />)}
            </div>

            <section className="space-y-3 rounded-[18px] border border-white bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <SearchBox value={search} onChange={onSearch} placeholder="Search contacts by name, username, or email..." />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        <ContactSelect value={sourceFilter} onChange={setSourceFilter} options={["All sources", "Direct DM", "Automation name", "Comment keyword", "Story reply", "Live comment"]} />
                        <ContactSelect value={relationshipFilter} onChange={setRelationshipFilter} options={["All relationships", "You Follow", "Follows You", "Mutual", "Unknown"]} />
                        <ContactSelect value={dateFilter} onChange={setDateFilter} options={["All dates", "Today", "This week", "This month"]} />
                        <ContactSelect value={emailFilter} onChange={setEmailFilter} options={["All emails", "Has email", "No email"]} />
                        <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 transition hover:bg-slate-50">
                            <X className="h-4 w-4" />
                            Reset
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {["All contacts", "New contacts", "With email", "From automations", "Active today", "No email"].map((item) => (
                            <button
                                key={item}
                                onClick={() => setSegment(item)}
                                className={cx(
                                    "inline-flex h-8 items-center rounded-full px-3 text-xs font-black transition",
                                    segment === item
                                        ? "bg-[#0F172A] text-white shadow-[0_8px_18px_rgba(15,23,42,0.16)]"
                                        : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-white hover:text-[#0F172A]"
                                )}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs font-bold text-slate-500">
                        {selectedCount ? `${selectedCount} selected` : `${filteredContacts.length} contacts shown`}
                    </p>
                </div>

                {selectedCount > 0 && (
                    <div className="flex flex-col gap-2 rounded-[1rem] border border-indigo-100 bg-[#EEF0FF] p-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-black text-[#5B4DFF]">{selectedCount} contact{selectedCount === 1 ? "" : "s"} selected</p>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => exportContacts("selected")} className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.9rem] bg-[#5B4DFF] px-3 text-xs font-black text-white transition hover:bg-[#4738E8]">
                                {accountPlan.featureAccess.exportCsv ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                {accountPlan.featureAccess.exportCsv ? "Export selected" : "Upgrade to export"}
                            </button>
                            <button onClick={() => setSelectedIds(new Set<string>())} className="inline-flex h-9 items-center justify-center rounded-[0.9rem] bg-white px-3 text-xs font-black text-slate-600 ring-1 ring-indigo-100 transition hover:bg-slate-50">
                                Clear selection
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <section className="rounded-[18px] border border-white bg-white shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-950">Captured leads</h2>
                        <p className="text-sm font-semibold text-slate-500">A lightweight Instagram CRM for every lead DMGennie captures.</p>
                    </div>
                    <button onClick={() => exportContacts("all")} className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.9rem] bg-slate-50 px-3 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-white">
                        {accountPlan.featureAccess.exportCsv ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        {accountPlan.featureAccess.exportCsv ? "Export all" : "Upgrade to export"}
                    </button>
                </div>

                {loading && !contacts.length ? (
                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <SkeletonCard key={index} rows={3} showIcon />
                        ))}
                    </div>
                ) : !contacts.length ? (
                    <div className="p-4">
                        <EmptyState
                            icon={<Users className="h-6 w-6" />}
                            title="No contacts yet"
                            copy="Contacts captured from your Instagram automations will appear here."
                            action="Create Automation"
                            onAction={() => onNavigate("automations")}
                        />
                    </div>
                ) : !filteredContacts.length ? (
                    <div className="p-4">
                        <EmptyState
                            icon={<Search className="h-6 w-6" />}
                            title="No matching contacts"
                            copy="Try changing your search or filters."
                            action={hasFilters ? "Clear filters" : undefined}
                            onAction={hasFilters ? resetFilters : undefined}
                        />
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[1040px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
                                        <th className="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={pageSelected}
                                                onChange={toggleVisibleSelection}
                                                className="h-4 w-4 rounded border-slate-300 text-[#5B4DFF] focus:ring-[#5B4DFF]"
                                            />
                                        </th>
                                        {["Contact", "Email", "Source", "Relationship", "Last Interaction", "Joined", "Actions"].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pageContacts.map((contact) => (
                                        <ContactTableRow
                                            key={contact.id}
                                            contact={contact}
                                            selected={selectedIds.has(contact.id)}
                                            onSelect={() => toggleContactSelection(contact.id)}
                                            onOpen={() => setSelectedContact(contact)}
                                            onCopyEmail={() => copyText(contact.email, "Email")}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 p-4 lg:hidden">
                            {pageContacts.map((contact) => (
                                <ContactMobileCard
                                    key={contact.id}
                                    contact={contact}
                                    selected={selectedIds.has(contact.id)}
                                    onSelect={() => toggleContactSelection(contact.id)}
                                    onOpen={() => setSelectedContact(contact)}
                                    onCopyEmail={() => copyText(contact.email, "Email")}
                                />
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-bold text-slate-500">{rangeStart}-{rangeEnd} of {filteredContacts.length}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={rowsPerPage}
                                    onChange={(event) => setRowsPerPage(Number(event.target.value))}
                                    className="h-9 rounded-[0.8rem] border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                                >
                                    {[5, 10, 20].map((count) => <option key={count} value={count}>{count} rows</option>)}
                                </select>
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                    className="inline-flex h-9 items-center gap-1 rounded-[0.8rem] border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Previous
                                </button>
                                <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200">Page {currentPage} of {totalPages}</span>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                    className="inline-flex h-9 items-center gap-1 rounded-[0.8rem] border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            <AnimatePresence>
                {selectedContact && (
                    <ContactDetailDrawer
                        contact={selectedContact}
                        onClose={() => setSelectedContact(null)}
                        onCopyEmail={() => copyText(selectedContact.email, "Email")}
                        onCopyUsername={() => copyText(selectedContact.username, "Username")}
                        onExport={() => exportContact(selectedContact)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="fixed bottom-5 right-5 z-50 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </PageShell>
    );
}

function ContactStatCard({ label, value, helper, icon, tone }: { label: string; value: string; helper: string; icon: ReactNode; tone: string }) {
    const tones: Record<string, string> = {
        purple: "bg-[#EEF0FF] text-[#5B4DFF]",
        green: "bg-emerald-50 text-emerald-600",
        blue: "bg-sky-50 text-sky-600",
        indigo: "bg-violet-50 text-violet-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="rounded-[18px] border border-white bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-center justify-between">
                <span className={cx("flex h-9 w-9 items-center justify-center rounded-[0.9rem]", tones[tone])}>{icon}</span>
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">CRM</span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">{value}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
        </div>
    );
}

function ContactSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 rounded-[1rem] border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
        >
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    );
}

function ContactTableRow({
    contact,
    selected,
    onSelect,
    onOpen,
    onCopyEmail,
}: {
    contact: ContactRecord;
    selected: boolean;
    onSelect: () => void;
    onOpen: () => void;
    onCopyEmail: () => void;
}) {
    return (
        <tr onClick={onOpen} className="cursor-pointer transition hover:bg-slate-50/80">
            <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onSelect}
                    className="h-4 w-4 rounded border-slate-300 text-[#5B4DFF] focus:ring-[#5B4DFF]"
                />
            </td>
            <td className="px-3 py-4">
                <ContactIdentity contact={contact} />
            </td>
            <td className="px-3 py-4">
                <p className={cx("text-sm font-black", hasCapturedEmail(contact) ? "text-slate-700" : "text-slate-400")}>{safeText(contact.email, "No email captured")}</p>
            </td>
            <td className="px-3 py-4">
                <div className="max-w-[190px]">
                    <SourcePill source={contact.sourceType} />
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{safeText(contact.source, "Unknown source")}</p>
                </div>
            </td>
            <td className="px-3 py-4"><RelationshipPill relationship={contact.relationship} /></td>
            <td className="px-3 py-4 text-sm font-bold text-slate-500">{safeText(contact.lastInteractionLabel, "Unknown")}</td>
            <td className="px-3 py-4 text-sm font-bold text-slate-500">{safeText(contact.joined, "Unknown")}</td>
            <td className="px-3 py-4">
                <div className="flex justify-end gap-1">
                    <IconButton title="View details" onClick={(event?: any) => { event?.stopPropagation?.(); onOpen(); }}><Eye className="h-4 w-4" /></IconButton>
                    <IconButton title="Copy email" onClick={(event?: any) => { event?.stopPropagation?.(); onCopyEmail(); }}><Copy className="h-4 w-4" /></IconButton>
                    <IconButton title="More actions"><MoreHorizontal className="h-4 w-4" /></IconButton>
                </div>
            </td>
        </tr>
    );
}

function ContactMobileCard({
    contact,
    selected,
    onSelect,
    onOpen,
    onCopyEmail,
}: {
    contact: ContactRecord;
    selected: boolean;
    onSelect: () => void;
    onOpen: () => void;
    onCopyEmail: () => void;
}) {
    return (
        <div className="rounded-[18px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
            <div className="flex items-start justify-between gap-3">
                <ContactIdentity contact={contact} />
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onSelect}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5B4DFF] focus:ring-[#5B4DFF]"
                />
            </div>
            <div className="mt-4 grid gap-3 text-sm">
                <ContactInfoLine label="Email" value={safeText(contact.email, "No email captured")} muted={!hasCapturedEmail(contact)} />
                <ContactInfoLine label="Source" value={safeText(contact.source, "Unknown source")} />
                <ContactInfoLine label="Joined" value={safeText(contact.joined, "Unknown")} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <SourcePill source={contact.sourceType} />
                <RelationshipPill relationship={contact.relationship} />
            </div>
            <div className="mt-4 flex gap-2">
                <button onClick={onOpen} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[0.9rem] bg-[#5B4DFF] text-sm font-black text-white transition hover:bg-[#4738E8]">
                    <Eye className="h-4 w-4" />
                    View details
                </button>
                <button onClick={onCopyEmail} className="inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                    <Copy className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function ContactIdentity({ contact }: { contact: ContactRecord }) {
    const initial = safeText(contact.name, contact.username).replace("@", "").charAt(0).toUpperCase() || "U";
    return (
        <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#5B4DFF] to-[#B84C88] text-sm font-black text-white shadow-[0_10px_18px_rgba(91,77,255,0.18)]">
                {contact.avatar ? <img src={contact.avatar} alt="" className="h-full w-full rounded-[1rem] object-cover" /> : initial}
            </span>
            <div className="min-w-0">
                <p className="truncate text-sm font-black capitalize text-[#0F172A]">{safeText(contact.name, safeText(contact.username, "Unknown Instagram user"))}</p>
                <p className="truncate text-xs font-bold text-[#64748B]">{safeText(contact.username, "Unknown Instagram user")}</p>
            </div>
        </div>
    );
}

function ContactInfoLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
            <span className={cx("min-w-0 truncate text-right text-xs font-black", muted ? "text-slate-400" : "text-slate-700")}>{value}</span>
        </div>
    );
}

function SourcePill({ source }: { source: ContactRecord["sourceType"] }) {
    const tone = source === "Direct DM"
        ? "bg-sky-50 text-sky-700 ring-sky-100"
        : source === "Story reply"
            ? "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100"
            : source === "Live comment"
                ? "bg-rose-50 text-rose-700 ring-rose-100"
                : source === "Unknown source"
                    ? "bg-slate-100 text-slate-500 ring-slate-200"
                    : "bg-[#EEF0FF] text-[#5B4DFF] ring-indigo-100";
    return <span className={cx("inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.06em] ring-1", tone)}>{source}</span>;
}

function RelationshipPill({ relationship }: { relationship: ContactRecord["relationship"] }) {
    const tone = relationship === "Mutual"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
        : relationship === "Follows You"
            ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
            : relationship === "You Follow"
                ? "bg-sky-50 text-sky-700 ring-sky-100"
                : "bg-slate-100 text-slate-500 ring-slate-200";
    return <span className={cx("inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.06em] ring-1", tone)}>{relationship}</span>;
}

function ContactDetailDrawer({
    contact,
    onClose,
    onCopyEmail,
    onCopyUsername,
    onExport,
}: {
    contact: ContactRecord;
    onClose: () => void;
    onCopyEmail: () => void;
    onCopyUsername: () => void;
    onExport: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50">
            <motion.button
                aria-label="Close contact details"
                className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:rounded-l-[26px]"
            >
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 p-5 backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5B4DFF]">Contact details</p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0F172A]">{safeText(contact.name, contact.username)}</h2>
                        </div>
                        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    <div className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
                        <ContactIdentity contact={contact} />
                        <div className="mt-4 flex flex-wrap gap-2">
                            <RelationshipPill relationship={contact.relationship} />
                            <SourcePill source={contact.sourceType} />
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-[20px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.025)]">
                        <DrawerInfo label="Instagram username" value={safeText(contact.username, "Unknown Instagram user")} />
                        <DrawerInfo label="Email" value={safeText(contact.email, "No email captured")} muted={!hasCapturedEmail(contact)} />
                        <DrawerInfo label="Source" value={safeText(contact.source, "Unknown source")} />
                        <DrawerInfo label="Joined" value={safeText(contact.joined, "Unknown")} />
                        <DrawerInfo label="Last interaction" value={safeText(contact.lastInteractionLabel, "Unknown")} />
                    </div>

                    <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.025)]">
                        <h3 className="text-sm font-black text-[#0F172A]">Captured data</h3>
                        <div className="mt-3 grid gap-2">
                            {contact.capturedFields.map((field) => (
                                <div key={field.label} className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-slate-50 px-3 py-2">
                                    <span className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{field.label}</span>
                                    <span className="min-w-0 truncate text-right text-xs font-black text-slate-700">{safeText(field.value, "Unknown")}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.025)]">
                        <h3 className="text-sm font-black text-[#0F172A]">Recent activity</h3>
                        <div className="mt-4 space-y-4">
                            {contact.timeline.map((item, index) => (
                                <div key={`${item.label}-${index}`} className="flex gap-3">
                                    <span className={cx("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", contactTimelineTone(item.tone))} />
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{item.label}</p>
                                        <p className="mt-0.5 text-xs font-bold text-slate-400">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <button onClick={onCopyUsername} className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50">
                            <Copy className="h-4 w-4" />
                            Copy username
                        </button>
                        <button onClick={onCopyEmail} className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50">
                            <Mail className="h-4 w-4" />
                            Copy email
                        </button>
                        <button onClick={onExport} className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] bg-[#5B4DFF] text-sm font-black text-white transition hover:bg-[#4738E8]">
                            <Download className="h-4 w-4" />
                            Export contact
                        </button>
                        {contact.profileUrl && (
                            <a href={contact.profileUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800">
                                <ExternalLink className="h-4 w-4" />
                                Open Instagram profile
                            </a>
                        )}
                    </div>
                </div>
            </motion.aside>
        </div>
    );
}

function DrawerInfo({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
            <span className={cx("min-w-0 truncate text-right text-sm font-black", muted ? "text-slate-400" : "text-slate-700")}>{value}</span>
        </div>
    );
}

function safeText(value: string | undefined | null, fallback = "Unknown") {
    if (!value || value === "null" || value === "undefined" || value === "@n/a") return fallback;
    return value;
}

function hasCapturedEmail(contact: ContactRecord) {
    return Boolean(contact.email && contact.email !== "No email captured");
}

function isContactWithin(joinedDate: string, range: string) {
    const date = new Date(joinedDate);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (range === "Today") return date.toDateString() === now.toDateString();
    if (range === "This week") return diff <= 7 * 86400000;
    if (range === "This month") return diff <= 30 * 86400000;
    return true;
}

function buildContactsCsv(rows: ContactRecord[]) {
    const headers = ["Name", "Username", "Email", "Source", "Relationship", "Last Interaction", "Joined Date"];
    const body = rows.map((contact) => [
        safeText(contact.name, safeText(contact.username, "Unknown Instagram user")),
        safeText(contact.username, "Unknown Instagram user"),
        hasCapturedEmail(contact) ? contact.email : "",
        safeText(contact.source, "Unknown source"),
        safeText(contact.relationship, "Unknown"),
        safeText(contact.lastInteractionLabel, "Unknown"),
        safeText(contact.joined, "Unknown"),
    ].map(csvEscape).join(","));
    return [headers.join(","), ...body].join("\n");
}

function csvEscape(value: string) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

function contactTimelineTone(tone: "purple" | "green" | "amber" | "slate") {
    const tones = {
        purple: "bg-[#5B4DFF]",
        green: "bg-emerald-500",
        amber: "bg-amber-500",
        slate: "bg-slate-400",
    };
    return tones[tone];
}

function InboxPage({ activity }: { activity: LogEntry[] }) {
    return (
        <PageShell title="Inbox" subtitle="A unified conversation inbox for Instagram DMs is coming soon.">
            <section className="relative overflow-hidden rounded-[24px] border border-white bg-white p-6 shadow-[0_18px_54px_rgba(15,23,42,0.06)] sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#5B4DFF]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-fuchsia-200/20 blur-3xl" />
                <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
                    <span className="inline-flex h-8 items-center rounded-full bg-[#EEF0FF] px-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#5B4DFF] ring-1 ring-indigo-100">
                        Coming soon
                    </span>
                    <span className="mt-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-[0_18px_38px_rgba(15,23,42,0.18)]">
                        <Inbox className="h-7 w-7" />
                    </span>
                    <h2 className="mt-5 text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl">DMGennie Inbox is being prepared</h2>
                    <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#64748B]">
                        Soon you will be able to see Instagram conversations, automation replies, lead captures, and follow-ups in one clean workspace.
                    </p>

                    <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
                        {[
                            { label: "Unified DM view", icon: <MessageCircle className="h-4 w-4" /> },
                            { label: "Automation history", icon: <Bot className="h-4 w-4" /> },
                            { label: "Lead follow-ups", icon: <UserPlus className="h-4 w-4" /> },
                        ].map((item) => (
                            <div key={item.label} className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-3 text-left">
                                <span className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-white text-[#5B4DFF] shadow-sm ring-1 ring-slate-100">
                                    {item.icon}
                                </span>
                                <p className="mt-3 text-sm font-black text-[#0F172A]">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                        <Link to="/pricing" className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] bg-[#5B4DFF] px-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-[#4738E8]">
                            <Crown className="h-4 w-4" />
                            Get ready with Pro
                        </Link>
                        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
                            <Bell className="h-4 w-4" />
                            Notify me
                        </button>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}

type AnalyticsTab = "Performance" | "Activity Log" | "Account Performance" | "Audience Insights";
type AnalyticsAutomationRow = {
    id: number;
    name: string;
    description: string;
    trigger: string;
    keywords: string[];
    dms: number;
    clicks: number;
    ctr: number;
    leads: number;
    deliveryRate: number;
    failed: number;
    status: "Live" | "Paused" | "Draft";
    modified: string;
    selectedContent: string;
    lastActivity: string;
};
type AnalyticsActivityEvent = {
    id: string;
    type: "DM sent" | "Link clicked" | "Lead captured" | "Failed DM";
    user: string;
    automation: string;
    keyword: string;
    status: "Delivered" | "Clicked" | "Captured" | "Failed";
    timestamp: string;
    errorReason?: string;
    suggestedFix?: string;
};
type ContentPerformanceRow = {
    id: string;
    title: string;
    type: InstagramMedia["type"];
    caption: string;
    metric: string;
    comments: number;
    keywordComments: number;
    triggerRate: number;
    dms: number;
    clicks: number;
    leads: number;
    color: string;
};
type AudienceUserRow = {
    id: string;
    username: string;
    name: string;
    comments: number;
    lastComment: string;
    topKeyword: string;
    sourceAutomation: string;
    leads: number;
    clicked: boolean;
};

function AnalyticsPage({
    stats,
    leadsCollected,
    deliveryRate,
    range,
    onRange,
    triggers,
    activity,
    onNavigate,
    accountPlan,
    onUpgrade,
}: {
    stats: Stats;
    leadsCollected: number;
    deliveryRate: number | null;
    range: string;
    onRange: (value: string) => void;
    triggers: Trigger[];
    activity: LogEntry[];
    onNavigate: (tab: Tab) => void;
    accountPlan: AccountPlanState;
    onUpgrade: () => void;
}) {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>("Performance");
    const [automationSort, setAutomationSort] = useState("Sort by DMs sent");
    const [automationStatus, setAutomationStatus] = useState("All statuses");
    const [automationTrigger, setAutomationTrigger] = useState("All triggers");
    const [selectedAutomation, setSelectedAutomation] = useState<AnalyticsAutomationRow | null>(null);
    const [contentSearch, setContentSearch] = useState("");
    const [contentSort, setContentSort] = useState("Sort by comments");
    const [activityType, setActivityType] = useState("All events");
    const [activityAutomation, setActivityAutomation] = useState("All automations");
    const [audienceSegment, setAudienceSegment] = useState("Top commenters");
    const [audienceAutomation, setAudienceAutomation] = useState("All Automations");
    const [toastMessage, setToastMessage] = useState("");

    const showToast = useCallback((message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(""), 2200);
    }, []);

    const dateOptions = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This month", "All time"];
    const automationRows = useMemo(() => buildAutomationAnalyticsRows(triggers, stats, leadsCollected, deliveryRate), [triggers, stats, leadsCollected, deliveryRate]);
    const activityEvents = useMemo(() => buildAnalyticsActivityEvents(activity, automationRows), [activity, automationRows]);
    const contentRows = useMemo(() => buildContentPerformanceRows(stats, leadsCollected), [stats, leadsCollected]);
    const audienceRows = useMemo(() => buildAudienceRows(activity, automationRows), [activity, automationRows]);
    const trendData = useMemo(() => buildAnalyticsTrendData(range, stats, leadsCollected), [range, stats, leadsCollected]);

    const visibleAutomationRows = useMemo(() => {
        let rows = automationRows.filter((row) => {
            const statusOk = automationStatus === "All statuses" || row.status === automationStatus;
            const triggerOk = automationTrigger === "All triggers" || row.trigger === automationTrigger;
            return statusOk && triggerOk;
        });
        rows = [...rows].sort((a, b) => {
            if (automationSort === "Sort by newest") return b.id - a.id;
            if (automationSort === "Sort by clicks") return b.clicks - a.clicks;
            if (automationSort === "Sort by CTR") return b.ctr - a.ctr;
            if (automationSort === "Sort by leads") return b.leads - a.leads;
            return b.dms - a.dms;
        });
        return rows;
    }, [automationRows, automationSort, automationStatus, automationTrigger]);

    const visibleContentRows = useMemo(() => {
        const query = contentSearch.toLowerCase();
        const rows = contentRows.filter((row) => `${row.title} ${row.caption} ${row.type}`.toLowerCase().includes(query));
        return [...rows].sort((a, b) => {
            if (contentSort === "Sort by trigger rate") return b.triggerRate - a.triggerRate;
            if (contentSort === "Sort by DMs sent") return b.dms - a.dms;
            return b.comments - a.comments;
        });
    }, [contentRows, contentSearch, contentSort]);

    const visibleActivityEvents = useMemo(() => {
        return activityEvents.filter((event) => {
            const eventOk = activityType === "All events" || event.type === activityType;
            const automationOk = activityAutomation === "All automations" || event.automation === activityAutomation;
            return eventOk && automationOk;
        });
    }, [activityEvents, activityType, activityAutomation]);

    const visibleAudienceRows = useMemo(() => {
        let rows = audienceRows.filter((row) => audienceAutomation === "All Automations" || row.sourceAutomation === audienceAutomation);
        if (audienceSegment === "Most recent commenters") rows = [...rows].sort((a, b) => a.lastComment.localeCompare(b.lastComment));
        if (audienceSegment === "Leads captured") rows = rows.filter((row) => row.leads > 0);
        if (audienceSegment === "Clicked link") rows = rows.filter((row) => row.clicked);
        if (audienceSegment === "Superfans") rows = rows.filter((row) => row.comments >= 2);
        return rows;
    }, [audienceRows, audienceAutomation, audienceSegment]);

    const periodMetrics = useMemo(() => {
        const factor = analyticsRangeFactor(range);
        const totalDms = range === "Today" ? stats.dmsSentToday : Math.round(stats.totalDmsSent * factor);
        const dmsSent = safeNumber(totalDms);
        const clicks = safeNumber(Math.round(stats.totalLinksSent * (range === "Today" ? 0.22 : factor)));
        const leads = safeNumber(Math.round(leadsCollected * (range === "Today" ? 0.22 : factor)));
        const failed = safeNumber(Math.round(stats.failedDms * (range === "Today" ? 0.22 : factor)));
        const activeAutomations = triggers.filter((trigger) => trigger.enabled).length;
        return {
            dmsSent,
            clicks,
            leads,
            deliveryRate,
            failed,
            activeAutomations,
        };
    }, [range, stats, leadsCollected, deliveryRate, triggers]);

    const bestAutomation = automationRows[0];
    const rangeLabel = range || "Last 7 days";
    const analyticsLocked = !accountPlan.featureAccess.advancedAnalytics;
    const exportLocked = !accountPlan.featureAccess.exportCsv;

    const exportPerformance = () => {
        if (exportLocked) {
            showToast("Upgrade to Pro to unlock this feature.");
            onUpgrade();
            return;
        }
        if (!visibleAutomationRows.length) {
            showToast("No analytics available to export.");
            return;
        }
        downloadCsv("dmgennie-automation-performance.csv", buildAutomationPerformanceCsv(visibleAutomationRows));
        showToast("Analytics exported successfully.");
    };

    const exportActivity = () => {
        if (exportLocked) {
            showToast("Upgrade to Pro to unlock this feature.");
            onUpgrade();
            return;
        }
        if (!visibleActivityEvents.length) {
            showToast("No activity available to export.");
            return;
        }
        downloadCsv("dmgennie-activity-log.csv", buildActivityCsv(visibleActivityEvents));
        showToast("Activity log exported successfully.");
    };

    return (
        <PageShell
            title="Analytics"
            subtitle="Track your Instagram automation performance and recent activity."
            action={
                <div className="flex flex-wrap items-center gap-2">
                    <SelectBox value={range} onChange={(value) => { onRange(value); showToast("Date range updated."); }} options={dateOptions} />
                    <SecondaryButton onClick={() => showToast("Analytics refreshed.")}><RefreshCw className="h-4 w-4" /> Refresh</SecondaryButton>
                    <PrimaryButton onClick={activeTab === "Activity Log" ? exportActivity : exportPerformance} compact>{exportLocked ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />} {exportLocked ? "Upgrade to export" : "Export CSV"}</PrimaryButton>
                </div>
            }
        >
            <div className="flex gap-2 overflow-x-auto rounded-[18px] border border-white bg-white p-1.5 shadow-[0_14px_42px_rgba(15,23,42,0.04)]">
                {(["Performance", "Activity Log", "Account Performance", "Audience Insights"] as AnalyticsTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            if (analyticsLocked && tab !== "Performance") {
                                showToast("Upgrade to Pro to unlock advanced analytics.");
                                onUpgrade();
                                return;
                            }
                            setActiveTab(tab);
                        }}
                        className={cx(
                            "whitespace-nowrap rounded-[0.95rem] px-4 py-2.5 text-sm font-black transition",
                            activeTab === tab ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                        )}
                    >
                        <span className="inline-flex items-center gap-2">{tab}{analyticsLocked && tab !== "Performance" && <Lock className="h-3.5 w-3.5" />}</span>
                    </button>
                ))}
            </div>

            {activeTab === "Performance" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-3">
                        <AnalyticsMetricCard icon={<Send className="h-5 w-5" />} label="DMs Sent" value={formatMetric(periodMetrics.dmsSent)} change="Selected period" tone="purple" />
                        <AnalyticsMetricCard icon={<MousePointerClick className="h-5 w-5" />} label="Link Clicks" value={formatMetric(periodMetrics.clicks)} change="Tracked clicks" tone="blue" />
                        <AnalyticsMetricCard icon={<UserPlus className="h-5 w-5" />} label="Leads Captured" value={formatMetric(periodMetrics.leads)} change="Captured contacts" tone="green" />
                        <AnalyticsMetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Delivery Rate" value={formatPercent(periodMetrics.deliveryRate)} change={periodMetrics.deliveryRate === null ? "No messages sent yet" : "Successful sends"} tone="green" />
                        <AnalyticsMetricCard icon={<AlertTriangle className="h-5 w-5" />} label="Failed Messages" value={formatMetric(periodMetrics.failed)} change="Needs review only if rising" tone="amber" />
                        <AnalyticsMetricCard icon={<Bot className="h-5 w-5" />} label="Active Automations" value={formatMetric(periodMetrics.activeAutomations)} change="Live workflows" tone="purple" />
                    </div>

                    {analyticsLocked ? (
                        <ProLockPanel
                            title="Advanced analytics are available on Pro."
                            copy="Upgrade to unlock charts, automation performance, content performance, audience insights, and CSV exports."
                            cta="Start Pro for ₹1"
                            onUpgrade={onUpgrade}
                        />
                    ) : (
                        <>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <AnalyticsChartCard title="DMs sent over time" range={rangeLabel} data={trendData} primaryKey="dms" primaryColor="#5B4DFF" secondaryKey="clicks" secondaryColor="#38BDF8" emptyText="No DMs sent data for this period" />
                                <AnalyticsChartCard title="Leads and failed DMs" range={rangeLabel} data={trendData} primaryKey="leads" primaryColor="#10B981" secondaryKey="failed" secondaryColor="#EF4444" emptyText="No lead data for this period" />
                            </div>

                    <Panel
                        title="Automation Performance"
                        action={
                            <div className="flex flex-wrap gap-2">
                                <SelectBox value={automationSort} onChange={setAutomationSort} options={["Sort by DMs sent", "Sort by newest", "Sort by clicks", "Sort by CTR", "Sort by leads"]} />
                                <SelectBox value={automationStatus} onChange={setAutomationStatus} options={["All statuses", "Live", "Draft", "Paused"]} />
                                <SelectBox value={automationTrigger} onChange={setAutomationTrigger} options={["All triggers", "Post or Reel comment", "DM keyword", "Story reply", "Live comment"]} />
                            </div>
                        }
                    >
                        {visibleAutomationRows.length ? (
                            <>
                                <div className="hidden overflow-x-auto lg:block">
                                    <table className="w-full min-w-[900px] text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
                                                <th className="px-3 py-3">Automation</th>
                                                <th className="px-3 py-3">Trigger</th>
                                                <th className="px-3 py-3">Keywords</th>
                                                <th className="px-3 py-3 text-right">DMs</th>
                                                <th className="px-3 py-3 text-right">Clicks</th>
                                                <th className="px-3 py-3 text-right">CTR</th>
                                                <th className="px-3 py-3 text-right">Leads</th>
                                                <th className="px-3 py-3 text-right">Delivery</th>
                                                <th className="px-3 py-3 text-right">Failed</th>
                                                <th className="px-3 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {visibleAutomationRows.map((row) => (
                                                <tr key={row.id} onClick={() => setSelectedAutomation(row)} className="cursor-pointer transition hover:bg-[#F8FAFC]">
                                                    <td className="px-3 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[#EEF0FF] text-[#5B4DFF]"><Bot className="h-5 w-5" /></span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-black text-slate-950">{row.name}</span>
                                                                <span className="block max-w-[260px] truncate text-xs font-semibold text-slate-500">{row.description}</span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 text-sm font-bold text-slate-600">{row.trigger}</td>
                                                    <td className="px-3 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {row.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">+{keyword}</span>)}
                                                        </div>
                                                    </td>
                                                    <AnalyticsNumberCell value={row.dms} />
                                                    <AnalyticsNumberCell value={row.clicks} />
                                                    <td className="px-3 py-4 text-right text-sm font-black text-slate-700">{row.ctr}%</td>
                                                    <AnalyticsNumberCell value={row.leads} />
                                                    <td className="px-3 py-4 text-right text-sm font-black text-emerald-600">{row.deliveryRate}%</td>
                                                    <td className={cx("px-3 py-4 text-right text-sm font-black", row.failed ? "text-rose-600" : "text-slate-400")}>{formatMetric(row.failed)}</td>
                                                    <td className="px-3 py-4"><StatusBadge status={row.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="grid gap-3 lg:hidden">
                                    {visibleAutomationRows.map((row) => (
                                        <button key={row.id} onClick={() => setSelectedAutomation(row)} className="rounded-[18px] border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-slate-950">{row.name}</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-500">{row.trigger}</p>
                                                </div>
                                                <StatusBadge status={row.status} />
                                            </div>
                                            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                                <CompactStat label="DMs" value={formatMetric(row.dms)} />
                                                <CompactStat label="Clicks" value={formatMetric(row.clicks)} />
                                                <CompactStat label="Leads" value={formatMetric(row.leads)} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <EmptyState icon={<Bot className="h-6 w-6" />} title="No automation data yet" copy="Create and launch an automation to start tracking performance." action="Create Automation" onAction={() => onNavigate("automations")} />
                        )}
                    </Panel>

                    <Panel
                        title="Content Performance"
                        action={
                            <div className="flex flex-wrap gap-2">
                                <SearchBox value={contentSearch} onChange={setContentSearch} placeholder="Search content..." compact />
                                <SelectBox value={contentSort} onChange={setContentSort} options={["Sort by comments", "Sort by trigger rate", "Sort by DMs sent"]} />
                            </div>
                        }
                    >
                        {visibleContentRows.length ? (
                            <div className="grid gap-3">
                                {visibleContentRows.slice(0, 5).map((row) => <ContentPerformanceCard key={row.id} row={row} />)}
                                {visibleContentRows.length > 5 && (
                                    <button onClick={() => showToast("More content performance will load as Instagram sync grows.")} className="mx-auto mt-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50">Load More</button>
                                )}
                            </div>
                        ) : (
                            <EmptyState icon={<ImageIcon className="h-6 w-6" />} title="No content performance yet" copy="Once your posts or reels receive comments, performance will appear here." />
                        )}
                    </Panel>

                    <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
                        <GeographicDistributionCard />
                        <Panel title="Performance insights">
                            <div className="grid gap-3">
                                <InsightRow icon={<TrophyIcon />} title="Best performing automation" value={bestAutomation?.name || "No automation yet"} copy={bestAutomation ? `${bestAutomation.ctr}% click-through rate` : "Launch an automation to identify a winner."} />
                                <InsightRow icon={<Activity className="h-4 w-4" />} title="Peak engagement day" value="Sunday" copy="Based on current DM volume trend." />
                                <InsightRow icon={<CheckCircle2 className="h-4 w-4" />} title="Delivery rate" value={formatPercent(periodMetrics.deliveryRate)} copy="Successful sends divided by DM attempts." />
                            </div>
                        </Panel>
                    </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === "Activity Log" && (
                <div className="space-y-4">
                    <Panel
                        title="Recent Automation Activity"
                        action={
                            <div className="flex flex-wrap gap-2">
                                <SelectBox value={activityType} onChange={setActivityType} options={["All events", "DM sent", "Link clicked", "Lead captured", "Failed DM"]} />
                                <SelectBox value={activityAutomation} onChange={setActivityAutomation} options={["All automations", ...automationRows.map((row) => row.name)]} />
                                <PrimaryButton onClick={exportActivity} compact><Download className="h-4 w-4" /> Export activity</PrimaryButton>
                            </div>
                        }
                    >
                        {visibleActivityEvents.some((event) => event.type === "Failed DM") && <FailedDmHelpCard />}
                        <div className="mt-4 grid gap-2">
                            {visibleActivityEvents.length ? visibleActivityEvents.map((event) => (
                                <ActivityEventRow key={event.id} event={event} onCopy={() => { navigator.clipboard?.writeText(`${event.type} - ${event.user}`); showToast("Activity copied."); }} onRetry={() => showToast("Failed DM retry started.")} />
                            )) : (
                                <EmptyState icon={<Activity className="h-6 w-6" />} title="No activity yet" copy="Once your automations start sending DMs, activity will appear here." />
                            )}
                        </div>
                    </Panel>
                </div>
            )}

            {activeTab === "Account Performance" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(165px,1fr))] gap-3">
                        <AnalyticsMetricCard icon={<Users className="h-5 w-5" />} label="Total Followers" value={typeof stats.followers === "number" ? formatMetric(stats.followers) : "—"} change={typeof stats.followers === "number" ? "Current Instagram count" : "Connect Instagram to sync"} tone="blue" />
                        <AnalyticsMetricCard icon={<TrendingUp className="h-5 w-5" />} label="New Followers" value="—" change="Requires Instagram insights sync" tone="green" />
                        <AnalyticsMetricCard icon={<ChevronDown className="h-5 w-5" />} label="Unfollowers" value="—" change="Requires Instagram insights sync" tone="amber" />
                        <AnalyticsMetricCard icon={<Activity className="h-5 w-5" />} label="Net Growth" value="—" change="Requires Instagram insights sync" tone="purple" />
                        <AnalyticsMetricCard icon={<MousePointerClick className="h-5 w-5" />} label="Profile Activity" value={formatMetric(Math.max(0, stats.totalLinksSent + stats.totalPublicReplies))} change="Clicks, replies, interactions" tone="blue" />
                        <AnalyticsMetricCard icon={<BarChart3 className="h-5 w-5" />} label="Engagement Rate" value={typeof stats.followers === "number" && stats.followers > 0 ? `${Math.max(0, Math.min(100, Math.round((stats.totalPublicReplies / stats.followers) * 1000) / 10))}%` : "—"} change="Based on available activity" tone="green" />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                        <AnalyticsChartCard title="Follower growth" range={rangeLabel} data={trendData} primaryKey="followers" primaryColor="#5B4DFF" secondaryKey="leads" secondaryColor="#10B981" emptyText="Follower data is unavailable for this period" />
                        <Panel title="Account insights availability">
                            <div className="rounded-[18px] border border-amber-100 bg-amber-50/70 p-4">
                                <div className="flex gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white text-amber-600 shadow-sm"><AlertTriangle className="h-5 w-5" /></span>
                                    <div>
                                        <h3 className="font-black text-slate-950">Account insights unavailable</h3>
                                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Instagram may require additional permissions or enough account activity to show deeper account-level insights.</p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <SecondaryButton><RefreshCw className="h-4 w-4" /> Check permissions</SecondaryButton>
                                            <PrimaryButton compact><Instagram className="h-4 w-4" /> Reconnect Instagram</PrimaryButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>
            )}

            {activeTab === "Audience Insights" && (
                <div className="space-y-4">
                    <Panel
                        title="Audience Insights"
                        action={
                            <div className="flex flex-wrap gap-2">
                                <SelectBox value={audienceAutomation} onChange={setAudienceAutomation} options={["All Automations", ...automationRows.map((row) => row.name), "Create group"]} />
                                <SelectBox value={audienceSegment} onChange={setAudienceSegment} options={["Top commenters", "Most recent commenters", "Leads captured", "Clicked link", "Superfans"]} />
                            </div>
                        }
                    >
                        <p className="-mt-2 mb-4 text-sm font-semibold text-slate-500">Discover your top commenters, superfans, and most engaged users.</p>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(145px,1fr))] gap-3">
                            <CompactInsight label="Total Comments" value={formatMetric(audienceRows.reduce((sum, row) => sum + row.comments, 0))} />
                            <CompactInsight label="Unique Commenters" value={formatMetric(audienceRows.length)} />
                            <CompactInsight label="Avg Comments/User" value={audienceRows.length ? (audienceRows.reduce((sum, row) => sum + row.comments, 0) / audienceRows.length).toFixed(1) : "0"} />
                            <CompactInsight label="Repeat Commenters" value={formatMetric(audienceRows.filter((row) => row.comments > 1).length)} />
                            <CompactInsight label="Superfans" value={formatMetric(audienceRows.filter((row) => row.comments >= 2).length)} />
                        </div>
                    </Panel>

                    <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
                        <Panel title={audienceSegment}>
                            {visibleAudienceRows.length ? (
                                <div className="grid gap-2">
                                    {visibleAudienceRows.map((row) => <AudienceRow key={row.id} row={row} />)}
                                </div>
                            ) : (
                                <EmptyState icon={<Users className="h-6 w-6" />} title="No commenters found" copy="Select automations or wait for users to engage with your content." />
                            )}
                        </Panel>
                        <Panel title="Superfans">
                            {audienceRows.filter((row) => row.comments >= 2).length ? (
                                <div className="space-y-3">
                                    {audienceRows.filter((row) => row.comments >= 2).slice(0, 4).map((row) => (
                                        <div key={row.id} className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-3">
                                            <div className="flex items-center gap-3">
                                                <FallbackAvatar value={row.username} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-black text-slate-950">{row.username}</p>
                                                    <p className="text-xs font-semibold text-slate-500">{row.comments} comments this period</p>
                                                </div>
                                                <SmallBadge label="Superfan" tone="gold" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState icon={<Sparkles className="h-6 w-6" />} title="No superfans yet" copy="Superfans will appear after users repeatedly engage with your automations." />
                            )}
                        </Panel>
                    </div>
                </div>
            )}

            {selectedAutomation && (
                <AutomationAnalyticsDrawer
                    row={selectedAutomation}
                    onClose={() => setSelectedAutomation(null)}
                    onEdit={() => { setSelectedAutomation(null); onNavigate("automations"); }}
                    onContacts={() => { setSelectedAutomation(null); onNavigate("contacts"); }}
                    onExport={() => {
                        downloadCsv("dmgennie-automation-report.csv", buildAutomationPerformanceCsv([selectedAutomation]));
                        showToast("Analytics exported successfully.");
                    }}
                />
            )}

            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="fixed bottom-5 right-5 z-[70] rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-2xl"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </PageShell>
    );
}

function AnalyticsMetricCard({ icon, label, value, change, tone }: { icon: ReactNode; label: string; value: string; change: string; tone: "purple" | "green" | "blue" | "amber" }) {
    const tones = {
        purple: "bg-[#EEF0FF] text-[#5B4DFF]",
        green: "bg-emerald-50 text-emerald-600",
        blue: "bg-sky-50 text-sky-600",
        amber: "bg-amber-50 text-amber-600",
    };
    return (
        <div className="rounded-[18px] border border-white bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
            <div className="flex items-start justify-between gap-3">
                <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem]", tones[tone])}>{icon}</span>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Live</span>
            </div>
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">{change}</p>
        </div>
    );
}

function ProLockPanel({ title, copy, cta, onUpgrade }: { title: string; copy: string; cta: string; onUpgrade: () => void }) {
    return (
        <Panel>
            <div className="flex flex-col gap-4 rounded-[20px] border border-[#FDE68A] bg-[#FFFDF6] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-white text-[#8A5D17] shadow-sm ring-1 ring-[#E8C56C]/50">
                        <Lock className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="text-base font-black text-[#0F172A]">{title}</h3>
                        <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#64748B]">{copy}</p>
                    </div>
                </div>
                <button onClick={onUpgrade} className={cx("inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-black", goldCtaCls)}>
                    <Crown className={cx("h-4 w-4", goldCrownCls)} />
                    {cta}
                </button>
            </div>
        </Panel>
    );
}

function AnalyticsChartCard({
    title,
    range,
    data,
    primaryKey,
    primaryColor,
    secondaryKey,
    secondaryColor,
    emptyText,
}: {
    title: string;
    range: string;
    data: Array<Record<string, string | number>>;
    primaryKey: string;
    primaryColor: string;
    secondaryKey?: string;
    secondaryColor?: string;
    emptyText: string;
}) {
    const hasData = data.some((item) => safeNumber(item[primaryKey] as number) > 0 || (secondaryKey ? safeNumber(item[secondaryKey] as number) > 0 : false));
    return (
        <Panel
            title={title}
            action={<span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">{range}</span>}
        >
            {hasData ? (
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: -22 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }} />
                            <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 20px 45px rgba(15,23,42,0.10)" }} />
                            <Line type="monotone" dataKey={primaryKey} stroke={primaryColor} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            {secondaryKey && <Line type="monotone" dataKey={secondaryKey} stroke={secondaryColor || "#10B981"} strokeWidth={3} dot={false} />}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <EmptyState icon={<BarChart3 className="h-6 w-6" />} title={emptyText} copy="Try a wider date range or launch an automation." />
            )}
        </Panel>
    );
}

function AnalyticsNumberCell({ value }: { value: number }) {
    return <td className="px-3 py-4 text-right text-sm font-black text-slate-700">{formatMetric(value)}</td>;
}

function CompactStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[14px] bg-slate-50 p-2">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className="mt-0.5 text-sm font-black text-slate-950">{value}</p>
        </div>
    );
}

function ContentPerformanceCard({ row }: { row: ContentPerformanceRow }) {
    return (
        <div className="grid gap-3 rounded-[18px] border border-slate-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_14px_36px_rgba(15,23,42,0.06)] md:grid-cols-[minmax(0,1.35fr)_repeat(6,minmax(72px,0.5fr))] md:items-center">
            <div className="flex min-w-0 items-center gap-3">
                <div className={cx("h-14 w-14 shrink-0 rounded-[1rem] bg-gradient-to-br shadow-inner", row.color)} />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-950">{row.title}</p>
                        <SmallBadge label={row.type} tone={row.type === "Reel" ? "purple" : row.type === "Carousel" ? "gold" : "gray"} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{row.caption}</p>
                    <p className="mt-1 text-[11px] font-black text-slate-400">{row.metric}</p>
                </div>
            </div>
            <MiniMetric label="Comments" value={formatMetric(row.comments)} />
            <MiniMetric label="Keyword" value={formatMetric(row.keywordComments)} />
            <MiniMetric label="Trigger" value={`${row.triggerRate}%`} />
            <MiniMetric label="DMs" value={formatMetric(row.dms)} />
            <MiniMetric label="Clicks" value={formatMetric(row.clicks)} />
            <MiniMetric label="Leads" value={formatMetric(row.leads)} />
        </div>
    );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[14px] bg-slate-50 px-3 py-2 text-left md:text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className="mt-0.5 text-sm font-black text-slate-800">{value}</p>
        </div>
    );
}

function GeographicDistributionCard() {
    return (
        <Panel title="Geographic Distribution">
            <EmptyState
                icon={<ExternalLink className="h-6 w-6" />}
                title="No geographic data yet"
                copy="Location data will appear when users click your tracked links."
            />
        </Panel>
    );
}

function InsightRow({ icon, title, value, copy }: { icon: ReactNode; title: string; value: string; copy: string }) {
    return (
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-100 bg-slate-50/70 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white text-[#5B4DFF] shadow-sm">{icon}</span>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{title}</p>
                <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">{copy}</p>
            </div>
        </div>
    );
}

function TrophyIcon() {
    return <Crown className="h-4 w-4" />;
}

function FailedDmHelpCard() {
    const reasons = [
        "User does not follow you",
        "Rate limit exceeded",
        "24-hour window expired",
        "Instagram API permission issue",
        "Message blocked by Instagram",
    ];
    return (
        <div className="rounded-[18px] border border-amber-100 bg-amber-50/70 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h3 className="font-black text-slate-950">Troubleshooting Failed DMs</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Common reasons and what DMGennie can help you review.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {reasons.map((reason) => <span key={reason} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">{reason}</span>)}
                </div>
            </div>
        </div>
    );
}

function ActivityEventRow({ event, onCopy, onRetry }: { event: AnalyticsActivityEvent; onCopy: () => void; onRetry: () => void }) {
    const config = activityConfig(event.type);
    return (
        <div className="rounded-[18px] border border-slate-100 bg-white p-3 transition hover:bg-slate-50">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem]", config.className)}>{config.icon}</span>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-slate-950">{event.type} <span className="font-bold text-slate-500">to</span> {event.user}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{event.automation} · keyword +{event.keyword} · {event.timestamp}</p>
                        {event.errorReason && (
                            <p className="mt-2 rounded-[12px] bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                                {event.errorReason}. {event.suggestedFix}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <span className={cx("rounded-full px-2.5 py-1 text-xs font-black", event.status === "Failed" ? "bg-rose-50 text-rose-700" : event.status === "Captured" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>{event.status}</span>
                    {event.status === "Failed" && <SecondaryButton onClick={onRetry}><RefreshCw className="h-4 w-4" /> Retry</SecondaryButton>}
                    <IconButton title="Copy event" onClick={onCopy}><Copy className="h-4 w-4" /></IconButton>
                </div>
            </div>
        </div>
    );
}

function CompactInsight({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
        </div>
    );
}

function AudienceRow({ row }: { row: AudienceUserRow }) {
    return (
        <div className="flex flex-col gap-3 rounded-[18px] border border-slate-100 bg-white p-3 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <FallbackAvatar value={row.username} />
                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{row.username}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{row.name} · top keyword +{row.topKeyword}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center md:w-[360px]">
                <MiniMetric label="Comments" value={formatMetric(row.comments)} />
                <MiniMetric label="Leads" value={formatMetric(row.leads)} />
                <MiniMetric label="Last" value={row.lastComment} />
            </div>
        </div>
    );
}

function FallbackAvatar({ value }: { value: string }) {
    const initial = safeText(value, "D").replace("@", "").charAt(0).toUpperCase() || "D";
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5B4DFF] to-[#B83280] text-sm font-black text-white shadow-sm">
            {initial}
        </span>
    );
}

function AutomationAnalyticsDrawer({
    row,
    onClose,
    onEdit,
    onContacts,
    onExport,
}: {
    row: AnalyticsAutomationRow;
    onClose: () => void;
    onEdit: () => void;
    onContacts: () => void;
    onExport: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/35 backdrop-blur-sm">
            <button aria-label="Close analytics drawer" className="absolute inset-0 cursor-default" onClick={onClose} />
            <motion.aside
                initial={{ x: 420, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 420, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-0 h-full w-full max-w-[440px] overflow-y-auto bg-white p-5 shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Automation analytics</p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950">{row.name}</h2>
                    </div>
                    <IconButton title="Close" onClick={onClose}><X className="h-5 w-5" /></IconButton>
                </div>

                <div className="mt-5 rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                        <StatusBadge status={row.status} />
                        <span className="text-xs font-black text-slate-400">{row.lastActivity}</span>
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{row.description}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <CompactStat label="DMs sent" value={formatMetric(row.dms)} />
                    <CompactStat label="Clicks" value={formatMetric(row.clicks)} />
                    <CompactStat label="CTR" value={`${row.ctr}%`} />
                    <CompactStat label="Leads" value={formatMetric(row.leads)} />
                    <CompactStat label="Failed" value={formatMetric(row.failed)} />
                    <CompactStat label="Delivery" value={`${row.deliveryRate}%`} />
                </div>

                <div className="mt-4 space-y-3 rounded-[20px] border border-slate-100 p-4">
                    <AnalyticsDetailRow label="Trigger type" value={row.trigger} />
                    <AnalyticsDetailRow label="Selected content" value={row.selectedContent} />
                    <AnalyticsDetailRow label="Keywords" value={row.keywords.map((keyword) => `+${keyword}`).join(", ") || "Any keyword"} />
                    <AnalyticsDetailRow label="Last modified" value={row.modified} />
                </div>

                <div className="mt-4 rounded-[20px] border border-slate-100 p-4">
                    <h3 className="font-black text-slate-950">Mini timeline</h3>
                    <div className="mt-4 space-y-3">
                        <TimelineMini label="DM sent" value={formatMetric(row.dms)} tone="purple" />
                        <TimelineMini label="Link clicked" value={formatMetric(row.clicks)} tone="blue" />
                        <TimelineMini label="Lead captured" value={formatMetric(row.leads)} tone="green" />
                        <TimelineMini label="Failed DM" value={formatMetric(row.failed)} tone="red" />
                    </div>
                </div>

                <div className="mt-5 grid gap-2">
                    <PrimaryButton onClick={onEdit}><PenLine className="h-4 w-4" /> Edit automation</PrimaryButton>
                    <SecondaryButton onClick={onContacts}><Users className="h-4 w-4" /> View contacts from this automation</SecondaryButton>
                    <SecondaryButton onClick={onExport}><Download className="h-4 w-4" /> Export report</SecondaryButton>
                </div>
            </motion.aside>
        </div>
    );
}

function AnalyticsDetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
            <span className="max-w-[220px] text-right text-sm font-black text-slate-700">{safeText(value)}</span>
        </div>
    );
}

function TimelineMini({ label, value, tone }: { label: string; value: string; tone: "purple" | "blue" | "green" | "red" }) {
    const tones = {
        purple: "bg-[#5B4DFF]",
        blue: "bg-sky-500",
        green: "bg-emerald-500",
        red: "bg-rose-500",
    };
    return (
        <div className="flex items-center gap-3">
            <span className={cx("h-2.5 w-2.5 rounded-full", tones[tone])} />
            <span className="flex-1 text-sm font-bold text-slate-600">{label}</span>
            <span className="text-sm font-black text-slate-950">{value}</span>
        </div>
    );
}

function activityConfig(type: AnalyticsActivityEvent["type"]) {
    if (type === "Link clicked") return { icon: <MousePointerClick className="h-5 w-5" />, className: "bg-sky-50 text-sky-600" };
    if (type === "Lead captured") return { icon: <UserPlus className="h-5 w-5" />, className: "bg-emerald-50 text-emerald-600" };
    if (type === "Failed DM") return { icon: <AlertTriangle className="h-5 w-5" />, className: "bg-rose-50 text-rose-600" };
    return { icon: <Send className="h-5 w-5" />, className: "bg-[#EEF0FF] text-[#5B4DFF]" };
}

function buildAutomationAnalyticsRows(triggers: Trigger[], stats: Stats, leadsCollected: number, deliveryRate: number | null): AnalyticsAutomationRow[] {
    if (!triggers.length) return [];
    const triggerTypes = ["Post or Reel comment", "DM keyword", "Story reply", "Live comment"];
    return triggers.map((trigger, index) => {
        const dms = safeNumber(trigger.dmsSent);
        const clicks = 0;
        const leads = 0;
        const failed = 0;
        const ctr = dms > 0 ? Math.round((clicks / dms) * 100) : 0;
        const rowDelivery = dms > 0 ? Math.max(0, Math.round(((dms - failed) / dms) * 100)) : safeNumber(deliveryRate);
        const keyword = normalizeKeyword(trigger.keyword || "link");
        return {
            id: trigger.id,
            name: `Auto DM for "${keyword}"`,
            description: safeText(trigger.replyMessage, "Automated Instagram response."),
            trigger: trigger.triggerType || triggerTypes[index % triggerTypes.length],
            keywords: [keyword],
            dms,
            clicks,
            ctr,
            leads,
            deliveryRate: rowDelivery,
            failed,
            status: trigger.enabled ? "Live" : "Paused",
            modified: trigger.modifiedAt ? new Date(trigger.modifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown",
            selectedContent: "All posts & reels",
            lastActivity: trigger.modifiedAt ? new Date(trigger.modifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown",
        };
    }).sort((a, b) => b.dms - a.dms);
}

function buildAnalyticsActivityEvents(activity: LogEntry[], automations: AnalyticsAutomationRow[]): AnalyticsActivityEvent[] {
    if (!activity.length) return [];
    const rows: AnalyticsActivityEvent[] = [];
    activity.forEach((entry, index) => {
        const automation = automations.find((item) => item.keywords.includes(normalizeKeyword(entry.trigger))) || automations[index % Math.max(1, automations.length)];
        const automationName = automation?.name || (entry.trigger ? `Auto DM for "${entry.trigger}"` : "Unknown automation");
        const user = safeText(entry.user, "Unknown user");
        const keyword = normalizeKeyword(entry.keyword || entry.trigger || "link");
        if (entry.status === "sent") {
            rows.push({
                id: `${entry.id}-dm`,
                type: "DM sent",
                user,
                automation: automationName,
                keyword,
                status: "Delivered",
                timestamp: safeText(entry.time, "Unknown date"),
            });
        } else if (["lead_captured", "email_captured", "captured"].includes(entry.status)) {
            rows.push({
                id: `${entry.id}-lead`,
                type: "Lead captured",
                user,
                automation: automationName,
                keyword,
                status: "Captured",
                timestamp: safeText(entry.time, "Unknown date"),
            });
        } else {
            rows.push({
                id: `${entry.id}-failed`,
                type: "Failed DM",
                user,
                automation: automationName,
                keyword,
                status: "Failed",
                timestamp: safeText(entry.time, "Unknown date"),
                errorReason: "User may have closed DMs or the 24-hour window expired",
                suggestedFix: "Ask the user to follow or comment again.",
            });
        }
    });
    return rows;
}

function buildContentPerformanceRows(stats: Stats, leadsCollected: number): ContentPerformanceRow[] {
    if (!stats.totalDmsSent && !stats.totalPublicReplies && !leadsCollected) return [];
    const content = fallbackInstagramMedia.filter((media) => media.id !== "all");
    return content.map((media, index) => {
        const baseComments = Math.max(0, Math.round((safeNumber(stats.totalPublicReplies || stats.totalDmsSent) / Math.max(1, content.length)) * Math.max(0.5, 1.2 - index * 0.1)));
        const keywordComments = Math.max(0, Math.round(baseComments * Math.max(0.25, 0.62 - index * 0.04)));
        const dms = Math.max(0, Math.round(keywordComments * 0.88));
        const clicks = Math.max(0, Math.round(dms * Math.max(0.18, 0.34 - index * 0.025)));
        const leads = Math.max(0, Math.round(clicks * 0.45));
        return {
            id: media.id,
            title: media.title,
            type: media.type,
            caption: media.caption,
            metric: media.metric,
            comments: baseComments,
            keywordComments,
            triggerRate: baseComments > 0 ? Math.round((keywordComments / baseComments) * 100) : 0,
            dms,
            clicks,
            leads,
            color: media.color,
        };
    });
}

function buildAudienceRows(activity: LogEntry[], automations: AnalyticsAutomationRow[]): AudienceUserRow[] {
    if (!activity.length) return [];
    const map = new Map<string, AudienceUserRow>();
    activity.forEach((entry, index) => {
        const username = safeText(entry.user, "Unknown user");
        const existing = map.get(username);
        const keyword = normalizeKeyword(entry.keyword || "link");
        const automation = automations.find((row) => row.keywords.includes(normalizeKeyword(entry.trigger)))?.name || (entry.trigger ? `Auto DM for "${entry.trigger}"` : "Unknown automation");
        const name = username.replace("@", "").replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
        const isLead = ["lead_captured", "email_captured", "captured"].includes(entry.status);
        const isClick = ["link_clicked", "clicked"].includes(entry.status);
        if (existing) {
            existing.comments += 1;
            existing.leads += isLead ? 1 : 0;
            existing.clicked = existing.clicked || isClick;
        } else {
            map.set(username, {
                id: `${username}-${index}`,
                username,
                name,
                comments: 1,
                lastComment: safeText(entry.time, "Unknown date"),
                topKeyword: keyword,
                sourceAutomation: automation,
                leads: isLead ? 1 : 0,
                clicked: isClick,
            });
        }
    });
    return [...map.values()].sort((a, b) => b.comments - a.comments);
}

function buildAnalyticsTrendData(range: string, stats: Stats, leadsCollected: number) {
    const factor = analyticsRangeFactor(range);
    const baseDms = chartData.reduce((sum, item) => sum + item.dms, 0);
    const baseLeads = chartData.reduce((sum, item) => sum + item.leads, 0);
    const dmsScale = stats.totalDmsSent > 0 && baseDms > 0 ? stats.totalDmsSent / baseDms : 0;
    const leadScale = leadsCollected > 0 && baseLeads > 0 ? leadsCollected / baseLeads : 0;
    return chartData.map((item, index) => {
        const dms = Math.max(0, Math.round(item.dms * factor * dmsScale));
        const leads = Math.max(0, Math.round(item.leads * factor * leadScale));
        const clicks = Math.max(0, Math.round(dms * 0.32));
        const failed = Math.max(0, Math.round((safeNumber(stats.failedDms) / chartData.length) * Math.max(0.4, 1 - index * 0.08)));
        const followerStep = Math.max(1, Math.round(safeNumber(stats.followers) * 0.0015));
        return {
            day: item.day,
            dms,
            leads,
            clicks,
            failed,
            followers: Math.max(0, safeNumber(stats.followers) - (chartData.length - index - 1) * followerStep),
        };
    });
}

function analyticsRangeFactor(range: string) {
    if (range === "Today") return 0.22;
    if (range === "Yesterday") return 0.2;
    if (range === "Last 30 days") return 2.9;
    if (range === "This month") return 2.6;
    if (range === "All time") return 4.4;
    return 1;
}

function safeNumber(value: number | string | undefined | null) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function usagePercent(value: number, limit: number) {
    const safeLimit = safeNumber(limit);
    if (!safeLimit) return 0;
    return Math.min(100, Math.max(0, (safeNumber(value) / safeLimit) * 100));
}

function formatUsage(value: number, limit: number) {
    const safeLimit = safeNumber(limit);
    return `${formatMetric(safeNumber(value))} / ${safeLimit >= 999999 ? "Unlimited" : formatMetric(safeLimit)}`;
}

function formatPercent(value: number | null | undefined) {
    return typeof value === "number" && Number.isFinite(value) ? `${value}%` : "—";
}

function formatMetric(value: number) {
    const safe = safeNumber(value);
    if (safe >= 1000000) return `${(safe / 1000000).toFixed(safe >= 10000000 ? 0 : 1)}M`;
    if (safe >= 10000) return `${(safe / 1000).toFixed(safe >= 100000 ? 0 : 1)}K`;
    return safe.toLocaleString();
}

function buildAutomationPerformanceCsv(rows: AnalyticsAutomationRow[]) {
    const headers = ["Automation name", "Trigger", "Keywords", "DMs sent", "Clicks", "CTR", "Leads", "Failed", "Delivery rate", "Status"];
    const body = rows.map((row) => [
        row.name,
        row.trigger,
        row.keywords.map((keyword) => `+${keyword}`).join(" "),
        String(row.dms),
        String(row.clicks),
        `${row.ctr}%`,
        String(row.leads),
        String(row.failed),
        `${row.deliveryRate}%`,
        row.status,
    ].map(csvEscape).join(","));
    return [headers.join(","), ...body].join("\n");
}

function buildActivityCsv(rows: AnalyticsActivityEvent[]) {
    const headers = ["Event type", "User", "Automation", "Keyword", "Status", "Error reason", "Timestamp"];
    const body = rows.map((row) => [
        row.type,
        row.user,
        row.automation,
        row.keyword,
        row.status,
        row.errorReason || "",
        row.timestamp,
    ].map(csvEscape).join(","));
    return [headers.join(","), ...body].join("\n");
}

function downloadCsv(fileName: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

type ReferralDashboardTab = "Overview" | "Referred Users" | "Commissions" | "Payouts" | "FAQ";
type ReferralUserStatus = "Joined" | "Trial Started" | "Trial Active" | "Trial Ended" | "Converted" | "Paying" | "Churned" | "Refunded";
type CommissionStatus = "Pending" | "Verified" | "Withdrawable" | "Paid" | "Reversed" | "Waiting for payment";
type PayoutStatus = "Requested" | "Processing" | "Paid" | "Failed" | "Rejected";
type PayoutMethodType = "UPI" | "Bank Transfer";

type ReferredUserRecord = {
    id: number;
    name: string;
    email: string;
    signupDate: string;
    trialStatus: "Not Started" | "Trial Started" | "Trial Active" | "Trial Ended";
    subscriptionStatus: "Free" | "Converted" | "Paying" | "Churned" | "Refunded";
    plan: "Free" | "Trial" | "Starter" | "Pro";
    firstPaymentDate: string;
    totalRevenue: number;
    commission: number;
    commissionStatus: CommissionStatus;
    lastActivity: string;
    status: ReferralUserStatus;
};

type CommissionRecord = {
    id: string;
    date: string;
    referredUser: string;
    subscriptionPlan: string;
    paymentAmount: number;
    commissionRate: number;
    commissionAmount: number;
    status: CommissionStatus;
    availableOn: string;
    paymentId: string;
};

type PayoutRecord = {
    id: string;
    requestedDate: string;
    amount: number;
    payoutMethod: string;
    status: PayoutStatus;
    processedDate: string;
    referenceId: string;
};

type PayoutMethodRecord = {
    type: PayoutMethodType;
    holderName: string;
    upiId?: string;
    bankName?: string;
    accountLast4?: string;
    ifsc?: string;
    status: "Pending verification" | "Verified";
};

type PayoutDraft = {
    type: PayoutMethodType;
    holderName: string;
    upiId: string;
    bankName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    ifsc: string;
};

const referralTabs: ReferralDashboardTab[] = ["Overview", "Referred Users", "Commissions", "Payouts", "FAQ"];
const referralFilters = ["All", "Joined", "Trial Active", "Converted", "Paying", "Churned", "Refunded"];
const minimumPayoutAmount = 500;

function ReferralPage({ preview = false }: { preview?: boolean }) {
    const { session } = useAuth();
    const referralCode = preview ? "PRINCE4686" : "USER_REFERRAL_CODE";
    const referralLink = `https://dmgennie.in/?ref=${referralCode}`;
    const [activeTab, setActiveTab] = useState<ReferralDashboardTab>("Overview");
    const [toast, setToast] = useState("");
    const [publicPreviewOpen, setPublicPreviewOpen] = useState(false);
    const [payoutMethodOpen, setPayoutMethodOpen] = useState(false);
    const [payoutRequestOpen, setPayoutRequestOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(0);
    const [userFilter, setUserFilter] = useState("All");
    const [userSearch, setUserSearch] = useState("");
    const [payoutMethod, setPayoutMethod] = useState<PayoutMethodRecord | null>(null);
    const [payoutDraft, setPayoutDraft] = useState<PayoutDraft>({
        type: "UPI",
        holderName: "",
        upiId: "",
        bankName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        ifsc: "",
    });
    const [payoutErrors, setPayoutErrors] = useState<Record<string, string>>({});

    const referredUsers: ReferredUserRecord[] = preview ? [
        {
            id: 1,
            name: "Prince Saini",
            email: "prince@example.com",
            signupDate: "May 12, 2026",
            trialStatus: "Trial Active",
            subscriptionStatus: "Free",
            plan: "Trial",
            firstPaymentDate: "Waiting",
            totalRevenue: 0,
            commission: 0,
            commissionStatus: "Waiting for payment",
            lastActivity: "Trial started today",
            status: "Trial Active",
        },
        {
            id: 2,
            name: "Creator Lab",
            email: "hello@creatorlab.in",
            signupDate: "May 4, 2026",
            trialStatus: "Trial Ended",
            subscriptionStatus: "Converted",
            plan: "Pro",
            firstPaymentDate: "May 18, 2026",
            totalRevenue: 2000,
            commission: 500,
            commissionStatus: "Pending",
            lastActivity: "First payment received",
            status: "Converted",
        },
        {
            id: 3,
            name: "Dream AI Studio",
            email: "growth@dreamai.co",
            signupDate: "Apr 21, 2026",
            trialStatus: "Trial Ended",
            subscriptionStatus: "Paying",
            plan: "Pro",
            firstPaymentDate: "May 1, 2026",
            totalRevenue: 3500,
            commission: 875,
            commissionStatus: "Withdrawable",
            lastActivity: "Renewal paid 2 days ago",
            status: "Paying",
        },
    ] : [];

    // TODO: listen to payment webhook after trial ends, create 25% commission after successful payment, and prevent duplicate commissions by paymentId.
    // TODO: reverse commission on refund/cancellation and mark commission withdrawable after the holding period.
    const commissions: CommissionRecord[] = preview ? [
        { id: "com_001", date: "May 18, 2026", referredUser: "Creator Lab", subscriptionPlan: "Pro", paymentAmount: 2000, commissionRate: 25, commissionAmount: 500, status: "Pending", availableOn: "May 25, 2026", paymentId: "pay_9F42A" },
        { id: "com_002", date: "May 1, 2026", referredUser: "Dream AI Studio", subscriptionPlan: "Pro", paymentAmount: 3500, commissionRate: 25, commissionAmount: 875, status: "Withdrawable", availableOn: "May 8, 2026", paymentId: "pay_7B19D" },
        { id: "com_003", date: "Apr 12, 2026", referredUser: "Nano Coach", subscriptionPlan: "Starter", paymentAmount: 1200, commissionRate: 25, commissionAmount: 300, status: "Paid", availableOn: "Apr 19, 2026", paymentId: "pay_4A81C" },
    ] : [];

    const payouts: PayoutRecord[] = preview ? [
        { id: "po_001", requestedDate: "Apr 22, 2026", amount: 300, payoutMethod: "UPI ••••@upi", status: "Paid", processedDate: "Apr 24, 2026", referenceId: "UTR-48291" },
    ] : [];

    const pendingCommission = sumCommission(commissions, "Pending");
    const verifiedCommission = sumCommission(commissions, "Verified") + sumCommission(commissions, "Withdrawable");
    const withdrawableBalance = sumCommission(commissions, "Withdrawable");
    const paidOutCommission = sumCommission(commissions, "Paid") + payouts.filter((row) => row.status === "Paid").reduce((sum, row) => sum + row.amount, 0);
    const payingReferrals = referredUsers.filter((user) => user.subscriptionStatus === "Paying" || user.subscriptionStatus === "Converted").length;

    const filteredUsers = referredUsers.filter((user) => {
        const matchesSearch = [user.name, user.email, user.plan, user.status].join(" ").toLowerCase().includes(userSearch.toLowerCase());
        const matchesFilter = userFilter === "All" || user.status === userFilter || user.subscriptionStatus === userFilter || user.trialStatus === userFilter;
        return matchesSearch && matchesFilter;
    });

    const showToast = useCallback((message: string) => {
        setToast(message);
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timeout = window.setTimeout(() => setToast(""), 2600);
        return () => window.clearTimeout(timeout);
    }, [toast]);

    useEffect(() => {
        const storedCode = localStorage.getItem("dmgennie_referral_code");
        if (storedCode) {
            showToast("Referral code detected");
        }
    }, [showToast]);

    const copyText = async (value: string, message: string) => {
        try {
            await navigator.clipboard.writeText(value);
            showToast(message);
        } catch {
            showToast("Something went wrong. Please try again.");
        }
    };

    const exportReferredUsers = () => {
        if (!filteredUsers.length) {
            showToast("No referral data available to export.");
            return;
        }
        const headers = ["Name", "Email", "Signup Date", "Trial Status", "Subscription Status", "Plan", "First Payment Date", "Total Revenue", "Your Commission", "Commission Status", "Last Activity"];
        const body = filteredUsers.map((user) => [
            user.name,
            user.email,
            user.signupDate,
            user.trialStatus,
            user.subscriptionStatus,
            user.plan,
            user.firstPaymentDate,
            formatCurrency(user.totalRevenue),
            formatCurrency(user.commission),
            user.commissionStatus,
            user.lastActivity,
        ].map(csvEscape).join(","));
        downloadCsv("dmgennie-referred-users.csv", [headers.join(","), ...body].join("\n"));
        showToast("Referral report exported.");
    };

    const exportCommissions = () => {
        if (!commissions.length) {
            showToast("No referral data available to export.");
            return;
        }
        const headers = ["Date", "Referred User", "Subscription Plan", "Payment Amount", "Commission Rate", "Commission Amount", "Status", "Available On", "Payment ID"];
        const body = commissions.map((row) => [
            row.date,
            row.referredUser,
            row.subscriptionPlan,
            formatCurrency(row.paymentAmount),
            `${row.commissionRate}%`,
            formatCurrency(row.commissionAmount),
            row.status,
            row.availableOn,
            row.paymentId,
        ].map(csvEscape).join(","));
        downloadCsv("dmgennie-commission-history.csv", [headers.join(","), ...body].join("\n"));
        showToast("Referral report exported.");
    };

    const exportPayouts = () => {
        if (!payouts.length) {
            showToast("No referral data available to export.");
            return;
        }
        const headers = ["Requested Date", "Amount", "Payout Method", "Status", "Processed Date", "Reference ID"];
        const body = payouts.map((row) => [
            row.requestedDate,
            formatCurrency(row.amount),
            row.payoutMethod,
            row.status,
            row.processedDate,
            row.referenceId,
        ].map(csvEscape).join(","));
        downloadCsv("dmgennie-payout-history.csv", [headers.join(","), ...body].join("\n"));
        showToast("Referral report exported.");
    };

    const shareOn = (channel: "whatsapp" | "x" | "linkedin" | "email") => {
        const text = `Try DMGennie for Instagram DM automation. Use my referral link: ${referralLink}`;
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(referralLink);

        if (channel === "whatsapp") window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
        if (channel === "x") window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank", "noopener,noreferrer");
        if (channel === "linkedin") window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, "_blank", "noopener,noreferrer");
        if (channel === "email") {
            window.location.href = `mailto:?subject=${encodeURIComponent("Try DMGennie")}&body=${encodedText}`;
            showToast("Invite email opened");
        }
    };

    const downloadQr = () => {
        const blocks = Array.from({ length: 49 }).map((_, index) => {
            const charCode = referralCode.charCodeAt(index % referralCode.length);
            return (charCode + index * 7) % 3 === 0;
        });
        const squares = blocks.map((filled, index) => {
            if (!filled) return "";
            const x = 24 + (index % 7) * 18;
            const y = 24 + Math.floor(index / 7) * 18;
            return `<rect x="${x}" y="${y}" width="14" height="14" rx="3" fill="#5B4DFF"/>`;
        }).join("");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" rx="28" fill="white"/><rect x="10" y="10" width="160" height="160" rx="24" fill="#F7F7FB" stroke="#E5E7EB"/>${squares}<text x="90" y="164" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#0F172A">DMGennie</text></svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "dmgennie-referral-qr.svg";
        link.click();
        URL.revokeObjectURL(url);
        showToast("QR code downloaded");
    };

    const validatePayout = () => {
        const errors: Record<string, string> = {};
        if (!payoutDraft.holderName.trim()) errors.holderName = "Account holder name is required.";
        if (payoutDraft.type === "UPI") {
            if (!/^[\w.-]+@[\w.-]+$/.test(payoutDraft.upiId.trim())) errors.upiId = "Enter a valid UPI ID.";
        } else {
            if (!payoutDraft.bankName.trim()) errors.bankName = "Bank name is required.";
            if (!/^\d{6,18}$/.test(payoutDraft.accountNumber.trim())) errors.accountNumber = "Enter a valid account number.";
            if (payoutDraft.accountNumber !== payoutDraft.confirmAccountNumber) errors.confirmAccountNumber = "Account numbers must match.";
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(payoutDraft.ifsc.trim().toUpperCase())) errors.ifsc = "Enter a valid IFSC code.";
        }
        setPayoutErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const savePayoutMethod = () => {
        if (!validatePayout()) return;
        // TODO: persist payout method through backend and never store sensitive bank data in frontend.
        setPayoutMethod({
            type: payoutDraft.type,
            holderName: payoutDraft.holderName.trim(),
            upiId: payoutDraft.type === "UPI" ? payoutDraft.upiId.trim() : undefined,
            bankName: payoutDraft.type === "Bank Transfer" ? payoutDraft.bankName.trim() : undefined,
            accountLast4: payoutDraft.type === "Bank Transfer" ? payoutDraft.accountNumber.slice(-4) : undefined,
            ifsc: payoutDraft.type === "Bank Transfer" ? payoutDraft.ifsc.trim().toUpperCase() : undefined,
            status: "Pending verification",
        });
        setPayoutMethodOpen(false);
        showToast("Payout method saved");
    };

    const requestPayout = () => {
        if (withdrawableBalance < minimumPayoutAmount) {
            showToast("Minimum ₹500 required");
            return;
        }
        if (!payoutMethod) {
            showToast("No payout method added");
            return;
        }
        // TODO: create payout request through backend and lock requested withdrawable balance.
        setPayoutRequestOpen(false);
        showToast("Payout request submitted");
    };

    const canRequestPayout = withdrawableBalance >= minimumPayoutAmount && Boolean(payoutMethod);

    return (
        <PageShell
            title="Refer & Earn"
            subtitle="Earn 25% commission when your referrals upgrade to a paid DMGennie plan."
            action={
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-9 items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 text-xs font-black text-emerald-700">25% recurring commission</span>
                    <SecondaryButton onClick={() => setPublicPreviewOpen(true)}><ExternalLink className="h-4 w-4" /> View public page</SecondaryButton>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <ReferralHeroCard
                        referralCode={referralCode}
                        referralLink={referralLink}
                        onCopyLink={() => copyText(referralLink, "Referral link copied")}
                        onCopyCode={() => copyText(referralCode, "Referral code copied")}
                        onShare={shareOn}
                        onDownloadQr={downloadQr}
                    />
                    <HowReferralWorks />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <ReferralMetricCard icon={<ClockIcon />} label="Pending" value={formatCurrency(pendingCommission)} helper="Commission under review" tone="gold" />
                    <ReferralMetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Verified" value={formatCurrency(verifiedCommission)} helper="Approved commission" tone="green" />
                    <ReferralMetricCard icon={<CreditCard className="h-4 w-4" />} label="Withdrawable" value={formatCurrency(withdrawableBalance)} helper="Available for payout" tone="green" />
                    <ReferralMetricCard icon={<Download className="h-4 w-4" />} label="Paid Out" value={formatCurrency(paidOutCommission)} helper="Total paid to you" tone="gray" />
                    <ReferralMetricCard icon={<Users className="h-4 w-4" />} label="Total Referrals" value={formatMetric(referredUsers.length)} helper="Joined via your link" tone="purple" />
                    <ReferralMetricCard icon={<UserPlus className="h-4 w-4" />} label="Paying Referrals" value={formatMetric(payingReferrals)} helper="Converted accounts" tone="purple" />
                </div>

                <div className="flex gap-2 overflow-x-auto rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
                    {referralTabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={cx(
                                "whitespace-nowrap rounded-[14px] px-4 py-2 text-sm font-black transition",
                                activeTab === tab ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "Overview" && (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)]">
                        <PayoutMethodPanel method={payoutMethod} onAdd={() => setPayoutMethodOpen(true)} />
                        <RequestPayoutPanel
                            withdrawableBalance={withdrawableBalance}
                            payoutMethod={payoutMethod}
                            canRequest={canRequestPayout}
                            onRequest={() => canRequestPayout ? setPayoutRequestOpen(true) : showToast(withdrawableBalance < minimumPayoutAmount ? "Minimum ₹500 required" : "No payout method added")}
                        />
                    </div>
                )}

                {activeTab === "Referred Users" && (
                    <Panel
                        title="Referred users"
                        action={<PrimaryButton compact onClick={exportReferredUsers}><Download className="h-4 w-4" /> Export CSV</PrimaryButton>}
                    >
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <SearchBox value={userSearch} onChange={setUserSearch} placeholder="Search referred users..." />
                            <div className="flex flex-wrap gap-2">
                                {referralFilters.map((filter) => (
                                    <button
                                        key={filter}
                                        type="button"
                                        onClick={() => setUserFilter(filter)}
                                        className={cx("rounded-full px-3 py-2 text-xs font-black transition", userFilter === filter ? "bg-[#5B4DFF] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ReferredUsersTable users={filteredUsers} onCopyLink={() => copyText(referralLink, "Referral link copied")} />
                    </Panel>
                )}

                {activeTab === "Commissions" && (
                    <Panel
                        title="Commission history"
                        action={<PrimaryButton compact onClick={exportCommissions}><Download className="h-4 w-4" /> Export CSV</PrimaryButton>}
                    >
                        <CommissionHistoryTable commissions={commissions} />
                    </Panel>
                )}

                {activeTab === "Payouts" && (
                    <Panel
                        title="Payout history"
                        action={<PrimaryButton compact onClick={exportPayouts}><Download className="h-4 w-4" /> Export CSV</PrimaryButton>}
                    >
                        <PayoutHistoryTable payouts={payouts} />
                    </Panel>
                )}

                {activeTab === "FAQ" && <ReferralFaq openIndex={faqOpen} onOpen={setFaqOpen} />}
            </div>

            {toast && <ReferralToast message={toast} />}

            {publicPreviewOpen && (
                <ModalShell onClose={() => setPublicPreviewOpen(false)}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-950">Referral page preview</h3>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">This is how your referral link will look to users. Public referral routing can open this URL once the public page is connected.</p>
                        </div>
                        <IconButton title="Close" onClick={() => setPublicPreviewOpen(false)}><X className="h-5 w-5" /></IconButton>
                    </div>
                    <div className="mt-5 rounded-[22px] border border-slate-200 bg-gradient-to-br from-indigo-50 to-rose-50 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#5B4DFF]">DMGennie referral</p>
                        <h4 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Automate Instagram DMs from comments</h4>
                        <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600">You were invited with referral code <span className="font-black text-slate-950">{referralCode}</span>. Start free, then upgrade when you are ready.</p>
                        <div className="mt-4 rounded-2xl bg-white p-3 text-sm font-black text-slate-700">{referralLink}</div>
                    </div>
                </ModalShell>
            )}

            {payoutMethodOpen && (
                <ModalShell onClose={() => setPayoutMethodOpen(false)}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-950">Add payout method</h3>
                            <p className="mt-2 text-sm font-semibold text-slate-500">Add UPI or bank details to withdraw verified earnings.</p>
                        </div>
                        <IconButton title="Close" onClick={() => setPayoutMethodOpen(false)}><X className="h-5 w-5" /></IconButton>
                    </div>
                    <div className="mt-5 grid gap-2 rounded-[18px] bg-slate-50 p-1 sm:grid-cols-2">
                        {(["UPI", "Bank Transfer"] as PayoutMethodType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setPayoutDraft((draft) => ({ ...draft, type }))}
                                className={cx("rounded-[15px] px-4 py-2.5 text-sm font-black transition", payoutDraft.type === type ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950")}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <div className="mt-5 grid gap-4">
                        <ReferralInput label="Account holder name" value={payoutDraft.holderName} error={payoutErrors.holderName} onChange={(value) => setPayoutDraft((draft) => ({ ...draft, holderName: value }))} />
                        {payoutDraft.type === "UPI" ? (
                            <ReferralInput label="UPI ID" value={payoutDraft.upiId} error={payoutErrors.upiId} onChange={(value) => setPayoutDraft((draft) => ({ ...draft, upiId: value }))} placeholder="name@upi" />
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <ReferralInput label="Bank name" value={payoutDraft.bankName} error={payoutErrors.bankName} onChange={(value) => setPayoutDraft((draft) => ({ ...draft, bankName: value }))} />
                                <ReferralInput label="IFSC code" value={payoutDraft.ifsc} error={payoutErrors.ifsc} onChange={(value) => setPayoutDraft((draft) => ({ ...draft, ifsc: value.toUpperCase() }))} />
                                <ReferralInput label="Account number" value={payoutDraft.accountNumber} error={payoutErrors.accountNumber} onChange={(value) => setPayoutDraft((draft) => ({ ...draft, accountNumber: value }))} />
                                <ReferralInput label="Confirm account number" value={payoutDraft.confirmAccountNumber} error={payoutErrors.confirmAccountNumber} onChange={(value) => setPayoutDraft((draft) => ({ ...draft, confirmAccountNumber: value }))} />
                            </div>
                        )}
                    </div>
                    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                        Payout details should be saved and verified by backend. Bank account numbers are masked after saving.
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <SecondaryButton onClick={() => setPayoutMethodOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton onClick={savePayoutMethod}>Save payout method</PrimaryButton>
                    </div>
                </ModalShell>
            )}

            {payoutRequestOpen && (
                <ModalShell onClose={() => setPayoutRequestOpen(false)}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-950">Request payout</h3>
                            <p className="mt-2 text-sm font-semibold text-slate-500">Confirm your withdrawal request. Manual UPI / bank transfer is processed within 5 business days.</p>
                        </div>
                        <IconButton title="Close" onClick={() => setPayoutRequestOpen(false)}><X className="h-5 w-5" /></IconButton>
                    </div>
                    <div className="mt-5 grid gap-3">
                        <ReferralReviewRow label="Available amount" value={formatCurrency(withdrawableBalance)} />
                        <ReferralReviewRow label="Requested amount" value={formatCurrency(withdrawableBalance)} />
                        <ReferralReviewRow label="Payout method" value={formatPayoutMethod(payoutMethod)} />
                        <ReferralReviewRow label="Processing time" value="Within 5 business days" />
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <SecondaryButton onClick={() => setPayoutRequestOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton onClick={requestPayout}>Request payout</PrimaryButton>
                    </div>
                </ModalShell>
            )}
        </PageShell>
    );
}

function ReferralHeroCard({
    referralCode,
    referralLink,
    onCopyLink,
    onCopyCode,
    onShare,
    onDownloadQr,
}: {
    referralCode: string;
    referralLink: string;
    onCopyLink: () => void;
    onCopyCode: () => void;
    onShare: (channel: "whatsapp" | "x" | "linkedin" | "email") => void;
    onDownloadQr: () => void;
}) {
    return (
        <section className="overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="bg-gradient-to-br from-slate-950 via-[#302047] to-[#6d2948] p-5 text-white sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/75">Partner program</span>
                        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Share DMGennie. Earn 25%.</h2>
                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/70">Invite creators to DMGennie and earn 25% commission when they upgrade after their trial.</p>
                    </div>
                    <div className="rounded-[20px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <FallbackAvatar value="@dmgennie.in" />
                            <div>
                                <p className="text-sm font-black">{session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Creator'}</p>
                                <p className="text-xs font-semibold text-white/60">Code: {referralCode}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-5 sm:p-6">
                <Label>Referral link</Label>
                <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <div className="min-w-0 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{referralLink}</div>
                    <PrimaryButton onClick={onCopyLink}><Copy className="h-4 w-4" /> Copy Link</PrimaryButton>
                    <SecondaryButton onClick={onCopyCode}><Hash className="h-4 w-4" /> Copy Code</SecondaryButton>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <ReferralShareButton onClick={() => onShare("whatsapp")} icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" />
                    <ReferralShareButton onClick={() => onShare("x")} icon={<ExternalLink className="h-4 w-4" />} label="X / Twitter" />
                    <ReferralShareButton onClick={() => onShare("linkedin")} icon={<ExternalLink className="h-4 w-4" />} label="LinkedIn" />
                    <ReferralShareButton onClick={() => onShare("email")} icon={<Mail className="h-4 w-4" />} label="Email" />
                    <ReferralShareButton onClick={onDownloadQr} icon={<Download className="h-4 w-4" />} label="QR Code" />
                </div>
            </div>
        </section>
    );
}

function HowReferralWorks() {
    const steps = [
        ["Share your referral link", "Copy and share your DMGennie referral link with creators."],
        ["Creator joins DMGennie", "Anyone who signs up using your link becomes your referral."],
        ["They finish trial and upgrade", "When they buy a paid subscription after trial, you earn 25% commission."],
        ["You get paid", "Verified earnings become withdrawable after the holding period."],
    ];
    return (
        <Panel title="How it works">
            <div className="space-y-3">
                {steps.map(([title, copy], index) => (
                    <div key={title} className="flex gap-3 rounded-[18px] border border-slate-100 bg-slate-50/70 p-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#5B4DFF] shadow-sm">{index + 1}</span>
                        <div>
                            <h3 className="text-sm font-black text-slate-950">{title}</h3>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{copy}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function ReferralMetricCard({ icon, label, value, helper, tone }: { icon: ReactNode; label: string; value: string; helper: string; tone: "purple" | "gold" | "green" | "gray" }) {
    const tones = {
        purple: "bg-indigo-50 text-[#5B4DFF]",
        gold: "bg-amber-50 text-amber-700",
        green: "bg-emerald-50 text-emerald-700",
        gray: "bg-slate-100 text-slate-600",
    };
    return (
        <div className="rounded-[18px] border border-white bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
            <span className={cx("flex h-9 w-9 items-center justify-center rounded-[14px]", tones[tone])}>{icon}</span>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

function PayoutMethodPanel({ method, onAdd }: { method: PayoutMethodRecord | null; onAdd: () => void }) {
    return (
        <Panel title="Payout Method" action={<SecondaryButton onClick={onAdd}>{method ? "Update method" : "Add Payout Method"}</SecondaryButton>}>
            {method ? (
                <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-black text-slate-950">{formatPayoutMethod(method)}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">Holder: {method.holderName}</p>
                            {method.ifsc && <p className="mt-1 text-xs font-semibold text-slate-500">IFSC: {method.ifsc}</p>}
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{method.status}</span>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<CreditCard className="h-6 w-6" />}
                    title="No payout method added yet."
                    copy="Add UPI or bank details to withdraw verified earnings."
                    action="Add Payout Method"
                    onAction={onAdd}
                />
            )}
        </Panel>
    );
}

function RequestPayoutPanel({
    withdrawableBalance,
    payoutMethod,
    canRequest,
    onRequest,
}: {
    withdrawableBalance: number;
    payoutMethod: PayoutMethodRecord | null;
    canRequest: boolean;
    onRequest: () => void;
}) {
    const helper = withdrawableBalance < minimumPayoutAmount ? "Minimum ₹500 required to request payout." : !payoutMethod ? "Add payout method to request payout." : "Manual UPI / bank transfer within 5 business days.";
    return (
        <Panel title="Request Payout">
            <div className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">Withdrawable balance</p>
                <p className="mt-2 text-4xl font-black text-slate-950">{formatCurrency(withdrawableBalance)}</p>
                <div className="mt-4 grid gap-2">
                    <ReferralReviewRow label="Minimum payout" value="₹500" />
                    <ReferralReviewRow label="Payout method" value={payoutMethod ? formatPayoutMethod(payoutMethod) : "Not added"} />
                    <ReferralReviewRow label="Estimated time" value="Within 5 business days" />
                </div>
                <button
                    type="button"
                    onClick={onRequest}
                    className={cx("mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-black transition", canRequest ? "bg-[#5B4DFF] text-white shadow-lg shadow-indigo-500/20 hover:bg-[#4738E8]" : "bg-slate-200 text-slate-500 hover:bg-slate-300")}
                >
                    <CreditCard className="h-4 w-4" />
                    Request Payout
                </button>
                <p className="mt-3 text-center text-xs font-semibold text-slate-500">{helper}</p>
            </div>
        </Panel>
    );
}

function ReferredUsersTable({ users, onCopyLink }: { users: ReferredUserRecord[]; onCopyLink: () => void }) {
    if (!users.length) {
        return <EmptyState icon={<Gift className="h-6 w-6" />} title="No referrals yet" copy="Share your referral link to start earning." action="Copy Referral Link" onAction={onCopyLink} />;
    }
    return (
        <>
            <div className="hidden overflow-x-auto rounded-[18px] border border-slate-100 md:block">
                <table className="min-w-[1040px] w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
                        <tr>
                            {["User", "Signup Date", "Trial Status", "Subscription", "Plan", "First Payment", "Revenue", "Commission", "Status", "Last Activity"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="transition hover:bg-slate-50/70">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <FallbackAvatar value={user.name} />
                                        <div>
                                            <p className="font-black text-slate-950">{user.name}</p>
                                            <p className="text-xs font-semibold text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-600">{user.signupDate}</td>
                                <td className="px-4 py-3"><ReferralStatusPill status={user.trialStatus} /></td>
                                <td className="px-4 py-3"><ReferralStatusPill status={user.subscriptionStatus} /></td>
                                <td className="px-4 py-3 font-black text-slate-700">{user.plan}</td>
                                <td className="px-4 py-3 font-semibold text-slate-600">{user.firstPaymentDate}</td>
                                <td className="px-4 py-3 font-black text-slate-950">{formatCurrency(user.totalRevenue)}</td>
                                <td className="px-4 py-3 font-black text-slate-950">{formatCurrency(user.commission)}</td>
                                <td className="px-4 py-3"><ReferralStatusPill status={user.commissionStatus} /></td>
                                <td className="px-4 py-3 font-semibold text-slate-500">{user.lastActivity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="grid gap-3 md:hidden">
                {users.map((user) => (
                    <div key={user.id} className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-4">
                        <div className="flex items-center gap-3">
                            <FallbackAvatar value={user.name} />
                            <div>
                                <p className="font-black text-slate-950">{user.name}</p>
                                <p className="text-xs font-semibold text-slate-500">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                            <span>Plan: <b className="text-slate-800">{user.plan}</b></span>
                            <span>Commission: <b className="text-slate-800">{formatCurrency(user.commission)}</b></span>
                            <span>Trial: <b className="text-slate-800">{user.trialStatus}</b></span>
                            <span>Status: <b className="text-slate-800">{user.subscriptionStatus}</b></span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

function CommissionHistoryTable({ commissions }: { commissions: CommissionRecord[] }) {
    if (!commissions.length) {
        return <EmptyState icon={<CreditCard className="h-6 w-6" />} title="No commission yet" copy="You will see commission here when your referrals upgrade after their trial." />;
    }
    return (
        <div className="overflow-x-auto rounded-[18px] border border-slate-100">
            <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                        {["Date", "Referred User", "Plan", "Payment Amount", "Rate", "Commission", "Status", "Available On", "Reference"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {commissions.map((row) => (
                        <tr key={row.id} className="transition hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.date}</td>
                            <td className="px-4 py-3 font-black text-slate-950">{row.referredUser}</td>
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.subscriptionPlan}</td>
                            <td className="px-4 py-3 font-black text-slate-950">{formatCurrency(row.paymentAmount)}</td>
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.commissionRate}%</td>
                            <td className="px-4 py-3 font-black text-slate-950">{formatCurrency(row.commissionAmount)}</td>
                            <td className="px-4 py-3"><ReferralStatusPill status={row.status} /></td>
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.availableOn}</td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{row.paymentId}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PayoutHistoryTable({ payouts }: { payouts: PayoutRecord[] }) {
    if (!payouts.length) {
        return <EmptyState icon={<Download className="h-6 w-6" />} title="No payouts yet" copy="Your payout history will appear here after your first withdrawal." />;
    }
    return (
        <div className="overflow-x-auto rounded-[18px] border border-slate-100">
            <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                        {["Requested Date", "Amount", "Payout Method", "Status", "Processed Date", "Reference ID"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {payouts.map((row) => (
                        <tr key={row.id} className="transition hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.requestedDate}</td>
                            <td className="px-4 py-3 font-black text-slate-950">{formatCurrency(row.amount)}</td>
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.payoutMethod}</td>
                            <td className="px-4 py-3"><ReferralStatusPill status={row.status} /></td>
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.processedDate}</td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{row.referenceId}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ReferralFaq({ openIndex, onOpen }: { openIndex: number; onOpen: (index: number) => void }) {
    const faqs = [
        ["How much can I earn?", "You earn 25% commission when your referred users upgrade to a paid DMGennie plan."],
        ["Do I earn during free trial?", "No. Commission is created only after your referral successfully pays for a subscription."],
        ["When does commission become available?", "Commission is first marked pending and becomes withdrawable after the verification or holding period."],
        ["What is the minimum payout?", "The minimum payout amount is ₹500."],
        ["How do I get paid?", "You can add a UPI or bank transfer payout method."],
        ["What happens if my referral cancels?", "If the subscription is refunded or canceled during the holding period, the commission may be reversed."],
        ["Is there a referral limit?", "No. You can refer unlimited users."],
        ["How do I track referrals?", "Your referred users, commissions, and payouts are visible on this dashboard."],
        ["Do I earn on renewals?", "Yes. You earn 25% on every successful subscription payment from your referred user."],
    ];
    return (
        <Panel title="Referral FAQ">
            <div className="space-y-2">
                {faqs.map(([question, answer], index) => (
                    <button
                        key={question}
                        type="button"
                        onClick={() => onOpen(openIndex === index ? -1 : index)}
                        className="w-full rounded-[18px] border border-slate-100 bg-slate-50/60 p-4 text-left transition hover:bg-slate-50"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-sm font-black text-slate-950">{question}</h3>
                            <ChevronDown className={cx("h-4 w-4 text-slate-400 transition", openIndex === index && "rotate-180")} />
                        </div>
                        {openIndex === index && <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{answer}</p>}
                    </button>
                ))}
            </div>
        </Panel>
    );
}

function ReferralShareButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-[#5B4DFF]">
            {icon}
            {label}
        </button>
    );
}

function ReferralInput({ label, value, onChange, error, placeholder }: { label: string; value: string; onChange: (value: string) => void; error?: string; placeholder?: string }) {
    return (
        <div>
            <Label>{label}</Label>
            <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={cx(inputCls, error && "border-rose-300 focus:border-rose-300 focus:ring-rose-500/10")} />
            {error && <p className="mt-1.5 text-xs font-bold text-rose-600">{error}</p>}
        </div>
    );
}

function ReferralReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-[14px] bg-white px-3 py-2.5 text-sm">
            <span className="font-bold text-slate-500">{label}</span>
            <span className="text-right font-black text-slate-950">{value}</span>
        </div>
    );
}

function ReferralStatusPill({ status }: { status: string }) {
    const normalized = status.toLowerCase();
    const tone = normalized.includes("paid") || normalized.includes("converted") || normalized.includes("verified") || normalized.includes("withdrawable") || normalized.includes("paying")
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
        : normalized.includes("pending") || normalized.includes("trial") || normalized.includes("requested") || normalized.includes("processing") || normalized.includes("waiting")
            ? "bg-amber-50 text-amber-700 ring-amber-100"
            : normalized.includes("refunded") || normalized.includes("reversed") || normalized.includes("failed") || normalized.includes("rejected") || normalized.includes("churned")
                ? "bg-rose-50 text-rose-700 ring-rose-100"
                : "bg-slate-100 text-slate-600 ring-slate-200";
    return <span className={cx("inline-flex h-7 items-center rounded-full px-2.5 text-xs font-black ring-1", tone)}>{status}</span>;
}

function ReferralToast({ message }: { message: string }) {
    return (
        <div className="fixed bottom-5 right-5 z-50 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            {message}
        </div>
    );
}

function ClockIcon() {
    return <Activity className="h-4 w-4" />;
}

function sumCommission(rows: CommissionRecord[], status: CommissionStatus) {
    return rows.filter((row) => row.status === status).reduce((sum, row) => sum + safeNumber(row.commissionAmount), 0);
}

function formatCurrency(value: number) {
    return `₹${safeNumber(value).toLocaleString()}`;
}

function formatPayoutMethod(method: PayoutMethodRecord | null) {
    if (!method) return "Not added";
    if (method.type === "UPI") return `UPI • ${method.upiId || "Pending"}`;
    return `${method.bankName || "Bank"} •••• ${method.accountLast4 || "----"}`;
}


function SettingsPage(props: {
    settings: SettingsData;
    settingsTab: SettingsTab;
    connected: boolean;
    syncing: boolean;
    saved: boolean;
    botEnabled: boolean;
    ownerEmail: string;
    ownerName: string;
    stats: Stats;
    usage: UsageData;
    onSettingsTab: (tab: SettingsTab) => void;
    onSettings: (settings: SettingsData) => void;
    onConnect: () => void;
    onDisconnect: () => void;
    onSync: () => void;
    onSave: () => void;
    onToggleBot: () => void;
    onPasswordUpdate: (password: string) => Promise<void>;
    onToast: (message: string) => void;
}) {
    const [profileDraft, setProfileDraft] = useState({
        fullName: props.ownerName || "Creator",
        email: props.ownerEmail || "No email available",
        phone: "",
    });
    const [profileSaved, setProfileSaved] = useState(profileDraft);
    const [editingProfile, setEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [notifications, setNotifications] = useState({
        automationFailures: true,
        leadCaptured: true,
        weeklySummary: true,
        productUpdates: false,
    });
    const [notificationsSaved, setNotificationsSaved] = useState(notifications);
    const [passwordDraft, setPasswordDraft] = useState({ current: "", next: "", confirm: "" });
    const [passwordError, setPasswordError] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteOtp, setDeleteOtp] = useState("");
    const [deleteOtpSent, setDeleteOtpSent] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        const nextProfile = {
            fullName: props.ownerName || "Creator",
            email: props.ownerEmail || "No email available",
            phone: profileDraft.phone,
        };
        setProfileDraft(nextProfile);
        setProfileSaved(nextProfile);
        // Keep local phone as frontend-only until a profile API supports it.
        // TODO: persist full name, phone, and notification preferences with backend settings APIs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.ownerEmail, props.ownerName]);

    const profileDirty = JSON.stringify(profileDraft) !== JSON.stringify(profileSaved);
    const notificationsDirty = JSON.stringify(notifications) !== JSON.stringify(notificationsSaved);
    const handle = props.settings.instagramHandle || (props.connected ? "@dmgennie.in" : "Instagram account");
    const cleanHandle = handle.replace("@", "");
    const dmsUsed = safeNumber(props.usage.dmsThisMonth);
    const contactsUsed = safeNumber(props.usage.contactsThisMonth);
    const dmsLimit = safeNumber(props.usage.dmLimit);
    const contactsLimit = safeNumber(props.usage.contactLimit);
    const dmsProgress = usagePercent(dmsUsed, dmsLimit);
    const contactsProgress = usagePercent(contactsUsed, contactsLimit);

    const menu: Array<{ key: SettingsTab; label: string; icon: ReactNode }> = [
        { key: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
        { key: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
        { key: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
        { key: "security", label: "Security", icon: <Lock className="h-4 w-4" /> },
        { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    ];

    const validatePhone = () => {
        if (!profileDraft.phone.trim()) {
            setPhoneError("");
            return true;
        }
        const valid = /^[+\d][\d\s()-]{7,18}$/.test(profileDraft.phone.trim());
        setPhoneError(valid ? "" : "Enter a valid phone number or leave it blank.");
        return valid;
    };

    const saveProfile = async () => {
        if (!validatePhone()) return;
        setSavingProfile(true);
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        setProfileSaved(profileDraft);
        setEditingProfile(false);
        setSavingProfile(false);
        props.onToast("Profile updated successfully.");
    };

    const saveNotifications = () => {
        setNotificationsSaved(notifications);
        props.onToast("Settings saved successfully.");
    };

    const savePassword = async () => {
        setPasswordError("");
        if (!passwordDraft.current.trim()) {
            setPasswordError("Current password is required.");
            return;
        }
        if (passwordDraft.next.length < 8) {
            setPasswordError("New password must be at least 8 characters.");
            return;
        }
        if (passwordDraft.next !== passwordDraft.confirm) {
            setPasswordError("Confirm password must match the new password.");
            return;
        }
        setSavingPassword(true);
        try {
            await props.onPasswordUpdate(passwordDraft.next);
            setPasswordDraft({ current: "", next: "", confirm: "" });
        } catch {
            setPasswordError("Unable to update password. Please try again.");
        } finally {
            setSavingPassword(false);
        }
    };

    const openPricing = () => {
        props.onToast("Opening pricing.");
        window.location.href = "/pricing";
    };

    const resetDeleteAccountFlow = () => {
        setDeleteOpen(false);
        setDeletePassword("");
        setDeleteOtp("");
        setDeleteOtpSent(false);
        setDeleteError("");
    };

    const sendDeleteOtp = () => {
        setDeleteError("");
        if (!deletePassword.trim()) {
            setDeleteError("Enter your account password before requesting the OTP.");
            return;
        }
        // TODO: request deletion OTP from backend and send it to the registered email.
        setDeleteOtpSent(true);
        props.onToast("OTP sent to registered email.");
    };

    const requestAccountDeletion = () => {
        setDeleteError("");
        if (!deletePassword.trim()) {
            setDeleteError("Password is required to delete your account.");
            return;
        }
        if (!/^\d{6}$/.test(deleteOtp.trim())) {
            setDeleteError("Enter the 6-digit OTP sent to your registered email.");
            return;
        }
        // TODO: verify password + OTP server-side and schedule account deletion with 7-day recovery.
        props.onToast("Account deletion scheduled. You can recover it within 7 days.");
        resetDeleteAccountFlow();
    };

    return (
        <PageShell title="Settings" subtitle="Manage your profile, Instagram connection, billing, and security.">
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                <Panel>
                    <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                        {menu.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => props.onSettingsTab(item.key)}
                                className={cx(
                                    "flex min-w-max items-center gap-3 rounded-[1rem] px-4 py-2.5 text-left text-sm font-black transition lg:w-full",
                                    props.settingsTab === item.key ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </Panel>
                <div className="space-y-4">
                    <Panel title={menu.find((item) => item.key === props.settingsTab)?.label || "Settings"} action={props.saved ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Saved</span> : undefined}>
                    {props.settingsTab === "profile" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-950">Personal Information</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">View and manage your basic account details.</p>
                                </div>
                                {!editingProfile && (
                                    <SecondaryButton onClick={() => setEditingProfile(true)}>
                                        <PenLine className="h-4 w-4" /> Edit
                                    </SecondaryButton>
                                )}
                            </div>

                            {!editingProfile ? (
                                <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50/70 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-[#5B4DFF] to-[#D9468B] text-lg font-black text-white">
                                            {(profileSaved.fullName || "Creator").charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-lg font-black text-slate-950">{profileSaved.fullName || "Creator"}</h3>
                                            <p className="mt-1 truncate text-sm font-semibold text-slate-500">{profileSaved.email || "No email available"}</p>
                                        </div>
                                        <span className="inline-flex h-7 w-fit items-center rounded-full bg-emerald-50 px-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Active account</span>
                                    </div>
                                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                                        <SettingsInfoTile label="Full name" value={profileSaved.fullName || "Creator"} />
                                        <SettingsInfoTile label="Email" value={profileSaved.email || "No email available"} />
                                        <SettingsInfoTile label="Phone" value={profileSaved.phone || "Not added"} />
                                    </div>
                                    <p className="mt-4 text-xs font-semibold text-slate-500">Email changes are handled by support for account safety.</p>
                                </div>
                            ) : (
                                <div className="rounded-[1.25rem] border border-slate-100 bg-white p-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Full Name" value={profileDraft.fullName} onChange={(value) => setProfileDraft({ ...profileDraft, fullName: value })} />
                                        <Field label="Email address" value={profileDraft.email} onChange={() => {}} readOnly helper="To change your email, please contact support." />
                                        <Field label="Phone number" value={profileDraft.phone} onChange={(value) => { setProfileDraft({ ...profileDraft, phone: value }); setPhoneError(""); }} placeholder="Not added" error={phoneError} helper="Optional. Used only for account support." />
                                    </div>
                                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs font-semibold text-slate-500">{profileDirty ? "You have unsaved personal information changes." : "No changes yet."}</p>
                                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                            <SecondaryButton onClick={() => { setProfileDraft(profileSaved); setPhoneError(""); setEditingProfile(false); }}>Cancel</SecondaryButton>
                                            <PrimaryButton onClick={saveProfile} disabled={savingProfile || !profileDirty}>
                                                {savingProfile ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {props.settingsTab === "instagram" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-950">Instagram Connections</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">Manage your connected Instagram account for DM automation.</p>
                                </div>
                            </div>
                            {props.connected ? (
                                <div className="rounded-[1.35rem] border border-slate-100 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex min-w-0 items-center gap-4">
                                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-[#5B4DFF] to-[#D9468B] text-lg font-black text-white shadow-sm">
                                                {cleanHandle.charAt(0).toUpperCase() || "D"}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate font-black text-slate-950">{handle}</h3>
                                                    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-emerald-50 px-2 text-[11px] font-black text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected</span>
                                                    <span className="inline-flex h-6 items-center rounded-full bg-indigo-50 px-2 text-[11px] font-black text-[#5B4DFF]">Meta API Active</span>
                                                </div>
                                                <p className="mt-1 text-sm font-semibold text-slate-500">{typeof props.stats.followers === "number" ? `${formatMetric(props.stats.followers)} followers` : "Followers unavailable"} · Refresh to sync latest data</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-400">Connected through secure Meta OAuth. No Instagram password stored.</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <SecondaryButton onClick={props.onSync}><RefreshCw className={cx("h-4 w-4", props.syncing && "animate-spin")} /> Refresh</SecondaryButton>
                                            <DangerButton onClick={props.onDisconnect}><Trash2 className="h-4 w-4" /> Disconnect</DangerButton>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<Instagram className="h-6 w-6" />}
                                    title="No Instagram account connected"
                                    copy="Connect your Instagram business account to start automating DMs."
                                    action="Connect Instagram"
                                    onAction={props.onConnect}
                                />
                            )}
                            <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50/70 p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white text-[#5B4DFF] ring-1 ring-slate-100">
                                            <Plus className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-black text-slate-950">Add new Instagram</h3>
                                            <p className="mt-1 text-sm font-semibold text-slate-500">Connect another business profile through Meta OAuth.</p>
                                        </div>
                                    </div>
                                    <PrimaryButton compact onClick={props.onConnect}><Instagram className="h-4 w-4" /> Connect New</PrimaryButton>
                                </div>
                            </div>
                        </div>
                    )}
                    {props.settingsTab === "billing" && (
                        <div className="space-y-4">
                            <div className="rounded-[1.35rem] border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700">Starter</span>
                                        <h3 className="mt-3 text-xl font-black text-slate-950">Plan & Usage</h3>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">Your current plan, limits, and billing actions in one place.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <PrimaryButton compact onClick={openPricing}><Crown className="h-4 w-4" /> Upgrade Plan</PrimaryButton>
                                        <SecondaryButton onClick={() => props.onToast("Billing portal opened.")}>Manage Billing</SecondaryButton>
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-3 md:grid-cols-3">
                                    <UsageMiniCard title="Monthly DMs" value={formatUsage(dmsUsed, dmsLimit)} progress={dmsProgress} />
                                    <UsageMiniCard title="Contacts" value={formatUsage(contactsUsed, contactsLimit)} progress={contactsProgress} />
                                    <UsageMiniCard title="IG Accounts" value={`${props.connected ? 1 : 0} / 3`} progress={props.connected ? 34 : 1} />
                                </div>
                                <div className="mt-5 rounded-[1rem] border border-emerald-100 bg-emerald-50/60 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-black text-slate-950">Subscription status</h3>
                                            <p className="mt-1 text-sm font-semibold text-slate-500">Trial active · No active paid subscription yet.</p>
                                        </div>
                                        <button type="button" onClick={openPricing} className="inline-flex h-10 items-center justify-center rounded-[0.9rem] bg-white px-4 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:-translate-y-0.5">
                                            Activate Subscription
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 p-5 text-center">
                                <h3 className="font-black text-slate-950">No invoices found yet.</h3>
                                <p className="mt-1 text-sm font-semibold text-slate-500">Invoices will appear here after your first paid subscription payment.</p>
                            </div>
                        </div>
                    )}
                    {props.settingsTab === "security" && (
                        <div className="space-y-5">
                            <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50/60 p-5">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
                                    <div>
                                        <h3 className="font-black text-slate-950">Secure OAuth Authentication</h3>
                                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">DMGennie uses official Meta OAuth for Instagram and never stores Instagram passwords.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[1.25rem] border border-slate-100 bg-white p-4">
                                <h3 className="font-black text-slate-950">Password</h3>
                                <p className="mt-1 text-sm font-semibold text-slate-500">Update your DMGennie account password for email login.</p>
                                <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <Field label="Current password" type="password" value={passwordDraft.current} onChange={(value) => setPasswordDraft({ ...passwordDraft, current: value })} />
                                    <Field label="New password" type="password" value={passwordDraft.next} onChange={(value) => setPasswordDraft({ ...passwordDraft, next: value })} />
                                    <Field label="Confirm password" type="password" value={passwordDraft.confirm} onChange={(value) => setPasswordDraft({ ...passwordDraft, confirm: value })} error={passwordError} />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <PrimaryButton onClick={savePassword} disabled={savingPassword}>
                                        {savingPassword ? <><RefreshCw className="h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
                                    </PrimaryButton>
                                </div>
                            </div>
                            <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50/50 p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="font-black text-rose-700">Danger Zone</h3>
                                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Delete your DMGennie account after password and email OTP verification. Recovery is available for 7 days.</p>
                                    </div>
                                    <DangerButton onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /> Delete DMGennie Account</DangerButton>
                                </div>
                            </div>
                        </div>
                    )}
                    {props.settingsTab === "notifications" && (
                        <div className="space-y-4">
                            <ToggleRow title="Automation Enabled" copy="Globally enable or disable automated DMs." active={props.botEnabled} onClick={props.onToggleBot} />
                            <ToggleRow title="Email me when automation fails" copy="Get notified when a message cannot be delivered." active={notifications.automationFailures} onClick={() => setNotifications({ ...notifications, automationFailures: !notifications.automationFailures })} />
                            <ToggleRow title="Email me when a lead is captured" copy="Know when a contact shares their email or details." active={notifications.leadCaptured} onClick={() => setNotifications({ ...notifications, leadCaptured: !notifications.leadCaptured })} />
                            <ToggleRow title="Email me weekly analytics summary" copy="Receive a digest of messages, clicks, and leads." active={notifications.weeklySummary} onClick={() => setNotifications({ ...notifications, weeklySummary: !notifications.weeklySummary })} />
                            <ToggleRow title="Product updates" copy="Occasional updates about new DMGennie features." active={notifications.productUpdates} onClick={() => setNotifications({ ...notifications, productUpdates: !notifications.productUpdates })} />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs font-semibold text-slate-500">{notificationsDirty ? "You have unsaved notification changes." : "Notification preferences are up to date."}</p>
                                <PrimaryButton onClick={saveNotifications} disabled={!notificationsDirty}>Save Notifications</PrimaryButton>
                            </div>
                        </div>
                    )}
                </Panel>
                </div>
            </div>
            {deleteOpen && (
                <ModalShell onClose={resetDeleteAccountFlow}>
                    <div>
                        <div className="text-center">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                            <AlertTriangle className="h-6 w-6" />
                            </span>
                            <h2 className="mt-5 text-2xl font-black text-slate-950">Delete DMGennie Account?</h2>
                            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-500">
                                We will send an OTP to <span className="font-black text-slate-700">{profileSaved.email || "your registered email"}</span>. Once confirmed, your account is scheduled for deletion and can be recovered within 7 days.
                            </p>
                        </div>
                        <div className="mx-auto mt-6 max-w-md space-y-4">
                            <Field label="Account password" type="password" value={deletePassword} onChange={(value) => { setDeletePassword(value); setDeleteError(""); }} helper="Required before we send the deletion OTP." />
                            <div className="rounded-[1rem] border border-slate-100 bg-slate-50 p-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-black text-slate-950">Email OTP</p>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">{deleteOtpSent ? "OTP sent to registered email." : "Request an OTP to continue deletion."}</p>
                                    </div>
                                    <SecondaryButton onClick={sendDeleteOtp}>
                                        <Mail className="h-4 w-4" /> {deleteOtpSent ? "Resend OTP" : "Send OTP"}
                                    </SecondaryButton>
                                </div>
                            </div>
                            <Field label="6-digit OTP" value={deleteOtp} onChange={(value) => { setDeleteOtp(value.replace(/\D/g, "").slice(0, 6)); setDeleteError(""); }} placeholder="123456" helper="Enter the OTP sent to your registered email." />
                            {deleteError && <p className="rounded-[1rem] border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{deleteError}</p>}
                            <div className="rounded-[1rem] border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                                Account deletion is scheduled, not instant. You can recover your DMGennie account within 7 days by contacting support before permanent removal.
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
                            <SecondaryButton onClick={resetDeleteAccountFlow}>Cancel</SecondaryButton>
                            <button
                                type="button"
                                disabled={!deletePassword.trim() || !deleteOtpSent || deleteOtp.length !== 6}
                                onClick={requestAccountDeletion}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-[0.95rem] bg-rose-600 px-5 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" /> Delete account
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}
        </PageShell>
    );
}

function HelpPage({ query, openFaq, onQuery, onOpenFaq }: { query: string; openFaq: number; onQuery: (value: string) => void; onOpenFaq: (index: number) => void }) {
    const faqs = [
        ["How do I connect Instagram?", "Go to Settings, choose Instagram, and connect your professional Instagram account through Meta OAuth."],
        ["Can I send links automatically?", "Yes. Create an automation with a comment keyword and add the link in your automated DM."],
        ["Do you store Instagram passwords?", "No. DMGennie uses OAuth and official Meta APIs, so your password is never stored."],
        ["Why did a DM fail?", "Some users have closed DMs. Use a fallback public reply to ask them to open DMs or follow first."],
    ].filter((faq) => faq.join(" ").toLowerCase().includes(query.toLowerCase()));

    return (
        <PageShell title="Help" subtitle="Find answers, setup guidance, and support options.">
            <Panel>
                <SearchBox value={query} onChange={onQuery} placeholder="Search help articles..." />
            </Panel>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
                <Panel title="Frequently asked questions">
                    <div className="space-y-3">
                        {faqs.map(([question, answer], index) => (
                            <button key={question} onClick={() => onOpenFaq(openFaq === index ? -1 : index)} className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:bg-slate-50">
                                <span className="flex items-center justify-between gap-3">
                                    <span className="font-black text-slate-950">{question}</span>
                                    <ChevronDown className={cx("h-4 w-4 text-slate-400 transition", openFaq === index && "rotate-180")} />
                                </span>
                                {openFaq === index && <span className="mt-3 block text-sm font-medium leading-6 text-slate-500">{answer}</span>}
                            </button>
                        ))}
                    </div>
                </Panel>
                <Panel title="Still need help?">
                    <div className="rounded-3xl bg-indigo-50 p-5 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600"><LifeBuoy className="h-6 w-6" /></span>
                        <h3 className="mt-4 font-black">Talk to support</h3>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Get help setting up automations or connecting Instagram.</p>
                        <div className="mt-5 grid gap-2">
                            <a href="mailto:support@dmgennie.in" className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
                                <Mail className="h-4 w-4" /> support@dmgennie.in
                            </a>
                            <a href="https://wa.me/?text=Hi%20DMGennie%20support%2C%20I%20need%20help%20with%20my%20dashboard." target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[#5B4DFF] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-[#4738E8]">
                                <MessageCircle className="h-4 w-4" /> WhatsApp support
                            </a>
                        </div>
                    </div>
                </Panel>
            </div>
        </PageShell>
    );
}

function PageShell({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
    return (
        <div className="space-y-4">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-black tracking-tight text-slate-950 sm:text-[32px]">{title}</h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
                </div>
                {action}
            </header>
            {children}
        </div>
    );
}

function Panel({ title, action, children }: { title?: string; action?: ReactNode; children?: ReactNode }) {
    return (
        <section className="rounded-[18px] border border-white bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-5">
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between gap-4">
                    {title && <h2 className="text-lg font-black text-slate-950">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

function PrimaryButton({ children, onClick, compact, disabled }: { children: ReactNode; onClick?: () => void; compact?: boolean; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cx(
                "inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[#5B4DFF] text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-[#4738E8] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0",
                compact ? "px-3.5 py-2" : "px-4 py-2.5"
            )}
        >
            {children}
        </button>
    );
}

function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
    return <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">{children}</button>;
}

function DangerButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
    return <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50">{children}</button>;
}

function SearchBox({ value, onChange, placeholder, compact = false }: { value: string; onChange: (value: string) => void; placeholder: string; compact?: boolean }) {
    return (
        <label className={cx("relative block", compact && "min-w-[220px]")}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-[1rem] border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10" />
        </label>
    );
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-[1rem] border border-slate-200 bg-white px-4 py-2.5 text-sm font-black capitalize text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10">
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    );
}

function StatusPill({ icon, label, tone, title }: { icon: ReactNode; label: string; tone: "green" | "red" | "indigo"; title?: string }) {
    const tones = {
        green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        red: "bg-rose-50 text-rose-700 ring-rose-100",
        indigo: "bg-indigo-50 text-[#5B4DFF] ring-indigo-100",
    };
    return <span title={title} className={cx("inline-flex h-7 items-center gap-2 rounded-full px-3 text-xs font-black ring-1", title && "cursor-help", tones[tone])}>{icon}{label}</span>;
}

function StatusBadge({ status }: { status: "Live" | "Paused" | "Draft" }) {
    const classes = status === "Live" ? "bg-emerald-50 text-emerald-700" : status === "Paused" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
    return <span className={cx("inline-flex h-7 items-center rounded-full px-2.5 text-xs font-black", classes)}>{status}</span>;
}

function IconButton({ children, onClick, danger, title }: { children: ReactNode; onClick?: () => void; danger?: boolean; title?: string }) {
    return <button type="button" title={title} aria-label={title || "Action"} onClick={onClick} className={cx("flex h-9 w-9 items-center justify-center rounded-xl transition", danger ? "text-rose-500 hover:bg-rose-50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950")}>{children}</button>;
}

function EmptyState({ icon, title, copy, action, onAction }: { icon: ReactNode; title: string; copy: string; action?: string; onAction?: () => void }) {
    return (
        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white text-indigo-600 shadow-sm">{icon}</span>
            <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{copy}</p>
            {action && <button type="button" onClick={onAction} className="mt-5 rounded-[1rem] bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-indigo-700">{action}</button>}
        </div>
    );
}

function Label({ children }: { children: ReactNode }) {
    return <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.08em] text-slate-500">{children}</label>;
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    helper,
    error,
    readOnly,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    helper?: string;
    error?: string;
    readOnly?: boolean;
}) {
    return (
        <div>
            <Label>{label}</Label>
            <input
                type={type}
                className={cx(inputCls, readOnly && "cursor-not-allowed bg-slate-50 text-slate-500")}
                value={value}
                placeholder={placeholder}
                readOnly={readOnly}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={Boolean(error)}
            />
            {error ? <p className="mt-1.5 text-xs font-bold text-rose-600">{error}</p> : helper ? <p className="mt-1.5 text-xs font-semibold text-slate-500">{helper}</p> : null}
        </div>
    );
}

function SettingsInfoTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[1rem] border border-white bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
        </div>
    );
}

function UsageMiniCard({ title, value, progress }: { title: string; value: string; progress: number }) {
    return (
        <div className="rounded-[1.15rem] border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{title}</p>
                <span className="text-sm font-black text-slate-950">{value}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#5B4DFF]" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
        </div>
    );
}

function ToggleRow({ title, copy, active, onClick }: { title: string; copy: string; active: boolean; onClick: () => void }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <div>
                <h3 className="font-black">{title}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{copy}</p>
            </div>
            <button type="button" aria-label={`Toggle ${title}`} onClick={onClick} className={cx("relative h-7 w-12 rounded-full transition", active ? "bg-indigo-600" : "bg-slate-300")}>
                <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition", active ? "left-6" : "left-1")} />
            </button>
        </div>
    );
}

function BillingCard() {
    return (
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="font-black">Pro plan</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">₹399/account/month, billed annually.</p>
                </div>
                <PrimaryButton>Manage Billing</PrimaryButton>
            </div>
        </div>
    );
}

function SecurityCard() {
    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    <div>
                        <h3 className="font-black">Secure OAuth Authentication</h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">DMGennie never stores Instagram passwords.</p>
                    </div>
                </div>
            </div>
            <SecondaryButton>Review login sessions</SecondaryButton>
        </div>
    );
}

function InsightCard({ title, value, copy }: { title: string; value: string; copy: string }) {
    return (
        <div className="rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{title}</p>
            <h3 className="mt-3 text-2xl font-black text-slate-950">{value}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">{copy}</p>
        </div>
    );
}
