'use client'

import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="relative py-16 bg-foreground text-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-12 md:col-span-4">
            <div className="text-3xl font-black mb-4">🧞 DMGenie</div>
            <p className="text-background/70 leading-relaxed mb-6">
              Go viral on Instagram with DM automation. Meta Verified partner trusted by 10k+ creators worldwide.
            </p>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="font-bold text-background mb-4">Product</h4>
            <div className="space-y-3">
              <a href="#features" className="block text-background/70 hover:text-background gentle-animation text-sm">Features</a>
              <Link to="/signup" className="block text-background/70 hover:text-background gentle-animation text-sm">Pricing</Link>
              <a href="#faq" className="block text-background/70 hover:text-background gentle-animation text-sm">FAQ</a>
            </div>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="font-bold text-background mb-4">Company</h4>
            <div className="space-y-3">
              <a href="#" className="block text-background/70 hover:text-background gentle-animation text-sm">Affiliate</a>
              <a href="#" className="block text-background/70 hover:text-background gentle-animation text-sm">Help Centre</a>
              <a href="#" className="block text-background/70 hover:text-background gentle-animation text-sm">Privacy Policy</a>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <h4 className="font-bold text-background mb-4">Get Started</h4>
            <p className="text-background/70 text-sm mb-4">Start automating your Instagram DMs today. No credit card required.</p>
            <Link to="/signup" className="inline-block bg-accent-blue text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 gentle-animation">
              Start For Free
            </Link>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-background/70 mb-4 md:mb-0">
              © 2025 DMGenie. All rights reserved.
            </div>
            <div className="text-sm text-background/70">
              Meta Verified Partner
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
