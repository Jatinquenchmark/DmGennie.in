type CheckoutResult = {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

type RazorpayInstance = { open: () => void }

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

let scriptPromise: Promise<void> | null = null

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export async function openProSubscriptionCheckout({
  subscriptionId,
  customerName,
  customerEmail,
  onSuccess,
}: {
  subscriptionId: string
  customerName?: string
  customerEmail?: string
  onSuccess: (result: CheckoutResult) => void | Promise<void>
}) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!key) throw new Error('VITE_RAZORPAY_KEY_ID is not configured')
  await loadRazorpay()
  if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable')

  const checkout = new window.Razorpay({
    key,
    subscription_id: subscriptionId,
    name: 'DMGennie',
    description: 'Pro monthly subscription',
    prefill: { name: customerName || '', email: customerEmail || '' },
    theme: { color: '#6d2948' },
    handler: onSuccess,
  })
  checkout.open()
}
