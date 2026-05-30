import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bot,
  CreditCard,
  Download,
  Home,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ErrorState, LoadingCard, SkeletonCard } from '@/components/Loading'

type AdminSection = 'overview' | 'users' | 'automations' | 'contacts' | 'billing' | 'settings'

const navItems: Array<{ key: AdminSection; label: string; path: string; icon: ReactNode }> = [
  { key: 'overview', label: 'Overview', path: '/admin', icon: <Home className="h-4 w-4" /> },
  { key: 'users', label: 'Users', path: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { key: 'automations', label: 'Automations', path: '/admin/automations', icon: <Bot className="h-4 w-4" /> },
  { key: 'contacts', label: 'Contacts', path: '/admin/contacts', icon: <Activity className="h-4 w-4" /> },
  { key: 'billing', label: 'Billing', path: '/admin/billing', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'settings', label: 'Settings', path: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
]

function sectionFromPath(pathname: string): AdminSection {
  if (pathname.includes('/users')) return 'users'
  if (pathname.includes('/automations')) return 'automations'
  if (pathname.includes('/contacts')) return 'contacts'
  if (pathname.includes('/billing')) return 'billing'
  if (pathname.includes('/settings')) return 'settings'
  return 'overview'
}

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString()
}

function formatDate(value?: string) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminDashboard() {
  const { session, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const section = sectionFromPath(location.pathname)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const authFetch = useCallback((url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(options.headers || {}),
      },
    })
  }, [session?.access_token])

  const endpoint = useMemo(() => {
    if (section === 'overview') return '/api/admin?action=overview'
    if (section === 'billing') return '/api/admin?action=overview'
    if (section === 'settings') return '/api/me'
    return `/api/admin?action=${section}`
  }, [section])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await authFetch(endpoint)
      if (!response.ok) throw new Error('Unable to load admin data')
      setData(await response.json())
    } catch {
      setError('Unable to load admin data.')
    } finally {
      setLoading(false)
    }
  }, [authFetch, endpoint])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = async () => {
    await signOut()
    navigate('/signup')
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-[#0F172A]">
      <div className="mx-auto flex w-full max-w-[1440px] gap-5 p-4 xl:p-5">
        <aside className="hidden h-[calc(100vh-2rem)] w-[274px] shrink-0 rounded-[26px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] lg:sticky lg:top-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5B4DFF] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">DMGennie</p>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94A3B8]">Admin Console</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-black transition ${
                  section === item.key
                    ? 'bg-[#0F172A] text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-8">
            <Link to="/dashboard" className="flex h-10 items-center justify-center rounded-2xl border border-[#E5E7EB] text-sm font-black text-[#475569] transition hover:bg-[#F8FAFC]">
              Back to App
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] text-sm font-black text-white transition hover:bg-[#059669]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 rounded-[24px] border border-white bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5B4DFF]">Secure Admin</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight capitalize">{section === 'overview' ? 'Admin Overview' : section}</h1>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">Manage users, automations, contacts, billing, and platform health.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={loadData} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-black text-[#475569] transition hover:bg-[#F8FAFC]">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <Link to="/dashboard" className="inline-flex h-10 items-center rounded-2xl bg-[#5B4DFF] px-4 text-sm font-black text-white transition hover:bg-[#4738E8]">
                Back to App
              </Link>
            </div>
          </header>

          <div className="mt-5">
            {loading ? (
              <AdminLoading />
            ) : error ? (
              <ErrorState title="Something went wrong" text={error} onRetry={loadData} className="min-h-[520px]" />
            ) : (
              <AdminContent
                section={section}
                data={data}
                search={search}
                setSearch={setSearch}
                authFetch={authFetch}
                onRefresh={loadData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function AdminLoading() {
  return (
    <div className="space-y-4">
      <LoadingCard title="Loading Admin" subtitle="Preparing platform controls..." detail="Fetching secure admin data..." className="mx-auto" />
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard rows={3} showIcon />
        <SkeletonCard rows={3} showIcon />
        <SkeletonCard rows={3} showIcon />
      </div>
      <SkeletonCard rows={6} className="min-h-[300px]" />
    </div>
  )
}

function AdminContent({
  section,
  data,
  search,
  setSearch,
  authFetch,
  onRefresh,
}: {
  section: AdminSection
  data: any
  search: string
  setSearch: (value: string) => void
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  onRefresh: () => void
}) {
  if (section === 'overview') return <Overview data={data} />
  if (section === 'users') return <UsersPage data={data} search={search} setSearch={setSearch} authFetch={authFetch} onRefresh={onRefresh} />
  if (section === 'automations') return <AutomationsPage data={data} search={search} setSearch={setSearch} authFetch={authFetch} onRefresh={onRefresh} />
  if (section === 'contacts') return <ContactsPage data={data} search={search} setSearch={setSearch} />
  if (section === 'billing') return <BillingPage data={data} />
  return <AdminSettings data={data} />
}

function Metric({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-white bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">{helper}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#5B4DFF]">{icon}</span>
      </div>
    </div>
  )
}

function Overview({ data }: { data: any }) {
  const metrics = data?.metrics || {}
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total users" value={formatNumber(metrics.totalUsers)} helper="All registered accounts" icon={<Users className="h-5 w-5" />} />
        <Metric label="Active users" value={formatNumber(metrics.activeUsers)} helper="Instagram connected" icon={<ShieldCheck className="h-5 w-5" />} />
        <Metric label="Automations" value={formatNumber(metrics.totalAutomations)} helper="Across all users" icon={<Bot className="h-5 w-5" />} />
        <Metric label="DMs sent" value={formatNumber(metrics.totalDmsSent)} helper={`${formatNumber(metrics.failedMessages)} failed`} icon={<BarChart3 className="h-5 w-5" />} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Recent signups">
          <SimpleTable
            rows={(data?.recentSignups || []).map((user: any) => ({
              User: user.email,
              Name: user.name,
              Plan: user.plan,
              Joined: formatDate(user.createdAt),
            }))}
          />
        </Panel>
        <Panel title="Recent activity">
          <SimpleTable
            rows={(data?.recentActivity || []).map((item: any) => ({
              Owner: item.ownerEmail,
              Contact: item.user,
              Keyword: item.keyword,
              Status: item.status,
              Time: formatDate(item.createdAt),
            }))}
          />
        </Panel>
      </div>
    </div>
  )
}

function UsersPage({ data, search, setSearch, authFetch, onRefresh }: any) {
  const users = (data?.users || []).filter((user: any) => `${user.email} ${user.name} ${user.instagramHandle}`.toLowerCase().includes(search.toLowerCase()))

  const updateUser = async (userId: string, action: string, plan?: string) => {
    await authFetch('/api/admin?action=users', { method: 'PUT', body: JSON.stringify({ userId, action, plan }) })
    onRefresh()
  }

  return (
    <Panel title="User management" action={<TableControls search={search} setSearch={setSearch} onExport={() => downloadCsv('dmgennie-admin-users.csv', users)} />}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">
            <tr>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Instagram</th>
              <th className="px-3 py-3">Plan</th>
              <th className="px-3 py-3">Intro Offer</th>
              <th className="px-3 py-3">Usage</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F7]">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-[#F8FAFC]">
                <td className="px-3 py-4"><strong>{user.name}</strong><br /><span className="text-[#64748B]">{user.email}</span></td>
                <td className="px-3 py-4"><Badge tone={user.role === 'admin' ? 'purple' : 'gray'}>{user.role}</Badge></td>
                <td className="px-3 py-4"><Badge tone={user.connectedInstagram ? 'green' : 'gray'}>{user.instagramHandle}</Badge></td>
                <td className="px-3 py-4">{user.plan}</td>
                <td className="px-3 py-4">
                  <Badge tone={user.introOfferUsed ? 'green' : 'gray'}>{user.introOfferUsed ? 'Used' : 'Not used'}</Badge>
                  <br />
                  <span className="text-xs text-[#64748B]">{user.proIntroStartedAt ? formatDate(user.proIntroStartedAt) : user.subscriptionStatus || 'free'}</span>
                </td>
                <td className="px-3 py-4">{formatNumber(user.dmsSent)} DMs<br /><span className="text-[#64748B]">{formatNumber(user.contacts)} leads</span></td>
                <td className="px-3 py-4">{formatDate(user.createdAt)}</td>
                <td className="px-3 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border px-3 py-1.5 font-bold" onClick={() => updateUser(user.id, user.suspended ? 'activate' : 'suspend')}>{user.suspended ? 'Activate' : 'Suspend'}</button>
                    <button className="rounded-full border px-3 py-1.5 font-bold" onClick={() => updateUser(user.id, 'plan', user.plan === 'Pro' ? 'Starter' : 'Pro')}>Toggle plan</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function AutomationsPage({ data, search, setSearch, authFetch, onRefresh }: any) {
  const automations = (data?.automations || []).filter((item: any) => `${item.ownerEmail} ${item.keyword} ${item.replyMessage}`.toLowerCase().includes(search.toLowerCase()))
  const toggle = async (item: any) => {
    await authFetch('/api/admin?action=automations', { method: 'PUT', body: JSON.stringify({ id: item.id, enabled: item.status !== 'Live' }) })
    onRefresh()
  }

  return (
    <Panel title="Automation management" action={<TableControls search={search} setSearch={setSearch} onExport={() => downloadCsv('dmgennie-admin-automations.csv', automations)} />}>
      <SimpleTable
        rows={automations.map((item: any) => ({
          Owner: item.ownerEmail,
          Keyword: item.keyword,
          Message: item.replyMessage,
          Status: item.status,
          'DMs sent': item.dmsSent,
          Failed: item.failed,
          Modified: formatDate(item.updatedAt),
          Action: <button className="rounded-full border px-3 py-1.5 font-bold" onClick={() => toggle(item)}>{item.status === 'Live' ? 'Pause' : 'Resume'}</button>,
        }))}
      />
    </Panel>
  )
}

function ContactsPage({ data, search, setSearch }: any) {
  const contacts = (data?.contacts || []).filter((item: any) => `${item.ownerEmail} ${item.instagramUser} ${item.source}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <Panel title="Contacts and leads" action={<TableControls search={search} setSearch={setSearch} onExport={() => downloadCsv('dmgennie-admin-contacts.csv', contacts)} />}>
      <SimpleTable
        rows={contacts.map((item: any) => ({
          Owner: item.ownerEmail,
          Contact: item.instagramUser,
          Email: item.email,
          Source: item.source,
          Keyword: item.keyword,
          Status: item.status,
          Joined: formatDate(item.joinedAt),
        }))}
      />
    </Panel>
  )
}

function BillingPage({ data }: { data: any }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Revenue" value={`₹${formatNumber(data?.metrics?.revenue)}`} helper="Connect billing provider for live revenue" icon={<CreditCard className="h-5 w-5" />} />
        <Metric label="Subscriptions" value={formatNumber(0)} helper="Billing webhook pending" icon={<ShieldCheck className="h-5 w-5" />} />
        <Metric label="Users" value={formatNumber(data?.metrics?.totalUsers)} helper="Potential subscribers" icon={<Users className="h-5 w-5" />} />
      </div>
      <Panel title="Billing controls">
        <p className="text-sm font-semibold leading-6 text-[#64748B]">
          Billing data is intentionally read-only here until Razorpay/subscription webhooks are connected to admin reporting.
          Admin APIs are ready to expose secure subscription data once the billing tables exist.
        </p>
      </Panel>
    </div>
  )
}

function AdminSettings({ data }: { data: any }) {
  return (
    <Panel title="Admin settings">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoTile label="Signed in as" value={data?.email || 'Admin'} />
        <InfoTile label="Role" value={data?.role || 'admin'} />
        <InfoTile label="Admin routes" value="/admin, /admin/users, /admin/automations" />
        <InfoTile label="Security" value="Backend role checks enabled" />
      </div>
    </Panel>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[22px] border border-white bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function SimpleTable({ rows }: { rows: Array<Record<string, any>> }) {
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm font-bold text-[#64748B]">No admin data found.</div>
  const headers = Object.keys(rows[0])
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F7]">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-[#F8FAFC]">
              {headers.map((header) => <td key={header} className="max-w-[320px] truncate px-3 py-4">{row[header]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableControls({ search, setSearch, onExport }: { search: string; setSearch: (value: string) => void; onExport: () => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="h-10 rounded-2xl border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#5B4DFF]/10" />
      </label>
      <button onClick={onExport} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] px-4 text-sm font-black text-[#475569] transition hover:bg-[#F8FAFC]">
        <Download className="h-4 w-4" />
        Export
      </button>
    </div>
  )
}

function Badge({ children, tone }: { children: ReactNode; tone: 'green' | 'purple' | 'gray' }) {
  const classes = {
    green: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-[#EEF0FF] text-[#5B4DFF]',
    gray: 'bg-slate-100 text-slate-600',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${classes[tone]}`}>{children}</span>
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  )
}
