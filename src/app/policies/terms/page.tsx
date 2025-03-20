import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | MatchUp Fantasy",
  description: "Terms and conditions for using MatchUp Fantasy services.",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: March 2024</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using MatchUp Fantasy services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Eligibility</h2>
          <p className="mb-3">
            To use MatchUp Fantasy services, you must:
          </p>
          <ul className="list-disc pl-5 mb-3">
            <li>Be at least 18 years of age</li>
            <li>Be a resident of a state/region where fantasy sports are legal</li>
            <li>Have the legal capacity to enter into a binding agreement</li>
            <li>Not be restricted from participating in online fantasy contests</li>
          </ul>
          <p>
            We reserve the right to verify your eligibility and to deny service to anyone at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
          <p className="mb-3">
            When registering for MatchUp Fantasy, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account.
          </p>
          <p>
            You agree to accept responsibility for all activities that occur under your account. We reserve the right to refuse service, terminate accounts, or remove content at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Fantasy Contests and Payments</h2>
          <p className="mb-3">
            Participation in paid contests requires a financial transaction. You agree to pay all fees and charges associated with your account on a timely basis. All payments are processed securely through our payment partner, Razorpay.
          </p>
          <p className="mb-3">
            Contest entries are final upon submission. Rules for each contest will be clearly displayed prior to entry. We reserve the right to cancel contests at our discretion and will refund entry fees in such cases.
          </p>
          <p>
            Winnings are subject to verification and compliance with these terms. Fraudulent activities will result in forfeiture of winnings and possible legal action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Prohibited Conduct</h2>
          <p className="mb-3">
            You agree not to:
          </p>
          <ul className="list-disc pl-5">
            <li>Use multiple accounts</li>
            <li>Engage in collusion with other players</li>
            <li>Use automated scripts or bots</li>
            <li>Manipulate or attempt to manipulate contests</li>
            <li>Engage in any activity that disrupts the functioning of the service</li>
            <li>Harass, threaten, or intimidate other users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
          <p>
            All content, features, and functionality of MatchUp Fantasy, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, and data compilations, are the exclusive property of MatchUp Fantasy or its licensors and are protected by copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p>
            MatchUp Fantasy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, resulting from your access to or use of or inability to access or use the services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the date at the top of these Terms and by maintaining a current version of the Terms at our website. Your continued use of the service after such modifications constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at support@matchup.ltd.
          </p>
        </section>
      </div>

      <div className="mt-8 text-center">
        <Link 
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 