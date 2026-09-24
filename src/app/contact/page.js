"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

const defaultStore = {
  store_name: "ORENTEMIST",
  store_email: "",
  store_phone: "",
  store_address: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
};

export default function ContactPage() {
  const [store, setStore] = useState(defaultStore);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    async function loadStoreSettings() {
      try {
        const response = await fetch(`${API_URL}/settings/`);

        if (!response.ok) {
          throw new Error("Failed to load store settings");
        }

        const data = await response.json();

        setStore({
          ...defaultStore,
          ...data,
        });
      } catch (error) {
        console.error("Store settings error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStoreSettings();
  }, []);

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#171717]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#faf9f6]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 md:px-10 lg:px-14">

          {/* Logo */}

          <Link
            href="/"
            className="font-serif text-2xl tracking-[0.08em]"
          >
            ORENTEMIST
          </Link>

          {/* Desktop Navigation */}

          <nav className="hidden items-center gap-9 md:flex">

            <Link
              href="/"
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/55 transition hover:text-black"
            >
              Home
            </Link>

            <Link
              href="/products"
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/55 transition hover:text-black"
            >
              Shop
            </Link>

            <Link
              href="/collection"
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/55 transition hover:text-black"
            >
              Collection
            </Link>

            <Link
              href="/about"
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/55 transition hover:text-black"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black"
            >
              Contact
            </Link>

          </nav>

          {/* Right */}

          <div className="flex items-center gap-5">

            <Link
              href="/account"
              className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-black/60 transition hover:text-black sm:block"
            >
              Account
            </Link>

            <Link
              href="/cart"
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            >
              Cart
            </Link>

            {/* Mobile Menu Button */}

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="flex h-9 w-9 items-center justify-center md:hidden"
              aria-label="Toggle menu"
            >
              <div className="space-y-1.5">
                <span className="block h-px w-5 bg-black" />
                <span className="block h-px w-5 bg-black" />
              </div>
            </button>

          </div>

        </div>

        {/* Mobile Navigation */}

        {mobileMenu && (
          <div className="border-t border-black/10 bg-[#faf9f6] px-6 py-7 md:hidden">

            <nav className="flex flex-col gap-6">

              <Link
                href="/"
                onClick={() => setMobileMenu(false)}
                className="text-sm uppercase tracking-[0.2em]"
              >
                Home
              </Link>

              <Link
                href="/products"
                onClick={() => setMobileMenu(false)}
                className="text-sm uppercase tracking-[0.2em]"
              >
                Shop
              </Link>

              <Link
                href="/collection"
                onClick={() => setMobileMenu(false)}
                className="text-sm uppercase tracking-[0.2em]"
              >
                Collection
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenu(false)}
                className="text-sm uppercase tracking-[0.2em]"
              >
                About
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenu(false)}
                className="text-sm font-semibold uppercase tracking-[0.2em]"
              >
                Contact
              </Link>

              <Link
                href="/account"
                onClick={() => setMobileMenu(false)}
                className="text-sm uppercase tracking-[0.2em]"
              >
                Account
              </Link>

              <Link
                href="/cart"
                onClick={() => setMobileMenu(false)}
                className="text-sm uppercase tracking-[0.2em]"
              >
                Cart
              </Link>

            </nav>

          </div>
        )}

      </header>

      {/* =====================================================
          CONTACT HERO
      ===================================================== */}

      <section className="border-b border-black/10">

        <div className="mx-auto grid max-w-[1500px] md:grid-cols-2">

          {/* Left */}

          <div className="flex min-h-[500px] flex-col justify-between px-6 py-14 md:min-h-[650px] md:px-10 md:py-16 lg:px-14">

            <div>

              <p className="mb-6 text-[10px] uppercase tracking-[0.4em] text-black/40">
                {loading
                  ? "ORENTEMIST"
                  : store.store_name || "ORENTEMIST"}
              </p>

              <h1 className="max-w-xl font-serif text-6xl leading-[0.88] tracking-tight md:text-7xl lg:text-[100px]">
                Let&apos;s
                <br />
                Talk.
              </h1>

            </div>

            <p className="max-w-md text-sm leading-7 text-black/50">
              Whether you have a question about a fragrance, an order, or
              simply want to get in touch, we&apos;re here to help.
            </p>

          </div>

          {/* Right */}

          <div className="flex min-h-[500px] items-center justify-center bg-[#171717] px-6 py-16 text-white md:min-h-[650px] md:px-12">

            <div className="w-full max-w-lg">

              <p className="mb-10 text-[10px] uppercase tracking-[0.35em] text-white/35">
                Contact
              </p>

              <h2 className="font-serif text-4xl leading-tight md:text-5xl">
                We&apos;d love to
                <br />
                hear from you.
              </h2>

              <div className="mt-12 h-px w-full bg-white/10" />

              {/* Email */}

              {store.store_email && (
                <a
                  href={`mailto:${store.store_email}`}
                  className="group block border-b border-white/10 py-6"
                >

                  <p className="text-[9px] uppercase tracking-[0.25em] text-white/35">
                    Email
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-5">

                    <span className="text-sm text-white/80 transition group-hover:text-white md:text-base">
                      {store.store_email}
                    </span>

                    <span className="text-white/30 transition group-hover:translate-x-1 group-hover:text-white">
                      →
                    </span>

                  </div>

                </a>
              )}

              {/* Phone */}

              {store.store_phone && (
                <a
                  href={`tel:${store.store_phone}`}
                  className="group block border-b border-white/10 py-6"
                >

                  <p className="text-[9px] uppercase tracking-[0.25em] text-white/35">
                    Phone
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-5">

                    <span className="text-sm text-white/80 transition group-hover:text-white md:text-base">
                      {store.store_phone}
                    </span>

                    <span className="text-white/30 transition group-hover:translate-x-1 group-hover:text-white">
                      →
                    </span>

                  </div>

                </a>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          STORE INFORMATION
      ===================================================== */}

      <section className="border-b border-black/10 bg-white">

        <div className="mx-auto max-w-[1500px] px-6 py-20 md:px-10 md:py-28 lg:px-14">

          <div className="grid gap-16 md:grid-cols-3">

            {/* Address */}

            <div>

              <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-black/35">
                Visit Us
              </p>

              <h3 className="font-serif text-3xl">
                Our Store
              </h3>

              <p className="mt-5 max-w-sm text-sm leading-7 text-black/50">
                {loading
                  ? "Loading store address..."
                  : store.store_address ||
                    "Store address available soon."}
              </p>

            </div>

            {/* Opening / Support */}

            <div>

              <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-black/35">
                Customer Care
              </p>

              <h3 className="font-serif text-3xl">
                Need Help?
              </h3>

              <p className="mt-5 max-w-sm text-sm leading-7 text-black/50">
                For questions about orders, products, delivery, or anything
                else, contact us using the details on this page.
              </p>

            </div>

            {/* Social */}

            <div>

              <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-black/35">
                Follow
              </p>

              <h3 className="font-serif text-3xl">
                Stay Connected
              </h3>

              <div className="mt-6 flex flex-col gap-4">

                {store.instagram_url && (
                  <a
                    href={store.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between border-b border-black/10 pb-3 text-sm"
                  >
                    <span>Instagram</span>
                    <span className="text-black/30 transition group-hover:translate-x-1 group-hover:text-black">
                      →
                    </span>
                  </a>
                )}

                {store.facebook_url && (
                  <a
                    href={store.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between border-b border-black/10 pb-3 text-sm"
                  >
                    <span>Facebook</span>
                    <span className="text-black/30 transition group-hover:translate-x-1 group-hover:text-black">
                      →
                    </span>
                  </a>
                )}

                {store.tiktok_url && (
                  <a
                    href={store.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between border-b border-black/10 pb-3 text-sm"
                  >
                    <span>TikTok</span>
                    <span className="text-black/30 transition group-hover:translate-x-1 group-hover:text-black">
                      →
                    </span>
                  </a>
                )}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTACT CTA
      ===================================================== */}

      <section className="bg-[#e9e4dc] px-6 py-24 md:px-10 md:py-32 lg:px-14">

        <div className="mx-auto max-w-[1500px]">

          <p className="mb-8 text-[10px] uppercase tracking-[0.4em] text-black/35">
            ORENTEMIST
          </p>

          <h2 className="max-w-5xl font-serif text-5xl leading-[0.95] md:text-7xl lg:text-8xl">
            Your next
            <br />
            signature scent
            <br />
            awaits.
          </h2>

          <Link
            href="/products"
            className="mt-10 inline-flex bg-black px-8 py-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/80"
          >
            Explore Collection
          </Link>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#faf9f6] px-6 py-14 md:px-10 lg:px-14">

        <div className="mx-auto max-w-[1500px]">

          <div className="grid gap-12 md:grid-cols-4">

            <div className="md:col-span-2">

              <Link
                href="/"
                className="font-serif text-2xl tracking-[0.08em]"
              >
                {store.store_name || "ORENTEMIST"}
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-6 text-black/45">
                Distinctive fragrances created for those who leave an
                impression.
              </p>

            </div>

            <div>

              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em]">
                Explore
              </p>

              <div className="flex flex-col gap-3 text-sm text-black/55">

                <Link href="/">Home</Link>

                <Link href="/products">Shop</Link>

                <Link href="/collection">Collection</Link>

                <Link href="/about">About</Link>

                <Link href="/contact">Contact</Link>

              </div>

            </div>

            <div>

              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em]">
                Customer
              </p>

              <div className="flex flex-col gap-3 text-sm text-black/55">

                <Link href="/account">Account</Link>

                <Link href="/cart">Cart</Link>

                {store.store_email && (
                  <a href={`mailto:${store.store_email}`}>
                    Email Us
                  </a>
                )}

                {store.store_phone && (
                  <a href={`tel:${store.store_phone}`}>
                    Call Us
                  </a>
                )}

              </div>

            </div>

          </div>

          <div className="mt-14 border-t border-black/10 pt-6 text-[9px] uppercase tracking-[0.2em] text-black/35">
            © {new Date().getFullYear()}{" "}
            {store.store_name || "ORENTEMIST"}. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}