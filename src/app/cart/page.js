"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

function getImageUrl(image) {
  if (!image) return "/placeholder-product.jpg";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  const imagePath = image.startsWith("/")
    ? image
    : `/${image}`;

  return `${API_URL}${imagePath}`;
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  function loadCart() {
    try {
      const savedCart =
        localStorage.getItem("orentemist_cart");

      const items = savedCart
        ? JSON.parse(savedCart)
        : [];

      const safeItems = Array.isArray(items)
        ? items
        : [];

      const total = safeItems.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      );

      setCart({
        id: null,
        items: safeItems,
        total,
      });
    } catch (error) {
      console.error("Cart loading error:", error);

      setCart({
        id: null,
        items: [],
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    function handleCartUpdated() {
      loadCart();
    }

    window.addEventListener(
      "orentemist-cart-updated",
      handleCartUpdated
    );

    window.addEventListener(
      "storage",
      handleCartUpdated
    );

    return () => {
      window.removeEventListener(
        "orentemist-cart-updated",
        handleCartUpdated
      );

      window.removeEventListener(
        "storage",
        handleCartUpdated
      );
    };
  }, []);

  function updateQuantity(itemId, quantity) {
    if (quantity < 1) return;

    try {
      setUpdatingItem(itemId);

      const savedCart =
        localStorage.getItem("orentemist_cart");

      const items = savedCart
        ? JSON.parse(savedCart)
        : [];

      const updatedItems = items.map((item) => {
        const matchesItem =
          String(item.product_id) ===
            String(itemId) ||
          String(item.id) === String(itemId);

        if (!matchesItem) {
          return item;
        }

        const isPreorder =
          item.is_preorder === true;

        const maxStock =
          Number(item.stock_quantity || 0);

        /*
         * PRE-ORDER:
         * If this item is a preorder, stock quantity
         * does not limit how many the customer can order.
         */
        if (!isPreorder && maxStock > 0) {
          if (quantity > maxStock) {
            alert(
              `Only ${maxStock} available for ${item.name}.`
            );

            return item;
          }
        }

        return {
          ...item,
          quantity,
        };
      });

      localStorage.setItem(
        "orentemist_cart",
        JSON.stringify(updatedItems)
      );

      loadCart();

      window.dispatchEvent(
        new Event("orentemist-cart-updated")
      );
    } catch (error) {
      console.error(
        "Cart update error:",
        error
      );

      alert(
        "Something went wrong while updating your cart."
      );
    } finally {
      setUpdatingItem(null);
    }
  }

  function removeItem(itemId) {
    try {
      setRemovingItem(itemId);

      const savedCart =
        localStorage.getItem("orentemist_cart");

      const items = savedCart
        ? JSON.parse(savedCart)
        : [];

      const updatedItems = items.filter(
        (item) =>
          String(item.product_id) !==
            String(itemId) &&
          String(item.id) !== String(itemId)
      );

      localStorage.setItem(
        "orentemist_cart",
        JSON.stringify(updatedItems)
      );

      loadCart();

      window.dispatchEvent(
        new Event("orentemist-cart-updated")
      );
    } catch (error) {
      console.error(
        "Remove cart item error:",
        error
      );

      alert(
        "Something went wrong while removing the item."
      );
    } finally {
      setRemovingItem(null);
    }
  }

  function clearCart() {
    localStorage.removeItem("orentemist_cart");

    loadCart();

    window.dispatchEvent(
      new Event("orentemist-cart-updated")
    );
  }

  if (loading || !cart) {
    return (
      <main className="min-h-screen bg-[#f8f7f4]">
        <nav className="border-b border-black/10 bg-[#f8f7f4]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />

            <div className="hidden h-4 w-48 animate-pulse rounded bg-gray-200 sm:block" />

            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-20">
          <div className="animate-pulse">
            <div className="h-10 w-40 rounded bg-gray-200" />

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="h-40 rounded-3xl bg-gray-200" />

              <div className="h-72 rounded-3xl bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const items = Array.isArray(cart.items)
    ? cart.items
    : [];

  const totalItems = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const preorderItems = items.filter(
    (item) => item.is_preorder === true
  );

  const hasPreorderItems =
    preorderItems.length > 0;

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-black">
      {/* NAVBAR */}

      <nav className="sticky top-0 z-50 border-b border-black/10 bg-[#f8f7f4]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.22em]"
          >
            ORENTEMIST
          </Link>

          <div className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.18em] sm:flex">
            <Link
              href="/"
              className="transition hover:opacity-50"
            >
              Home
            </Link>

            <Link
              href="/products"
              className="transition hover:opacity-50"
            >
              Collection
            </Link>

            <Link
              href="/account"
              className="transition hover:opacity-50"
            >
              Account
            </Link>

            <Link
              href="/cart"
              className="transition hover:opacity-50"
            >
              Cart
            </Link>
          </div>

          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black bg-black text-white"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M6 8h12l1 12H5L6 8Z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>

            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-black ring-1 ring-black/10">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* PAGE */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:py-20">
        {/* HEADER */}

        <div className="flex flex-col gap-5 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
              Your Selection
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Shopping Cart
            </h1>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="w-fit text-xs font-medium uppercase tracking-[0.18em] text-gray-500 underline underline-offset-4 transition hover:text-black"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* PRE-ORDER NOTICE */}

        {hasPreorderItems && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-black px-5 py-4 text-white">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm">
                ✓
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em]">
                  Pre-order included
                </p>

                <p className="mt-1 text-xs leading-5 text-white/60">
                  Your pre-order items are paid for at checkout.
                  They will ship according to the availability
                  information shown for the product.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY CART */}

        {items.length === 0 ? (
          <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 8h12l1 12H5L6 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
            </div>

            <h2 className="mt-7 text-2xl font-semibold">
              Your cart is empty
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
              Discover a fragrance that feels uniquely yours
              and add it to your collection.
            </p>

            <Link
              href="/products"
              className="mt-8 rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* CART ITEMS */}

            <div className="space-y-4">
              {items.map((item) => {
                const itemId =
                  item.product_id || item.id;

                const isPreorder =
                  item.is_preorder === true;

                const itemSubtotal =
                  Number(item.price || 0) *
                  Number(item.quantity || 0);

                return (
                  <article
                    key={`${itemId}-${item.variant_id || "default"}`}
                    className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {/* IMAGE */}

                      <Link
                        href={`/products/${itemId}`}
                        className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f8f7f4] sm:h-36 sm:w-36"
                      >
                        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eeeae2] blur-2xl" />

                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="relative h-full w-full object-contain p-3"
                        />
                      </Link>

                      {/* INFO */}

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                              {item.brand || "ORENTEMIST"}
                            </p>

                            <Link
                              href={`/products/${itemId}`}
                              className="mt-2 block truncate text-base font-semibold transition hover:opacity-60 sm:text-lg"
                            >
                              {item.name}
                            </Link>

                            {item.size && (
                              <p className="mt-1 text-xs text-gray-500">
                                {item.size}
                              </p>
                            )}

                            {isPreorder && (
                              <div className="mt-3 inline-flex items-center rounded-full bg-black px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                                Pre-order
                              </div>
                            )}

                            {!isPreorder &&
                              Number(item.stock_quantity || 0) <=
                                10 &&
                              Number(item.stock_quantity || 0) >
                                0 && (
                                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
                                  Only{" "}
                                  {item.stock_quantity}{" "}
                                  left
                                </p>
                              )}

                            {isPreorder &&
                              item.preorder_message && (
                                <p className="mt-2 text-xs leading-5 text-gray-500">
                                  {item.preorder_message}
                                </p>
                              )}

                            {isPreorder &&
                              item.preorder_release_date && (
                                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                                  Expected availability:{" "}
                                  {
                                    item.preorder_release_date
                                  }
                                </p>
                              )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(itemId)
                            }
                            disabled={
                              removingItem === itemId
                            }
                            aria-label={`Remove ${item.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
                          {/* QUANTITY */}

                          <div>
                            <div className="flex h-10 w-fit items-center overflow-hidden rounded-full border border-black/10">
                              <button
                                type="button"
                                disabled={
                                  updatingItem === itemId ||
                                  Number(item.quantity) <= 1
                                }
                                onClick={() =>
                                  updateQuantity(
                                    itemId,
                                    Number(item.quantity) - 1
                                  )
                                }
                                className="flex h-full w-10 items-center justify-center text-lg transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                −
                              </button>

                              <span className="flex w-10 justify-center text-xs font-medium">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                disabled={
                                  updatingItem === itemId
                                }
                                onClick={() =>
                                  updateQuantity(
                                    itemId,
                                    Number(item.quantity) + 1
                                  )
                                }
                                className="flex h-full w-10 items-center justify-center text-lg transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>

                            {isPreorder && (
                              <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-gray-400">
                                No current stock limit
                              </p>
                            )}
                          </div>

                          {/* PRICE */}

                          <div className="text-left sm:text-right">
                            <p className="text-lg font-medium">
                              {formatPrice(itemSubtotal)}
                            </p>

                            {Number(item.quantity) > 1 && (
                              <p className="mt-1 text-xs text-gray-400">
                                {formatPrice(item.price)}{" "}
                                each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* SUMMARY */}

            <aside className="h-fit rounded-3xl border border-black/10 bg-white p-6 sm:p-7 lg:sticky lg:top-28">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                Order Summary
              </p>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                Your Order
              </h2>

              <div className="mt-7 space-y-4 border-b border-black/10 pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Items
                  </span>

                  <span className="font-medium">
                    {totalItems}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Delivery
                  </span>

                  <span className="text-xs text-gray-400">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <span className="text-sm font-medium">
                  Total
                </span>

                <span className="text-xl font-semibold">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-7 flex h-14 items-center justify-center rounded-full bg-black text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="mt-3 flex h-14 items-center justify-center rounded-full border border-black/10 bg-[#f8f7f4] text-sm font-medium transition hover:border-black"
              >
                Continue Shopping
              </Link>

              <div className="mt-7 border-t border-black/10 pt-6">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8f7f4]">
                    ✓
                  </div>

                  <div>
                    <p className="text-xs font-semibold">
                      Secure shopping
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Your order is protected from checkout
                      to delivery.
                    </p>
                  </div>
                </div>
              </div>

              {hasPreorderItems && (
                <div className="mt-5 rounded-2xl bg-[#f8f7f4] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                    Pre-order payment
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Pre-order products are paid in full during
                    checkout using the same secure payment
                    process.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>

      {/* BRAND SECTION */}

      {items.length > 0 && (
        <section className="border-t border-black/10 bg-black px-5 py-16 text-white sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">
              ORENTEMIST
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Your fragrance. Your identity.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/60">
              Every fragrance is carefully selected for people
              who appreciate character, elegance and unforgettable
              presence.
            </p>
          </div>
        </section>
      )}

      {/* FOOTER */}

      <footer className="bg-[#f8f7f4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold tracking-[0.2em]">
            ORENTEMIST
          </p>

          <div className="flex gap-6 text-xs text-gray-500">
            <Link
              href="/products"
              className="transition hover:text-black"
            >
              Shop
            </Link>

            <Link
              href="/account"
              className="transition hover:text-black"
            >
              Account
            </Link>

            <Link
              href="/cart"
              className="transition hover:text-black"
            >
              Cart
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} ORENTEMIST
          </p>
        </div>
      </footer>
    </main>
  );
}