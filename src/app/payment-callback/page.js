"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

async function getCsrfToken() {
  const response = await fetch(
    `${API_URL}/auth/csrf/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.csrfToken) {
    throw new Error(
      data.detail ||
        data.error ||
        "Could not get CSRF token."
    );
  }

  return data.csrfToken;
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const [message, setMessage] =
    useState(
      "Verifying your payment..."
    );

  const hasStartedVerification =
    useRef(false);

  useEffect(() => {
    async function verifyPayment() {
      if (
        hasStartedVerification.current
      ) {
        return;
      }

      hasStartedVerification.current =
        true;

      const reference =
        searchParams.get(
          "reference"
        );

      const pendingOrderId =
        localStorage.getItem(
          "orentemist_pending_order_id"
        );

      const pendingCheckoutToken =
        localStorage.getItem(
          "orentemist_pending_checkout_token"
        );

      if (!reference) {
        setMessage(
          "Payment reference was not found."
        );

        return;
      }

      if (!pendingCheckoutToken) {
        setMessage(
          "Checkout information was not found. Please contact support if your payment was completed."
        );

        return;
      }

      try {
        const csrfToken =
          await getCsrfToken();

        const verifyUrl =
          `${API_URL}/orders/verify-payment/`;

        const response =
          await fetch(
            verifyUrl,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "X-CSRFToken":
                  csrfToken,
              },

              credentials:
                "include",

              body: JSON.stringify({
                reference:
                  reference,

                checkout_token:
                  pendingCheckoutToken,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.detail ||
              "Payment verification failed."
          );
        }

        const orderId =
          data.order?.id ||
          pendingOrderId;

        if (!orderId) {
          throw new Error(
            "Payment was verified, but the order ID could not be found."
          );
        }

        // Checkout submits the complete cart, so a confirmed payment clears it.
        localStorage.removeItem("orentemist_cart");

        localStorage.removeItem(
          "orentemist_pending_order_id"
        );

        localStorage.removeItem(
          "orentemist_pending_payment_reference"
        );

        localStorage.removeItem(
          "orentemist_pending_checkout_token"
        );

        window.dispatchEvent(
          new Event(
            "orentemist-cart-updated"
          )
        );

        const reviewRequired =
          response.status === 202 ||
          (
            data.order?.payment_status ===
              "paid" &&
            data.order?.status ===
              "pending"
          );

        router.replace(
          `/order-success?order=${orderId}&reference=${encodeURIComponent(
            reference
          )}${
            reviewRequired
              ? "&review=1"
              : ""
          }`
        );
      } catch (error) {
        console.error(
          "Payment verification error:",
          error
        );

        setMessage(
          error?.message ||
            "We could not verify your payment."
        );
      }
    }

    verifyPayment();
  }, [
    router,
    searchParams,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-5 text-black">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-white">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>

        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
          ORENTEMIST
        </p>

        <h1 className="mt-3 text-2xl font-semibold">
          Processing Payment
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          {message}
        </p>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
