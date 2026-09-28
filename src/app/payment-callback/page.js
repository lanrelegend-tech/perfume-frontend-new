"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

function getAccessToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    null
  );
}

function cartItemKey(item) {
  const productId = item.product_id ?? item.id ?? item.product;
  const variantId = item.variant_id ?? item.variantId ?? item.variant ?? "";
  return `${productId}:${variantId}`;
}

function removePurchasedCartItems(orderItems) {
  if (!Array.isArray(orderItems)) {
    return;
  }

  try {
    const storedCart = JSON.parse(
      localStorage.getItem("orentemist_cart") || "[]"
    );

    if (!Array.isArray(storedCart)) {
      return;
    }

    const purchasedQuantities = new Map();

    for (const item of orderItems) {
      const key = cartItemKey(item);
      const quantity = Number(item.quantity || 0);

      purchasedQuantities.set(
        key,
        (purchasedQuantities.get(key) || 0) + quantity
      );
    }

    const remainingCart = storedCart.flatMap((item) => {
      const key = cartItemKey(item);
      const purchasedQuantity = purchasedQuantities.get(key) || 0;
      const remainingQuantity = Number(item.quantity || 0) - purchasedQuantity;

      purchasedQuantities.delete(key);

      return remainingQuantity > 0
        ? [{ ...item, quantity: remainingQuantity }]
        : [];
    });

    localStorage.setItem(
      "orentemist_cart",
      JSON.stringify(remainingCart)
    );
  } catch (error) {
    console.error("Could not update the cart after payment:", error);
  }
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState(
    "Verifying your payment..."
  );
  const hasStartedVerification = useRef(false);

  useEffect(() => {
    async function verifyPayment() {
      if (hasStartedVerification.current) {
        return;
      }

      hasStartedVerification.current = true;

      const reference = searchParams.get("reference");

      const pendingOrderId = localStorage.getItem(
        "orentemist_pending_order_id"
      );

      if (!reference) {
        setMessage(
          "Payment reference was not found."
        );
        return;
      }

      try {
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
                ...(getAccessToken()
                  ? { Authorization: `Bearer ${getAccessToken()}` }
                  : {}),
              },

              body: JSON.stringify({
                reference: reference,
              }),
            }
          );

        const data = await response.json();

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

        removePurchasedCartItems(data.order?.items);

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
            data.order?.payment_status === "paid" &&
            data.order?.status === "pending"
          );

        router.replace(
          `/order-success?order=${orderId}&reference=${encodeURIComponent(
            reference
          )}${reviewRequired ? "&review=1" : ""}`
        );

      } catch (error) {
        console.error("Payment verification error:", error);

        setMessage(
          error?.message ||
            "We could not verify your payment."
        );
      }
    }

    verifyPayment();
  }, [router, searchParams]);

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
