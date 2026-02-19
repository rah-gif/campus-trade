import React from "react";
import Navbar from "../components/Navbar";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
            Terms of Service
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Last Updated: January 1, 2026
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                1. Agreement to Terms
              </h2>
              <p>
                By accessing or using CampusTrade, you agree to be bound by
                these Terms of Service and our Privacy Policy. If you do not
                agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                2. User Accounts
              </h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  You must be a currently enrolled student or staff member with
                  a valid campus email address to create an account.
                </li>
                <li>
                  You are responsible for safeguarding the password that you use
                  to access the service and for any activities or actions under
                  your password.
                </li>
                <li>
                  You agree not to disclose your password to any third party.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                3. Selling and Buying Policy
              </h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Prohibited Items:</strong> You may not list illegal
                  items, weapons, drugs, or any items that violate campus
                  policies.
                </li>
                <li>
                  <strong>Accuracy:</strong> Sellers must provide accurate
                  descriptions and images of items.
                </li>
                <li>
                  <strong>Safety:</strong> Users are encouraged to meet in safe,
                  public locations on campus for transactions. CampusTrade is
                  not responsible for off-platform disputes.
                </li>
                <li>
                  <strong>No Fees:</strong> CampusTrade currently does not
                  charge fees for listing or selling, but we facilitate the
                  connection only.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                4. User Conduct
              </h2>
              <p>
                You agree not to engage in any of the following prohibited
                activities:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Harassing, threatening, or defrauding other users.</li>
                <li>Posting false or misleading information.</li>
                <li>Using the service for any illegal purpose.</li>
                <li>
                  Interfering with or disrupting the integrity or performance of
                  the Service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                5. Termination
              </h2>
              <p>
                We may terminate or suspend your account immediately, without
                prior notice or liability, for any reason whatsoever, including
                without limitation if you breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                6. Limitation of Liability
              </h2>
              <p>
                In no event shall CampusTrade, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses, resulting from your
                access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                7. Changes
              </h2>
              <p>
                We reserve the right, at our sole discretion, to modify or
                replace these Terms at any time. By continuing to access or use
                our Service after those revisions become effective, you agree to
                be bound by the revised terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
