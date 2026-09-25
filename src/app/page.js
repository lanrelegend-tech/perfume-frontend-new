"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

function getImageUrl(image) {
  if (!image) return "/placeholder-product.jpg";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    if (image.includes("res.cloudinary.com")) {
      return image.replace(
        "/image/upload/",
        "/image/upload/f_auto,q_auto/"
      );
    }

    return image;
  }

  const imagePath = image.startsWith("/") ? image : `/${image}`;

  return `${API_URL}${imagePath}`;
}

function formatPrice(amount, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function getProductsFromResponse(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getWhatsAppUrl(phone) {
  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned) return null;

  let internationalNumber = cleaned;

  if (internationalNumber.startsWith("0")) {
    internationalNumber = `234${internationalNumber.slice(1)}`;
  }

  if (!internationalNumber.startsWith("234")) {
    internationalNumber = `234${internationalNumber}`;
  }

  return `https://wa.me/${internationalNumber}`;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [totalItems, setTotalItems] = useState(0);

useEffect(() => {
  function updateCartCount() {
    try {
      const savedCart = localStorage.getItem(
        "orentemist_cart"
      );

      const cart = savedCart
        ? JSON.parse(savedCart)
        : [];

      const count = Array.isArray(cart)
        ? cart.reduce(
            (total, item) =>
              total + Number(item.quantity || 0),
            0
          )
        : 0;

      setTotalItems(count);
    } catch (error) {
      console.error("Cart count error:", error);
      setTotalItems(0);
    }
  }

  updateCartCount();

  window.addEventListener(
    "orentemist-cart-updated",
    updateCartCount
  );

  window.addEventListener(
    "storage",
    updateCartCount
  );

  return () => {
    window.removeEventListener(
      "orentemist-cart-updated",
      updateCartCount
    );

    window.removeEventListener(
      "storage",
      updateCartCount
    );
  };
}, []);

  useEffect(() => {
  const controller = new AbortController();

  async function loadStore() {
    try {
      const [
        productsResponse,
        categoriesResponse,
        settingsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/products/`, {
          signal: controller.signal,
        }),
        fetch(`${API_URL}/products/categories/`, {
          signal: controller.signal,
        }),
        fetch(`${API_URL}/settings/`, {
          signal: controller.signal,
        }),
      ]);

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(getProductsFromResponse(productsData));
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (Array.isArray(categoriesData?.results)) {
          setCategories(categoriesData.results);
        }
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load store:", error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  loadStore();

  return () => {
    controller.abort();
  };
}, []);

  const storeName = settings?.store_name || "ORENTEMIST";
  const storeEmail = settings?.store_email || "";
  const storePhone = settings?.store_phone || "";
  const storeAddress = settings?.store_address || "";
  const currency = settings?.currency || "NGN";

  const whatsappUrl = getWhatsAppUrl(storePhone);

  const featuredProducts = products
    .filter((product) => product.featured)
    .slice(0, 4);

  const displayedProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : products.slice(0, 4);

  const newArrivals = [...products]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
    )
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-white pb-20 text-black md:pb-0">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.3em] sm:text-2xl"
          >
            {storeName}
          </Link>

          <nav className="hidden items-center gap-8 text-sm md:flex">

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
              Shop
            </Link>

            <Link
              href="/collection"
              className="transition hover:opacity-50"
            >
              Collections
            </Link>

            <Link
              href="/about"
              className="transition hover:opacity-50"
            >
              About
            </Link>

          </nav>

         <div className="flex items-center gap-4 text-sm">

  <Link
    href="/account"
    className="hidden transition hover:opacity-50 sm:block"
  >
    Account
  </Link>

  {/* CART ICON */}
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

  {/* MOBILE MENU */}
  <button
    type="button"
    onClick={() => setMobileMenuOpen(true)}
    aria-label="Open menu"
    className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95 md:hidden"
  >
    <span className="flex flex-col gap-1.5">
      <span className="h-1 w-1 rounded-full bg-black" />
      <span className="h-1 w-1 rounded-full bg-black" />
      <span className="h-1 w-1 rounded-full bg-black" />
    </span>
  </button>

</div>
        </div>
      </header>

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden bg-black text-white">

        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-24">

          <div className="relative z-10 max-w-xl">

            <p className="mb-6 text-xs uppercase tracking-[0.45em] text-white/60">
              The Essence Of Luxury
            </p>

            <h1 className="text-5xl font-light leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Find Your
              <br />
              Signature Scent.
            </h1>

            <p className="mt-7 max-w-md text-sm leading-7 text-white/60 sm:text-base">
              Discover carefully selected fragrances created for
              those who want to leave a lasting impression.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <Link
                href="/products"
                className="bg-white px-7 py-4 text-sm font-medium text-black transition hover:bg-white/80"
              >
                Shop
              </Link>

              <Link
                href="/collection"
                className="border border-white/30 px-7 py-4 text-sm font-medium transition hover:bg-white hover:text-black"
              >
                Explore Featured
              </Link>

            </div>

          </div>

          <div className="relative mt-16 flex min-h-[400px] items-center justify-center lg:mt-0">

            <div className="absolute h-72 w-72 rounded-full bg-white/10 blur-3xl sm:h-96 sm:w-96" />

            <div className="relative flex h-[390px] w-[270px] items-center justify-center border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] shadow-2xl sm:h-[470px] sm:w-[330px]">

              <div className="text-center">

                <div className="mx-auto mb-8 h-40 w-28 border border-white/30 bg-gradient-to-b from-white/20 to-white/5 shadow-2xl sm:h-52 sm:w-36">

                  <div className="mx-auto h-12 w-12 border-x border-white/30 bg-white/10 sm:h-16 sm:w-16" />

                  <div className="mt-16 text-[9px] tracking-[0.3em] text-white/60 sm:mt-20">
                    {storeName}
                  </div>

                </div>

                <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                  Eau De Parfum
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================= CATEGORIES ================= */}

      {categories.length > 0 && (
        <section className="border-b border-black/10">

          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">

            <div className="mb-8 flex items-end justify-between">

              <div>

                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-black/40">
                  Explore
                </p>

                <h2 className="text-2xl font-medium sm:text-3xl">
                  Shop by Category
                </h2>

              </div>

              <Link
                href="/products"
                className="hidden text-sm underline underline-offset-4 sm:block"
              >
                View all
              </Link>

            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group flex min-h-32 items-end border border-black/10 bg-zinc-50 p-5 transition hover:bg-black hover:text-white"
                >

                  <div>

                    <p className="text-lg font-medium">
                      {category.name}
                    </p>

                    <span className="mt-2 block text-xs uppercase tracking-widest opacity-40 transition group-hover:opacity-70">
                      Explore
                    </span>

                  </div>

                </Link>
              ))}

            </div>

          </div>

        </section>
      )}

      {/* ================= FEATURED ================= */}

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">

        <div className="mb-10 flex items-end justify-between">

          <div>

            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-black/40">
              Curated For You
            </p>

            <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
              Featured Fragrances
            </h2>

          </div>

          <Link
            href="/collection"
            className="hidden text-sm underline underline-offset-4 sm:block"
          >
            View collection
          </Link>

        </div>

        {loading ? (
          <ProductSkeleton />
        ) : displayedProducts.length === 0 ? (
          <div className="border border-black/10 py-20 text-center">

            <p className="text-sm text-black/50">
              Products will appear here soon.
            </p>

          </div>
        ) : (
          <ProductGrid
            products={displayedProducts}
            currency={currency}
          />
        )}

      </section>

      {/* ================= BRAND BANNER ================= */}

      <section className="bg-zinc-950 text-white">

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-28">

          <div>

            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-white/40">
              {storeName}
            </p>

            <h2 className="max-w-xl text-4xl font-light leading-tight sm:text-5xl">
              A fragrance is more than a scent.
              <br />
              <span className="text-white/50">
                It becomes part of you.
              </span>
            </h2>

          </div>

          <div>

            <p className="max-w-lg text-sm leading-7 text-white/50">
              From everyday elegance to unforgettable evenings,
              discover fragrances selected to complement every
              version of you.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-block border border-white/30 px-7 py-4 text-sm transition hover:bg-white hover:text-black"
            >
              Discover {storeName}
            </Link>

          </div>

        </div>

      </section>

      {/* ================= NEW ARRIVALS ================= */}

      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">

          <div className="mb-10 flex items-end justify-between">

            <div>

              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-black/40">
                Just In
              </p>

              <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
                New Arrivals
              </h2>

            </div>

            <Link
              href="/products"
              className="hidden text-sm underline underline-offset-4 sm:block"
            >
              Shop all
            </Link>

          </div>

          <ProductGrid
            products={newArrivals}
            currency={currency}
          />

        </section>
      )}

      {/* ================= FREE SHIPPING ================= */}

      {settings?.free_shipping_threshold && (
        <section className="border-y border-black/10 bg-zinc-50">

          <div className="mx-auto max-w-7xl px-5 py-10 text-center sm:px-8 lg:px-10">

            <p className="text-xs uppercase tracking-[0.35em] text-black/40">
              Complimentary Delivery
            </p>

            <p className="mt-3 text-sm text-black/70">
              Enjoy free shipping on orders over{" "}
              <strong>
                {formatPrice(
                  settings.free_shipping_threshold,
                  currency
                )}
              </strong>
            </p>

          </div>

        </section>
      )}

      {/* ================= PROMO ================= */}

      <section className="border-y border-black/10 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 lg:px-10">

          <p className="text-xs uppercase tracking-[0.4em] text-black/40">
            Your Signature Awaits
          </p>

          <h2 className="mt-4 text-3xl font-light sm:text-4xl">
            Find the fragrance that feels like you.
          </h2>

          <Link
            href="/products"
            className="mt-8 inline-block bg-black px-8 py-4 text-sm text-white transition hover:bg-black/80"
          >
            Shop Now
          </Link>

        </div>

      </section>

      {/* ================= NEWSLETTER ================= */}

      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">

        <p className="text-xs uppercase tracking-[0.4em] text-black/40">
          Stay In The Scent
        </p>

        <h2 className="mt-4 text-3xl font-light sm:text-4xl">
          Join the {storeName} world.
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/50">
          Receive new collection announcements, fragrance
          discoveries and exclusive offers.
        </p>

        <form
          className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >

          <input
            type="email"
            placeholder="Your email address"
            className="h-13 flex-1 border border-black/15 bg-white px-5 text-sm outline-none transition focus:border-black"
          />

          <button
            type="submit"
            className="h-13 bg-black px-7 text-sm text-white transition hover:bg-black/80"
          >
            Subscribe
          </button>

        </form>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="bg-black text-white">

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">

              <Link
                href="/"
                className="text-xl tracking-[0.3em]"
              >
                {storeName}
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/40">
                Luxury fragrances selected for people who
                understand that presence begins before you
                say a word.
              </p>

            </div>

            <div>

              <h3 className="mb-5 text-xs uppercase tracking-widest text-white/50">
                Shop
              </h3>

              <div className="space-y-3 text-sm text-white/60">

                <Link
                  href="/products"
                  className="block transition hover:text-white"
                >
                  All Fragrances
                </Link>

                <Link
                  href="/collection"
                  className="block transition hover:text-white"
                >
                  Featured
                </Link>

                <Link
                  href="/products?sort=newest"
                  className="block transition hover:text-white"
                >
                  New Arrivals
                </Link>

              </div>

            </div>

            <div>

              <h3 className="mb-5 text-xs uppercase tracking-widest text-white/50">
                Help
              </h3>

              <div className="space-y-3 text-sm text-white/60">

                <Link
                  href="/account"
                  className="block transition hover:text-white"
                >
                  My Account
                </Link>

                <Link
                  href="/cart"
                  className="block transition hover:text-white"
                >
                  Cart
                </Link>

                <Link
                  href="/contact"
                  className="block transition hover:text-white"
                >
                  Contact
                </Link>

              </div>

            </div>

          </div>

          {/* ================= CONTACT ================= */}

          <div className="mt-14 border-t border-white/10 pt-10">

            <h3 className="mb-6 text-xs uppercase tracking-widest text-white/50">
              Contact
            </h3>

            <div className="grid gap-6 text-sm text-white/60 sm:grid-cols-2 lg:grid-cols-4">

              {storeEmail && (
                <a
                  href={`mailto:${storeEmail}`}
                  className="transition hover:text-white"
                >
                  <span className="mb-1 block text-xs uppercase tracking-widest text-white/30">
                    Email
                  </span>

                  {storeEmail}
                </a>
              )}

              {storePhone && (
                <a
                  href={`tel:${storePhone}`}
                  className="transition hover:text-white"
                >
                  <span className="mb-1 block text-xs uppercase tracking-widest text-white/30">
                    Phone
                  </span>

                  {storePhone}
                </a>
              )}

              {storeAddress && (
                <div>
                  <span className="mb-1 block text-xs uppercase tracking-widest text-white/30">
                    Address
                  </span>

                  {storeAddress}
                </div>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  <span className="mb-1 block text-xs uppercase tracking-widest text-white/30">
                    WhatsApp
                  </span>

                  Chat with us
                </a>
              )}

            </div>

          </div>

          {/* ================= SOCIAL ================= */}

          {(settings?.instagram_url ||
            settings?.facebook_url ||
            settings?.tiktok_url) && (
            <div className="mt-10 border-t border-white/10 pt-8">

              <div className="flex flex-wrap items-center gap-6 text-sm text-white/50">

                <span className="text-xs uppercase tracking-widest text-white/30">
                  Follow us
                </span>

                {settings?.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    Instagram
                  </a>
                )}

                {settings?.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    Facebook
                  </a>
                )}

                {settings?.tiktok_url && (
                  <a
                    href={settings.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    TikTok
                  </a>
                )}

              </div>

            </div>
          )}

          {/* ================= COPYRIGHT ================= */}

          <div className="mt-10 border-t border-white/10 pt-7 text-xs text-white/30">

            <p>
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </p>

          </div>

        </div>

      </footer>

    


{/* ================= MOBILE SIDE MENU ================= */}

{mobileMenuOpen && (
  <div className="fixed inset-0 z-[200] md:hidden">

    {/* BACKDROP */}

    <button
      type="button"
      aria-label="Close menu"
      onClick={() => setMobileMenuOpen(false)}
      className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
    />

    {/* SIDE DRAWER */}

    <aside className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl">

      {/* DRAWER HEADER */}

      <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">

        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="text-lg font-semibold tracking-[0.3em]"
        >
          {storeName}
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center text-2xl text-black/60"
        >
          ×
        </button>

      </div>

      {/* MENU LINKS */}

      <div className="flex flex-1 flex-col px-6 py-8">

        <p className="mb-6 text-[10px] uppercase tracking-[0.35em] text-black/40">
          Menu
        </p>

        <nav className="space-y-1">

          

          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Shop
            <span className="text-black/30">→</span>
          </Link>

          <Link
            href="/collection"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Collection
            <span className="text-black/30">→</span>
          </Link>

          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Account
            <span className="text-black/30">→</span>
          </Link>
          

          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Contact
            <span className="text-black/30">→</span>
          </Link>

          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            About
            <span className="text-black/30">→</span>
          </Link>
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Cart
            <span className="text-black/30">→</span>
          </Link>

        </nav>

      </div>

      {/* DRAWER FOOTER */}

      <div className="border-t border-black/10 px-6 py-6">

        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30">
          {storeName}
        </p>

        <p className="mt-2 text-xs text-black/40">
          Luxury fragrances. Signature presence.
        </p>

      </div>

    </aside>

  </div>
)}
</main>

);
}


/* =========================================================
   PRODUCT GRID
========================================================= */

function ProductGrid({ products, currency = "NGN" }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">

      {products.map((product) => {

       const stock = Number(product.stock_quantity) || 0;

const isPreorder =
  stock === 0 &&
  product.is_preorder === true;

const isSoldOut =
  stock === 0 &&
  product.is_preorder !== true;

        return (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group"
          >

            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
<Image
  src={getImageUrl(product.image)}
  alt={product.name}
  fill
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
  loading="lazy"
/>

              {product.featured && (
                <span className="absolute left-3 top-3 bg-black px-3 py-1.5 text-[9px] uppercase tracking-widest text-white">
                  Featured
                </span>
              )}

             {isPreorder && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/30">

    <span className="bg-white px-4 py-2 text-[10px] uppercase tracking-widest">
      Pre-order Available
    </span>

  </div>
)}

{isSoldOut && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/30">

    <span className="bg-white px-4 py-2 text-[10px] uppercase tracking-widest">
      Sold Out
    </span>

  </div>
)}

            </div>

            <div className="pt-4">

              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">
                {product.brand}
              </p>

              <h3 className="mt-1 text-sm font-medium sm:text-base">
                {product.name}
              </h3>

              {product.size && (
                <p className="mt-1 text-xs text-black/40">
                  {product.size}
                </p>
              )}

              <p className="mt-2 text-sm font-medium">
                {formatPrice(product.price, currency)}
              </p>

            </div>

          </Link>
        );
      })}

    </div>
  );
}


/* =========================================================
   LOADING SKELETON
========================================================= */

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">

      {[1, 2, 3, 4].map((item) => (
        <div key={item}>

          <div className="aspect-[4/5] animate-pulse bg-zinc-100" />

          <div className="mt-4 h-3 w-20 animate-pulse bg-zinc-100" />

          <div className="mt-2 h-5 w-32 animate-pulse bg-zinc-100" />

          <div className="mt-3 h-4 w-20 animate-pulse bg-zinc-100" />

        </div>
      ))}

    </div>
  );
}