export function formatNumber(value) {
    return Number(value || 0);
}

export async function listAuthUsers(supabase) {
    const allUsers = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;

        const users = data?.users || [];
        allUsers.push(...users);
        if (users.length < perPage) break;
        page += 1;
    }

    return allUsers;
}

export function userDisplayName(user) {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator';
}

export function userRole(user, roleRows = []) {
    return roleRows.find((row) => row.user_id === user.id)?.role || user?.app_metadata?.role || 'user';
}

export function userPlan(user) {
    return user?.app_metadata?.plan || 'Starter';
}
