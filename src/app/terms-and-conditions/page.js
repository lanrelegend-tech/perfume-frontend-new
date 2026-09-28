import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions",
  description:
    "Read the ORENTEMIST Terms & Conditions governing purchases, payments, orders, delivery, products, accounts, and use of our website.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-black">
      {/* Header */}
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.25em]"
          >
            ORENTEMIST
          </Link>

          <Link
            href="/"
            className="text-sm text-black/60 transition hover:text-black"
          >
            Back to Store
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="mb-14">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-black/50">
            ORENTEMIST
          </p>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Terms & Conditions
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-black/60">
            These Terms & Conditions explain the rules that apply when you
            access the ORENTEMIST website, create an account, place an order,
            or purchase products from us.
          </p>

          <p className="mt-4 text-sm text-black/50">
            Last updated: September 2026
          </p>
        </div>

        <div className="space-y-12">
          {/* 01 */}
          <section>
            <h2 className="text-2xl font-semibold">
              1. About ORENTEMIST
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                ORENTEMIST is an online fragrance store offering perfumes and
                related products to customers.
              </p>

              <p>
                By accessing or using this website, you agree to comply with
                these Terms & Conditions. If you do not agree with these terms,
                please do not use the website or place an order.
              </p>
            </div>
          </section>

          {/* 02 */}
          <section>
            <h2 className="text-2xl font-semibold">
              2. Use of Our Website
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                You agree to use the ORENTEMIST website only for lawful
                purposes and in a manner that does not interfere with the
                operation or security of the website.
              </p>

              <p>You must not:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Attempt to gain unauthorized access to our systems or
                  accounts.
                </li>
                <li>
                  Use the website for fraudulent or unlawful activities.
                </li>
                <li>
                  Submit false, misleading, or fraudulent information.
                </li>
                <li>
                  Attempt to interfere with the website, payment system, or
                  services.
                </li>
                <li>
                  Use automated methods to abuse or disrupt the website.
                </li>
              </ul>
            </div>
          </section>

          {/* 03 */}
          <section>
            <h2 className="text-2xl font-semibold">
              3. Customer Accounts
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Certain features of ORENTEMIST may require you to create an
                account.
              </p>

              <p>
                You are responsible for providing accurate information and
                keeping your account credentials secure.
              </p>

              <p>
                You should notify us if you believe that your account has been
                accessed without authorization.
              </p>

              <p>
                ORENTEMIST reserves the right to restrict or suspend an
                account where there is evidence of fraudulent, abusive, or
                unauthorized activity.
              </p>
            </div>
          </section>

          {/* 04 */}
          <section>
            <h2 className="text-2xl font-semibold">
              4. Products and Product Information
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                We make reasonable efforts to display product descriptions,
                images, prices, sizes, availability, and other information
                accurately.
              </p>

              <p>
                However, product images may appear slightly different depending
                on your device or display settings.
              </p>

              <p>
                Product availability may change without notice. A product
                appearing on the website does not guarantee that it will remain
                available when you complete your purchase.
              </p>

              <p>
                Where a product is marked as a pre-order, the expected
                availability or fulfilment period may differ from standard
                in-stock products.
              </p>
            </div>
          </section>

          {/* 05 */}
          <section>
            <h2 className="text-2xl font-semibold">
              5. Prices and Payments
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Prices displayed on the website are shown in Nigerian Naira
                (NGN) unless otherwise stated.
              </p>

              <p>
                The total amount payable for an order is calculated during
                checkout and may include applicable delivery charges and
                discounts.
              </p>

              <p>
                Payments are processed through our supported payment
                provider. ORENTEMIST does not manually process or store your
                complete payment card details.
              </p>

              <p>
                An order is not considered paid until the payment has been
                successfully confirmed by our payment system.
              </p>
            </div>
          </section>

          {/* 06 */}
          <section>
            <h2 className="text-2xl font-semibold">
              6. Orders and Order Confirmation
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                When you place an order, you are submitting a request to
                purchase the selected products at the displayed price and
                applicable delivery charges.
              </p>

              <p>
                After an order is successfully created, you may receive an
                order confirmation containing your order details.
              </p>

              <p>
                An order confirmation does not prevent ORENTEMIST from
                cancelling an order where there is a payment issue, product
                availability issue, suspected fraud, pricing error, or other
                legitimate reason.
              </p>

              <p>
                If an order that has already been paid for is cancelled and a
                refund is applicable, the refund will be handled in accordance
                with our{" "}
                <Link
                  href="/refund-policy"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  Refund Policy
                </Link>
                .
              </p>
            </div>
          </section>

          {/* 07 */}
          <section>
            <h2 className="text-2xl font-semibold">
              7. Delivery and Shipping
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Delivery charges are calculated based on the applicable
                delivery location and shipping rates available at checkout.
              </p>

              <p>
                Customers are responsible for providing accurate delivery
                information, including their name, phone number, address,
                state, city, and other information required to complete
                delivery.
              </p>

              <p>
                Incorrect or incomplete delivery information may cause delays
                or additional delivery arrangements.
              </p>

              <p>
                Delivery times may vary depending on location, courier
                operations, order volume, weather, public holidays, and other
                circumstances outside our direct control.
              </p>

              <p>
                An order may be marked as shipped once it has been handed over
                for delivery and delivered once the delivery process has been
                completed.
              </p>
            </div>
          </section>

          {/* 08 */}
          <section>
            <h2 className="text-2xl font-semibold">
              8. Order Cancellation and Refunds
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Cancellation and refund requests are handled according to the
                circumstances of the order and our Refund Policy.
              </p>

              <p>
                Where an eligible paid order is cancelled, the applicable
                refund may be processed through the original payment provider.
              </p>

              <p>
                Refund processing times may depend on the payment provider and
                the customer's bank or financial institution.
              </p>

              <p>
                Please review the full{" "}
                <Link
                  href="/refund-policy"
                  className="underline underline-offset-4 hover:no-underline"
                >
                  Refund Policy
                </Link>{" "}
                for more information.
              </p>
            </div>
          </section>

          {/* 09 */}
          <section>
            <h2 className="text-2xl font-semibold">
              9. Coupons and Promotional Offers
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Promotional codes and coupons may be subject to specific
                conditions, expiry dates, usage limits, minimum order values,
                or product restrictions.
              </p>

              <p>
                Unless otherwise stated, promotional offers cannot be
                exchanged for cash.
              </p>

              <p>
                ORENTEMIST reserves the right to cancel or restrict a
                promotional benefit where there is evidence of misuse,
                duplication, fraud, or an attempt to circumvent the applicable
                promotion rules.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-2xl font-semibold">
              10. Product Use and Safety
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Fragrances and related products should be used according to
                their intended purpose and any instructions or warnings
                provided with the product.
              </p>

              <p>
                Customers should avoid contact with the eyes and discontinue
                use if irritation or an adverse reaction occurs.
              </p>

              <p>
                Keep fragrance products away from excessive heat, flames, and
                other sources of ignition where applicable.
              </p>

              <p>
                Customers are responsible for reviewing product information
                and using products appropriately.
              </p>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-2xl font-semibold">
              11. Intellectual Property
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                The ORENTEMIST name, branding, logos, website design, product
                descriptions, graphics, photographs, text, and other original
                content on the website are owned by or used by ORENTEMIST with
                appropriate rights.
              </p>

              <p>
                You may not copy, reproduce, modify, distribute, sell, or
                commercially exploit our website content without prior
                permission.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-2xl font-semibold">
              12. Website Availability and Security
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                We aim to keep the ORENTEMIST website available and secure,
                but we do not guarantee that the website will always be
                uninterrupted, error-free, or available at all times.
              </p>

              <p>
                Temporary interruptions may occur because of maintenance,
                technical problems, payment-provider issues, hosting
                infrastructure, network problems, or circumstances outside our
                reasonable control.
              </p>
            </div>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-2xl font-semibold">
              13. Fraud and Unauthorized Transactions
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                ORENTEMIST may review orders and payment activity for security
                and fraud-prevention purposes.
              </p>

              <p>
                Orders may be delayed, rejected, or cancelled where there are
                reasonable indications of unauthorized payment activity,
                fraudulent behavior, abuse of promotions, or attempts to
                circumvent our security systems.
              </p>

              <p>
                Where a legitimate paid order is cancelled, any applicable
                refund will be handled according to our Refund Policy.
              </p>
            </div>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-2xl font-semibold">
              14. Limitation of Liability
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                ORENTEMIST will take reasonable steps to provide accurate
                products, order processing, payment handling, and delivery
                services.
              </p>

              <p>
                To the extent permitted by applicable law, ORENTEMIST will
                not be responsible for losses caused by circumstances outside
                our reasonable control, including third-party payment
                providers, courier delays, network failures, or other external
                service interruptions.
              </p>

              <p>
                Nothing in these Terms & Conditions is intended to exclude or
                limit any legal rights or protections that cannot lawfully be
                excluded or limited.
              </p>
            </div>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-2xl font-semibold">
              15. Privacy
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Information collected through the ORENTEMIST website may be
                used to process orders, provide customer support, manage
                accounts, communicate with customers, and operate our
                services.
              </p>

              <p>
                We will handle personal information in accordance with our
                applicable privacy practices and policies.
              </p>
            </div>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-2xl font-semibold">
              16. Changes to These Terms
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                ORENTEMIST may update these Terms & Conditions from time to
                time to reflect changes to our website, services, business
                operations, or applicable requirements.
              </p>

              <p>
                The latest version published on this page will apply to
                future use of the website and future orders unless otherwise
                stated.
              </p>
            </div>
          </section>

          {/* 17 */}
          <section>
            <h2 className="text-2xl font-semibold">
              17. Applicable Law
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                These Terms & Conditions are intended to operate in accordance
                with applicable laws and regulations governing the ORENTEMIST
                business and its transactions with customers.
              </p>

              <p>
                Nothing in these Terms is intended to remove or reduce rights
                that customers may have under applicable law.
              </p>
            </div>
          </section>

          {/* 18 */}
          <section>
            <h2 className="text-2xl font-semibold">
              18. Contact ORENTEMIST
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                If you have questions about these Terms & Conditions, your
                order, payment, delivery, or any other issue relating to the
                ORENTEMIST website, please contact our support team.
              </p>

              <p>
                When contacting us about an order, please provide your order
                number and the relevant details so that we can assist you
                efficiently.
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex border border-black bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/80"
              >
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-black/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} ORENTEMIST. All rights reserved.
          </p>

          <div className="flex gap-5">
            <Link
              href="/terms-and-conditions"
              className="text-black transition"
            >
              Terms & Conditions
            </Link>

            <Link
              href="/refund-policy"
              className="transition hover:text-black"
            >
              Refund Policy
            </Link>

            <Link
              href="/"
              className="transition hover:text-black"
            >
              Store
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}