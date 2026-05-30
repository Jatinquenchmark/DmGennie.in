import { Link } from 'react-router-dom'
import { Trash2, ArrowLeft, Mail, Clock, CheckCircle } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { PageHeader } from '@/components/PageHeader'

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#5b5ef4" fillOpacity="0.12" />
        <path d="M10 26 L18 14" stroke="#5b5ef4" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M16 26 L24 14" stroke="#5b5ef4" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="28" cy="26" r="3" fill="#5b5ef4" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-accent-blue transition-colors">
        DM<span className="text-accent-blue">Gennie</span>
      </span>
    </Link>
  )
}

const steps = [
  {
    icon: <Mail className="w-6 h-6 text-accent-blue" />,
    title: 'Send a Deletion Request',
    description: (
      <>
        Email us at{' '}
        <a href="mailto:support@dmgennie.in" className="text-accent-blue hover:underline font-semibold">
          support@dmgennie.in
        </a>{' '}
        with the subject line <strong>"Data Deletion Request"</strong>. Include the email address
        associated with your DMGennie account.
      </>
    ),
  },
  {
    icon: <Clock className="w-6 h-6 text-purple-500" />,
    title: 'We Process Your Request',
    description:
      'Our team will verify your identity and initiate the deletion process within 3 business days of receiving your request. You will receive a confirmation email.',
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
    title: 'Data Permanently Deleted',
    description:
      'All your personal data — including your account details, Instagram access tokens, keyword triggers, and activity logs — will be permanently and irreversibly deleted within 30 days.',
  },
]

export default function DeleteData() {
  return (
    <div className="premium-gradient min-h-screen text-foreground">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-6 pb-16 pt-36">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Trash2 className="w-4 h-4" /> Data Deletion
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Request Data Deletion
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            You have the right to have your personal data permanently deleted from DMGennie at any
            time. This page explains exactly what gets deleted and how to request it.
          </p>
        </div>

        {/* What gets deleted */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-6">What Gets Deleted</h2>
          <div className="grid gap-4">
            {[
              { label: 'Account Information', detail: 'Your name, email address, and hashed password.' },
              { label: 'Instagram Access Token', detail: 'Your Meta Page Access Token used to send DMs — immediately revoked and deleted.' },
              { label: 'Instagram Account Data', detail: 'Your Instagram handle, account ID, and follower count stored in our system.' },
              { label: 'Keyword Triggers', detail: 'All keyword-to-DM triggers and reply messages you configured.' },
              { label: 'Activity Logs', detail: 'All records of comment events and DM delivery statuses.' },
              { label: 'Settings & Preferences', detail: 'All customisation data including reply delay, timezone, and bot settings.' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p>
                  <p className="text-muted-foreground text-sm mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-8">How to Request Deletion</h2>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                  {step.icon}
                </div>
                <div className="flex-1 pt-2">
                  <p className="font-bold text-foreground mb-1">
                    <span className="text-accent-blue mr-2">Step {i + 1}.</span>{step.title}
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Ready to Delete Your Data?</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Send an email to our support team and we'll handle everything within 30 days.
          </p>
          <a
            href="mailto:support@dmgennie.in?subject=Data%20Deletion%20Request"
            className="inline-flex items-center gap-2 bg-red-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Send Deletion Request
          </a>
          <p className="text-muted-foreground text-xs mt-4">
            Expected response: within 3 business days · Full deletion: within 30 days
          </p>
        </div>

        {/* Revoking from Meta */}
        <div className="mt-10 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-2">Also Revoke from Meta</h3>
          <p className="text-sm text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
            To completely revoke DMGennie's access, you can also remove it from Facebook's app settings:
            go to <strong>Facebook → Settings → Apps and Websites</strong> and remove DMGennie. This
            immediately invalidates our access to your Instagram account independent of your deletion request.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
