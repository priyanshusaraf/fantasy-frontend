import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | MatchUp Fantasy",
  description: "Contact us for any questions about MatchUp Fantasy.",
};

export default function ContactPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
        <p className="mb-6">
          We're here to help! If you have any questions, concerns, or feedback about MatchUp Fantasy, please don't hesitate to reach out.
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Email</h3>
            <p className="text-blue-600 dark:text-blue-400">support@matchup.ltd</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Business Hours</h3>
            <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Address</h3>
            <p>123 Fantasy Lane</p>
            <p>Bengaluru, Karnataka 560001</p>
            <p>India</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Report Issues</h2>
        <p className="mb-4">
          Experiencing technical problems or have found a bug? Please provide as much detail as possible:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Your device and browser information</li>
          <li>Steps to reproduce the issue</li>
          <li>Screenshots (if applicable)</li>
        </ul>
        <p>
          For payment-related inquiries, please include your transaction ID.
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