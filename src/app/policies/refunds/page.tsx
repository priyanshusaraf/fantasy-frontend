import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancellations and Refunds | MatchUp Fantasy",
  description: "MatchUp Fantasy's policy on cancellations, refunds, and contest entry fees.",
};

export default function RefundPolicyPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Cancellations and Refunds Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: March 2024</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Contest Entry Fees</h2>
          <p className="mb-3">
            When you pay an entry fee to join a fantasy contest on MatchUp Fantasy, you are purchasing a spot in that specific contest. Please note the following regarding contest entry fees:
          </p>
          <ul className="list-disc pl-5">
            <li>All entry fees are clearly displayed before you join a contest</li>
            <li>Entry fees are processed securely through our payment partner, Razorpay</li>
            <li>By submitting your payment, you acknowledge and agree to the terms of this policy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Cancellation by User</h2>
          <p className="mb-3">
            You may cancel your participation in a contest under the following conditions:
          </p>
          <ul className="list-disc pl-5 mb-3">
            <li>The contest has not yet locked (typically when the first game begins)</li>
            <li>The contest is not already filled to capacity</li>
            <li>The cancellation request is made at least 10 minutes before the contest locks</li>
          </ul>
          <p>
            To cancel, navigate to the "My Contests" section of your account and select the "Cancel Entry" option for the applicable contest.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Refund Eligibility</h2>
          <p className="mb-3">Refunds of entry fees are available in the following situations:</p>
          <ul className="list-disc pl-5">
            <li>You cancel your participation before the contest locks (as described above)</li>
            <li>MatchUp Fantasy cancels a contest (see Contest Cancellation below)</li>
            <li>Technical error that prevented your proper participation despite being charged</li>
            <li>Duplicate charges for the same contest entry</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Contest Cancellation</h2>
          <p className="mb-3">
            MatchUp Fantasy reserves the right to cancel contests under certain circumstances, including but not limited to:
          </p>
          <ul className="list-disc pl-5 mb-3">
            <li>Insufficient number of participants</li>
            <li>Technical issues affecting the integrity of the contest</li>
            <li>Game postponements or cancellations affecting a significant portion of the contest</li>
            <li>Unexpected events that compromise the fairness of the contest</li>
          </ul>
          <p>
            In the event of a contest cancellation, all entry fees will be refunded to the original payment method or credited to your MatchUp Fantasy account within 24-48 hours.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. No Refund Scenarios</h2>
          <p className="mb-3">
            Refunds will NOT be provided in the following situations:
          </p>
          <ul className="list-disc pl-5">
            <li>Contest has already locked (games have started)</li>
            <li>Poor performance of your selected players</li>
            <li>Player injuries or other natural sport occurrences</li>
            <li>User error in lineup selection</li>
            <li>Failure to submit/finalize lineups before the contest locks</li>
            <li>Violation of MatchUp Fantasy's Terms and Conditions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Partial Contest Adjustments</h2>
          <p>
            If a real-world sporting event that is part of a fantasy contest is postponed, canceled, or shortened after a contest has locked, MatchUp Fantasy will handle these situations according to our Contest Adjustment Policy. In general, if a significant portion of the contest is affected, we may:
          </p>
          <ul className="list-disc pl-5">
            <li>Adjust scoring to only include completed games</li>
            <li>Extend the contest to include rescheduled games</li>
            <li>Issue partial refunds in exceptional circumstances</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Refund Process</h2>
          <p className="mb-3">
            If you are eligible for a refund:
          </p>
          <ul className="list-disc pl-5">
            <li>For self-cancelled entries: Refunds are processed automatically</li>
            <li>For contest cancellations: Refunds are processed automatically</li>
            <li>For technical errors: Submit a support request within 48 hours</li>
          </ul>
          <p className="mt-3">
            Refunds are typically processed within 24-48 hours and will be issued to the original payment method used. Depending on your bank or payment provider, it may take additional time for the refund to appear in your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Contact Us</h2>
          <p>
            If you have questions about the refund policy or need to request a refund for a situation not covered by automatic refunds, please contact our support team at support@matchup.ltd with your transaction details.
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