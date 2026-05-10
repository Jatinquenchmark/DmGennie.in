import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, MessageCircle, Zap, Instagram } from 'lucide-react'

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
        DM<span className="text-accent-blue">Genie</span>
      </span>
    </Link>
  )
}

const testSteps = [
  {
    step: '01',
    icon: <Instagram className="w-6 h-6" />,
    title: 'Connect Instagram Account',
    detail: `Go to Dashboard > Settings > click "Connect Instagram Account". You will be redirected to Meta's official OAuth page. Authorise DMGenie with the requested permissions.`,
    permissions: [
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
      'pages_manage_metadata',
    ],
  },
  {
    step: '02',
    icon: <Zap className="w-6 h-6" />,
    title: 'Create a Keyword Trigger',
    detail: `Go to Dashboard > Auto-Replies > click "Add Trigger". Enter a keyword (e.g. "link") and a DM reply message (e.g. "Here is the link: https://example.com"). Save the trigger.`,
    note: 'The trigger is now active. Any user who comments "link" on your post will receive the configured DM.',
  },
  {
    step: '03',
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Test the Comment-to-DM Flow',
    detail: `Post anything on your connected Instagram account. Comment the keyword you configured (e.g. "link") on that post from a different Instagram account. Within seconds, that account should receive a DM with your configured reply.`,
    note: `DM delivery depends on the commenter having their DMs open. If closed, a public comment reply is posted instead.`,
  },
]

export default function ReviewerDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue text-sm font-semibold px-4 py-2 rounded-full mb-6">
            Meta App Review — Reviewer Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            How DMGenie Works
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            This page is provided for Meta App Review. It explains what DMGenie does, which
            permissions are used, and provides a step-by-step test flow for reviewers.
          </p>
        </div>

        {/* What is DMGenie */}
        <section className="mb-14 p-6 bg-card border border-border rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">What is DMGenie?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            DMGenie is a customer engagement tool for Instagram creators and businesses. It enables
            professional accounts to automatically send Instagram direct messages when a user comments
            a specific keyword on their posts or reels.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">Example use case:</strong> A business posts &quot;Comment
            LINK below to get our catalogue&quot;. When a user comments &quot;LINK&quot;, DMGenie automatically sends
            them a private DM with the catalogue URL — saving the business from manually replying to
            hundreds of comments.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            All messaging is performed via the official <strong className="text-foreground">Instagram
              Messaging API (Graph API)</strong>. DMGenie does not use any unofficial methods or
            third-party scraping tools.
          </p>
        </section>

        {/* Permissions Explained */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-6">Permissions &amp; Why They Are Needed</h2>
          <div className="space-y-4">
            {[
              {
                permission: 'instagram_basic',
                reason: `To read the connected Instagram account's basic profile information (username, account ID) so we can display the connected account in the dashboard.`,
              },
              {
                permission: 'instagram_manage_messages',
                reason: 'To send private Instagram direct messages to users who comment on posts. This is the core functionality of DMGenie.',
              },
              {
                permission: 'instagram_manage_comments',
                reason: `To receive webhook notifications when a user comments on a post, and to post a public comment reply when a user's DMs are closed.`,
              },
              {
                permission: 'pages_manage_metadata',
                reason: 'Required to subscribe the connected Facebook Page to Instagram webhook events so we receive real-time comment notifications.',
              },
            ].map((p) => (
              <div key={p.permission} className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-blue mt-2" />
                <div>
                  <code className="text-accent-blue font-mono text-sm font-semibold">{p.permission}</code>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{p.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Test Steps */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-foreground mb-8">Step-by-Step Test Flow</h2>
          <div className="space-y-8">
            {testSteps.map((s) => (
              <div key={s.step} className="flex gap-6">
                <div className="flex-shrink-0 text-4xl font-extrabold text-accent-blue/20 leading-none mt-1 w-12 text-right">
                  {s.step}
                </div>
                <div className="flex-1 pb-8 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 text-accent-blue mb-2">
                    {s.icon}
                    <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">{s.detail}</p>
                  {'permissions' in s && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {s.permissions.map((p) => (
                        <code key={p} className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-1 rounded-md font-mono">{p}</code>
                      ))}
                    </div>
                  )}
                  {'note' in s && s.note && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">{s.note}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Test Credentials Note */}
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-2">Test Account Requirements</h3>
              <ul className="text-sm text-amber-600/80 dark:text-amber-400/80 space-y-1 leading-relaxed">
                <li>• The Instagram account must be a <strong>Professional account</strong> (Business or Creator).</li>
                <li>• It must be linked to a <strong>Facebook Page</strong> to access Meta's API.</li>
                <li>• The test commenter account must have DMs open for the DM delivery test.</li>
                <li>• If test credentials are provided, use them at <a href="https://www.dmgennie.in/signup" className="underline">dmgennie.in/signup</a> to log in.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Questions during review?{' '}
            <a href="mailto:support@dmgennie.in" className="text-accent-blue hover:underline font-semibold">support@dmgennie.in</a>
          </p>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap gap-4 items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} DMGenie. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/delete-data" className="hover:text-foreground transition-colors">Delete Data</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
