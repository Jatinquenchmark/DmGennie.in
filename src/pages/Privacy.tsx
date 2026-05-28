import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { PageHeader } from '@/components/PageHeader'

// DMGenie Logo SVG inline
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

export default function Privacy() {
  const lastUpdated = 'May 10, 2025'
  const contactEmail = 'support@dmgennie.in'

  return (
    <div className="premium-gradient min-h-screen text-foreground">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-6 pb-16 pt-36">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Shield className="w-4 h-4" /> Privacy Policy
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Your Privacy Matters
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: <strong>{lastUpdated}</strong>
          </p>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            DMGenie ("we", "our", or "us") is committed to protecting your personal information.
            This Privacy Policy explains what data we collect, how we use it, and your rights
            regarding your data when you use DMGenie at{' '}
            <a href="https://www.dmgennie.in" className="text-accent-blue hover:underline">
              dmgennie.in
            </a>
            .
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect the minimum information necessary to provide the DMGenie service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account information:</strong> Your name, email address, and password when you sign up.</li>
              <li><strong className="text-foreground">Instagram / Facebook tokens:</strong> Page Access Tokens obtained via Meta OAuth during Instagram connection. These are stored encrypted and used solely to send automated DMs on your behalf.</li>
              <li><strong className="text-foreground">Instagram account metadata:</strong> Your Instagram handle, account ID, and follower count fetched from the Meta Graph API.</li>
              <li><strong className="text-foreground">Trigger configuration:</strong> Keywords and reply messages you create inside the dashboard.</li>
              <li><strong className="text-foreground">Activity logs:</strong> Records of comment-triggered DM events (timestamp, keyword matched, delivery status) associated with your account.</li>
              <li><strong className="text-foreground">Usage data:</strong> Standard server logs including IP address, browser type, and pages visited, retained for security and debugging purposes.</li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To operate and maintain the DMGenie service on your behalf.</li>
              <li>To send automated Instagram direct messages via the official Meta Messaging API according to your configured triggers.</li>
              <li>To display your dashboard statistics and activity logs.</li>
              <li>To authenticate you securely and protect your account.</li>
              <li>To send transactional emails (e.g., confirmation, password reset).</li>
              <li>To comply with Meta Platform Terms and applicable law.</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We do <strong className="text-foreground">not</strong> use your data for advertising, analytics profiling, or any purpose beyond delivering the service described above.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Instagram & Facebook Token Handling</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              When you connect your Instagram account:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are redirected to Meta's official OAuth flow. DMGenie never sees your Facebook or Instagram password.</li>
              <li>Meta issues us a Page Access Token scoped to the permissions you grant.</li>
              <li>This token is stored encrypted in our database and transmitted only over HTTPS.</li>
              <li>The token is used exclusively to send DMs and post comment replies on your behalf via the Meta Graph API.</li>
              <li>You can revoke this access at any time by disconnecting your account in the DMGenie dashboard or by removing DMGenie from your Facebook App settings.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Data Sharing & Third Parties</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do <strong className="text-foreground">not sell, rent, or share</strong> your personal data with third parties for their own purposes. We may share data only in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Service providers:</strong> Supabase (database and authentication), hosted on secure cloud infrastructure. They process data solely on our behalf.</li>
              <li><strong className="text-foreground">Meta Platforms:</strong> API calls to Meta Graph API as required to deliver the service you requested.</li>
              <li><strong className="text-foreground">Legal requirements:</strong> If required by law, court order, or to protect the rights and safety of DMGenie or others.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. Activity logs are retained for up to 90 days. If you delete your account, all personal data is permanently removed within 30 days, except where retention is required by law.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. Data Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All data is transmitted over HTTPS/TLS encryption.</li>
              <li>Access tokens are stored encrypted at rest.</li>
              <li>Access to production data is restricted to authorised personnel only.</li>
              <li>We perform regular security reviews of our infrastructure.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (see Section 8).</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Data portability.</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise any of these rights, email us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-accent-blue hover:underline">{contactEmail}</a>.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Data Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can request deletion of all your data at any time. Visit our{' '}
              <Link to="/delete-data" className="text-accent-blue hover:underline">Data Deletion page</Link>
              {' '}for instructions, or email{' '}
              <a href={`mailto:${contactEmail}`} className="text-accent-blue hover:underline">{contactEmail}</a>
              {' '}with the subject "Data Deletion Request". We will process your request within 30 days.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use only essential session cookies required for authentication and security. We do not use advertising or tracking cookies.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              DMGenie is not directed at individuals under the age of 13. We do not knowingly collect data from children. If you believe a child has provided us personal information, please contact us immediately.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes by email or by posting a prominent notice on the website. Continued use of DMGenie after changes constitutes acceptance.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact:
            </p>
            <div className="mt-4 p-5 bg-card border border-border rounded-2xl">
              <p className="font-semibold text-foreground">DMGenie Support</p>
              <p className="text-muted-foreground mt-1">
                Email:{' '}
                <a href={`mailto:${contactEmail}`} className="text-accent-blue hover:underline">{contactEmail}</a>
              </p>
              <p className="text-muted-foreground">Website: <a href="https://www.dmgennie.in" className="text-accent-blue hover:underline">www.dmgennie.in</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
