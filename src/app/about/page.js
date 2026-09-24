"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

/* =========================================================
   HELPERS
========================================================= */

function getCategoriesFromResponse(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getWhatsAppUrl(phone) {
  if (!phone) return "#";

  let cleanPhone = String(phone).replace(/\D/g, "");

  if (cleanPhone.startsWith("0")) {
    cleanPhone = `234${cleanPhone.slice(1)}`;
  }

  if (!cleanPhone.startsWith("234")) {
    cleanPhone = `234${cleanPhone}`;
  }

  return `https://wa.me/${cleanPhone}`;
}

/* =========================================================
   ABOUT PAGE
========================================================= */

export default function AboutPage() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [MobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadAboutData() {
      try {
        const [settingsResponse, categoriesResponse] =
          await Promise.all([
            fetch(`${API_URL}/settings/`),
            fetch(`${API_URL}/products/categories/`),
          ]);

        if (settingsResponse.ok) {
          const settingsData =
            await settingsResponse.json();

          setSettings(settingsData);
        }

        if (categoriesResponse.ok) {
          const categoriesData =
            await categoriesResponse.json();

          setCategories(
            getCategoriesFromResponse(categoriesData)
          );
        }
      } catch (error) {
        console.error(
          "Failed to load about page:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAboutData();
  }, []);

  const storeName =
    settings?.store_name || "ORENTEMIST";

  const storeEmail =
    settings?.store_email || "";

  const storePhone =
    settings?.store_phone || "";

  const storeAddress =
    settings?.store_address || "";

  const instagram =
    settings?.instagram_url || "";

  const facebook =
    settings?.facebook_url || "";

  const tiktok =
    settings?.tiktok_url || "";

  const whatsapp =
    getWhatsAppUrl(storePhone);

  return (
    <main className="min-h-screen bg-[#fafafa] text-black">

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-[#fafafa]/90 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-10">

          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.25em] sm:text-2xl sm:tracking-[0.3em]"
          >
         ORENTEMIST
          </Link>

          <nav className="hidden items-center gap-8 text-sm md:flex">

            <Link
              href="/"
              className="transition-opacity hover:opacity-50"
            >
              Home
            </Link>

            <Link
              href="/products"
              className="transition-opacity hover:opacity-50"
            >
              Shop
            </Link>

            <Link
              href="/collection"
              className="transition-opacity hover:opacity-50"
            >
              Collections
            </Link>

            <Link
              href="/about"
              className="font-medium"
            >
              About
            </Link>

          </nav>

          <div className="flex items-center gap-4 text-sm sm:gap-5">

            <Link
              href="/account"
              className="hidden transition-opacity hover:opacity-50 sm:block"
            >
              Account
            </Link>

            <Link
              href="/cart"
              className="transition-opacity hover:opacity-50"
            >
              Cart
            </Link>
            <button
  type="button"
  onClick={() => setMobileMenuOpen(true)}
  aria-label="Open menu"
  className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
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

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden bg-black text-white sm:min-h-[calc(100vh-80px)]">

        {/* Background atmosphere */}

        <div className="absolute inset-0">

          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-[100px] sm:h-[700px] sm:w-[700px]" />

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/[0.05]" />

          <div className="absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full border border-white/[0.04]" />

        </div>

        {/* Decorative vertical lines */}

        <div className="absolute inset-y-0 left-[8%] hidden w-px bg-white/[0.06] lg:block" />

        <div className="absolute inset-y-0 right-[8%] hidden w-px bg-white/[0.06] lg:block" />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">

          <div className="max-w-5xl">

            <p className="text-[9px] uppercase tracking-[0.55em] text-white/40 sm:text-xs">
              The House of {storeName}
            </p>

            <h1 className="mt-7 text-[15vw] font-light leading-[0.82] tracking-[-0.06em] sm:text-[11vw] lg:text-[9rem]">
              Scent
              <br />
              <span className="ml-[8vw] italic">
                becomes
              </span>
              <br />
              <span className="ml-[18vw]">
                memory.
              </span>
            </h1>

            <p className="mt-10 max-w-xl text-sm leading-7 text-white/45 sm:mt-14 sm:text-base sm:leading-8">

              We believe fragrance is more than something
              you wear. It is presence, identity and the
              invisible signature people remember.

            </p>

          </div>

          {/* Scroll indicator */}

          <div className="mt-20 flex items-center gap-4 text-[9px] uppercase tracking-[0.35em] text-white/30 sm:mt-24">

            <span className="h-px w-12 bg-white/20" />

            Discover the house

          </div>

        </div>

      </section>

      {/* ===================================================
          INTRO
      =================================================== */}

      <section className="border-b border-black/[0.07] bg-white">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">

          <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">

            <div>

              <p className="text-[10px] uppercase tracking-[0.4em] text-black/35">
                01 — Our Philosophy
              </p>

              <h2 className="mt-7 text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">

                Fragrance
                <br />
                should feel
                <br />
                <span className="italic">
                  personal.
                </span>

              </h2>

            </div>

            <div className="max-w-2xl">

              <p className="text-xl font-light leading-9 text-black/75 sm:text-2xl sm:leading-10">

                At {storeName}, we see perfume as an
                extension of who you are.

              </p>

              <p className="mt-8 text-sm leading-8 text-black/50 sm:text-base">

                Every fragrance tells a story. Some are
                bold. Some are quiet. Some arrive before
                you do, while others stay long after you've
                left.

              </p>

              <p className="mt-6 text-sm leading-8 text-black/50 sm:text-base">

                Our collection is built for people who
                understand that the right scent can change
                the way you enter a room, the way you
                remember a moment, and the way others
                remember you.

              </p>

              <p className="mt-6 text-sm leading-8 text-black/50 sm:text-base">

                We curate fragrances across different
                personalities, moods and occasions so that
                finding your signature scent feels less like
                shopping and more like discovering a part
                of yourself.

              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          BIG STATEMENT
      =================================================== */}

      <section className="bg-[#f2f2ef]">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">

          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

            <div>

              <p className="text-[10px] uppercase tracking-[0.4em] text-black/35">
                The ORENTEMIST Standard
              </p>

              <h2 className="mt-7 text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">

                Not just
                <br />
                a fragrance.
                <br />
                <span className="italic">
                  Your signature.
                </span>

              </h2>

            </div>

            <div className="relative">

              <div className="aspect-[4/5] overflow-hidden bg-black">

                <div className="flex h-full w-full items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto h-28 w-28 rounded-full border border-white/20 sm:h-40 sm:w-40" />

                    <p className="mt-8 text-[10px] uppercase tracking-[0.5em] text-white/40">
                   ORENTEMIST
                    </p>

                    <p className="mt-3 text-3xl font-light text-white sm:text-4xl">
                      The Invisible
                      <br />
                      Signature
                    </p>

                  </div>

                </div>

              </div>

              <div className="absolute -bottom-5 -left-5 hidden h-28 w-28 border border-black/10 sm:block" />

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          VALUES
      =================================================== */}

      <section className="bg-white">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">

          <div className="mb-16 max-w-xl">

            <p className="text-[10px] uppercase tracking-[0.4em] text-black/35">
              What We Believe
            </p>

            <h2 className="mt-6 text-4xl font-light tracking-tight sm:text-5xl">
              The details matter.
            </h2>

          </div>

          <div className="grid border-l border-t border-black/10 sm:grid-cols-2 lg:grid-cols-4">

            <ValueCard
              number="01"
              title="Presence"
              text="A memorable fragrance does not need to shout. It simply needs to leave an impression."
            />

            <ValueCard
              number="02"
              title="Character"
              text="Your fragrance should complement your personality rather than compete with it."
            />

            <ValueCard
              number="03"
              title="Discovery"
              text="We make it easier to explore different notes, families and moods until something feels right."
            />

            <ValueCard
              number="04"
              title="Elegance"
              text="From the fragrance you choose to the experience around it, simplicity is part of luxury."
            />

          </div>

        </div>

      </section>

      {/* ===================================================
          COLLECTIONS
      =================================================== */}

      <section className="bg-black text-white">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">

          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">

            <div>

              <p className="text-[10px] uppercase tracking-[0.4em] text-white/35">
                Explore The Collection
              </p>

              <h2 className="mt-6 max-w-3xl text-4xl font-light tracking-tight sm:text-5xl lg:text-7xl">

                Something for
                <br />
                every <span className="italic">mood.</span>

              </h2>

            </div>

            <Link
              href="/products"
              className="group inline-flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
            >

              Shop all fragrances

              <span className="transition-transform group-hover:translate-x-2">
                →
              </span>

            </Link>

          </div>

          {/* CATEGORY CARDS */}

          {categories.length > 0 ? (

            <div className="mt-16 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">

              {categories.slice(0, 6).map(
                (category, index) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="group relative min-h-[220px] overflow-hidden bg-black p-7 transition hover:bg-[#111] sm:min-h-[280px] sm:p-9"
                  >

                    <span className="text-[9px] tracking-[0.3em] text-white/25">
                      0{index + 1}
                    </span>

                    <div className="absolute bottom-7 left-7 right-7 sm:bottom-9 sm:left-9 sm:right-9">

                      <h3 className="text-2xl font-light sm:text-3xl">
                        {category.name}
                      </h3>

                      <div className="mt-5 flex items-center justify-between">

                        <span className="text-[9px] uppercase tracking-[0.25em] text-white/30">
                          Explore
                        </span>

                        <span className="text-lg text-white/30 transition-transform duration-300 group-hover:translate-x-2 group-hover:text-white">
                          →
                        </span>

                      </div>

                    </div>

                  </Link>
                )
              )}

            </div>

          ) : (

            <div className="mt-16 border border-white/10 p-10 text-center">

              <p className="text-sm text-white/40">
                Explore our complete fragrance collection.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-xs text-black"
              >
                View Collection
              </Link>

            </div>

          )}

        </div>

      </section>

      {/* ===================================================
          EXPERIENCE
      =================================================== */}

      <section className="bg-[#fafafa]">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">

          <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr] lg:gap-32">

            <div>

              <p className="text-[10px] uppercase tracking-[0.4em] text-black/35">
                The Experience
              </p>

              <h2 className="mt-7 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">

                Find the scent
                <br />
                that feels like
                <br />
                <span className="italic">
                  you.
                </span>

              </h2>

            </div>

            <div className="space-y-10">

              <ExperienceStep
                number="01"
                title="Explore"
                text="Browse by fragrance, category, brand or notes and discover what catches your attention."
              />

              <ExperienceStep
                number="02"
                title="Discover"
                text="Read the details behind each fragrance and find the notes that match your personality."
              />

              <ExperienceStep
                number="03"
                title="Choose"
                text="When you find the one, make it yours and let your fragrance become part of your story."
              />

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          CONTACT CTA
      =================================================== */}

      <section className="bg-white">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40">

          <div className="relative overflow-hidden bg-black px-6 py-20 text-center text-white sm:px-12 sm:py-28">

            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />

            <div className="relative">

              <p className="text-[10px] uppercase tracking-[0.45em] text-white/35">
                Your Signature Awaits
              </p>

              <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-light leading-tight sm:text-5xl lg:text-7xl">

                Ready to find
                <br />
                your <span className="italic">scent?</span>

              </h2>

              <p className="mx-auto mt-7 max-w-lg text-sm leading-7 text-white/45">

                Explore our collection and discover a
                fragrance that says something about you
                without saying a word.

              </p>

              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">

                <Link
                  href="/products"
                  className="rounded-full bg-white px-8 py-4 text-xs font-medium text-black transition hover:bg-white/90"
                >
                  Explore Collection
                </Link>

                {storePhone && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/15 px-8 py-4 text-xs font-medium text-white transition hover:bg-white hover:text-black"
                  >
                    Chat With Us
                  </a>
                )}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="bg-black text-white">

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">

          <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-4">

            {/* BRAND */}

            <div className="lg:col-span-2">

              <Link
                href="/"
                className="text-xl tracking-[0.3em]"
              >
             ORENTEMIST
              </Link>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/40">

                Luxury fragrances selected for people
                who understand that presence begins
                before you say a word.

              </p>

            </div>

            {/* EXPLORE */}

            <div>

              <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                Explore
              </h3>

              <div className="mt-6 space-y-4 text-sm text-white/55">

                <Link
                  href="/"
                  className="block transition hover:text-white"
                >
                  Home
                </Link>

                <Link
                  href="/products"
                  className="block transition hover:text-white"
                >
                  Shop
                </Link>

                <Link
                  href="/about"
                  className="block transition hover:text-white"
                >
                  About
                </Link>

                <Link
                  href="/cart"
                  className="block transition hover:text-white"
                >
                  Cart
                </Link>

              </div>

            </div>

            {/* CONTACT */}

            <div>

              <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                Contact
              </h3>

              <div className="mt-6 space-y-4 text-sm text-white/55">

                {storeEmail && (
                  <a
                    href={`mailto:${storeEmail}`}
                    className="block break-all transition hover:text-white"
                  >
                    {storeEmail}
                  </a>
                )}

                {storePhone && (
                  <a
                    href={`tel:${storePhone}`}
                    className="block transition hover:text-white"
                  >
                    {storePhone}
                  </a>
                )}

                {storeAddress && (
                  <p className="leading-6">
                    {storeAddress}
                  </p>
                )}

              </div>

            </div>

          </div>

          {/* SOCIAL */}

          {(instagram || facebook || tiktok) && (
            <div className="mt-14 flex flex-wrap gap-5 border-t border-white/10 pt-7">

              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.2em] text-white/35 transition hover:text-white"
                >
                  Instagram
                </a>
              )}

              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.2em] text-white/35 transition hover:text-white"
                >
                  Facebook
                </a>
              )}

              {tiktok && (
                <a
                  href={tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.2em] text-white/35 transition hover:text-white"
                >
                  TikTok
                </a>
              )}

            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-7 text-xs text-white/25">

            © {new Date().getFullYear()} {storeName}.
            All rights reserved.

          </div>

        </div>

      </footer>

{/* ================= MOBILE SIDE MENU ================= */}

{MobileMenuOpen && (
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
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Home
            <span className="text-black/30">→</span>
          </Link>

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
   VALUE CARD
========================================================= */

function ValueCard({
  number,
  title,
  text,
}) {
  return (
    <div className="border-b border-r border-black/10 p-7 sm:p-9 lg:min-h-[310px]">

      <span className="text-[9px] tracking-[0.3em] text-black/25">
        {number}
      </span>

      <h3 className="mt-14 text-2xl font-light">
        {title}
      </h3>

      <p className="mt-5 text-sm leading-7 text-black/45">
        {text}
      </p>

    </div>
  );
}


/* =========================================================
   EXPERIENCE STEP
========================================================= */

function ExperienceStep({
  number,
  title,
  text,
}) {
  return (
    <div className="flex gap-6 border-b border-black/10 pb-9">

      <span className="pt-1 text-[9px] tracking-[0.25em] text-black/30">
        {number}
      </span>

      <div>

        <h3 className="text-xl font-light">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-black/45">
          {text}
        </p>

      </div>

    </div>
  );
}