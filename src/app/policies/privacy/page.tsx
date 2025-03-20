import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | MatchUp Fantasy",
  description: "Learn how MatchUp Fantasy handles your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: March 2024</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p>
            At MatchUp Fantasy, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fantasy sports platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          <div className="mb-4">
            <h3 className="font-medium mb-2">Personal Information</h3>
            <p className="mb-2">We may collect personal information that you voluntarily provide when using our service, including:</p>
            <ul className="list-disc pl-5">
              <li>Name, email address, and contact details</li>
              <li>Date of birth (to verify age eligibility)</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely through Razorpay)</li>
              <li>Profile information and preferences</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Automatically Collected Information</h3>
            <p className="mb-2">When you access our platform, we may automatically collect certain information, including:</p>
            <ul className="list-disc pl-5">
              <li>Device information (type, model, operating system)</li>
              <li>IP address and location data</li>
              <li>Browser type and settings</li>
              <li>Usage data and platform interactions</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-3">We use the information we collect to:</p>
          <ul className="list-disc pl-5">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and administer contests</li>
            <li>Verify your identity and eligibility</li>
            <li>Communicate with you about account activity and updates</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Send you promotional materials (if you've opted in)</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Detect and prevent fraudulent activities</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
          <p className="mb-3">
            We may share your information with third parties in the following situations:
          </p>
          <ul className="list-disc pl-5">
            <li>With service providers who perform services on our behalf (payment processors, cloud services)</li>
            <li>To comply with legal requirements and law enforcement requests</li>
            <li>To protect our rights, privacy, safety or property</li>
            <li>In connection with a business transaction (merger, acquisition, or sale)</li>
            <li>With your consent or at your direction</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Payment Information</h2>
          <p>
            All payment information is processed through our secure payment partner, Razorpay. We do not store complete credit card or bank account information on our servers. For information about how Razorpay processes your data, please refer to Razorpay's privacy policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
          <p className="mb-3">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-5">
            <li>Accessing and reviewing your personal information</li>
            <li>Updating or correcting inaccuracies</li>
            <li>Requesting deletion of your personal information</li>
            <li>Restricting or objecting to processing</li>
            <li>Data portability</li>
            <li>Withdrawing consent</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us at privacy@matchup.ltd.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect or solicit personal information from children. If we learn that we have collected personal information from a child, we will delete that information as quickly as possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new privacy policy on this page and updating the "Last Updated" date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            If you have questions or concerns about this privacy policy or our data practices, please contact us at privacy@matchup.ltd.
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