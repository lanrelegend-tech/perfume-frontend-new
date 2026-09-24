"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function CollectionPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  /*
  ============================================================
  LOAD PRODUCTS
  ============================================================
  */

  useEffect(() => {
    let cancelled = false;

    async function loadCollection() {
      try {
        /*
        --------------------------------------------------------
        STEP 1
        Load products first.
        Featured products depend on this request.
        --------------------------------------------------------
        */

        const productsRes = await fetch(
          `${API_URL}/products/`,
          {
            cache: "no-store",
          }
        );

        if (!productsRes.ok) {
          throw new Error(
            `Products request failed: ${productsRes.status}`
          );
        }

        const productsData =
          await productsRes.json();

        if (cancelled) {
          return;
        }

        const products = Array.isArray(productsData)
          ? productsData
          : productsData.results || [];

        /*
        --------------------------------------------------------
        Give Featured Products the data immediately.
        The main Collection grid remains loading.
        --------------------------------------------------------
        */

        setProducts(products);
        setFeaturedLoading(false);

        /*
        --------------------------------------------------------
        STEP 2
        Load categories AFTER products.
        --------------------------------------------------------
        */

        const categoriesRes = await fetch(
          `${API_URL}/products/categories/`,
          {
            cache: "no-store",
          }
        );

        if (!categoriesRes.ok) {
          throw new Error(
            `Categories request failed: ${categoriesRes.status}`
          );
        }

        const categoriesData =
          await categoriesRes.json();

        if (cancelled) {
          return;
        }

        const categories = Array.isArray(
          categoriesData
        )
          ? categoriesData
          : categoriesData.results || [];

        setCategories(categories);

        /*
        --------------------------------------------------------
        Now allow the full Collection grid to render.
        --------------------------------------------------------
        */

        setLoading(false);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Collection error:",
            error
          );

          setFeaturedLoading(false);
          setLoading(false);
        }
      }
    }

    loadCollection();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  ============================================================
  CART COUNT
  ============================================================
  */

  useEffect(() => {
    function updateCartCount() {
      try {
        const savedCart =
          localStorage.getItem(
            "orentemist_cart"
          );

        const cart = savedCart
          ? JSON.parse(savedCart)
          : [];

        const count = Array.isArray(cart)
          ? cart.reduce(
              (total, item) =>
                total +
                Number(item.quantity || 0),
              0
            )
          : 0;

        setCartCount(count);
      } catch (error) {
        console.error(
          "Cart count error:",
          error
        );

        setCartCount(0);
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

  /*
  ============================================================
  FEATURED PRODUCTS
  ============================================================
  */

  const featuredProducts = products
    .filter((product) =>
      Boolean(product.featured)
    )
    .sort((a, b) => {
      const dateA = new Date(
        a.updated_at ||
          a.updatedAt ||
          a.created_at ||
          a.createdAt ||
          0
      ).getTime();

      const dateB = new Date(
        b.updated_at ||
          b.updatedAt ||
          b.created_at ||
          b.createdAt ||
          0
      ).getTime();

      return dateB - dateA;
    });

  const mainFeaturedProduct =
    featuredProducts[0] || null;

  const additionalFeaturedProducts =
    featuredProducts.slice(1);

  /*
  ============================================================
  FILTERED PRODUCTS
  ============================================================
  */

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((product) => {
          const categoryId =
            product.category?.id ??
            product.category_id ??
            product.category;

          const categoryName =
            product.category?.name ??
            product.category_name ??
            "";

          return (
            String(categoryId) ===
              String(activeCategory) ||
            categoryName.toLowerCase() ===
              String(
                activeCategory
              ).toLowerCase()
          );
        });

  /*
  ============================================================
  HELPERS
  ============================================================
  */

  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(Number(price || 0));
  };

  const getImage = (product) => {
    if (!product?.image) {
      return "/placeholder-perfume.jpg";
    }

    return product.image;
  };

  const isInStock = (product) => {
    return (
      product?.in_stock !== false &&
      product?.stock !== 0 &&
      product?.stock_quantity !== 0
    );
  };

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
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black"
            >
              Collection
            </Link>

            <Link
              href="/about"
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/55 transition hover:text-black"
            >
              About
            </Link>

          </nav>

          {/* Right Side */}

          <div className="flex items-center gap-5">

            {/* Account */}

            <Link
              href="/account"
              className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-black/60 transition hover:text-black sm:block"
            >
              Account
            </Link>

            {/* Desktop Cart */}

            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-black md:flex"
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

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] font-semibold text-white">
                  {cartCount}
                </span>
              )}

            </Link>

            {/* Mobile Actions */}

            <div className="flex items-center gap-2 md:hidden">

              {/* Mobile Cart */}

              <Link
                href="/cart"
                aria-label="Shopping cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white"
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

                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] font-semibold text-white">
                    {cartCount}
                  </span>
                )}

              </Link>

              {/* Mobile Menu Button */}

              <button
                type="button"
                onClick={() =>
                  setMobileMenu(!mobileMenu)
                }
                className="flex h-10 w-10 items-center justify-center"
                aria-label="Toggle menu"
              >
                <div className="space-y-1.5">
                  <span className="block h-px w-5 bg-black" />
                  <span className="block h-px w-5 bg-black" />
                </div>
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          EDITORIAL HEADER
      ===================================================== */}

      <section className="border-b border-black/10">

        <div className="mx-auto grid max-w-[1500px] md:grid-cols-2">

          {/* Left */}

          <div className="flex min-h-[430px] flex-col justify-between px-6 py-12 md:min-h-[560px] md:px-10 md:py-16 lg:px-14">

            <div>

              <p className="mb-5 text-[10px] uppercase tracking-[0.4em] text-black/40">
                ORENTEMIST / 2026
              </p>

              <h1 className="max-w-xl font-serif text-6xl leading-[0.88] tracking-tight md:text-7xl lg:text-[100px]">
                The
                <br />
                Art of
                <br />
                Scent.
              </h1>

            </div>

            <p className="max-w-sm text-sm leading-7 text-black/50">
              A curated collection of fragrances
              created to become part of your
              identity. Discover scents designed
              to be remembered.
            </p>

          </div>

          {/* Big Featured Card */}

          <div className="relative min-h-[430px] overflow-hidden bg-[#e9e4dc] md:min-h-[560px]">

            {/* FEATURED LOADING */}

            {featuredLoading ? (

              <div className="flex h-full w-full items-center justify-center">

                <div className="h-full w-full animate-pulse bg-black/5" />

              </div>

            ) : mainFeaturedProduct ? (

              <Link
                href={`/products/${mainFeaturedProduct.id}`}
                className="group block h-full"
              >

                <Image
                  src={getImage(
                    mainFeaturedProduct
                  )}
                  alt={
                    mainFeaturedProduct.name ||
                    "Featured fragrance"
                  }
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition duration-1000 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/0 transition duration-700 group-hover:bg-black/5" />

                <div className="absolute bottom-6 left-6 bg-white px-5 py-4 md:bottom-8 md:left-8">

                  <p className="text-[9px] uppercase tracking-[0.25em] text-black/40">
                    Featured
                  </p>

                  <p className="mt-1 font-serif text-lg">
                    {mainFeaturedProduct.name}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-black/40">
                    Discover fragrance
                  </p>

                </div>

              </Link>

            ) : (

              <div className="flex h-full items-center justify-center">

                <div className="text-center">

                  <p className="font-serif text-3xl text-black/20">
                    ORENTEMIST
                  </p>

                  <p className="mt-3 text-[9px] uppercase tracking-[0.3em] text-black/25">
                    Featured fragrances coming soon
                  </p>

                </div>

              </div>

            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          FEATURED COLLECTION
      ===================================================== */}

      {!featuredLoading &&
        featuredProducts.length > 0 && (

          <section className="border-b border-black/10 bg-white">

            <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-10 md:py-20 lg:px-14">

              <div className="mb-10 flex items-end justify-between">

                <div>

                  <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-black/35">
                    Selected
                  </p>

                  <h2 className="font-serif text-4xl md:text-5xl">
                    Featured Fragrances
                  </h2>

                </div>

                <span className="text-[10px] uppercase tracking-[0.2em] text-black/35">
                  {featuredProducts.length}{" "}
                  {featuredProducts.length === 1
                    ? "Fragrance"
                    : "Fragrances"}
                </span>

              </div>

              {additionalFeaturedProducts.length > 0 ? (

                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">

                  {additionalFeaturedProducts.map(
                    (product) => (

                      <Link
                        href={`/products/${product.id}`}
                        key={product.id}
                        className="group"
                      >

                        <div className="relative aspect-[3/4] overflow-hidden bg-[#efede8]">

                          <Image
                            src={getImage(product)}
                            alt={
                              product.name ||
                              "Featured perfume"
                            }
                            fill
                            loading="lazy"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition duration-700 ease-out group-hover:scale-105"
                          />

                          {!isInStock(product) && (
                            <span className="absolute right-3 top-3 bg-black px-3 py-2 text-[9px] uppercase tracking-[0.15em] text-white">
                              Sold Out
                            </span>
                          )}

                          <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">

                            <div className="bg-white px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.18em]">
                              Discover Fragrance
                            </div>

                          </div>

                        </div>

                        <div className="pt-4">

                          <div className="flex items-start justify-between gap-3">

                            <div>

                              <h3 className="font-serif text-lg">
                                {product.name}
                              </h3>

                              <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-black/35">
                                {product.category?.name ||
                                  product.category_name ||
                                  "Fragrance"}
                              </p>

                            </div>

                            <span className="whitespace-nowrap text-xs">
                              {formatPrice(
                                product.price
                              )}
                            </span>

                          </div>

                        </div>

                      </Link>

                    )
                  )}

                </div>

              ) : (

                <div className="border-t border-black/10 pt-8">

                  <p className="text-sm text-black/45">
                    The featured fragrance is
                    shown above.
                  </p>

                </div>

              )}

            </div>

          </section>

        )}

      {/* =====================================================
          CATEGORY NAVIGATION
      ===================================================== */}

      <section className="border-b border-black/10 bg-white">

        <div className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto px-6 py-5 md:px-10 lg:px-14">

          <span className="mr-4 shrink-0 text-[10px] uppercase tracking-[0.25em] text-black/35">
            Filter
          </span>

          <button
            onClick={() =>
              setActiveCategory("All")
            }
            className={`shrink-0 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition ${
              activeCategory === "All"
                ? "bg-black text-white"
                : "border border-black/10 hover:border-black"
            }`}
          >
            All
          </button>

          {categories.map((category) => {

            const name =
              typeof category === "string"
                ? category
                : category.name;

            const value =
              typeof category === "string"
                ? category
                : category.id;

            return (
              <button
                key={category.id || name}
                onClick={() =>
                  setActiveCategory(value)
                }
                className={`shrink-0 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition ${
                  String(activeCategory) ===
                  String(value)
                    ? "bg-black text-white"
                    : "border border-black/10 hover:border-black"
                }`}
              >
                {name}
              </button>
            );
          })}

        </div>

      </section>

      {/* =====================================================
          ALL PRODUCTS
      ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-6 py-16 md:px-10 md:py-20 lg:px-14">

        <div className="mb-12 flex items-end justify-between">

          <div>

            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-black/35">
              Discover
            </p>

            <h2 className="font-serif text-4xl md:text-5xl">
              The Collection
            </h2>

          </div>

          <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">
            {loading
              ? "..."
              : `${filteredProducts.length} Products`}
          </span>

        </div>

        {loading ? (

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

            {Array.from({ length: 8 }).map(
              (_, index) => (

                <div key={index}>

                  <div className="aspect-[3/4] animate-pulse bg-black/5" />

                  <div className="mt-4 h-4 w-2/3 animate-pulse bg-black/5" />

                  <div className="mt-3 h-3 w-1/3 animate-pulse bg-black/5" />

                </div>

              )
            )}

          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="py-32 text-center">

            <h3 className="font-serif text-4xl">
              Nothing here yet.
            </h3>

            <button
              onClick={() =>
                setActiveCategory("All")
              }
              className="mt-7 bg-black px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-white"
            >
              View All
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-6 md:gap-y-20 lg:grid-cols-4">

            {filteredProducts.map(
              (product, index) => {

                const inStock =
                  isInStock(product);

                return (

                  <Link
                    href={`/products/${product.id}`}
                    key={product.id}
                    className="group"
                  >

                    <div className="relative aspect-[3/4] overflow-hidden bg-[#efede8]">

                      <Image
                        src={getImage(product)}
                        alt={
                          product.name ||
                          "Perfume"
                        }
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition duration-700 ease-out group-hover:scale-105"
                      />

                      <span className="absolute left-4 top-4 text-[9px] tracking-[0.2em] text-black/45">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      {product.featured && (
                        <span className="absolute bottom-4 left-4 bg-white px-3 py-2 text-[9px] uppercase tracking-[0.15em]">
                          Featured
                        </span>
                      )}

                      {!inStock && (
                        <span className="absolute right-4 top-4 bg-black px-3 py-2 text-[9px] uppercase tracking-[0.15em] text-white">
                          Sold Out
                        </span>
                      )}

                      <div className="absolute bottom-4 left-4 right-4 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">

                        <div className="bg-white px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em]">
                          Discover Fragrance
                        </div>

                      </div>

                    </div>

                    <div className="pt-5">

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <h3 className="font-serif text-lg md:text-xl">
                            {product.name}
                          </h3>

                          <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-black/35">
                            {product.category?.name ||
                              product.category_name ||
                              "Fragrance"}
                          </p>

                        </div>

                        <span className="whitespace-nowrap text-xs">
                          {formatPrice(
                            product.price
                          )}
                        </span>

                      </div>

                    </div>

                  </Link>

                );
              }
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          BRAND STATEMENT
      ===================================================== */}

      <section className="border-y border-black/10 bg-[#171717] px-6 py-24 text-white md:px-10 md:py-32 lg:px-14">

        <div className="mx-auto max-w-[1500px]">

          <p className="mb-8 text-[10px] uppercase tracking-[0.4em] text-white/35">
            ORENTEMIST
          </p>

          <h2 className="max-w-5xl font-serif text-5xl leading-[0.95] md:text-7xl lg:text-8xl">
            Fragrance is not
            <br />
            what you wear.
            <br />
            It is what they remember.
          </h2>

        </div>

      </section>

      {/* =====================================================
          MOBILE SIDE MENU
      ===================================================== */}

      {mobileMenu && (
        <div className="fixed inset-0 z-[200] md:hidden">

          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close menu"
            onClick={() =>
              setMobileMenu(false)
            }
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* SIDE DRAWER */}

          <aside className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">

              <Link
                href="/"
                onClick={() =>
                  setMobileMenu(false)
                }
                className="text-lg font-semibold tracking-[0.3em]"
              >
                ORENTEMIST
              </Link>

              <button
                type="button"
                onClick={() =>
                  setMobileMenu(false)
                }
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
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
                >
                  Home
                  <span className="text-black/30">
                    →
                  </span>
                </Link>

                <Link
                  href="/products"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
                >
                  Shop
                  <span className="text-black/30">
                    →
                  </span>
                </Link>

                <Link
                  href="/about"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
                >
                  About
                  <span className="text-black/30">
                    →
                  </span>
                </Link>

                <Link
                  href="/account"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
                >
                  Account
                  <span className="text-black/30">
                    →
                  </span>
                </Link>

                <Link
                  href="/contact"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
                >
                  Contact
                  <span className="text-black/30">
                    →
                  </span>
                </Link>

                <Link
                  href="/cart"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center justify-between border-b border-black/10 py-5 text-lg"
                >

                  <span className="flex items-center gap-3">

                    Cart

                    {cartCount > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-semibold text-white">
                        {cartCount}
                      </span>
                    )}

                  </span>

                  <span className="text-black/30">
                    →
                  </span>

                </Link>

              </nav>

            </div>

          </aside>

        </div>
      )}

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
                ORENTEMIST
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-6 text-black/45">
                Distinctive fragrances created
                for those who leave an
                impression.
              </p>

            </div>

            <div>

              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em]">
                Explore
              </p>

              <div className="flex flex-col gap-3 text-sm text-black/55">

                <Link href="/">
                  Home
                </Link>

                <Link href="/products">
                  Shop
                </Link>

                <Link href="/collection">
                  Collection
                </Link>

                <Link href="/about">
                  About
                </Link>

              </div>

            </div>

            <div>

              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em]">
                Customer
              </p>

              <div className="flex flex-col gap-3 text-sm text-black/55">

                <Link href="/account">
                  Account
                </Link>

                <Link href="/cart">
                  Cart
                </Link>

                <Link href="/contact">
                  Contact
                </Link>

              </div>

            </div>

          </div>

          <div className="mt-14 border-t border-black/10 pt-6 text-[9px] uppercase tracking-[0.2em] text-black/35">
            © {new Date().getFullYear()} ORENTEMIST. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}