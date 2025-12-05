import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Mamalu Kitchen terms and conditions for using our services.",
};

export default function TermsPage() {
  return (
    <div className="py-20 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-stone max-w-none">
          <p className="text-stone-600 mb-6">
            Last updated: January 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-stone-600">
              By accessing and using the Mamalu Kitchen website and services,
              you agree to be bound by these Terms of Service. If you do not
              agree with any part of these terms, please do not use our
              services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              2. Products and Orders
            </h2>
            <p className="text-stone-600 mb-4">
              All orders are subject to product availability. We reserve the
              right to limit quantities and refuse orders at our discretion.
              Prices are subject to change without notice.
            </p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>All prices are in AED unless otherwise stated</li>
              <li>Payment is required at the time of purchase</li>
              <li>Orders are confirmed upon payment verification</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              3. Cooking Classes
            </h2>
            <p className="text-stone-600 mb-4">
              Class bookings are subject to the following terms:
            </p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>
                Cancellations made 48+ hours before class: Full refund
              </li>
              <li>
                Cancellations made 24-48 hours before class: 50% refund
              </li>
              <li>
                Cancellations made less than 24 hours: No refund
              </li>
              <li>Class rescheduling subject to availability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              4. Catering and Events
            </h2>
            <p className="text-stone-600">
              Catering orders require a deposit to confirm booking. Final
              payment is due 7 days before the event. Cancellation policies
              will be outlined in your catering agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-stone-600">
              All content on this website, including recipes, images, and
              branding, is the property of Mamalu Kitchen. You may not
              reproduce, distribute, or use our content for commercial purposes
              without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-stone-600">
              Mamalu Kitchen shall not be liable for any indirect, incidental,
              or consequential damages arising from your use of our services.
              Our liability is limited to the amount paid for the specific
              product or service in question.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
              7. Contact Information
            </h2>
            <p className="text-stone-600">
              For questions regarding these terms, please contact us at{" "}
              <a
                href="mailto:legal@mamalukitchen.com"
                className="text-amber-600 hover:text-amber-700"
              >
                legal@mamalukitchen.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
