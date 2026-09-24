"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function OrderSuccessContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("order");
  const reference = searchParams.get("reference");

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-3xl font-semibold text-black">
          Order Confirmed
        </h1>

        <p className="mt-4 text-gray-600">
          Thank you for your purchase. Your payment was successful and your
          order has been received.
        </p>

        {orderId && (
          <div className="mt-6 rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Order Number
            </p>

            <p className="mt-1 text-lg font-semibold text-black">
              #{orderId}
            </p>
          </div>
        )}

        {reference && (
          <p className="mt-4 text-xs text-gray-400 break-all">
            Payment reference: {reference}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full rounded-xl bg-black px-6 py-3 text-center text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </Link>

          <Link
            href="/"
            className="w-full rounded-xl border border-gray-300 px-6 py-3 text-center text-black transition hover:bg-gray-50"
          >
            Back Home
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}