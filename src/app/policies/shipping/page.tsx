import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy | MatchUp Fantasy",
  description: "Information about MatchUp Fantasy's digital services shipping policy.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Shipping Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: March 2024</p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Digital Services Only</h2>
        <p className="mb-4">
          MatchUp Fantasy is a completely digital fantasy sports platform. We do not sell or ship physical products. All our services, including:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Fantasy sports contests</li>
          <li>Account access</li>
          <li>Statistical information</li>
          <li>Game information</li>
          <li>Prize distribution</li>
        </ul>
        <p>
          These are delivered digitally through our website and mobile applications. No physical shipment is involved in our service provision.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Prize Distribution</h2>
        <p className="mb-4">
          All prizes won on MatchUp Fantasy are distributed digitally via:
        </p>
        <ul className="list-disc pl-5">
          <li>Direct deposit to your registered bank account</li>
          <li>Digital wallet transfers</li>
          <li>Credit to your MatchUp Fantasy account balance</li>
          <li>Other electronic payment methods as available</li>
        </ul>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Payment Processing</h2>
        <p className="mb-4">
          All payments on our platform are processed digitally through our secured payment partner, Razorpay. The following apply to our payment processing:
        </p>
        <ul className="list-disc pl-5">
          <li>Instant digital delivery of contest entries</li>
          <li>Secure electronic processing of all transactions</li>
          <li>No physical receipts (all receipts provided digitally)</li>
          <li>Prompt digital disbursement of winnings</li>
        </ul>
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