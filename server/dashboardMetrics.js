const SUCCESS_STATUSES = ['sent', 'success', 'delivered'];
const FAILED_STATUSES = ['failed', 'error', 'failed_dm', 'failed_dms_closed', 'delivery_failed'];
const LEAD_STATUSES = ['lead_captured', 'email_captured', 'captured'];

const PLAN_LIMITS = {
    starter: { planName: 'Starter', dmLimit: 1000, contactLimit: 1000 },
    pro: { planName: 'Pro', dmLimit: 20000, contactLimit: 20000 },
    admin: { planName: 'Admin', dmLimit: 999999, contactLimit: 999999 },
};

function normalizePlan(value) {
    const key = String(value || 'Starter').trim().toLowerCase();
    return PLAN_LIMITS[key] ? key : 'starter';
}

function normalizeStatus(value) {
    return String(value || '').trim().toLowerCase();
}

function isMissingTable(error) {
    return ['42P01', 'PGRST116', 'PGRST200', 'PGRST204', 'PGRST205'].includes(error?.code);
}

function safeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function relativeTime(value) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return 'Just now';
    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} min ago`;
    if (diff < day) return `${Math.floor(diff / hour)} hr ago`;
    if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeZoneOffsetMs(timeZone, date) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).formatToParts(date);
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        const asUtc = Date.UTC(
            Number(values.year),
            Number(values.month) - 1,
            Number(values.day),
            Number(values.hour === '24' ? '0' : values.hour),
            Number(values.minute),
            Number(values.second)
        );
        return asUtc - date.getTime();
    } catch {
        return 0;
    }
}

function zonedBoundary(timeZone, unit) {
    const now = new Date();
    try {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(now);
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        const year = Number(values.year);
        const month = Number(values.month) - 1;
        const day = unit === 'month' ? 1 : Number(values.day);
        const utcGuess = new Date(Date.UTC(year, month, day, 0, 0, 0));
        return new Date(utcGuess.getTime() - timeZoneOffsetMs(timeZone, utcGuess));
    } catch {
        const fallback = new Date();
        if (unit === 'month') fallback.setDate(1);
        fallback.setHours(0, 0, 0, 0);
        return fallback;
    }
}

async function countRows(supabase, table, userId, { statuses, since } = {}) {
    let query = supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (statuses?.length) query = query.in('status', statuses);
    if (since) query = query.gte('created_at', since);

    const { count, error } = await query;
    if (error) return { available: !isMissingTable(error), count: 0, error };
    return { available: true, count: count || 0, error: null };
}

async function firstAvailableCount(supabase, tables, userId, options) {
    for (const table of tables) {
        const result = await countRows(supabase, table, userId, options);
        if (result.available) return result.count;
    }
    return null;
}

async function getActivityCounts(supabase, userId, startTodayIso, startMonthIso) {
    const [
        successAll,
        successToday,
        successMonth,
        failedAll,
        failedToday,
        failedMonth,
        leadAll,
        leadMonth,
    ] = await Promise.all([
        countRows(supabase, 'activity_log', userId, { statuses: SUCCESS_STATUSES }),
        countRows(supabase, 'activity_log', userId, { statuses: SUCCESS_STATUSES, since: startTodayIso }),
        countRows(supabase, 'activity_log', userId, { statuses: SUCCESS_STATUSES, since: startMonthIso }),
        countRows(supabase, 'activity_log', userId, { statuses: FAILED_STATUSES }),
        countRows(supabase, 'activity_log', userId, { statuses: FAILED_STATUSES, since: startTodayIso }),
        countRows(supabase, 'activity_log', userId, { statuses: FAILED_STATUSES, since: startMonthIso }),
        countRows(supabase, 'activity_log', userId, { statuses: LEAD_STATUSES }),
        countRows(supabase, 'activity_log', userId, { statuses: LEAD_STATUSES, since: startMonthIso }),
    ]);

    return {
        successAll: successAll.count,
        successToday: successToday.count,
        successMonth: successMonth.count,
        failedAll: failedAll.count,
        failedToday: failedToday.count,
        failedMonth: failedMonth.count,
        leadAll: leadAll.count,
        leadMonth: leadMonth.count,
    };
}

async function getMessageCounts(supabase, userId, startTodayIso, startMonthIso) {
    const tables = ['messages', 'message_logs', 'dm_messages'];
    const successAll = await firstAvailableCount(supabase, tables, userId, { statuses: SUCCESS_STATUSES });
    if (successAll === null) return null;

    const [successToday, successMonth, failedAll, failedMonth] = await Promise.all([
        firstAvailableCount(supabase, tables, userId, { statuses: SUCCESS_STATUSES, since: startTodayIso }),
        firstAvailableCount(supabase, tables, userId, { statuses: SUCCESS_STATUSES, since: startMonthIso }),
        firstAvailableCount(supabase, tables, userId, { statuses: FAILED_STATUSES }),
        firstAvailableCount(supabase, tables, userId, { statuses: FAILED_STATUSES, since: startMonthIso }),
    ]);

    return {
        successAll,
        successToday: successToday || 0,
        successMonth: successMonth || 0,
        failedAll: failedAll || 0,
        failedMonth: failedMonth || 0,
    };
}

async function getLeadCounts(supabase, userId, startMonthIso, activityCounts) {
    const tables = ['leads', 'contacts'];
    const leadAll = await firstAvailableCount(supabase, tables, userId);
    if (leadAll !== null) {
        const leadMonth = await firstAvailableCount(supabase, tables, userId, { since: startMonthIso });
        return { all: leadAll, month: leadMonth || 0 };
    }
    return { all: activityCounts.leadAll, month: activityCounts.leadMonth };
}

async function countTriggerDms(supabase, userId, keyword) {
    const normalized = String(keyword || '').trim();
    if (!normalized) return 0;
    const { count, error } = await supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('trigger_keyword', normalized)
        .in('status', SUCCESS_STATUSES);
    if (error) return 0;
    return count || 0;
}

function mapActivity(row) {
    const status = normalizeStatus(row.status);
    const isSuccess = SUCCESS_STATUSES.includes(status);
    const isFailed = FAILED_STATUSES.includes(status);
    return {
        id: row.id,
        user: row.username || row.instagram_username || 'Unknown Instagram user',
        keyword: row.keyword || row.trigger_keyword || '',
        trigger: row.trigger_keyword || row.keyword || '',
        status: isSuccess ? 'sent' : isFailed ? 'failed' : status || 'unknown',
        time: relativeTime(row.created_at),
        createdAt: row.created_at || null,
    };
}

export async function buildDashboardMetrics({ supabase, userId, user, settings }) {
    const safeSettings = settings || {};
    const timeZone = safeSettings.timezone || 'Asia/Kolkata';
    const startTodayIso = zonedBoundary(timeZone, 'day').toISOString();
    const startMonthIso = zonedBoundary(timeZone, 'month').toISOString();
    const connected = Boolean(safeSettings.page_access_token && safeSettings.instagram_account_id);

    const { data: triggersData } = await supabase
        .from('triggers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    const { data: recentRows } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    const activityCounts = await getActivityCounts(supabase, userId, startTodayIso, startMonthIso);
    const rawMessageCounts = await getMessageCounts(supabase, userId, startTodayIso, startMonthIso);
    const messageCounts = rawMessageCounts && (rawMessageCounts.successAll + rawMessageCounts.failedAll > 0)
        ? rawMessageCounts
        : null;
    const leadCounts = await getLeadCounts(supabase, userId, startMonthIso, activityCounts);

    const successfulMessages = messageCounts?.successAll ?? activityCounts.successAll;
    const dmsSentToday = messageCounts?.successToday ?? activityCounts.successToday;
    const dmsThisMonth = messageCounts?.successMonth ?? activityCounts.successMonth;
    const failedMessages = messageCounts?.failedAll ?? activityCounts.failedAll;
    const failedThisMonth = messageCounts?.failedMonth ?? activityCounts.failedMonth;
    const attemptedMessages = successfulMessages + failedMessages;
    const deliveryRate = attemptedMessages > 0 ? Math.round((successfulMessages / attemptedMessages) * 100) : null;

    const planKey = normalizePlan(
        safeSettings.plan_name ||
        safeSettings.plan ||
        user?.app_metadata?.plan ||
        user?.user_metadata?.plan
    );
    const plan = PLAN_LIMITS[planKey];

    const automations = await Promise.all((triggersData || []).map(async (trigger) => ({
        id: trigger.id,
        keyword: trigger.keyword || '',
        replyMessage: trigger.reply_message || '',
        enabled: Boolean(trigger.enabled),
        status: trigger.enabled ? 'Live' : 'Paused',
        triggerType: trigger.trigger_type || 'Post or Reel comment',
        dmsSent: await countTriggerDms(supabase, userId, trigger.keyword),
        modifiedAt: trigger.updated_at || trigger.created_at || null,
    })));

    const followersValue = connected && safeSettings.followers !== null && safeSettings.followers !== undefined
        ? safeNumber(safeSettings.followers)
        : null;

    return {
        connected,
        botEnabled: Boolean(safeSettings.bot_enabled),
        dmsSentToday,
        activeAutomations: automations.filter((trigger) => trigger.enabled).length,
        leadsCollected: leadCounts.all,
        followers: followersValue,
        failedMessages,
        deliveryRate,
        usage: {
            dmsThisMonth,
            dmLimit: plan.dmLimit,
            contactsThisMonth: leadCounts.month,
            contactLimit: plan.contactLimit,
            planName: plan.planName,
        },
        stats: {
            followers: followersValue,
            totalDmsSent: successfulMessages,
            totalLinksSent: safeNumber(safeSettings.total_links_sent),
            totalPublicReplies: safeNumber(safeSettings.total_public_replies),
            dmsSentToday,
            failedDms: failedMessages,
            failedDmsThisMonth: failedThisMonth,
            leadsCollected: leadCounts.all,
        },
        triggers: automations,
        automations,
        recentActivity: (recentRows || []).map(mapActivity),
        activityLog: (recentRows || []).map(mapActivity),
    };
}
