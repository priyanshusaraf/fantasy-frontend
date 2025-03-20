import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto py-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-3 text-white">MatchUp Fantasy</h3>
            <p className="text-sm mb-4">
              Your ultimate fantasy sports experience. Create dream teams, join tournaments, and compete in real-time.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/policies/terms" className="hover:text-blue-400 transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/refunds" className="hover:text-blue-400 transition-colors">
                  Cancellations & Refunds
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-blue-400 transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/fantasy/contests" className="hover:text-blue-400 transition-colors">
                  Contests
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-blue-400 transition-colors">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-blue-400 transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/user/dashboard" className="hover:text-blue-400 transition-colors">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-white">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/policies/contact" className="hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="mailto:support@matchup.ltd" className="hover:text-blue-400 transition-colors">
                  support@matchup.ltd
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>© {new Date().getFullYear()} MatchUp Fantasy. All rights reserved.</p>
          <p className="mt-2">Payment processing secured by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
