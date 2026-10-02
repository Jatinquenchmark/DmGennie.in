// Run: node server/dashboardMetrics.test.mjs
// Pins the RPC-row -> API-shape contract that replaced the per-count query fan-out.
// A rename on either side of dashboard_activity_counts breaks these asserts.
import assert from 'node:assert';
import { buildDashboardMetrics } from './dashboardMetrics.js';

// Minimal stub of the supabase client surface buildDashboardMetrics touches.
function makeSupabase({ rpcRow, triggers = [], recent = [] }) {
    const calls = { rpc: 0, from: [] };
    const table = (rows) => {
        const q = {
            select: () => q,
            eq: () => q,
            in: () => q,
            gte: () => q,
            order: () => q,
            limit: () => Promise.resolve({ data: rows, error: null }),
            then: (res) => Promise.resolve({ data: rows, error: null }).then(res),
        };
        return q;
    };
    return {
        calls,
        rpc: (name, args) => {
            calls.rpc += 1;
            assert.equal(name, 'dashboard_activity_counts');
            assert.ok(args.p_user_id && args.p_start_today && args.p_start_month);
            return Promise.resolve({ data: [rpcRow], error: null });
        },
        from: (name) => {
            calls.from.push(name);
            // Optional tables (messages/leads/contacts) report "missing" so the
            // probe paths fall through to activity_log counts, as in production.
            if (!['triggers', 'activity_log'].includes(name)) {
                const miss = {
                    select: () => miss, eq: () => miss, in: () => miss, gte: () => miss,
                    order: () => miss, limit: () => Promise.resolve({ data: null, error: { code: '42P01' } }),
                    then: (res) => Promise.resolve({ data: null, error: { code: '42P01' } }).then(res),
                };
                return miss;
            }
            return table(name === 'triggers' ? triggers : recent);
        },
    };
}

const rpcRow = {
    success_all: 120, success_today: 7, success_month: 42,
    failed_all: 9, failed_today: 1, failed_month: 4,
    lead_all: 15, lead_month: 5,
    per_trigger: { link: 80, price: 40 },
};

const supabase = makeSupabase({
    rpcRow,
    triggers: [
        { id: 1, keyword: 'link', reply_message: 'here', enabled: true, trigger_type: null, created_at: '2026-01-01' },
        { id: 2, keyword: ' price ', reply_message: 'x', enabled: false, trigger_type: 'DM keyword', created_at: '2026-01-02' },
        { id: 3, keyword: 'ghost', reply_message: 'y', enabled: true, trigger_type: null, created_at: '2026-01-03' },
    ],
    recent: [{ id: 'a', username: '@x', keyword: 'link', trigger_keyword: 'link', status: 'sent', created_at: new Date().toISOString() }],
});

const out = await buildDashboardMetrics({
    supabase, userId: 'u-1', user: { id: 'u-1' },
    settings: { timezone: 'Asia/Kolkata', page_access_token: 't', instagram_account_id: 'ig', followers: 321 },
});

// The RPC is called exactly once — the whole point of the change.
assert.equal(supabase.calls.rpc, 1, 'dashboard_activity_counts must be called exactly once');

// snake_case RPC columns land on the right camelCase API fields.
assert.equal(out.stats.totalDmsSent, 120);
assert.equal(out.dmsSentToday, 7);
assert.equal(out.usage.dmsThisMonth, 42);
assert.equal(out.failedMessages, 9);
assert.equal(out.stats.failedDmsThisMonth, 4);
assert.equal(out.leadsCollected, 15);
assert.equal(out.usage.contactsThisMonth, 5);

// deliveryRate = success / (success + failed) = 120/129 -> 93%
assert.equal(out.deliveryRate, 93);

// per_trigger lookup replaces the old per-trigger count query.
const byId = Object.fromEntries(out.triggers.map((t) => [t.id, t]));
assert.equal(byId[1].dmsSent, 80, 'exact keyword match');
assert.equal(byId[2].dmsSent, 40, 'keyword is trimmed before lookup');
assert.equal(byId[3].dmsSent, 0, 'keyword absent from per_trigger -> 0, not undefined/NaN');

assert.equal(out.activeAutomations, 2);
assert.equal(out.connected, true);
assert.equal(out.followers, 321);

// A missing/failed RPC must degrade to zeros, never NaN or undefined.
const broken = {
    rpc: () => Promise.resolve({ data: null, error: { message: 'function does not exist' } }),
    from: makeSupabase({ rpcRow, triggers: [], recent: [] }).from,
};
const degraded = await buildDashboardMetrics({
    supabase: broken, userId: 'u-1', user: { id: 'u-1' }, settings: {},
});
assert.equal(degraded.stats.totalDmsSent, 0);
assert.equal(degraded.dmsSentToday, 0);
assert.equal(degraded.usage.dmsThisMonth, 0);
assert.equal(degraded.deliveryRate, null);

console.log('dashboardMetrics RPC mapping tests passed');
