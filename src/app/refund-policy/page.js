import Link from "next/link";

export const metadata = {
  title: "Refund Policy",
  description:
    "Read the ORENTEMIST refund policy covering order cancellations, refunds, damaged or incorrect items, and refund processing.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-black">
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
            Refund Policy
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-black/60">
            We want every ORENTEMIST order to be a smooth and satisfying
            experience. This policy explains when refunds may be available,
            how cancellations are handled, and what to do if there is an issue
            with your order.
          </p>

          <p className="mt-4 text-sm text-black/50">
            Last updated: September 2026
          </p>
        </div>

        <div className="space-y-12">
          {/* 01 */}
          <section>
            <h2 className="text-2xl font-semibold">
              1. Order Cancellation
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                If you need to cancel an order, please contact ORENTEMIST as
                soon as possible after placing the order.
              </p>

              <p>
                Cancellation requests may be accepted before an order has been
                fulfilled or shipped. Once an order has already been processed
                for delivery, cancellation may no longer be possible.
              </p>

              <p>
                Where a cancellation of a paid order is approved and a refund
                is applicable, the payment will be refunded through the
                payment method or payment processor used for the original
                transaction.
              </p>
            </div>
          </section>

          {/* 02 */}
          <section>
            <h2 className="text-2xl font-semibold">
              2. Eligible Refunds
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>A refund may be considered where:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Your order was cancelled and a refund is applicable.
                </li>
                <li>
                  You received an incorrect product due to an error on our
                  part.
                </li>
                <li>
                  Your order arrived damaged and the issue is verified.
                </li>
                <li>
                  ORENTEMIST is unable to fulfil a paid order.
                </li>
                <li>
                  Another valid issue with the order is confirmed by our
                  customer support team.
                </li>
              </ul>
            </div>
          </section>

          {/* 03 */}
          <section>
            <h2 className="text-2xl font-semibold">
              3. Damaged or Incorrect Items
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                If your order arrives damaged or you receive an incorrect
                product, please contact us as soon as possible after delivery.
              </p>

              <p>
                To help us investigate the issue, we may request photographs
                or other relevant information about the product, packaging,
                order, or delivery.
              </p>

              <p>
                After reviewing the issue, ORENTEMIST may offer an appropriate
                resolution, which may include a replacement or refund where
                applicable.
              </p>
            </div>
          </section>

          {/* 04 */}
          <section>
            <h2 className="text-2xl font-semibold">
              4. Non-Refundable Situations
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Refunds are generally not available for products that have
                been opened, used, altered, or damaged after delivery due to
                customer handling.
              </p>

              <p>
                Because fragrances are personal-use products, we may be unable
                to accept returns simply because a customer does not like the
                scent after opening or using the product.
              </p>

              <p>
                Products that were correctly supplied according to the order
                may not qualify for a refund solely because the customer
                changed their mind after the product has been opened or used.
              </p>
            </div>
          </section>

          {/* 05 */}
          <section>
            <h2 className="text-2xl font-semibold">
              5. Refund Processing
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Approved refunds are processed through the payment system used
                for the original transaction where possible.
              </p>

              <p>
                Once a refund has been successfully initiated, the time it
                takes for the funds to appear in your account may depend on
                the payment provider and your bank or financial institution.
              </p>

              <p>
                ORENTEMIST cannot guarantee a specific bank processing time
                after a refund has been successfully submitted.
              </p>
            </div>
          </section>

          {/* 06 */}
          <section>
            <h2 className="text-2xl font-semibold">
              6. Refund Amount
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                Where a full refund is approved, the applicable amount paid
                for the cancelled or affected order will be refunded.
              </p>

              <p>
                Where only part of an order is affected, the refund amount
                may be limited to the affected item or applicable portion of
                the order.
              </p>

              <p>
                Delivery or other charges may be treated separately depending
                on the reason for the refund and the circumstances of the
                order.
              </p>
            </div>
          </section>

          {/* 07 */}
          <section>
            <h2 className="text-2xl font-semibold">
              7. Promotional Discounts and Coupons
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                If a discount code or coupon was used on an order that is
                subsequently cancelled or refunded, the value of the refund
                will be based on the amount actually paid for the order,
                subject to the applicable circumstances.
              </p>

              <p>
                A promotional coupon or discount may not necessarily be
                converted into cash or reinstated after a refund unless
                ORENTEMIST determines that it is appropriate to do so.
              </p>
            </div>
          </section>

          {/* 08 */}
          <section>
            <h2 className="text-2xl font-semibold">
              8. How to Request a Refund
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                To request assistance with a refund, please contact ORENTEMIST
                and provide your order number together with a clear
                description of the issue.
              </p>

              <p>
                If your request concerns a damaged or incorrect item, include
                photographs where possible so that our team can review the
                issue.
              </p>
            </div>
          </section>

          {/* 09 */}
          <section>
            <h2 className="text-2xl font-semibold">
              9. Order Issues and Support
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                If you experience a problem with your order, please contact us
                before attempting to dispute the transaction with your bank or
                payment provider. We will review the issue and work with you
                to determine an appropriate resolution.
              </p>

              <p>
                Please keep your order confirmation and payment information
                available when contacting support.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-2xl font-semibold">
              10. Policy Updates
            </h2>

            <div className="mt-4 space-y-4 text-[15px] leading-7 text-black/70">
              <p>
                ORENTEMIST may update this Refund Policy from time to time to
                reflect changes to our services, payment processes, or
                applicable requirements.
              </p>

              <p>
                The latest version published on this page will apply to
                future orders unless otherwise stated.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t border-black/10 pt-10">
            <h2 className="text-2xl font-semibold">
              Contact ORENTEMIST
            </h2>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-black/70">
              If you have questions about this Refund Policy or need help
              with an order, please contact the ORENTEMIST support team with
              your order number and relevant details.
            </p>

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
              href="/refund-policy"
              className="text-black transition"
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