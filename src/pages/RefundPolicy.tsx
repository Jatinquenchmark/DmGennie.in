import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Mail, MessageCircle } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { PageHeader } from '@/components/PageHeader'

export default function RefundPolicy() {
  const effectiveDate = '12 Aug 2025'
  const supportEmail = 'support@dmgennie.in'
  const whatsappNumber = '+91-7982454237'

  return (
    <div className="premium-gradient min-h-screen text-foreground">
      <PageHeader />

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-36">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-accent-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-blue/10 px-4 py-2 text-sm font-semibold text-accent-blue">
            <FileText className="h-4 w-4" /> Return and Refund Policy
          </div>
          <h1 className="mb-4 text-4xl font-extrabold text-foreground md:text-5xl">
            Return and Refund Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Effective date: <strong>{effectiveDate}</strong>
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            At DMGennie, we want creators and businesses to feel confident when using our Instagram automation tools.
            This policy explains how cancellations and refunds work for free, monthly, and annual plans.
          </p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">1. Free Plan</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>The Free plan does not require payment.</li>
              <li>You can stop using the Free plan at any time without any obligation.</li>
              <li>Users on the Free plan can upgrade to a paid plan whenever they choose.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">2. Monthly Plan</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>You may cancel your Monthly plan at least 3 days before your next payment date.</li>
              <li>No refunds are provided for the current billing cycle after payment is completed.</li>
              <li>Once cancelled, your subscription will not renew for the next billing cycle.</li>
              <li>Your paid features remain available until the end of the current billing cycle.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">3. Annual Plan</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>You may cancel your Annual plan at any time.</li>
              <li>No refunds are provided for the current billing cycle after payment is completed.</li>
              <li>Once cancelled, your subscription will not renew for the next annual billing cycle.</li>
              <li>Your paid features remain available until the end of the current billing cycle.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">4. Promotional Offers</h2>
            <p className="leading-relaxed text-muted-foreground">
              Promotional pricing, including the Pro first-month offer, is billed once the payment is successful.
              Promotional charges are not refundable for the active billing cycle unless required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">5. How to Cancel Your Subscription</h2>
            <p className="leading-relaxed text-muted-foreground">
              To cancel your subscription, contact DMGennie support before your renewal date. Once cancellation is
              processed, you will receive an email confirmation.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 font-semibold text-foreground transition hover:border-accent-blue/30 hover:bg-white"
              >
                <MessageCircle className="h-5 w-5 text-accent-blue" />
                WhatsApp: {whatsappNumber}
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 font-semibold text-foreground transition hover:border-accent-blue/30 hover:bg-white"
              >
                <Mail className="h-5 w-5 text-accent-blue" />
                {supportEmail}
              </a>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">6. Abuse of Refunds</h2>
            <p className="leading-relaxed text-muted-foreground">
              We reserve the right to deny refund or cancellation requests from users who repeatedly subscribe and
              cancel to abuse this policy. Such accounts may also be subject to suspension.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">7. Changes to This Policy</h2>
            <p className="leading-relaxed text-muted-foreground">
              We may update this policy from time to time. Changes will be posted on this page, and significant
              updates may be communicated by email or in-app notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-foreground">8. Contact</h2>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-semibold text-foreground">DMGennie Support</p>
              <p className="mt-1 text-muted-foreground">
                Email:{' '}
                <a href={`mailto:${supportEmail}`} className="text-accent-blue hover:underline">
                  {supportEmail}
                </a>
              </p>
              <p className="text-muted-foreground">
                Website:{' '}
                <a href="https://www.dmgennie.in" className="text-accent-blue hover:underline">
                  www.dmgennie.in
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
