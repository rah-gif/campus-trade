import React from "react";
import Navbar from "../components/Navbar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
            Privacy Policy
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Last Updated: January 1, 2026
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                1. Introduction
              </h2>
              <p>
                Welcome to CampusTrade. We respect your privacy and are
                committed to protecting your personal data. This privacy policy
                will inform you as to how we look after your personal data when
                you visit our website and tell you about your privacy rights and
                how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                2. Data We Collect
              </h2>
              <p>
                We may collect, use, store and transfer different kinds of
                personal data about you which we have grouped together follows:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Identity Data:</strong> includes first name, last
                  name, student ID, and batch/year.
                </li>
                <li>
                  <strong>Contact Data:</strong> includes email address (campus
                  email) and telephone numbers provided for transactions.
                </li>
                <li>
                  <strong>Transaction Data:</strong> includes details about
                  items you have listed, sold, or purchased.
                </li>
                <li>
                  <strong>Technical Data:</strong> includes internet protocol
                  (IP) address, your login data, browser type and version.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                3. How We Use Your Data
              </h2>
              <p>
                We will only use your personal data when the law allows us to.
                Most commonly, we will use your personal data in the following
                circumstances:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>To register you as a new user.</li>
                <li>
                  To enable you to list items for sale and communicate with
                  other students.
                </li>
                <li>
                  To manage our relationship with you, including notifying you
                  about changes to our terms or privacy policy.
                </li>
                <li>
                  To administer and protect our business and this website.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                4. Data Security
              </h2>
              <p>
                We have put in place appropriate security measures to prevent
                your personal data from being accidentally lost, used or
                accessed in an unauthorized way, altered or disclosed. In
                addition, we limit access to your personal data to those
                employees, agents, contractors who have a business need to know.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                5. Your Legal Rights
              </h2>
              <p>
                Under certain circumstances, you have rights under data
                protection laws in relation to your personal data, including the
                right to request access, correction, erasure, restriction,
                transfer, to object to processing, to portability of data and
                (where the lawful ground of processing is consent) to withdraw
                consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                6. Contact Us
              </h2>
              <p>
                If you have any questions about this privacy policy or our
                privacy practices, please contact the administration at:{" "}
                <a
                  href="mailto:admin@campus-trade.lnbti.lk"
                  className="text-indigo-600 hover:underline"
                >
                  admin@campus-trade.lnbti.lk
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
