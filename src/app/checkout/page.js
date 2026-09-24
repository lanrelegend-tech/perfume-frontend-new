"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

const CART_STORAGE_KEY = "orentemist_cart";

function getStoredCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Cart storage error:", error);
    return [];
  }
}

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    null
  );
}

function getImageUrl(image) {
  if (!image) {
    return "/placeholder.jpg";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${API_URL}${image}`;
}

function formatPrice(price) {
  return `₦${Number(price || 0).toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const [shippingRates, setShippingRates] =
    useState([]);

  const [shippingLoading, setShippingLoading] =
    useState(false);

  const [shippingError, setShippingError] =
    useState("");

  const [selectedShipping, setSelectedShipping] =
    useState(null);

  const [deliveryMethod, setDeliveryMethod] =
    useState("delivery");

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
  });

  const [couponCode, setCouponCode] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState(null);

  const [couponLoading, setCouponLoading] =
    useState(false);

  const [couponError, setCouponError] =
    useState("");

  /*
   * LOAD CART FROM BROWSER
   */
  function loadCart() {
    try {
      setLoading(true);

      const storedCart = getStoredCart();

      const items = storedCart.map((item) => ({
        ...item,

        quantity: Number(item.quantity || 0),

        product_price: Number(item.price || 0),

        product_name:
          item.name || "Product",

        product_image:
          item.image || "",

        subtotal:
          Number(item.price || 0) *
          Number(item.quantity || 0),
      }));

      const total = items.reduce(
        (sum, item) =>
          sum + Number(item.subtotal || 0),
        0
      );

      setCart({
        items,
        total,
      });
    } catch (error) {
      console.error(
        "Checkout cart error:",
        error
      );

      setCart({
        items: [],
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadShippingRates() {
    try {
      setShippingLoading(true);
      setShippingError("");

      const response = await fetch(
        `${API_URL}/shipping/`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load shipping rates."
        );
      }

      const rates = Array.isArray(data)
        ? data
        : data.results || [];

      setShippingRates(rates);
    } catch (error) {
      console.error(
        "Shipping rates error:",
        error
      );

      setShippingRates([]);

      setShippingError(
        "Unable to load delivery rates. Please try again."
      );
    } finally {
      setShippingLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
    loadShippingRates();

    function handleCartUpdate() {
      loadCart();
    }

    function handleStorage(event) {
      if (
        event.key === CART_STORAGE_KEY
      ) {
        loadCart();
      }
    }

    window.addEventListener(
      "orentemist-cart-updated",
      handleCartUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "orentemist-cart-updated",
        handleCartUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "state") {
      setSelectedShipping(null);
      setShippingError("");
    }
  }

  function getCartSubtotal() {
    if (
      !cart ||
      !Array.isArray(cart.items)
    ) {
      return 0;
    }

    return cart.items.reduce(
      (total, item) => {
        return (
          total +
          Number(item.subtotal || 0)
        );
      },
      0
    );
  }

  function findShippingRate() {
    if (deliveryMethod === "pickup") {
      return (
        shippingRates.find(
          (rate) =>
            rate.delivery_type ===
              "pickup" &&
            rate.is_active !== false
        ) || null
      );
    }

    if (!form.state.trim()) {
      return null;
    }

    const customerState =
      form.state.trim().toLowerCase();

    return (
      shippingRates.find(
        (rate) =>
          rate.delivery_type !==
            "pickup" &&
          rate.is_active !== false &&
          String(rate.state || "")
            .trim()
            .toLowerCase() ===
            customerState
      ) || null
    );
  }

  function getShippingFee() {
    if (selectedShipping) {
      return Number(
        selectedShipping.delivery_fee || 0
      );
    }

    const matchingRate =
      findShippingRate();

    if (matchingRate) {
      return Number(
        matchingRate.delivery_fee || 0
      );
    }

    return 0;
  }

  function handleSelectShipping() {
    const rate = findShippingRate();

    if (!rate) {
      setSelectedShipping(null);

      if (deliveryMethod === "delivery") {
        setShippingError(
          "We currently do not have a delivery rate for this state."
        );
      }

      return;
    }

    setSelectedShipping(rate);
    setShippingError("");
  }

  function handleDeliveryMethodChange(
    method
  ) {
    setDeliveryMethod(method);
    setSelectedShipping(null);
    setShippingError("");

    if (method === "pickup") {
      setForm((previous) => ({
        ...previous,
        address: "",
        city: "",
        state: "",
      }));
    }
  }

  async function handleApplyCoupon() {
    const code = couponCode.trim();

    if (!code) {
      setCouponError(
        "Please enter a coupon code."
      );

      return;
    }

    const subtotal = getCartSubtotal();

    if (subtotal <= 0) {
      setCouponError(
        "Your cart is empty."
      );

      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const response = await fetch(
        `${API_URL}/coupons/validate/`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            code: code,
            order_amount: subtotal,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setCouponError(
          data.error ||
            "This coupon cannot be applied."
        );

        setAppliedCoupon(null);

        return;
      }

      setAppliedCoupon({
        code:
          data.coupon || code,

        discountType:
          data.discount_type,

        discountValue:
          data.discount_value,

        discountAmount:
          Number(
            data.discount_amount || 0
          ),

        originalAmount:
          Number(
            data.original_amount ||
              subtotal
          ),

        finalAmount:
          Number(
            data.final_amount ||
              subtotal
          ),
      });

      setCouponError("");
    } catch (error) {
      console.error(
        "Coupon validation error:",
        error
      );

      setCouponError(
        "Unable to validate coupon. Please try again."
      );

      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  function getDiscountAmount() {
    if (!appliedCoupon) {
      return 0;
    }

    return Number(
      appliedCoupon.discountAmount || 0
    );
  }

  function getFinalTotal() {
    const subtotal =
      getCartSubtotal();

    const discount =
      getDiscountAmount();

    const shipping =
      getShippingFee();

    return Math.max(
      0,
      subtotal -
        discount +
        shipping
    );
  }

  /*
   * PLACE ORDER
   */
  async function handlePlaceOrder(
    event
  ) {
    event.preventDefault();

    if (
      !cart ||
      !cart.items ||
      cart.items.length === 0
    ) {
      alert("Your cart is empty.");
      return;
    }

    if (
      deliveryMethod ===
        "delivery" &&
      !form.state.trim()
    ) {
      alert("Please enter your state.");
      return;
    }

    const shippingRate =
      findShippingRate();

    if (!shippingRate) {
      setShippingError(
        deliveryMethod === "pickup"
          ? "Pickup is currently unavailable."
          : "We currently do not have a delivery rate for this state."
      );

      alert(
        deliveryMethod === "pickup"
          ? "Pickup is currently unavailable."
          : "Please enter a supported delivery state before continuing."
      );

      return;
    }

    try {
      setPlacingOrder(true);

      /*
       * Get the current browser cart.
       */
      const browserCart =
        getStoredCart();

      if (
        !browserCart ||
        browserCart.length === 0
      ) {
        alert("Your cart is empty.");

        setPlacingOrder(false);

        return;
      }

      /*
       * Order information.
       */
      const orderData = {
        customer: form,

        delivery_method:
          deliveryMethod,

        pickup_address:
          deliveryMethod === "pickup"
            ? shippingRate.pickup_address ||
              ""
            : null,

        coupon_code:
          appliedCoupon?.code ||
          null,

        subtotal:
          getCartSubtotal(),

        discount:
          getDiscountAmount(),

        delivery_fee:
          Number(
            shippingRate.delivery_fee ||
              0
          ),

        total:
          getFinalTotal(),

        /*
         * Browser cart items.
         */
        cart_items:
  browserCart.map((item) => ({
    product_id:
      item.product_id ?? item.id,

    quantity:
      Number(
        item.quantity || 0
      ),

    variant_id:
      item.variant_id ??
      item.variantId ??
      null,

    size:
      item.size || "",
  })),

      };

      /*
       * CREATE ORDER
       */
      const response =
        await fetch(
          `${API_URL}/orders/create/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(getAccessToken()
                ? {
                    Authorization: `Bearer ${getAccessToken()}`,
                  }
                : {}),
            },

            body: JSON.stringify(
              orderData
            ),
          }
        );

      const responseText =
  await response.text();

console.log(
  "CREATE ORDER STATUS:",
  response.status
);

console.log(
  "CREATE ORDER RESPONSE:",
  responseText
);

let data;

try {
  data = JSON.parse(responseText);
} catch (error) {
  throw new Error(
    `Server returned a non-JSON response (${response.status}).`
  );
}

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Unable to create your order."
        );
      }

      console.log(
        "Order created:",
        data
      );

      const order =
        data.order || data;

      if (!order.id) {
        throw new Error(
          "Order was created, but no order ID was returned."
        );
      }

      /*
       * Save pending order.
       */
      localStorage.setItem(
        "orentemist_pending_order_id",
        String(order.id)
      );
      if (order.checkout_token) {
  localStorage.setItem(
    "orentemist_pending_checkout_token",
    order.checkout_token
  );
}

      /*
       * INITIALIZE PAYSTACK
       */
      setPaymentLoading(true);

      const paymentResponse =
        await fetch(
          `${API_URL}/orders/${order.id}/pay/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(getAccessToken()
                ? {
                    Authorization: `Bearer ${getAccessToken()}`,
                  }
                : {}),
            },

            body: JSON.stringify({
  order_id: order.id,
  checkout_token: order.checkout_token,
}),
          }
        );
const paymentResponseText =
  await paymentResponse.text();

console.log(
  "PAYMENT STATUS:",
  paymentResponse.status
);

console.log(
  "PAYMENT RESPONSE:",
  paymentResponseText
);

let paymentData;

try {
  paymentData =
    JSON.parse(paymentResponseText);
} catch (error) {
  throw new Error(
    `Payment server returned a non-JSON response (${paymentResponse.status}).`
  );
}

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.error ||
            paymentData.detail ||
            paymentData.message ||
            "Unable to initialize payment."
        );
      }

      console.log(
        "Paystack initialization:",
        paymentData
      );

      const reference =
        paymentData.reference ||
        paymentData.data?.reference;

      if (!reference) {
        throw new Error(
          "Paystack did not return a payment reference."
        );
      }

      /*
       * Save payment reference.
       */

      if (paymentData.checkout_token) {
  localStorage.setItem(
    "orentemist_pending_checkout_token",
    paymentData.checkout_token
  );
}
      localStorage.setItem(
        "orentemist_pending_payment_reference",
        reference
      );

      /*
       * PAYSTACK AUTHORIZATION URL
       */
      const authorizationUrl =
        paymentData.authorization_url ||
        paymentData.data
          ?.authorization_url;

      if (!authorizationUrl) {
        throw new Error(
          "Paystack did not return an authorization URL."
        );
      }

      /*
       * Do NOT clear cart yet.
       *
       * We clear it after successful
       * payment confirmation.
       */
      window.location.href =
        authorizationUrl;
    } catch (error) {
      console.error(
        "Checkout/payment error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong. Please try again."
      );

      setPaymentLoading(false);
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
          <div className="animate-pulse">
            <div className="mb-10 h-8 w-40 rounded bg-gray-200" />

            <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
              <div className="space-y-5">
                <div className="h-24 rounded-2xl bg-gray-100" />
                <div className="h-24 rounded-2xl bg-gray-100" />
                <div className="h-24 rounded-2xl bg-gray-100" />
              </div>

              <div className="h-80 rounded-3xl bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const items =
    cart?.items || [];

  const subtotal =
    getCartSubtotal();

  const discount =
    getDiscountAmount();

  const shippingFee =
    getShippingFee();

  const finalTotal =
    getFinalTotal();

  const currentShippingRate =
    findShippingRate();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#fafafa]">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-black">
              Your cart is empty
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Add some fragrances to your
              cart before proceeding to
              checkout.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-black">
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
      />

      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.28em]"
          >
            ORENTEMIST
          </Link>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="hidden sm:inline">
              Secure Checkout
            </span>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <rect
                x="3"
                y="11"
                width="18"
                height="10"
                rx="2"
              />

              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div className="mb-10">
          <Link
            href="/cart"
            className="mb-5 inline-flex items-center gap-2 text-xs text-gray-500 transition hover:text-black"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>

            Back to cart
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Complete your details to continue
            with your order.
          </p>
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid items-start gap-10 lg:grid-cols-[1fr_420px]"
        >
          <div className="space-y-8">
            <section className="rounded-3xl border border-black/10 bg-white p-5 sm:p-7">
              <div className="mb-7">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  01
                </span>

                <h2 className="mt-1 text-xl font-semibold">
                  Contact Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  We'll use these details to
                  contact you about your order.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-xs font-medium"
                  >
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Jamiu"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-xs font-medium"
                  >
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Abdulrazaq"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-medium"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-xs font-medium"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="08012345678"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-5 sm:p-7">
              <div className="mb-7">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  02
                </span>

                <h2 className="mt-1 text-xl font-semibold">
                  Delivery Address
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choose how you want to receive
                  your order.
                </p>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-xs font-medium">
                  Delivery method
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleDeliveryMethodChange(
                        "delivery"
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      deliveryMethod ===
                      "delivery"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white hover:border-black/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      Home Delivery
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        deliveryMethod ===
                        "delivery"
                          ? "text-white/70"
                          : "text-gray-500"
                      }`}
                    >
                      We'll deliver your order
                      to your address.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeliveryMethodChange(
                        "pickup"
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      deliveryMethod ===
                      "pickup"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white hover:border-black/30"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      Pickup
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        deliveryMethod ===
                        "pickup"
                          ? "text-white/70"
                          : "text-gray-500"
                      }`}
                    >
                      Pick up your order from
                      our location.
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {deliveryMethod ===
                "delivery" ? (
                  <>
                    <div>
                      <label
                        htmlFor="address"
                        className="mb-2 block text-xs font-medium"
                      >
                        Street address
                      </label>

                      <textarea
                        id="address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="House number, street name, area..."
                        className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="city"
                          className="mb-2 block text-xs font-medium"
                        >
                          City
                        </label>

                        <input
                          id="city"
                          name="city"
                          type="text"
                          value={form.city}
                          onChange={handleChange}
                          required
                          placeholder="Lagos"
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="state"
                          className="mb-2 block text-xs font-medium"
                        >
                          State
                        </label>

                        <input
                          id="state"
                          name="state"
                          type="text"
                          value={form.state}
                          onChange={handleChange}
                          required
                          placeholder="Lagos"
                          onBlur={
                            handleSelectShipping
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="M3 7h18v13H3z" />
                          <path d="M8 7V4h8v3" />
                          <path d="M8 12h8" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                          Pickup location
                        </p>

                        {shippingLoading ? (
                          <p className="mt-2 text-sm text-gray-500">
                            Loading pickup
                            location...
                          </p>
                        ) : currentShippingRate ? (
                          <>
                            <p className="mt-2 text-sm font-medium text-black">
                              {currentShippingRate.pickup_address ||
                                "Pickup address unavailable."}
                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                              Please pick up your
                              order from this
                              location.
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-red-500">
                            No pickup location
                            is currently
                            available.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path d="M3 7h11v10H3z" />
                        <path d="M14 10h4l3 3v4h-7z" />
                        <circle
                          cx="7.5"
                          cy="19"
                          r="1.5"
                        />
                        <circle
                          cx="17.5"
                          cy="19"
                          r="1.5"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {deliveryMethod ===
                        "pickup"
                          ? "Pickup"
                          : "Delivery"}
                      </p>

                      {shippingLoading ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Loading delivery
                          options...
                        </p>
                      ) : deliveryMethod ===
                        "pickup" ? (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">
                            Pickup from
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {currentShippingRate?.pickup_address ||
                              "Pickup location unavailable."}
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatPrice(
                              currentShippingRate?.delivery_fee ||
                                0
                            )}
                          </p>
                        </div>
                      ) : selectedShipping ? (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">
                            Delivery to{" "}
                            <span className="font-medium text-black">
                              {
                                selectedShipping.state
                              }
                            </span>
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatPrice(
                              selectedShipping.delivery_fee
                            )}
                          </p>
                        </div>
                      ) : form.state ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {findShippingRate()
                            ? `Delivery available to ${findShippingRate().state}.`
                            : "No delivery rate found for this state."}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Enter your state to
                          calculate delivery.
                        </p>
                      )}
                    </div>
                  </div>

                  {shippingError && (
                    <p className="mt-3 text-xs text-red-500">
                      {shippingError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="mb-2 block text-xs font-medium"
                  >
                    Country
                  </label>

                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={form.country}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white p-5 sm:p-7">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M3 7h11v10H3z" />
                    <path d="M14 10h4l3 3v4h-7z" />
                    <circle
                      cx="7.5"
                      cy="19"
                      r="1.5"
                    />
                    <circle
                      cx="17.5"
                      cy="19"
                      r="1.5"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    {deliveryMethod ===
                    "pickup"
                      ? "Pickup information"
                      : "Delivery information"}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {deliveryMethod ===
                    "pickup"
                      ? "Your order will be prepared for pickup at the location shown above."
                      : "Your delivery fee is automatically calculated based on your selected state."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-8">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
              <div className="border-b border-black/10 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-semibold">
                  Order Summary
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}{" "}
                  in your cart
                </p>
              </div>

              <div className="max-h-[430px] overflow-y-auto px-5 sm:px-6">
                <div className="divide-y divide-black/10">
                  {items.map((item) => (
                    <div
                      key={
                        item.key ||
                        `${item.id}-${item.variantId || "default"}`
                      }
                      className="flex gap-4 py-5"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                        <img
                          src={getImageUrl(
                            item.product_image
                          )}
                          alt={
                            item.product_name ||
                            "Product"
                          }
                          className="h-full w-full object-cover"
                        />

                        <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] font-semibold text-white">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {item.product_name}
                        </h3>

                        {item.size && (
                          <p className="mt-1 text-xs text-gray-500">
                            Size: {item.size}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                          {formatPrice(
                            item.product_price
                          )}{" "}
                          each
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(
                            item.subtotal
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-black/10 px-5 py-5 sm:px-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>

                    <span className="font-medium text-black">
                      {formatPrice(
                        subtotal
                      )}
                    </span>
                  </div>

                  {!appliedCoupon ? (
                    <div className="pt-2">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-black">
                          Have a coupon?
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(event) => {
                            setCouponCode(
                              event.target.value.toUpperCase()
                            );

                            if (
                              couponError
                            ) {
                              setCouponError(
                                ""
                              );
                            }
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              event.preventDefault();

                              handleApplyCoupon();
                            }
                          }}
                          placeholder="ENTER CODE"
                          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3.5 py-3 text-xs font-medium uppercase tracking-wider outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-black"
                        />

                        <button
                          type="button"
                          onClick={
                            handleApplyCoupon
                          }
                          disabled={
                            couponLoading
                          }
                          className="rounded-xl bg-black px-4 py-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {couponLoading
                            ? "..."
                            : "Apply"}
                        </button>
                      </div>

                      {couponError && (
                        <p className="mt-2 text-xs text-red-500">
                          {couponError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="m5 12 4 4L19 6" />
                            </svg>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold">
                              Coupon applied
                            </p>

                            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-gray-500">
                              {appliedCoupon.code}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleRemoveCoupon
                          }
                          className="shrink-0 text-[10px] font-medium text-gray-500 underline underline-offset-2 transition hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Discount
                      </span>

                      <span className="font-medium">
                        -{" "}
                        {formatPrice(
                          discount
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-500">
                    <span>
                      {deliveryMethod ===
                      "pickup"
                        ? "Pickup"
                        : "Delivery"}
                    </span>

                    <span className="font-medium text-black">
                      {shippingFee > 0
                        ? formatPrice(
                            shippingFee
                          )
                        : "—"}
                    </span>
                  </div>

                  <div className="my-4 h-px bg-black/10" />

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Total
                      </p>

                      <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                        Including delivery
                      </p>
                    </div>

                    <div className="text-right">
                      {appliedCoupon && (
                        <p className="mb-1 text-xs text-gray-400 line-through">
                          {formatPrice(
                            subtotal +
                              shippingFee
                          )}
                        </p>
                      )}

                      <p className="text-xl font-semibold">
                        {formatPrice(
                          finalTotal
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    placingOrder ||
                    paymentLoading ||
                    shippingLoading
                  }
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder ||
                  paymentLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      {paymentLoading
                        ? "Opening Payment..."
                        : "Creating Order..."}
                    </>
                  ) : (
                    <>
                      Continue to Payment

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </>
                  )}
                </button>

                <div className="mt-5 flex items-start gap-2 text-[10px] leading-4 text-gray-400">
                  <svg
                    className="mt-0.5 shrink-0"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="10"
                      rx="2"
                    />

                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>

                  <span>
                    Your information is
                    securely handled during
                    checkout.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}