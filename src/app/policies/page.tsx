import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Policies | MatchUp Fantasy",
  description: "MatchUp Fantasy's legal policies, terms, and guidelines.",
};

export default function PoliciesPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Legal Policies</h1>
      <p className="text-center mb-10 max-w-xl mx-auto">
        These policies govern your use of MatchUp Fantasy services. Please review them carefully to understand your rights and obligations.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/policies/terms">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
            <h2 className="text-xl font-semibold mb-3">Terms and Conditions</h2>
            <p className="text-gray-600 dark:text-gray-300">
              The rules and regulations governing your use of the MatchUp Fantasy platform.
            </p>
          </div>
        </Link>

        <Link href="/policies/privacy">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
            <h2 className="text-xl font-semibold mb-3">Privacy Policy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              How we collect, use, and protect your personal information.
            </p>
          </div>
        </Link>

        <Link href="/policies/refunds">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
            <h2 className="text-xl font-semibold mb-3">Cancellations and Refunds</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Our policies regarding contest cancellations and refund eligibility.
            </p>
          </div>
        </Link>

        <Link href="/policies/shipping">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full">
            <h2 className="text-xl font-semibold mb-3">Shipping Policy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Information about our digital-only service with no physical shipments.
            </p>
          </div>
        </Link>

        <Link href="/policies/contact">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow h-full md:col-span-2">
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300">
              How to get in touch with our support team for any questions or concerns.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Compliance Information</h2>
        <p className="mb-4">
          MatchUp Fantasy is committed to legal compliance and responsible gaming. We follow industry best practices and applicable regulations for fantasy sports platforms.
        </p>
        <p>
          Our payment processing is securely handled by Razorpay, a trusted payment gateway provider in India.
        </p>
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