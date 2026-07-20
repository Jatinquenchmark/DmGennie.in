import { supabase, getUser, ensureSettings, cors } from '../server/supabaseApi.js';
import { getSubscriptionState } from '../server/billingConfig.js';

// Visual (node-graph) automations. Sibling of api/triggers.js (keyword automations).
// The client sends { name, enabled, triggerType, graph:{nodes,edges} }; graph is stored as jsonb.

const EMPTY_GRAPH = { nodes: [], edges: [] };

function safeGraph(graph) {
    if (!graph || typeof graph !== 'object') return EMPTY_GRAPH;
    return {
        nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
        edges: Array.isArray(graph.edges) ? graph.edges : [],
    };
}

function toSummary(row) {
    return {
        id: row.id,
        name: row.name,
        enabled: row.enabled,
        triggerType: row.trigger_type,
        nodeCount: Array.isArray(row.graph?.nodes) ? row.graph.nodes.length : 0,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
    };
}

function toFlow(row) {
    return {
        id: row.id,
        name: row.name,
        enabled: row.enabled,
        triggerType: row.trigger_type,
        graph: safeGraph(row.graph),
        updatedAt: row.updated_at,
        createdAt: row.created_at,
    };
}

// Flows + keyword triggers share the plan's automation budget.
async function combinedAutomationCount(userId) {
    const [{ count: flowCount }, { count: triggerCount }] = await Promise.all([
        supabase.from('flows').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('triggers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return (flowCount || 0) + (triggerCount || 0);
}

export default async function handler(req, res) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = user.id;
    const { id } = req.query;

    if (req.method === 'GET') {
        if (id) {
            const { data, error } = await supabase.from('flows').select('*').eq('id', id).eq('user_id', userId).single();
            if (error || !data) return res.status(404).json({ error: 'Flow not found.' });
            return res.json(toFlow(data));
        }
        const { data } = await supabase.from('flows').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
        return res.json((data || []).map(toSummary));
    }

    if (req.method === 'POST') {
        const settings = await ensureSettings(userId);
        const subscription = getSubscriptionState(user, settings);
        // Flows share the plan's automation budget with keyword triggers. Pro-only
        // trigger types are gated in the builder UI, matching the keyword-trigger flow.
        if ((await combinedAutomationCount(userId)) >= subscription.limits.automationLimit) {
            return res.status(403).json({
                error: 'PLAN_LIMIT_REACHED',
                message: "You've reached your Starter automation limit. Upgrade to Pro to create more.",
            });
        }
        const { data, error } = await supabase.from('flows').insert({
            user_id: userId,
            name: req.body.name || 'Untitled flow',
            enabled: Boolean(req.body.enabled),
            trigger_type: req.body.triggerType || null,
            graph: safeGraph(req.body.graph),
        }).select().single();
        if (error) {
            console.error('[flows] insert failed:', error.message);
            return res.status(500).json({ error: 'Unable to create flow.' });
        }
        return res.json(toFlow(data));
    }

    if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ error: 'Missing flow id.' });
        const updates = { updated_at: new Date().toISOString() };
        if (req.body.name !== undefined) updates.name = req.body.name;
        if (req.body.enabled !== undefined) updates.enabled = Boolean(req.body.enabled);
        if (req.body.triggerType !== undefined) updates.trigger_type = req.body.triggerType;
        if (req.body.graph !== undefined) updates.graph = safeGraph(req.body.graph);
        const { data, error } = await supabase.from('flows').update(updates).eq('id', id).eq('user_id', userId).select().single();
        if (error || !data) {
            console.error('[flows] update failed:', error?.message);
            return res.status(500).json({ error: 'Unable to update flow.' });
        }
        return res.json(toFlow(data));
    }

    if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'Missing flow id.' });
        await supabase.from('flows').delete().eq('id', id).eq('user_id', userId);
        return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
