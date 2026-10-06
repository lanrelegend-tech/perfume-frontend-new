"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

const RECENT_SEARCHES_KEY =
  "orentemist_recent_searches";

const MAX_RECENT_SEARCHES = 6;

/* =========================================================
   HELPERS
========================================================= */

function getImageUrl(image) {
  if (!image) return "/placeholder-product.jpg";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    if (image.includes("res.cloudinary.com")) {
      return image.replace(
        "/image/upload/",
        "/image/upload/f_auto,q_auto/"
      );
    }

    return image;
  }

  const imagePath = image.startsWith("/")
    ? image
    : `/${image}`;

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

function getNotes(product) {
  if (Array.isArray(product.fragrance_notes)) {
    return product.fragrance_notes;
  }

  if (typeof product.fragrance_notes === "string") {
    return product.fragrance_notes
      .split(",")
      .map((note) => note.trim())
      .filter(Boolean);
  }

  if (typeof product.notes === "string") {
    return product.notes
      .split(",")
      .map((note) => note.trim())
      .filter(Boolean);
  }

  return [];
}

function getCategory(product) {
  return (
    product.category_name ||
    product.category?.name ||
    product.category?.title ||
    product.category_type ||
    "Perfume"
  );
}

function getSearchableText(product) {
  const notes = getNotes(product);

  return [
    product.name,
    product.brand,
    product.description,
    product.size,
    product.volume,
    product.ml,
    product.product_type,
    product.type,
    getCategory(product),
    ...notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProductStatus(product) {
  const stock =
    Number(product.stock_quantity) || 0;

  if (
    stock === 0 &&
    product.is_preorder === true
  ) {
    return "Pre-order";
  }

  if (stock === 0) {
    return "Sold Out";
  }

  if (stock <= 10) {
    return "Low Stock";
  }

  return "Available";
}

/* =========================================================
   PAGE
========================================================= */

export default function SearchPage() {
  const inputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [nextProductsUrl, setNextProductsUrl] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currency, setCurrency] = useState("NGN");

  const [query, setQuery] = useState("");

  const [recentSearches, setRecentSearches] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [sortBy, setSortBy] =
    useState("relevance");

  /* =======================================================
     LOAD RECENT SEARCHES
  ======================================================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          RECENT_SEARCHES_KEY
        );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  /* =======================================================
     SAVE SEARCH
  ======================================================= */

  function saveSearch(value) {
    const clean = value.trim();

    if (!clean) return;

    setRecentSearches((current) => {
      const updated = [
        clean,
        ...current.filter(
          (item) =>
            item.toLowerCase() !==
            clean.toLowerCase()
        ),
      ].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(
          RECENT_SEARCHES_KEY,
          JSON.stringify(updated)
        );
      } catch {}

      return updated;
    });
  }

  /* =======================================================
     REMOVE RECENT SEARCH
  ======================================================= */

  function removeRecentSearch(search) {
    setRecentSearches((current) => {
      const updated = current.filter(
        (item) => item !== search
      );

      try {
        localStorage.setItem(
          RECENT_SEARCHES_KEY,
          JSON.stringify(updated)
        );
      } catch {}

      return updated;
    });
  }

  /* =======================================================
     CLEAR RECENT SEARCHES
  ======================================================= */

  function clearRecentSearches() {
    setRecentSearches([]);

    try {
      localStorage.removeItem(
        RECENT_SEARCHES_KEY
      );
    } catch {}
  }

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  function buildSearchProductsUrl() {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("search", query.trim());
    }

    const orderingMap = {
      "price-low": "price",
      "price-high": "-price",
      newest: "-created_at",
    };

    if (orderingMap[sortBy]) {
      params.set("ordering", orderingMap[sortBy]);
    }

    const queryString = params.toString();

    return `${API_URL}/products/${queryString ? `?${queryString}` : ""}`;
  }

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);

        const response = await fetch(
          buildSearchProductsUrl(),
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.ok) {
          const data =
            await response.json();

          setProducts(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.results)
              ? data.results
              : []
          );

          setNextProductsUrl(
            Array.isArray(data)
              ? null
              : data?.next || null
          );
        }

        try {
          const settingsResponse =
            await fetch(
              `${API_URL}/settings/`,
              {
                cache: "no-store",
                signal: controller.signal,
              }
            );

          if (settingsResponse.ok) {
            const settings =
              await settingsResponse.json();

            if (settings?.currency) {
              setCurrency(
                settings.currency
              );
            }
          }
        } catch {}

      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            "Search products error:",
            error
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [query, sortBy]);

  async function loadMoreProducts() {
    if (!nextProductsUrl || loadingMore) {
      return;
    }

    try {
      setLoadingMore(true);

      const response = await fetch(
        nextProductsUrl,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const pageProducts = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setProducts((currentProducts) => {
        const existingIds = new Set(
          currentProducts.map((product) => product.id)
        );

        return [
          ...currentProducts,
          ...pageProducts.filter(
            (product) => !existingIds.has(product.id)
          ),
        ];
      });

      setNextProductsUrl(
        Array.isArray(data)
          ? null
          : data?.next || null
      );
    } finally {
      setLoadingMore(false);
    }
  }

  /* =======================================================
     SEARCH RESULTS
  ======================================================= */

  const results = useMemo(() => {
    const cleanQuery =
      query.trim().toLowerCase();

    if (!cleanQuery) {
      return [];
    }

    const words =
      cleanQuery
        .split(/\s+/)
        .filter(Boolean);

    const matches = products
      .map((product) => {
        const searchable =
          getSearchableText(product);

        let score = 0;

        /* Exact full match */

        if (
          searchable.includes(
            cleanQuery
          )
        ) {
          score += 20;
        }

        const name =
          String(
            product.name || ""
          ).toLowerCase();

        const brand =
          String(
            product.brand || ""
          ).toLowerCase();

        /* Product name */

        if (
          name.includes(cleanQuery)
        ) {
          score += 50;
        }

        /* Brand */

        if (
          brand.includes(cleanQuery)
        ) {
          score += 40;
        }

        /* Individual words */

        words.forEach((word) => {
          if (name.includes(word)) {
            score += 25;
          }

          if (brand.includes(word)) {
            score += 20;
          }

          if (
            searchable.includes(word)
          ) {
            score += 8;
          }
        });

        return {
          product,
          score,
        };
      })
      .filter(
        (item) => item.score > 0
      );

    if (sortBy === "price-low") {
      matches.sort(
        (a, b) =>
          Number(
            a.product.price || 0
          ) -
          Number(
            b.product.price || 0
          )
      );
    } else if (
      sortBy === "price-high"
    ) {
      matches.sort(
        (a, b) =>
          Number(
            b.product.price || 0
          ) -
          Number(
            a.product.price || 0
          )
      );
    } else if (
      sortBy === "newest"
    ) {
      matches.sort(
        (a, b) =>
          new Date(
            b.product.created_at || 0
          ) -
          new Date(
            a.product.created_at || 0
          )
      );
    } else {
      matches.sort(
        (a, b) =>
          b.score - a.score
      );
    }

    return matches.map(
      (item) => item.product
    );
  }, [
    products,
    query,
    sortBy,
  ]);

  /* =======================================================
     SUGGESTIONS
  ======================================================= */

  const suggestedSearches = [
    "Oud",
    "Vanilla",
    "Musk",
    "Rose",
    "Woody",
    "Fresh",
    "Sweet",
    "Lattafa",
  ];

  const popularProducts =
    useMemo(() => {
      return products
        .filter(
          (product) =>
            product.featured
        )
        .slice(0, 4);
    }, [products]);

  /* =======================================================
     HANDLERS
  ======================================================= */

  function handleSearchSubmit(
    event
  ) {
    event?.preventDefault();

    const clean =
      query.trim();

    if (!clean) {
      inputRef.current?.focus();
      return;
    }

    saveSearch(clean);
    setShowSuggestions(false);
  }

  function chooseSuggestion(
    value
  ) {
    setQuery(value);
    saveSearch(value);
    setShowSuggestions(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function clearSearch() {
    setQuery("");
    setShowSuggestions(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#faf9f6] text-black">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-[80] border-b border-black/[0.08] bg-[#faf9f6]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-10">

          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.2em] sm:text-2xl"
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
              className="transition-opacity hover:opacity-50"
            >
              About
            </Link>

          </nav>

          <div className="flex items-center gap-2 sm:gap-3">

            <Link
              href="/account"
              className="hidden text-sm transition-opacity hover:opacity-50 sm:block"
            >
              Account
            </Link>

            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black bg-black text-white sm:h-10 sm:w-10"
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
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full md:hidden"
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

      {/* =================================================
          SEARCH HERO
      ================================================= */}

      <section className="relative overflow-hidden border-b border-black/[0.07] bg-white">

        {/* Decorative background */}

        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-black/[0.025] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-black/[0.025] blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">

          <div className="text-center">

            <p className="text-[10px] uppercase tracking-[0.45em] text-black/35 sm:text-xs">
              ORENTEMIST FRAGRANCE DISCOVERY
            </p>

            <h1 className="mt-5 text-4xl font-light tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Find your
              <br />
              <span className="italic">
                signature scent.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-black/45 sm:text-base">
              Search our fragrance collection
              by perfume, brand, notes or
              anything that describes the scent
              you're looking for.
            </p>

          </div>

          {/* SEARCH FORM */}

          <form
            onSubmit={
              handleSearchSubmit
            }
            className="relative mx-auto mt-10 max-w-3xl"
          >

            <div
              className={`relative rounded-[22px] border bg-[#faf9f6] transition-all duration-300 ${
                showSuggestions &&
                !query
                  ? "border-black shadow-[0_20px_60px_rgba(0,0,0,0.07)]"
                  : "border-black/10"
              }`}
            >

              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 sm:left-6"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="m20 20-4-4" />
              </svg>

              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(
                    event.target.value
                  );
                  setShowSuggestions(
                    true
                  );
                }}
                onFocus={() =>
                  setShowSuggestions(
                    true
                  )
                }
                placeholder="Search perfume, oud, vanilla, Lattafa..."
                className="h-[68px] w-full bg-transparent pl-14 pr-28 text-base outline-none placeholder:text-black/30 sm:h-[76px] sm:pl-16 sm:text-lg"
              />

              {query && (
                <button
                  type="button"
                  onClick={
                    clearSearch
                  }
                  aria-label="Clear search"
                  className="absolute right-[76px] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/[0.05] text-lg text-black/50 transition hover:bg-black/10 hover:text-black"
                >
                  ×
                </button>
              )}

              <button
                type="submit"
                className="absolute right-2 top-1/2 flex h-12 -translate-y-1/2 items-center justify-center rounded-[16px] bg-black px-5 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black/80 sm:right-2 sm:px-7"
              >
                Search
              </button>

            </div>

            {/* =================================================
                SUGGESTION PANEL
            ================================================= */}

            {showSuggestions &&
              !query && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-[22px] border border-black/10 bg-white p-5 text-left shadow-[0_25px_70px_rgba(0,0,0,0.08)] sm:p-7">

                  {recentSearches.length >
                    0 && (
                    <div>

                      <div className="flex items-center justify-between">

                        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                          Recent searches
                        </p>

                        <button
                          type="button"
                          onClick={
                            clearRecentSearches
                          }
                          className="text-[10px] uppercase tracking-[0.15em] text-black/35 underline underline-offset-4"
                        >
                          Clear
                        </button>

                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">

                        {recentSearches.map(
                          (item) => (
                            <div
                              key={item}
                              className="flex items-center rounded-full border border-black/10 bg-[#faf9f6]"
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  chooseSuggestion(
                                    item
                                  )
                                }
                                className="px-4 py-2.5 text-xs"
                              >
                                {item}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeRecentSearch(
                                    item
                                  )
                                }
                                aria-label={`Remove ${item}`}
                                className="pr-3 text-black/30 hover:text-black"
                              >
                                ×
                              </button>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  <div
                    className={
                      recentSearches.length
                        ? "mt-7 border-t border-black/10 pt-6"
                        : ""
                    }
                  >

                    <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                      Try searching
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {suggestedSearches.map(
                        (suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() =>
                              chooseSuggestion(
                                suggestion
                              )
                            }
                            className="rounded-full border border-black/10 px-4 py-2.5 text-xs transition hover:border-black hover:bg-black hover:text-white"
                          >
                            {suggestion}
                          </button>
                        )
                      )}

                    </div>

                  </div>

                </div>
              )}

          </form>

          {/* POPULAR NOTES */}

          {!query && (
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-xs text-black/40">

              <span className="mr-1">
                Popular:
              </span>

              {[
                "Oud",
                "Vanilla",
                "Musk",
                "Rose",
              ].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      chooseSuggestion(
                        item
                      )
                    }
                    className="text-black/65 underline underline-offset-4 transition hover:text-black"
                  >
                    {item}
                  </button>
                )
              )}

            </div>
          )}

        </div>

      </section>

      {/* =================================================
          RESULTS
      ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10">

        {!query.trim() ? (
          <>
            {/* FEATURED DISCOVERY */}

            {popularProducts.length >
              0 && (
              <div>

                <div className="flex items-end justify-between">

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.35em] text-black/35">
                      Explore
                    </p>

                    <h2 className="mt-3 text-2xl font-light sm:text-3xl">
                      You might like
                    </h2>

                  </div>

                  <Link
                    href="/products"
                    className="text-xs underline underline-offset-4"
                  >
                    View collection
                  </Link>

                </div>

                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">

                  {popularProducts.map(
                    (product) => (
                      <ProductCard
                        key={
                          product.id
                        }
                        product={
                          product
                        }
                        currency={
                          currency
                        }
                      />
                    )
                  )}

                </div>

              </div>
            )}

            {/* DISCOVER BY MOOD */}

            <div className="mt-20 border-t border-black/10 pt-12">

              <div className="text-center">

                <p className="text-[10px] uppercase tracking-[0.35em] text-black/35">
                  Discover by scent
                </p>

                <h2 className="mt-3 text-2xl font-light sm:text-3xl">
                  What are you in the mood for?
                </h2>

              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">

                {[
                  {
                    title: "Deep & Woody",
                    search: "Woody",
                  },
                  {
                    title: "Warm & Sweet",
                    search: "Vanilla",
                  },
                  {
                    title: "Fresh & Clean",
                    search: "Fresh",
                  },
                  {
                    title: "Dark & Mysterious",
                    search: "Oud",
                  },
                ].map(
                  (item) => (
                    <button
                      key={
                        item.title
                      }
                      type="button"
                      onClick={() =>
                        chooseSuggestion(
                          item.search
                        )
                      }
                      className="group relative min-h-[150px] overflow-hidden border border-black/10 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-black/30 hover:shadow-xl hover:shadow-black/[0.04] sm:min-h-[180px]"
                    >

                      <span className="absolute right-5 top-5 text-black/20 transition group-hover:text-black">
                        ↗
                      </span>

                      <div className="flex h-full flex-col justify-end">

                        <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
                          Explore
                        </p>

                        <h3 className="mt-2 text-lg font-light">
                          {item.title}
                        </h3>

                      </div>

                    </button>
                  )
                )}

              </div>

            </div>
          </>
        ) : (
          <>
            {/* RESULTS HEADER */}

            <div className="flex flex-col gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-[10px] uppercase tracking-[0.3em] text-black/35">
                  Search results
                </p>

                <h2 className="mt-2 text-2xl font-light sm:text-3xl">

                  {loading
                    ? "Searching..."
                    : results.length ===
                      0
                    ? "No fragrances found"
                    : `${results.length} ${
                        results.length ===
                        1
                          ? "fragrance"
                          : "fragrances"
                      } found`}

                </h2>

                <p className="mt-2 text-sm text-black/40">
                  Results for{" "}
                  <span className="font-medium text-black">
                    “{query}”
                  </span>
                </p>

              </div>

              {results.length >
                0 && (
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value
                    )
                  }
                  className="h-11 rounded-full border border-black/10 bg-white px-4 text-xs outline-none"
                >
                  <option value="relevance">
                    Relevance
                  </option>

                  <option value="newest">
                    Newest
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>
                </select>
              )}

            </div>

            {/* LOADING */}

            {loading ? (
              <ProductSkeleton />
            ) : results.length ===
              0 ? (
              <NoResults
                query={query}
                onSuggestion={
                  chooseSuggestion
                }
                suggestions={
                  suggestedSearches
                }
              />
            ) : (
              <>
              <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">

                {results.map(
                  (product) => (
                    <ProductCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                      currency={
                        currency
                      }
                    />
                  )
                )}

              </div>
              {nextProductsUrl && (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreProducts}
                    disabled={loadingMore}
                    className="rounded-full border border-black px-7 py-3 text-xs font-medium transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore
                      ? "Loading..."
                      : "Load More"}
                  </button>
                </div>
              )}
              </>
            )}

          </>
        )}

      </section>

      {/* =================================================
          MOBILE MENU
      ================================================= */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">

          <button
            type="button"
            aria-label="Close menu"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <aside className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">

              <Link
                href="/"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="text-lg font-semibold tracking-[0.3em]"
              >
                ORENTEMIST
              </Link>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center text-2xl text-black/60"
              >
                ×
              </button>

            </div>

            <nav className="flex-1 px-6 py-8">

              {[
                ["Home", "/"],
                [
                  "Collection",
                  "/collection",
                ],
                [
                  "Shop",
                  "/products",
                ],
                ["About", "/about"],
                [
                  "Account",
                  "/account",
                ],
                ["Cart", "/cart"],
                [
                  "Contact",
                  "/contact",
                ],
              ].map(
                ([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() =>
                      setMobileMenuOpen(
                        false
                      )
                    }
                    className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
                  >
                    {label}

                    <span className="text-black/25">
                      →
                    </span>
                  </Link>
                )
              )}

            </nav>

            <div className="border-t border-black/10 px-6 py-6">

              <p className="text-[10px] uppercase tracking-[0.3em] text-black/30">
                ORENTEMIST
              </p>

              <p className="mt-2 text-xs text-black/40">
                Luxury fragrances.
                Signature presence.
              </p>

            </div>

          </aside>

        </div>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="mt-10 bg-black text-white">

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">

          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-lg tracking-[0.3em]">
                ORENTEMIST
              </p>

              <p className="mt-3 max-w-sm text-sm leading-6 text-white/35">
                Luxury fragrances for
                those who leave a
                lasting impression.
              </p>

            </div>

            <div className="flex gap-6 text-xs text-white/50">

              <Link
                href="/products"
                className="hover:text-white"
              >
                Shop
              </Link>

              <Link
                href="/about"
                className="hover:text-white"
              >
                About
              </Link>

              <Link
                href="/contact"
                className="hover:text-white"
              >
                Contact
              </Link>

            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.2em] text-white/25">
            © {new Date().getFullYear()}{" "}
            ORENTEMIST. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  currency = "NGN",
}) {
  const status =
    getProductStatus(product);

  const notes =
    getNotes(product);

  const category =
    getCategory(product);

  const size =
    product.size ||
    product.volume ||
    product.ml ||
    "";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group min-w-0"
    >

      <div className="relative aspect-[4/5] overflow-hidden bg-[#efefec]">

        <Image
          src={getImageUrl(product.image)}
          alt={
            product.name ||
            "Fragrance"
          }
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
        />

        {product.featured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black px-3 py-1.5 text-[8px] uppercase tracking-[0.2em] text-white">
            Featured
          </span>
        )}

        {status ===
          "Low Stock" && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-3 py-1.5 text-[8px] uppercase tracking-[0.15em] backdrop-blur">
            Low Stock
          </span>
        )}

        {status ===
          "Pre-order" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">

            <span className="rounded-full bg-white px-4 py-2 text-[8px] uppercase tracking-[0.2em]">
              Pre-order
            </span>

          </div>
        )}

        {status ===
          "Sold Out" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">

            <span className="rounded-full bg-white px-4 py-2 text-[8px] uppercase tracking-[0.2em]">
              Sold Out
            </span>

          </div>
        )}

      </div>

      <div className="pt-4">

        <p className="truncate text-[9px] uppercase tracking-[0.22em] text-black/65">
          {product.brand ||
            category ||
            "Perfume"}
        </p>

        <div className="mt-1 flex items-start justify-between gap-3">

          <h3 className="min-w-0 truncate text-sm font-semibold sm:text-base">
            {product.name}
          </h3>

          <span className="shrink-0 text-sm font-medium">
            {formatPrice(
              product.price,
              currency
            )}
          </span>

        </div>

        {size && (
          <p className="mt-1.5 text-xs text-black/45">
            {size}
          </p>
        )}

        {notes.length >
          0 && (
          <div className="mt-3 flex gap-1.5 overflow-hidden">

            {notes
              .slice(0, 3)
              .map(
                (
                  note,
                  index
                ) => (
                  <span
                    key={`${note}-${index}`}
                    className="shrink-0 rounded-full bg-black/[0.035] px-2.5 py-1 text-[8px] uppercase tracking-wider text-black/55"
                  >
                    {note}
                  </span>
                )
              )}

          </div>
        )}

      </div>

    </Link>
  );
}


/* =========================================================
   PRODUCT SKELETON
========================================================= */

function ProductSkeleton() {
  return (
    <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">

      {Array.from({
        length: 8,
      }).map((_, index) => (
        <div key={index}>

          <div className="aspect-[4/5] animate-pulse bg-black/[0.04]" />

          <div className="mt-4 h-2.5 w-16 animate-pulse bg-black/[0.05]" />

          <div className="mt-2 h-4 w-28 animate-pulse bg-black/[0.05]" />

          <div className="mt-3 h-3 w-16 animate-pulse bg-black/[0.04]" />

        </div>
      ))}

    </div>
  );
}


/* =========================================================
   NO RESULTS
========================================================= */

function NoResults({
  query,
  suggestions,
  onSuggestion,
}) {
  return (
    <div className="py-16 text-center sm:py-24">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.035]">

        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
          />

          <path d="m20 20-4-4" />

        </svg>

      </div>

      <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-black/35">
        Nothing found
      </p>

      <h2 className="mt-3 text-2xl font-light sm:text-3xl">
        We couldn't find that scent.
      </h2>

      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-black/45">
        Try searching for a perfume name,
        brand, fragrance note or something
        simpler.
      </p>

      <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2">

        {suggestions.map(
          (suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() =>
                onSuggestion(
                  suggestion
                )
              }
              className="rounded-full border border-black/10 px-4 py-2.5 text-xs transition hover:border-black hover:bg-black hover:text-white"
            >
              {suggestion}
            </button>
          )
        )}

      </div>

      <p className="mt-8 text-xs text-black/25">
        Search used: “{query}”
      </p>

    </div>
  );
}
