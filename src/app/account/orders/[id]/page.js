"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

function formatPrice(value) {
  const amount = Number(value || 0);

  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/[_-]/g, " ");
}

function getStatusLabel(status) {
  const value = normalizeStatus(status);

  if (value === "pending") return "Pending";
  if (value === "confirmed") return "Confirmed";
  if (value === "processing") return "Processing";
  if (value === "shipped") return "Shipped";
  if (value === "out for delivery") return "Out for delivery";
  if (value === "delivered") return "Delivered";

  if (value === "cancelled" || value === "canceled") {
    return "Cancelled";
  }

  return status || "Pending";
}

function getStatusColor(status) {
  const value = normalizeStatus(status);

  if (value === "delivered") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    value === "shipped" ||
    value === "out for delivery" ||
    value === "processing" ||
    value === "confirmed"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (value === "cancelled" || value === "canceled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getProductName(item) {
  return (
    item?.product_name ||
    item?.product?.name ||
    item?.product?.title ||
    item?.name ||
    "Perfume"
  );
}

function getProductImage(item) {
  return (
    item?.product_image ||
    item?.product?.image ||
    item?.image ||
    item?.product?.image_url ||
    null
  );
}

function getProductPrice(item) {
  return Number(
    item?.price ??
      item?.product_price ??
      item?.unit_price ??
      item?.product?.price ??
      0
  );
}

function getQuantity(item) {
  return Number(item?.quantity || 1);
}

function getItemTotal(item) {
  if (item?.subtotal !== undefined && item?.subtotal !== null) {
    return Number(item.subtotal);
  }

  return getProductPrice(item) * getQuantity(item);
}

/*
  IMPORTANT:
  This uses the exact direct fields from the order object,
  matching the working admin order page.
*/
function getAddress(order) {
  return {
    name: order?.full_name || "",
    phone: order?.phone || "",
    street: order?.address || "",
    city: order?.city || "",
    state: order?.state || "",
    country: order?.country || "Nigeria",
  };
}

function StatusIcon({ completed }) {
  return (
    <div
      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
        completed
          ? "border-black bg-black text-white"
          : "border-neutral-300 bg-white text-neutral-300"
      }`}
    >
      {completed ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      ) : (
        <span className="h-2 w-2 rounded-full bg-current" />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-neutral-200" />

          <div className="mt-8 h-9 w-64 rounded bg-neutral-200" />

          <div className="mt-3 h-4 w-48 rounded bg-neutral-200" />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="h-72 rounded-2xl bg-neutral-200" />
              <div className="h-80 rounded-2xl bg-neutral-200" />
            </div>

            <div className="h-[500px] rounded-2xl bg-neutral-200" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orderId = params?.id;

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          router.push("/login");
          return;
        }

        let response = await fetch(
          `${API_URL}/orders/${orderId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        /*
          If direct order endpoint returns 404,
          use the user's orders endpoint.
        */
        if (!response.ok && response.status === 404) {
          const listResponse = await fetch(
            `${API_URL}/orders/my-orders/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              cache: "no-store",
            }
          );

          if (listResponse.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            router.push("/login");
            return;
          }

          if (!listResponse.ok) {
            throw new Error("Unable to load your orders.");
          }

          const listData = await listResponse.json();

          const orders = Array.isArray(listData)
            ? listData
            : listData?.results || listData?.orders || [];

          const foundOrder = orders.find(
            (item) =>
              String(item.id) === String(orderId) ||
              String(item.order_number) === String(orderId)
          );

          if (!foundOrder) {
            throw new Error("Order not found.");
          }

          setOrder(foundOrder);
          return;
        }

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load this order.");
        }

        const data = await response.json();

        setOrder(data);
      } catch (err) {
        console.error("Order details error:", err);

        setError(
          err.message || "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-semibold text-black">
            Order not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {error || "We couldn't find this order."}
          </p>

          <Link
            href="/account"
            className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Back to account
          </Link>
        </div>
      </main>
    );
  }

  const status = normalizeStatus(order.status);

  const items = Array.isArray(order.items)
    ? order.items
    : order.items?.results || [];

  /*
    Get address ONCE here.
    No duplicate getAddress function inside the component.
  */
  const address = getAddress(order);

  const subtotal = Number(
    order.subtotal ??
      order.sub_total ??
      order.items_total ??
      items.reduce(
        (sum, item) => sum + getItemTotal(item),
        0
      )
  );

  const discount = Number(
    order.discount_amount ??
      order.discount ??
      order.coupon_discount ??
      0
  );

  const deliveryFee = Number(
    order.delivery_fee ??
      order.shipping_fee ??
      order.shipping_cost ??
      0
  );

  const total = Number(
    order.total_amount ??
      order.total ??
      subtotal - discount + deliveryFee
  );

  const trackingNumber =
    order.tracking_number ||
    order.tracking_id ||
    order.courier_tracking_number ||
    order.shipment_tracking_number ||
    "";

  const courier =
    order.courier ||
    order.courier_name ||
    order.shipping_courier ||
    "";

  const trackingUrl =
    order.tracking_url ||
    order.courier_tracking_url ||
    "";

  const isCancelled =
    status === "cancelled" ||
    status === "canceled";

  const isDelivered =
    status === "delivered";

  const isShipped =
    status === "shipped" ||
    status === "out for delivery";

  const isProcessing =
    status === "processing" ||
    status === "confirmed";

  const isPending =
    status === "pending";

  const timeline = [
    {
      title: "Order confirmed",
      description:
        "Your order has been received successfully.",
      completed:
        !isPending &&
        !isCancelled,
    },

    {
      title: "Preparing your order",
      description:
        "Your order is being prepared for delivery.",
      completed:
        isProcessing ||
        isShipped ||
        isDelivered,
    },

    {
      title: "Order shipped",
      description:
        "Your package has left us and is on its way.",
      completed:
        isShipped ||
        isDelivered,
    },

    {
      title: "Order delivered",
      description:
        "Your package has been delivered.",
      completed:
        isDelivered,
    },
  ];

  if (isCancelled) {
    timeline.splice(1, 3);

    timeline.push({
      title: "Order cancelled",
      description:
        "This order has been cancelled.",
      completed: true,
    });
  }

  return (
    <main className="min-h-screen bg-[#fafafa] pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">

        {/* BACK */}

        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-black"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          Back to my account
        </Link>

        {/* HEADER */}

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
              ORENTEMIST
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Order{" "}
              {order.order_number
                ? `#${order.order_number}`
                : `#${order.id}`}
            </h1>

            <p className="mt-2 text-sm font-medium text-neutral-600">
              Placed on{" "}
              {formatDate(
                order.created_at ||
                  order.date_created
              )}
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </div>

        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* LEFT */}

          <div className="space-y-6">

            {/* ORDER TRACKING */}

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="border-b border-neutral-100 pb-6">

                <h2 className="text-2xl font-bold tracking-tight text-black">
                  Order Tracking
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Follow the current progress of your
                  order from confirmation to delivery.
                </p>

              </div>

              <div className="mt-7">

                {timeline.map(
                  (step, index) => (
                    <div
                      key={step.title}
                      className="relative flex gap-4"
                    >

                      {index !==
                        timeline.length - 1 && (
                        <div
                          className={`absolute left-[19px] top-10 h-[calc(100%-5px)] w-0.5 ${
                            step.completed
                              ? "bg-black"
                              : "bg-neutral-200"
                          }`}
                        />
                      )}

                      <StatusIcon
                        completed={
                          step.completed
                        }
                      />

                      <div className="pb-8">

                        <h3
                          className={`text-base font-semibold ${
                            step.completed
                              ? "text-black"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-neutral-600">
                          {step.description}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

              {/* TRACKING DETAILS */}

              {(trackingNumber ||
                courier) && (
                <div className="mt-2 border-t border-neutral-100 pt-6">

                  <h3 className="text-base font-semibold text-black">
                    Delivery tracking details
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">

                    {courier && (
                      <div className="rounded-xl bg-neutral-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Delivery company
                        </p>

                        <p className="mt-2 text-sm font-semibold text-black">
                          {courier}
                        </p>

                      </div>
                    )}

                    {trackingNumber && (
                      <div className="rounded-xl bg-neutral-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Tracking number
                        </p>

                        <p className="mt-2 break-all text-sm font-semibold text-black">
                          {trackingNumber}
                        </p>

                      </div>
                    )}

                  </div>

                  {(trackingUrl ||
                    trackingNumber) &&
                    (isShipped ||
                      isDelivered) && (
                      <a
                        href={
                          trackingUrl ||
                          `https://www.google.com/search?q=${encodeURIComponent(
                            `${courier || ""} ${trackingNumber}`
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                      >
                        Track my delivery

                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M7 17 17 7" />
                          <path d="M7 7h10v10" />
                        </svg>

                      </a>
                    )}

                </div>
              )}

            </section>

            {/* ITEMS */}

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="border-b border-neutral-100 pb-6">

                <h2 className="text-2xl font-bold tracking-tight text-black">
                  Your Items
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}{" "}
                  in this order.
                </p>

              </div>

              {items.length === 0 ? (
                <div className="mt-6 rounded-xl bg-neutral-50 p-8 text-center">

                  <p className="text-sm text-neutral-600">
                    No product information is
                    available.
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-neutral-100">

                  {items.map(
                    (item, index) => {

                      const image =
                        getProductImage(
                          item
                        );

                      const name =
                        getProductName(
                          item
                        );

                      const price =
                        getProductPrice(
                          item
                        );

                      const quantity =
                        getQuantity(item);

                      const itemTotal =
                        getItemTotal(item);

                      return (
                        <div
                          key={
                            item.id ||
                            `${name}-${index}`
                          }
                          className="flex gap-4 py-6 first:pt-0 last:pb-0"
                        >

                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">

                            {image ? (
                              <img
                                src={image}
                                alt={name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-300">

                                <svg
                                  width="28"
                                  height="28"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                >
                                  <path d="M7 4h10v16H7z" />
                                  <path d="M9 4V2h6v2" />
                                </svg>

                              </div>
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <h3 className="text-base font-semibold text-black">
                              {name}
                            </h3>

                            {item?.size && (
                              <p className="mt-1 text-sm text-neutral-600">
                                Size:{" "}
                                {item.size}
                              </p>
                            )}

                            <p className="mt-2 text-sm text-neutral-600">
                              Quantity:{" "}
                              {quantity}
                            </p>

                            {price > 0 && (
                              <p className="mt-1 text-xs text-neutral-500">
                                {formatPrice(
                                  price
                                )}{" "}
                                each
                              </p>
                            )}

                            <p className="mt-3 text-base font-semibold text-black">
                              {formatPrice(
                                itemTotal
                              )}
                            </p>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

            {/* DELIVERY ADDRESS */}

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="border-b border-neutral-100 pb-6">

                <h2 className="text-2xl font-bold tracking-tight text-black">
                  Delivery Address
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  This is the delivery information
                  saved for this order.
                </p>

              </div>

              <div className="mt-6 rounded-xl bg-neutral-50 p-5 sm:p-6">

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* FULL NAME */}

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Full name
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {address.name ||
                        "Not provided"}
                    </p>

                  </div>

                  {/* PHONE */}

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Phone number
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {address.phone ||
                        "Not provided"}
                    </p>

                  </div>

                  {/* STREET */}

                  <div className="sm:col-span-2">

                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Street address
                    </p>

                    <p className="mt-1 text-sm font-semibold leading-6 text-black">
                      {address.street ||
                        "Not provided"}
                    </p>

                  </div>

                  {/* CITY */}

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      City
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {address.city ||
                        "Not provided"}
                    </p>

                  </div>

                  {/* STATE */}

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      State
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {address.state ||
                        "Not provided"}
                    </p>

                  </div>

                  {/* COUNTRY */}

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Country
                    </p>

                    <p className="mt-1 text-sm font-semibold text-black">
                      {address.country}
                    </p>

                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* RIGHT SIDE */}

          <aside className="space-y-6">

            {/* ORDER SUMMARY */}

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-6">

              <div className="border-b border-neutral-100 pb-6">

                <h2 className="text-2xl font-bold tracking-tight text-black">
                  Order Summary
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  A breakdown of the amount paid for
                  this order.
                </p>

              </div>

              <div className="mt-6 space-y-5">

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm font-medium text-neutral-600">
                    Subtotal
                  </span>

                  <span className="text-sm font-semibold text-black">
                    {formatPrice(
                      subtotal
                    )}
                  </span>

                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between gap-4">

                    <span className="text-sm font-medium text-neutral-600">
                      Discount
                    </span>

                    <span className="text-sm font-semibold text-green-600">
                      -
                      {formatPrice(
                        discount
                      )}
                    </span>

                  </div>
                )}

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm font-medium text-neutral-600">
                    Delivery fee
                  </span>

                  <span className="text-sm font-semibold text-black">
                    {deliveryFee > 0
                      ? formatPrice(
                          deliveryFee
                        )
                      : "Free"}
                  </span>

                </div>

                <div className="border-t border-neutral-200 pt-5">

                  <div className="flex items-center justify-between gap-4">

                    <span className="text-base font-bold text-black">
                      Total
                    </span>

                    <span className="text-xl font-bold text-black">
                      {formatPrice(total)}
                    </span>

                  </div>

                </div>

              </div>

              {/* PAYMENT */}

              <div className="mt-7 border-t border-neutral-100 pt-6">

                <h3 className="text-base font-bold text-black">
                  Payment Information
                </h3>

                <div className="mt-4 flex items-center justify-between gap-3">

                  <span className="text-sm font-medium text-neutral-600">
                    Payment status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      String(
                        order.payment_status ||
                          ""
                      ).toLowerCase() ===
                      "paid"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {order.payment_status ||
                      "Pending"}
                  </span>

                </div>

                {order.payment_reference && (
                  <div className="mt-5">

                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Payment reference
                    </p>

                    <p className="mt-2 break-all text-xs font-medium leading-5 text-neutral-700">
                      {
                        order.payment_reference
                      }
                    </p>

                  </div>
                )}

              </div>

              {/* ORDER INFORMATION */}

              <div className="mt-6 border-t border-neutral-100 pt-6">

                <h3 className="text-base font-bold text-black">
                  Order Information
                </h3>

                <div className="mt-4 space-y-4">

                  <div className="flex items-center justify-between gap-4">

                    <span className="text-xs font-medium text-neutral-500">
                      Order date
                    </span>

                    <span className="text-xs font-semibold text-black">
                      {formatDate(
                        order.created_at
                      )}
                    </span>

                  </div>

                  {order.updated_at && (
                    <div className="flex items-center justify-between gap-4">

                      <span className="text-xs font-medium text-neutral-500">
                        Last updated
                      </span>

                      <span className="text-xs font-semibold text-black">
                        {formatDateTime(
                          order.updated_at
                        )}
                      </span>

                    </div>
                  )}

                </div>

              </div>

            </section>

            {/* HELP */}

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />

                  <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.8 1-2 1.2-2 2.5" />

                  <path d="M12 16h.01" />
                </svg>

              </div>

              <h3 className="mt-5 text-base font-bold text-black">
                Need help with your order?
              </h3>

              <p className="mt-2 text-sm leading-6 text-neutral-600">
                If you have any questions about
                your delivery or payment, our
                support team is here to help.
              </p>

              <Link
                href="/contact"
                className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Contact us
              </Link>

            </section>

          </aside>

        </div>
      </div>
    </main>
  );
}