"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

/* =========================================================
   HELPERS
========================================================= */

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

function getProductStatus(product) {
  const stock = Number(product.stock_quantity) || 0;

  const isPreorder =
    stock === 0 &&
    product.is_preorder === true;

  if (isPreorder) {
    return "Pre-order Available";
  }

  if (stock === 0) {
    return "Sold Out";
  }

  if (stock <= 10) {
    return "Low Stock";
  }

  return "In Stock";
}

/* =========================================================
   SEARCH EVERYTHING
========================================================= */

function getSearchableText(product) {
  const fragranceNotes = Array.isArray(
    product.fragrance_notes
  )
    ? product.fragrance_notes.join(" ")
    : product.fragrance_notes ||
      product.fragrance_note ||
      product.notes ||
      product.top_notes ||
      product.middle_notes ||
      product.base_notes ||
      "";

  const categoryName =
    product.category_name ||
    product.category?.name ||
    product.category?.title ||
    "";

  const categoryType =
    product.category_type ||
    product.category?.type ||
    "";

  return [
    product.name,
    product.brand,
    product.description,

    /* fragrance information */
    fragranceNotes,
    product.top_notes,
    product.middle_notes,
    product.base_notes,

    /* category */
    categoryName,
    categoryType,

    /* product details */
    product.size,
    product.volume,
    product.product_type,
    product.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/* =========================================================
   EXTRACT NOTES FOR DISPLAY
========================================================= */

function getFragranceNotes(product) {
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

function getCategoryName(product) {
  return (
    product.category_name ||
    product.category?.name ||
    product.category?.title ||
    "Perfume"
  );
}

function getProductSize(product) {
  return (
    product.size ||
    product.volume ||
    product.ml ||
    ""
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currency, setCurrency] = useState("NGN");
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
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [selectedStatus, setSelectedStatus] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("featured");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const [searchFocused, setSearchFocused] =
    useState(false);

  /* =======================================================
     LOAD PRODUCTS + CATEGORIES + SETTINGS
  ======================================================= */
useEffect(() => {
  async function loadStore() {
    try {
      // Load products first so the collection appears immediately
      const productsResponse = await fetch(
        `${API_URL}/products/`
      );

      if (productsResponse.ok) {
        const productsData =
          await productsResponse.json();

        setProducts(
          getProductsFromResponse(productsData)
        );

        // Stop the main loading screen immediately
        setLoading(false);
      }

      // Load categories and settings separately
      // so they never block the product grid
      const [categoriesResponse, settingsResponse] =
        await Promise.all([
          fetch(`${API_URL}/products/categories/`),
          fetch(`${API_URL}/settings/`),
        ]);

      if (categoriesResponse.ok) {
        const categoriesData =
          await categoriesResponse.json();

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (
          Array.isArray(categoriesData?.results)
        ) {
          setCategories(categoriesData.results);
        }
      }

      if (settingsResponse.ok) {
        const settingsData =
          await settingsResponse.json();

        if (settingsData?.currency) {
          setCurrency(settingsData.currency);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      setLoading(false);
    }
  }

  loadStore();
}, [])

  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredProducts = useMemo(() => {
    let result = [...products];

    /* SEARCH EVERYTHING */

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((product) =>
        getSearchableText(product).includes(query)
      );
    }

    /* CATEGORY */

    if (selectedCategory !== "all") {
      result = result.filter((product) => {
        const productCategoryId =
          product.category_id ??
          product.category?.id;

        return (
          String(productCategoryId) ===
          String(selectedCategory)
        );
      });
    }

    /* STOCK STATUS */

    if (selectedStatus !== "all") {
      result = result.filter(
        (product) =>
          getProductStatus(product) ===
          selectedStatus
      );
    }

    /* SORT */

    if (sortBy === "price-low") {
      result.sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      );
    }

    if (sortBy === "price-high") {
      result.sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    if (sortBy === "featured") {
      result.sort(
        (a, b) =>
          Number(Boolean(b.featured)) -
          Number(Boolean(a.featured))
      );
    }

    return result;
  }, [
    products,
    search,
    selectedCategory,
    selectedStatus,
    sortBy,
  ]);

  /* =======================================================
     CLEAR
  ======================================================= */

  function clearFilters() {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSortBy("featured");
  }

  const hasFilters =
    search.trim() ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    sortBy !== "featured";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#fafafa] text-black">

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-[#fafafa]/95 backdrop-blur-xl">

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
              className="font-medium"
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

          <div className="flex items-center gap-4 text-sm sm:gap-5">

            <Link
              href="/account"
              className="hidden transition-opacity hover:opacity-50 sm:block"
            >
              Account
            </Link>
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

      {/* ===================================================
          HERO / INTRO
      =================================================== */}

      <section className="relative overflow-hidden border-b border-black/[0.08] bg-white">

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-black/[0.03] blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">

          <p className="text-[10px] uppercase tracking-[0.45em] text-black/40 sm:text-xs">
            ORENTEMIST COLLECTION
          </p>

          <div className="mt-4 max-w-4xl">

            <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
              Find Your
              <br className="sm:hidden" />{" "}
              Signature Scent.
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-black/50 sm:text-base">
              Explore perfumes by name, fragrance notes,
              description, brand, category, or size.
              Discover the scent that matches you.
            </p>

          </div>

          {/* QUICK CATEGORY CHIPS */}

          {categories.length > 0 && (
            <div className="mt-9 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

              <button
                type="button"
                onClick={() =>
                  setSelectedCategory("all")
                }
                className={`shrink-0 rounded-full border px-5 py-2.5 text-xs transition ${
                  selectedCategory === "all"
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white hover:border-black/30"
                }`}
              >
                All Products
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category.id)
                  }
                  className={`shrink-0 rounded-full border px-5 py-2.5 text-xs transition ${
                    String(selectedCategory) ===
                    String(category.id)
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white hover:border-black/30"
                  }`}
                >
                  {category.name}
                </button>
              ))}

            </div>
          )}

        </div>

      </section>

      {/* ===================================================
          SEARCH
      =================================================== */}

      <section className="sticky top-[72px] z-40 border-b border-black/[0.08] bg-[#fafafa]/95 backdrop-blur-xl sm:top-20">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8 lg:px-10">

          <div className="flex gap-2 sm:gap-3">

            {/* SEARCH BOX */}

            <div
              className={`relative flex-1 transition-all ${
                searchFocused
                  ? "sm:max-w-none"
                  : ""
              }`}
            >

              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40">

                <svg
                  width="18"
                  height="18"
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

              </div>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onFocus={() =>
                  setSearchFocused(true)
                }
                onBlur={() =>
                  setSearchFocused(false)
                }
                placeholder="Search perfume, oud, vanilla, rose, musk..."
                className="h-12 w-full rounded-full border border-black/10 bg-white pl-11 pr-10 text-sm outline-none transition placeholder:text-black/35 focus:border-black/30 focus:shadow-lg focus:shadow-black/[0.03]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

            </div>

            {/* FILTER BUTTON */}

            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(true)
              }
              className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:border-black/30 lg:hidden"
            >

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>

              Filters

            </button>

            {/* SORT DESKTOP */}

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="hidden h-12 rounded-full border border-black/10 bg-white px-5 text-sm outline-none transition hover:border-black/30 lg:block"
            >
              <option value="featured">
                Featured
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

          </div>

          {/* SEARCH HINT */}

          {search && (
            <div className="pt-3 text-xs text-black/40">
              Searching names, brands, fragrance notes,
              descriptions and categories for{" "}
              <span className="font-medium text-black">
                “{search}”
              </span>
            </div>
          )}

        </div>

      </section>

      {/* ===================================================
          MOBILE FILTER DRAWER
      =================================================== */}

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">

          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl">

            <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-black/15" />

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                  Refine
                </p>

                <h2 className="mt-1 text-2xl font-light">
                  Filters
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-xl"
              >
                ×
              </button>

            </div>

            {/* CATEGORY */}

            <div className="mt-8">

              <h3 className="text-xs font-medium uppercase tracking-[0.2em]">
                Product Category
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategory("all")
                  }
                  className={`rounded-full border px-4 py-2.5 text-xs ${
                    selectedCategory === "all"
                      ? "border-black bg-black text-white"
                      : "border-black/10"
                  }`}
                >
                  All Products
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        category.id
                      )
                    }
                    className={`rounded-full border px-4 py-2.5 text-xs ${
                      String(selectedCategory) ===
                      String(category.id)
                        ? "border-black bg-black text-white"
                        : "border-black/10"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}

              </div>

            </div>

            {/* AVAILABILITY */}

            <div className="mt-8 border-t border-black/10 pt-7">

              <h3 className="text-xs font-medium uppercase tracking-[0.2em]">
                Availability
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-2">

                {[
                  ["all", "All"],
                  ["In Stock", "In Stock"],
                  ["Low Stock", "Low Stock"],
                  [
                    "Out of Stock",
                    "Out of Stock",
                  ],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setSelectedStatus(value)
                    }
                    className={`rounded-xl border px-4 py-3 text-left text-sm ${
                      selectedStatus === value
                        ? "border-black bg-black text-white"
                        : "border-black/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}

              </div>

            </div>

            {/* SORT */}

            <div className="mt-8 border-t border-black/10 pt-7">

              <h3 className="text-xs font-medium uppercase tracking-[0.2em]">
                Sort By
              </h3>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="mt-4 h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none"
              >
                <option value="featured">
                  Featured
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

            </div>

            {/* ACTIONS */}

            <div className="mt-8 flex gap-3">

              <button
                type="button"
                onClick={clearFilters}
                className="h-13 flex-1 rounded-full border border-black/10 text-sm"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="h-13 flex-1 rounded-full bg-black text-sm text-white"
              >
                Show{" "}
                {filteredProducts.length} Products
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <section className="mx-auto flex max-w-7xl gap-10 px-4 py-8 sm:px-8 sm:py-12 lg:px-10">

        {/* =================================================
            DESKTOP SIDEBAR
        ================================================= */}

        <aside className="hidden w-52 shrink-0 lg:block">

          <div className="sticky top-36">

            {/* CATEGORY */}

            <div>

              <div className="flex items-center justify-between">

                <h3 className="text-xs font-medium uppercase tracking-[0.2em]">
                  Category
                </h3>

              </div>

              <div className="mt-5 space-y-3">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategory("all")
                  }
                  className={`block text-left text-sm transition ${
                    selectedCategory === "all"
                      ? "font-medium text-black"
                      : "text-black/45 hover:text-black"
                  }`}
                >
                  All Products
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        category.id
                      )
                    }
                    className={`block text-left text-sm transition ${
                      String(selectedCategory) ===
                      String(category.id)
                        ? "font-medium text-black"
                        : "text-black/45 hover:text-black"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}

              </div>

            </div>

            {/* AVAILABILITY */}

            <div className="mt-10 border-t border-black/10 pt-8">

              <h3 className="text-xs font-medium uppercase tracking-[0.2em]">
                Availability
              </h3>

              <div className="mt-5 space-y-3">

                {[
                  ["all", "All"],
                  ["In Stock", "In Stock"],
                  ["Low Stock", "Low Stock"],
                  [
                    "Out of Stock",
                    "Out of Stock",
                  ],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setSelectedStatus(value)
                    }
                    className={`block text-left text-sm transition ${
                      selectedStatus === value
                        ? "font-medium text-black"
                        : "text-black/45 hover:text-black"
                    }`}
                  >
                    {label}
                  </button>
                ))}

              </div>

            </div>

            {/* CLEAR */}

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-10 text-xs uppercase tracking-widest underline underline-offset-4"
              >
                Clear Filters
              </button>
            )}

          </div>

        </aside>

        {/* =================================================
            PRODUCT AREA
        ================================================= */}

        <div className="min-w-0 flex-1">

          {/* RESULTS HEADER */}

          <div className="mb-7 flex items-end justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-black/35">
                Collection
              </p>

              <p className="mt-2 text-sm text-black/50">
                {loading
                  ? "Loading collection..."
                  : `${filteredProducts.length} ${
                      filteredProducts.length ===
                      1
                        ? "product"
                        : "products"
                    }`}
              </p>

            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs underline underline-offset-4"
              >
                Clear
              </button>
            )}

          </div>

          {/* LOADING */}

          {loading ? (
            <ProductSkeleton />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              search={search}
              onClear={clearFilters}
            />
          ) : (
            <ProductGrid
              products={filteredProducts}
              currency={currency}
            />
          )}

        </div>

      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="mt-10 bg-black text-white">

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">

              <Link
                href="/"
                className="text-xl tracking-[0.3em]"
              >
                ORENTEMIST
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/40">
                Luxury fragrances selected for people
                who understand that presence begins
                before you say a word.
              </p>

            </div>

            <div>

              <h3 className="mb-5 text-xs uppercase tracking-widest text-white/50">
                Shop
              </h3>

              <div className="space-y-3 text-sm text-white/60">

                <Link
                  href="/products"
                  className="block hover:text-white"
                >
                  All Products
                </Link>

                <Link
                  href="/collection"
                  className="block hover:text-white"
                >
                  Featured
                </Link>

                <Link
                  href="/products?sort=newest"
                  className="block hover:text-white"
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
                  className="block hover:text-white"
                >
                  My Account
                </Link>

                <Link
                  href="/cart"
                  className="block hover:text-white"
                >
                  Cart
                </Link>

                <Link
                  href="/contact"
                  className="block hover:text-white"
                >
                  Contact
                </Link>

              </div>

            </div>

          </div>

          <div className="mt-14 border-t border-white/10 pt-7 text-xs text-white/30">
            © {new Date().getFullYear()} ORENTEMIST. All rights reserved.
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

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">

        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="text-lg font-semibold tracking-[0.3em]"
        >
          ORENTEMIST
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

      {/* MENU */}
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
            href="/collection"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Collection
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
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
          >
            Account
            <span className="text-black/30">→</span>
          </Link>
          <Link
  href="/cart"
  onClick={() => setMobileMenuOpen(false)}
  className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
>
  <span className="flex items-center gap-3">
    Cart

    {totalItems > 0 && (
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-semibold text-white">
        {totalItems}
      </span>
    )}
  </span>

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

        </nav>

      </div>

      {/* FOOTER */}
      <div className="border-t border-black/10 px-6 py-6">

        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30">
       ORENTEMIST
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

function ProductGrid({
  products,
  currency = "NGN",
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">

      {products.map((product, index) => {

        const status =
          getProductStatus(product);
         
          
        const isPreorder =
           status === "Pre-order Available";

        const isSoldOut =
           status === "Sold Out";  

       

        const notes =
          getFragranceNotes(product);

        const category =
          getCategoryName(product);

        const size =
          getProductSize(product);

        return (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group min-w-0"
          >

            {/* IMAGE */}

            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#f0f0ee]">

             <Image
  src={getImageUrl(product.image)}
  alt={product.name}
  fill
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
  className="object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
  loading={index < 4 ? "eager" : "lazy"}
/>

              {/* IMAGE GRADIENT */}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* FEATURED */}

              {product.featured && (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black px-3 py-1.5 text-[8px] uppercase tracking-[0.2em] text-white sm:left-3 sm:top-3">
                  Featured
                </span>
              )}

              {/* LOW STOCK */}

              {status === "Low Stock" && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-3 py-1.5 text-[8px] uppercase tracking-[0.15em] backdrop-blur sm:right-3 sm:top-3">
                  Low Stock
                </span>
              )}

             {/* PRE-ORDER */}

{isPreorder && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/25">

    <span className="rounded-full bg-white px-4 py-2 text-[8px] uppercase tracking-[0.2em]">
      Pre-order Available
    </span>

  </div>
)}

{/* SOLD OUT */}

{isSoldOut && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/25">

    <span className="rounded-full bg-white px-4 py-2 text-[8px] uppercase tracking-[0.2em]">
      Sold Out
    </span>

  </div>
)}

            </div>

            {/* PRODUCT INFO */}

            <div className="pt-4">

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="truncate text-[9px] uppercase tracking-[0.22em] text-black/35 sm:text-[10px]">
                    {product.brand ||
                      category ||
                      "Perfume"}
                  </p>

                  <h3 className="mt-1 truncate text-sm font-medium sm:text-base">
                    {product.name}
                  </h3>

                </div>

                <span className="shrink-0 text-sm font-medium">
                  {formatPrice(
                    product.price,
                    currency
                  )}
                </span>

              </div>

              {/* SIZE */}

              {size && (
                <p className="mt-2 text-xs text-black/40">
                  {size}
                </p>
              )}

              {/* NOTES */}

              {notes.length > 0 && (
                <div className="mt-3 flex gap-1.5 overflow-hidden">

                  {notes
                    .slice(0, 3)
                    .map((note, index) => (
                      <span
                        key={`${note}-${index}`}
                        className="shrink-0 rounded-full bg-black/[0.035] px-2.5 py-1 text-[8px] uppercase tracking-wider text-black/45"
                      >
                        {note}
                      </span>
                    ))}

                </div>
              )}

              {/* CATEGORY */}

              <p className="mt-3 text-[9px] uppercase tracking-[0.15em] text-black/25">
                {category}
              </p>

            </div>

          </Link>
        );
      })}

    </div>
  );
}


/* =========================================================
   SKELETON
========================================================= */

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3">

      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div key={index}>

            <div className="aspect-[4/5] animate-pulse bg-black/[0.04]" />

            <div className="mt-4 h-2.5 w-16 animate-pulse bg-black/[0.05]" />

            <div className="mt-2 h-4 w-28 animate-pulse bg-black/[0.05]" />

            <div className="mt-3 h-3 w-16 animate-pulse bg-black/[0.04]" />

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  search,
  onClear,
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center border border-black/[0.08] bg-white px-6 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.035]">

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
        No fragrance found
      </p>

      <h2 className="mt-3 text-2xl font-light sm:text-3xl">
        Nothing matched your search.
      </h2>

      {search && (
        <p className="mt-3 max-w-md text-sm leading-6 text-black/45">
          We couldn't find a product matching{" "}
          <span className="font-medium text-black">
            "{search}"
          </span>
          . Try another fragrance note, category,
          brand or product name.
        </p>
      )}

      <button
        type="button"
        onClick={onClear}
        className="mt-8 rounded-full bg-black px-7 py-3.5 text-xs text-white transition hover:bg-black/80"
      >
        Clear Filters
      </button>

    </div>
  );
}