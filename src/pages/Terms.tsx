import { Link } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
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
        DM<span className="text-accent-blue">Genie</span>
      </span>
    </Link>
  )
}

export default function Terms() {
  const lastUpdated = 'May 10, 2025'
  const contactEmail = 'support@dmgennie.in'

  return (
    <div className="premium-gradient min-h-screen text-foreground">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-6 pb-16 pt-36">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <FileText className="w-4 h-4" /> Terms of Service
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: <strong>{lastUpdated}</strong>
          </p>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Please read these Terms of Service carefully before using DMGenie. By accessing or using
            our service at{' '}
            <a href="https://www.dmgennie.in" className="text-accent-blue hover:underline">dmgennie.in</a>
            , you agree to be bound by these terms.
          </p>
        </div>

        <div className="space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account or using DMGenie, you confirm that you are at least 18 years old, have the authority to enter into these terms, and agree to comply with all applicable laws and regulations including Meta's Platform Terms of Service and Instagram's Community Guidelines.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              DMGenie is an Instagram comment-to-DM automation platform that allows creators and businesses to automatically send Instagram direct messages when users comment specific keywords on their posts and reels. DMGenie operates exclusively via official Meta Graph API and Instagram Messaging API. DMGenie is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">3. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree to use DMGenie only for lawful purposes and in accordance with these Terms. You must NOT use DMGenie to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Send spam, unsolicited messages, or harassing content.</li>
              <li>Violate Meta's Platform Policies, Instagram's Terms of Use, or any applicable law.</li>
              <li>Impersonate any person or entity.</li>
              <li>Promote illegal products, services, or activities.</li>
              <li>Distribute malware, phishing links, or harmful content.</li>
              <li>Circumvent any rate limits, API restrictions, or security measures imposed by Meta.</li>
              <li>Collect, scrape, or harvest user data without consent.</li>
              <li>Use the service for any purpose that could damage DMGenie's reputation or relationship with Meta.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">4. Instagram & Meta Compliance</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              DMGenie operates under Meta's Platform Terms. By connecting your Instagram account, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are solely responsible for the content of messages sent through your account.</li>
              <li>You will comply with Meta's Messaging Policy and Instagram's anti-spam policies.</li>
              <li>You will not use DMGenie to send promotional messages to users who have not opted in.</li>
              <li>DMGenie may suspend your account if we detect policy violations.</li>
              <li>Meta may independently restrict or revoke API access at their discretion.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">5. Anti-Spam Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              DMGenie is designed for legitimate customer engagement, not spam. You must only send messages to users who have actively engaged with your content by commenting. Sending unsolicited, repetitive, or irrelevant messages is prohibited and may result in immediate account termination. We reserve the right to throttle or disable automated messaging if abuse is detected.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">6. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are solely responsible for all activity that occurs under your account.</li>
              <li>You must notify us immediately at <a href="mailto:support@dmgennie.in" className="text-accent-blue hover:underline">support@dmgennie.in</a> if you suspect unauthorised access.</li>
              <li>You are responsible for ensuring your use complies with local laws and regulations.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">7. Subscription & Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              DMGenie currently offers a free tier. Paid plans, when introduced, will be subject to additional pricing terms communicated clearly before purchase. All payments are processed securely. Refunds may be requested within 7 days of a charge by contacting <a href="mailto:support@dmgennie.in" className="text-accent-blue hover:underline">support@dmgennie.in</a>. We reserve the right to change pricing with 30 days' notice.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All DMGenie branding, software, designs, and content are owned by DMGenie and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without written permission. You retain ownership of all content you create and messages you configure within the platform.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              DMGenie is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, as API availability is subject to Meta's infrastructure. We are not responsible for changes to Meta's API policies that affect service functionality.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, DMGenie shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to loss of revenue, data, or business opportunities. Our total liability shall not exceed the amount paid by you to DMGenie in the 12 months preceding the claim.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may terminate your account at any time by contacting support. Upon termination, your data will be deleted per our Privacy Policy.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of India.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms at any time. We will notify you of material changes via email or in-app notice. Continued use after changes take effect constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">14. Contact</h2>
            <div className="mt-2 p-5 bg-card border border-border rounded-2xl">
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
