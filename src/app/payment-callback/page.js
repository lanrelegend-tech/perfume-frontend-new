"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";
function getGuestSessionId() {
  let sessionId = localStorage.getItem(
    "orentemist_guest_session_id"
  );
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(
      "orentemist_guest_session_id",
      sessionId
    );
  }
  return sessionId;
}
export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();
  const [message, setMessage] =
    useState(
      "Verifying your payment..."
    );
  useEffect(() => {
    async function verifyPayment() {
      const reference =
        searchParams.get(
          "reference"
        );
      const pendingOrderId =
        localStorage.getItem(
          "orentemist_pending_order_id"
        );
        const checkoutToken =
  localStorage.getItem(
    "orentemist_pending_checkout_token"
  );
      if (!reference) {
        setMessage(
          "Payment reference was not found."
        );
        return;
      }
      if (!checkoutToken) {
  setMessage(
    "Checkout token was not found. Please restart checkout."
  );
  return;
}
      try {
        const guestSessionId =
          getGuestSessionId();
        const verifyUrl =
          `${API_URL}/orders/verify-payment/`;
        console.log(
          "=============================="
        );
        console.log(
          "PAYMENT CALLBACK"
        );
        console.log(
          "API URL:",
          API_URL
        );
        console.log(
          "VERIFY API URL:",
          verifyUrl
        );
        console.log(
          "PAYMENT REFERENCE:",
          reference
        );
        console.log(
          "PENDING ORDER ID:",
          pendingOrderId
        );
        console.log(
          "GUEST SESSION ID:",
          guestSessionId
        );
        console.log(
          "=============================="
        );
        const response =
          await fetch(
            verifyUrl,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                "X-Guest-Session-ID":
                  guestSessionId,
              },
              body: JSON.stringify({
                reference:
                  reference,
                   checkout_token: checkoutToken,
              }),
            }
          );
        console.log(
          "VERIFY RESPONSE STATUS:",
          response.status
        );
        const data =
          await response.json();
        console.log(
          "VERIFY RESPONSE DATA:",
          data
        );
        if (!response.ok) {
          throw new Error(
            data.error ||
              data.detail ||
              "Payment verification failed."
          );
        }
        console.log(
          "Payment verified successfully:",
          data
        );
        const orderId =
          data.order?.id ||
          pendingOrderId;
        if (!orderId) {
          throw new Error(
            "Payment was verified, but the order ID could not be found."
          );
        }
        localStorage.removeItem(
  "orentemist_cart"
);

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
  new Event("orentemist-cart-updated")
);

router.replace(
          `/order-success?order=${orderId}&reference=${encodeURIComponent(
            reference
          )}`
        );
      } catch (error) {
        console.error(
          "=============================="
        );
        console.error(
          "PAYMENT VERIFICATION ERROR:",
          error
        );
        console.error(
          "ERROR MESSAGE:",
          error?.message
        );
        console.error(
          "=============================="
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