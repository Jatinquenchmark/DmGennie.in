function isMissingTable(error) {
    return ['42P01', 'PGRST116', 'PGRST200', 'PGRST204', 'PGRST205'].includes(error?.code);
}

function safeText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    if (!text || text === 'null' || text === 'undefined' || text === '@n/a') return fallback;
    return text;
}

function normalizeUsername(row) {
    const username = safeText(
        row.instagram_username ||
        row.username ||
        row.handle ||
        row.instagram_handle ||
        row.user_name,
        ''
    );
    if (!username) return 'Unknown Instagram user';
    return username.startsWith('@') ? username : `@${username}`;
}

function normalizeName(row, username) {
    return safeText(
        row.name ||
        row.full_name ||
        row.display_name ||
        row.contact_name ||
        row.first_name,
        username !== 'Unknown Instagram user' ? username.replace('@', '') : 'Unknown'
    );
}

function normalizeSourceType(row) {
    const raw = safeText(row.source_type || row.source || row.origin || row.trigger_type, '').toLowerCase();
    if (raw.includes('story')) return 'Story reply';
    if (raw.includes('live')) return 'Live comment';
    if (raw.includes('automation') || raw.includes('auto') || raw.includes('comment') || raw.includes('keyword')) return 'Comment keyword';
    if (raw.includes('direct') || raw.includes('dm')) return 'Direct DM';
    if (row.automation_id || row.trigger_id || row.trigger_keyword || row.keyword) return 'Comment keyword';
    return 'Direct DM';
}

function normalizeRelationship(row) {
    const value = safeText(row.relationship || row.relationship_status || row.follow_status, '').toLowerCase();
    if (value.includes('mutual')) return 'Mutual';
    if (value.includes('follows')) return 'Follows You';
    if (value.includes('you_follow') || value.includes('you follow')) return 'You Follow';
    return 'Unknown';
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

function formatDate(value) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isToday(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.toDateString() === now.toDateString();
}

function isWithinLastSevenDays(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
}

function hasEmail(row) {
    return Boolean(safeText(row.email || row.email_address || row.lead_email, ''));
}

function isAutomationSource(row) {
    const source = safeText(row.source_type || row.source || row.origin || row.trigger_type, '').toLowerCase();
    return Boolean(
        row.automation_id ||
        row.trigger_id ||
        row.trigger_keyword ||
        row.keyword ||
        ['automation', 'comment_keyword', 'story_reply', 'auto_dm', 'live_comment'].some((value) => source.includes(value))
    );
}

function mapContactRow(row, tableName) {
    const username = normalizeUsername(row);
    const name = normalizeName(row, username);
    const email = safeText(row.email || row.email_address || row.lead_email, 'No email captured');
    const joinedAt = row.created_at || row.joined_at || row.inserted_at || row.signup_date || null;
    const lastInteractionAt = row.last_interaction_at || row.last_activity_at || row.updated_at || joinedAt;
    const sourceType = normalizeSourceType(row);
    const source = safeText(
        row.source_label ||
        row.automation_name ||
        row.source ||
        row.trigger_name ||
        (row.keyword || row.trigger_keyword ? `Keyword: ${row.keyword || row.trigger_keyword}` : ''),
        sourceType === 'Direct DM' ? 'Direct DM' : 'Instagram automation'
    );
    const keyword = safeText(row.keyword || row.trigger_keyword || row.matched_keyword, 'Unknown');

    return {
        id: safeText(row.id, `${tableName}-${username}-${joinedAt || Date.now()}`),
        name,
        username,
        email,
        source,
        sourceType,
        relationship: normalizeRelationship(row),
        joined: formatDate(joinedAt),
        joinedDate: joinedAt || '',
        lastInteraction: safeText(row.last_interaction || row.status || 'Added to contacts', 'Added to contacts'),
        lastInteractionLabel: relativeTime(lastInteractionAt),
        lastInteractionAt: lastInteractionAt || '',
        automation: safeText(row.automation_name || row.trigger_name || row.automation || source, source),
        keyword,
        avatar: safeText(row.avatar_url || row.profile_picture_url || row.profile_pic_url, ''),
        profileUrl: safeText(row.profile_url || row.instagram_profile_url, username !== 'Unknown Instagram user' ? `https://www.instagram.com/${username.replace('@', '')}/` : ''),
        capturedFields: [
            { label: 'Email', value: email },
            { label: 'Source', value: source },
            { label: 'Keyword', value: keyword },
        ],
        timeline: [
            { label: sourceType === 'Direct DM' ? 'Started direct DM conversation' : `Captured from ${sourceType.toLowerCase()}`, time: relativeTime(joinedAt), tone: 'purple' },
            { label: hasEmail(row) ? 'Email captured' : 'Added to contacts', time: relativeTime(lastInteractionAt), tone: hasEmail(row) ? 'green' : 'slate' },
        ],
    };
}

async function loadRowsFromTable(supabase, tableName, userId) {
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId);

    if (error) {
        if (isMissingTable(error)) return { available: false, rows: [] };
        throw error;
    }

    const rows = [...(data || [])].sort((a, b) => {
        const left = new Date(b.created_at || b.joined_at || b.inserted_at || 0).getTime();
        const right = new Date(a.created_at || a.joined_at || a.inserted_at || 0).getTime();
        return left - right;
    });

    return { available: true, rows };
}

export async function buildContactsPayload({ supabase, userId }) {
    const tables = ['contacts', 'leads'];
    let rows = [];
    let tableName = 'contacts';

    for (const table of tables) {
        const result = await loadRowsFromTable(supabase, table, userId);
        if (!result.available) continue;
        tableName = table;
        rows = result.rows;
        if (rows.length || table === tables[tables.length - 1]) break;
    }

    const contacts = rows.map((row) => mapContactRow(row, tableName));
    const metrics = {
        totalContacts: contacts.length,
        withEmail: rows.filter(hasEmail).length,
        activeToday: rows.filter((row) => isToday(row.last_interaction_at || row.last_activity_at || row.updated_at || row.created_at)).length,
        newThisWeek: rows.filter((row) => isWithinLastSevenDays(row.created_at || row.joined_at || row.inserted_at)).length,
        fromAutomations: rows.filter(isAutomationSource).length,
    };

    return { metrics, contacts };
}
