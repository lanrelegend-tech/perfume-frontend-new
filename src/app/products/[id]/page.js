"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

const MIN_REVIEW_LENGTH = 5;
const MAX_REVIEW_LENGTH = 1000;

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

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("access") ||
    localStorage.getItem("token")
  );
}

function isTokenExpired(token) {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return false;
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const payload = JSON.parse(atob(base64));

    if (!payload.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

function getCurrentUserId() {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const payload = JSON.parse(atob(base64));

    return (
      payload.user_id ||
      payload.id ||
      payload.sub ||
      null
    );
  } catch {
    return null;
  }
}

function renderStars(rating, size = "text-sm") {
  const value = Number(rating) || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${size} ${
            star <= Math.round(value)
              ? "text-[#c89b3c]"
              : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [cartCount, setCartCount] = useState(0);

  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [selectedVariant, setSelectedVariant] = useState(null);

  const [addingToCart, setAddingToCart] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseCheckLoading, setPurchaseCheckLoading] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] =
    useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingReview, setDeletingReview] = useState(null);
  const [deletingReviewLoading, setDeletingReviewLoading] =
    useState(false);

  function loadCartCount() {
    try {
      const savedCart =
        localStorage.getItem("orentemist_cart");

      const items = savedCart
        ? JSON.parse(savedCart)
        : [];

      const count = Array.isArray(items)
        ? items.reduce(
            (total, item) =>
              total + Number(item.quantity || 0),
            0
          )
        : 0;

      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }

  function clearAuthentication() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access");
    localStorage.removeItem("token");

    setIsLoggedIn(false);
  }

  function checkAuthentication() {
    const token = getAccessToken();

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    if (isTokenExpired(token)) {
      clearAuthentication();
      return;
    }

    setIsLoggedIn(true);
  }

  async function loadReviews(productId) {
    try {
      setReviewsLoading(true);

      const response = await fetch(
        `${API_URL}/reviews/product/${productId}/`
      );

      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data = await response.json();

      setReviews(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (error) {
      console.error("Reviews error:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function checkPurchaseStatus(productId) {
    const token = getAccessToken();

    if (!token || isTokenExpired(token)) {
      setHasPurchased(false);
      return;
    }

    try {
      setPurchaseCheckLoading(true);

      const response = await fetch(
        `${API_URL}/orders/my-orders/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        setHasPurchased(false);
        return;
      }

      const data = await response.json();

      const orders = Array.isArray(data)
        ? data
        : data.results || [];

      const purchased = orders.some((order) => {
        if (order.payment_status !== "paid") {
          return false;
        }

        const items = Array.isArray(order.items)
          ? order.items
          : [];

        return items.some(
          (item) =>
            Number(item.product) ===
            Number(productId)
        );
      });

      setHasPurchased(purchased);
    } catch (error) {
      console.error(
        "Purchase verification error:",
        error
      );

      setHasPurchased(false);
    } finally {
      setPurchaseCheckLoading(false);
    }
  }

  async function loadRelatedProducts(currentProduct) {
    try {
      const currentProductId =
        Number(currentProduct.id);

      const currentCategoryId =
        currentProduct?.category?.id ||
        currentProduct?.category_id;

      let url = `${API_URL}/products/`;

      if (currentCategoryId) {
        url += `?category=${encodeURIComponent(
          currentCategoryId
        )}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const products = Array.isArray(data)
        ? data
        : data.results || [];

      const related = products.filter(
        (item) =>
          Number(item.id) !== currentProductId
      );

      setRelatedProducts(
        related.slice(0, 4)
      );
    } catch (error) {
      console.error(
        "Related products error:",
        error
      );

      setRelatedProducts([]);
    }
  }

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products/${params.id}/`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        setProduct(data);

        if (
          Array.isArray(data.variants) &&
          data.variants.length > 0
        ) {
          const firstAvailableVariant =
            data.variants.find(
              (variant) =>
                variant.in_stock &&
                Number(
                  variant.stock_quantity
                ) > 0
            );

          setSelectedVariant(
            firstAvailableVariant ||
              data.variants[0]
          );
        }

        loadRelatedProducts(data);
      } catch (error) {
        console.error(
          "Product error:",
          error
        );

        setError(
          "Unable to load this product."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    loadReviews(params.id);
    loadCartCount();
    checkAuthentication();

    if (getAccessToken()) {
      checkPurchaseStatus(params.id);
    } else {
      setHasPurchased(false);
    }
  }, [params?.id]);

  useEffect(() => {
    function handleCartUpdated() {
      loadCartCount();
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

  const images = useMemo(() => {
    if (!product) {
      return [];
    }

    const collectedImages = [];

    if (product.image) {
      collectedImages.push(product.image);
    }

    if (Array.isArray(product.images)) {
      product.images.forEach((item) => {
        const image =
          typeof item === "string"
            ? item
            : item?.image;

        if (image) {
          collectedImages.push(image);
        }
      });
    }

    return Array.from(
      new Map(
        collectedImages.map((image) => [
          getImageUrl(image),
          image,
        ])
      ).values()
    ).slice(0, 4);
  }, [product]);

  /*
   * =====================================================
   * STOCK / PRE-ORDER LOGIC
   * =====================================================
   */

  const currentStock = selectedVariant
    ? Number(
        selectedVariant.stock_quantity
      ) || 0
    : Number(
        product?.stock_quantity
      ) || 0;

  const currentInStock = selectedVariant
    ? Boolean(selectedVariant.in_stock)
    : Boolean(product?.in_stock);

  const productStock =
    Number(product?.stock_quantity) || 0;

  const productHasStock =
    productStock > 0;

  const productAllowsPreorder =
    productStock === 0 &&
    product?.is_preorder === true;

  const variantHasStock =
    currentStock > 0 &&
    currentInStock;

  /*
   * If the product has no variants, use the product
   * preorder state.
   *
   * If it has variants, an available variant is
   * treated normally. Otherwise the product preorder
   * setting can allow the product to be ordered.
   */

  const isPreorder =
    !variantHasStock &&
    productAllowsPreorder;

  const isAvailable =
    variantHasStock ||
    productHasStock ||
    isPreorder;

  const isSoldOut =
    !isAvailable;

  const status = isPreorder
    ? "Pre-order Available"
    : isSoldOut
    ? "Sold Out"
    : currentStock <= 10
    ? "Low Stock"
    : "In Stock";

  const statusDescription = isPreorder
    ? product?.preorder_message ||
      "Available for pre-order"
    : isSoldOut
    ? "This fragrance is currently unavailable."
    : currentStock <= 10
    ? `Only ${currentStock} left`
    : "Available now";

  const trimmedReviewComment =
    reviewComment.trim();

  const reviewCommentLength =
    reviewComment.length;

  const isReviewValid =
    trimmedReviewComment.length >=
      MIN_REVIEW_LENGTH &&
    trimmedReviewComment.length <=
      MAX_REVIEW_LENGTH &&
    Number(reviewRating) >= 1 &&
    Number(reviewRating) <= 5;

  const trimmedEditComment =
    editComment.trim();

  const editCommentLength =
    editComment.length;

  const isEditValid =
    trimmedEditComment.length >=
      MIN_REVIEW_LENGTH &&
    trimmedEditComment.length <=
      MAX_REVIEW_LENGTH &&
    Number(editRating) >= 1 &&
    Number(editRating) <= 5;

  function handleIncreaseQuantity() {
    if (!isAvailable) {
      return;
    }

    /*
     * Pre-orders do not have current stock.
     * Therefore there is no stock ceiling for them.
     */

    if (isPreorder) {
      setQuantity((current) => current + 1);
      return;
    }

    const stock = currentStock;

    setQuantity((current) => {
      if (
        stock > 0 &&
        current >= stock
      ) {
        return current;
      }

      return current + 1;
    });
  }

  function handleDecreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  }

  function handleAddToCart() {
    if (!product || !isAvailable) {
      return;
    }

    try {
      setAddingToCart(true);

      const savedCart =
        localStorage.getItem(
          "orentemist_cart"
        );

      const cart = savedCart
        ? JSON.parse(savedCart)
        : [];

      const safeCart = Array.isArray(cart)
        ? cart
        : [];

      const variantId =
        selectedVariant?.id || null;

      const existingIndex =
        safeCart.findIndex(
          (item) =>
            Number(item.product_id) ===
              Number(product.id) &&
            Number(item.variant_id || 0) ===
              Number(variantId || 0)
        );

      if (existingIndex !== -1) {
        const existingItem =
          safeCart[existingIndex];

        const newQuantity =
          Number(
            existingItem.quantity || 0
          ) + quantity;

        /*
         * Normal products respect current stock.
         *
         * Pre-orders do not because stock is intentionally 0.
         */
        if (
          !isPreorder &&
          currentStock > 0 &&
          newQuantity > currentStock
        ) {
          alert(
            `Only ${currentStock} available for ${product.name}.`
          );

          return;
        }

        safeCart[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          is_preorder: isPreorder,
        };
      } else {
        safeCart.push({
          product_id: product.id,
          variant_id: variantId,
          name: product.name,
          brand:
            product.brand ||
            "ORENTEMIST",
          price: Number(
            selectedVariant
              ? selectedVariant.price
              : product.price
          ),
          image:
            product.image || null,
          size:
            selectedVariant?.size ||
            product.size ||
            null,
          quantity,
          stock_quantity:
            currentStock,
          in_stock:
            currentInStock,
          is_preorder: isPreorder,
        });
      }

      localStorage.setItem(
        "orentemist_cart",
        JSON.stringify(safeCart)
      );

      loadCartCount();

      window.dispatchEvent(
        new Event(
          "orentemist-cart-updated"
        )
      );

      alert(
        isPreorder
          ? `${product.name} added as a pre-order.`
          : `${product.name} added to cart.`
      );
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setAddingToCart(false);
    }
  }

  function handleBuyNow() {
    if (!product || !isAvailable) {
      return;
    }

    handleAddToCart();

    setTimeout(() => {
      window.location.href =
        "/checkout";
    }, 300);
  }

  async function handleShareProduct() {
    if (!product) {
      return;
    }

    const url = window.location.href;

    const shareData = {
      title: product.name,
      text: `Check out ${product.name} from ORENTEMIST.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(
          shareData
        );

        return;
      }

      await navigator.clipboard.writeText(
        url
      );

      alert("Product link copied.");
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error(
        "Share error:",
        error
      );

      alert(
        "Unable to share this product."
      );
    }
  }

  function redirectToLogin() {
    if (!product?.id) {
      window.location.href = "/login";
      return;
    }

    const nextUrl =
      `/products/${product.id}%23reviews`;

    window.location.href =
      `/login?next=${nextUrl}`;
  }

  async function handleSubmitReview(event) {
    event.preventDefault();

    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    const trimmedComment =
      reviewComment.trim();

    if (
      trimmedComment.length <
      MIN_REVIEW_LENGTH
    ) {
      setReviewMessage(
        `Your review must be at least ${MIN_REVIEW_LENGTH} characters.`
      );

      return;
    }

    if (
      trimmedComment.length >
      MAX_REVIEW_LENGTH
    ) {
      setReviewMessage(
        `Your review cannot exceed ${MAX_REVIEW_LENGTH} characters.`
      );

      return;
    }

    try {
      setSubmittingReview(true);
      setReviewMessage("");

      const token = getAccessToken();

      if (!token) {
        setIsLoggedIn(false);
        redirectToLogin();
        return;
      }

      if (isTokenExpired(token)) {
        clearAuthentication();
        redirectToLogin();
        return;
      }

      const response = await fetch(
        `${API_URL}/reviews/product/${product.id}/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: Number(reviewRating),
            comment: trimmedComment,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearAuthentication();
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to submit your review."
        );
      }

      setReviewComment("");
      setReviewRating(5);

      setReviewMessage(
        "Thank you. Your review has been submitted."
      );

      await loadReviews(product.id);
    } catch (error) {
      console.error(
        "Review submission error:",
        error
      );

      setReviewMessage(
        error.message ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  function openEditReview(review) {
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    const currentUserId =
      getCurrentUserId();

    if (
      currentUserId === null ||
      Number(review.user) !==
        Number(currentUserId)
    ) {
      setReviewMessage(
        "You can only edit your own review."
      );

      return;
    }

    setEditingReview(review);
    setEditRating(
      Number(review.rating) || 5
    );
    setEditComment(
      review.comment || ""
    );
    setReviewMessage("");
  }

  function closeEditModal() {
    if (savingEdit) {
      return;
    }

    setEditingReview(null);
    setEditRating(5);
    setEditComment("");
  }

  async function handleSaveEdit() {
    if (!editingReview) {
      return;
    }

    const trimmedComment =
      editComment.trim();

    if (
      trimmedComment.length <
        MIN_REVIEW_LENGTH ||
      trimmedComment.length >
        MAX_REVIEW_LENGTH
    ) {
      return;
    }

    const token = getAccessToken();

    if (!token || isTokenExpired(token)) {
      clearAuthentication();
      closeEditModal();
      redirectToLogin();
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(
        `${API_URL}/reviews/${editingReview.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: Number(editRating),
            comment: trimmedComment,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearAuthentication();
        closeEditModal();
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to update your review."
        );
      }

      closeEditModal();

      setReviewMessage(
        "Your review has been updated."
      );

      await loadReviews(product.id);
    } catch (error) {
      console.error(
        "Review update error:",
        error
      );

      setReviewMessage(
        error.message ||
          "Unable to update your review."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  function openDeleteReview(review) {
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    const currentUserId =
      getCurrentUserId();

    if (
      currentUserId === null ||
      Number(review.user) !==
        Number(currentUserId)
    ) {
      setReviewMessage(
        "You can only delete your own review."
      );

      return;
    }

    setDeletingReview(review);
    setReviewMessage("");
  }

  function closeDeleteModal() {
    if (deletingReviewLoading) {
      return;
    }

    setDeletingReview(null);
  }

  async function handleConfirmDelete() {
    if (!deletingReview) {
      return;
    }

    const token = getAccessToken();

    if (!token || isTokenExpired(token)) {
      clearAuthentication();
      closeDeleteModal();
      redirectToLogin();
      return;
    }

    try {
      setDeletingReviewLoading(true);

      const response = await fetch(
        `${API_URL}/reviews/${deletingReview.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearAuthentication();
        closeDeleteModal();
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to delete your review."
        );
      }

      closeDeleteModal();

      setReviewMessage(
        "Your review has been deleted."
      );

      await loadReviews(product.id);
    } catch (error) {
      console.error(
        "Review deletion error:",
        error
      );

      setReviewMessage(
        error.message ||
          "Unable to delete your review."
      );
    } finally {
      setDeletingReviewLoading(false);
    }
  }

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f7f4]">
        <nav className="border-b border-black/10 bg-[#f8f7f4]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />

            <div className="hidden h-4 w-48 animate-pulse rounded bg-gray-200 sm:block" />

            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-20">
          <div className="grid animate-pulse gap-10 lg:grid-cols-2">
            <div className="aspect-square rounded-3xl bg-gray-200" />

            <div className="space-y-6">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-12 w-3/4 rounded bg-gray-200" />
              <div className="h-8 w-32 rounded bg-gray-200" />
              <div className="h-24 w-full rounded bg-gray-200" />
              <div className="h-14 w-full rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =====================================================
   * ERROR / 404
   * =====================================================
   */

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f8f7f4] text-black">
        <nav className="border-b border-black/10 bg-[#f8f7f4]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="text-lg font-semibold tracking-[0.22em]"
            >
              ORENTEMIST
            </Link>

            <Link
              href="/cart"
              className="text-sm transition hover:opacity-50"
            >
              Cart
            </Link>

            <button
              type="button"
              className="text-xl md:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </nav>

        <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-5 py-20">
          <div className="relative z-10 w-full max-w-4xl text-center">
            <p className="text-[10px] uppercase tracking-[0.45em] text-black/40">
              ORENTEMIST
            </p>

            <h1 className="mt-8 text-[clamp(8rem,25vw,20rem)] font-light leading-[0.75] tracking-[-0.08em] text-black/[0.06]">
              404
            </h1>

            <div className="relative -mt-16 sm:-mt-24 md:-mt-32">
              <p className="text-xs uppercase tracking-[0.4em] text-black/40">
                Fragrance not found
              </p>

              <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-light leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl">
                This scent has
                <br />
                <span className="italic">
                  disappeared.
                </span>
              </h2>

              <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-black/50">
                The fragrance you're looking for may have moved, expired, or never existed.
              </p>
            </div>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="bg-black px-8 py-4 text-sm font-medium text-white transition hover:bg-black/80"
              >
                Return Home
              </Link>

              <Link
                href="/products"
                className="border border-black/15 bg-white px-8 py-4 text-sm font-medium transition hover:bg-black hover:text-white"
              >
                Explore Fragrances
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const averageRating =
    Number(product.average_rating || 0);

  const reviewCount =
    Number(product.review_count) ||
    reviews.length;

  const currentUserId =
    isLoggedIn
      ? getCurrentUserId()
      : null;

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-black">

      {/* ================================================= */}
      {/* NAVBAR */}
      {/* ================================================= */}

      <nav className="sticky top-0 z-50 border-b border-black/10 bg-[#f8f7f4]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">

          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.22em]"
          >
            ORENTEMIST
          </Link>

          {/* MOBILE */}

          <div className="ml-auto flex items-center gap-3 md:hidden">

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

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full"
            >
              <span className="flex flex-col gap-1.5">
                <span className="h-1 w-1 rounded-full bg-black" />
                <span className="h-1 w-1 rounded-full bg-black" />
                <span className="h-1 w-1 rounded-full bg-black" />
              </span>
            </button>
          </div>

          {/* DESKTOP */}

          <div className="ml-auto hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.18em] md:flex">

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
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-black"
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
          </div>
        </div>
      </nav>

      {/* ================================================= */}
      {/* MOBILE MENU */}
      {/* ================================================= */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:hidden">
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#f8f7f4] p-6 shadow-2xl">

            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                ORENTEMIST
              </p>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-14 flex flex-col gap-7 text-sm font-medium uppercase tracking-[0.18em]">

              <Link
                href="/"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Home
              </Link>

              <Link
                href="/products"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Collection
              </Link>

              <Link
                href="/account"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Account
              </Link>

              <Link
                href="/cart"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                Cart
                {cartCount > 0 && (
                  <span className="ml-2 rounded-full bg-black px-2 py-1 text-[9px] text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* BREADCRUMB */}
      {/* ================================================= */}

      <div className="mx-auto max-w-7xl px-5 pt-7 sm:px-8">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">

          <Link
            href="/products"
            className="transition hover:text-black"
          >
            Collection
          </Link>

          <span>/</span>

          <span className="max-w-[220px] truncate text-gray-600">
            {product.name}
          </span>
        </div>
      </div>

      {/* ================================================= */}
      {/* PRODUCT */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">

          {/* IMAGE */}

          <div className="lg:sticky lg:top-28 lg:self-start">

            <div className="grid grid-cols-4 gap-3 sm:gap-4">

              <div className="col-span-1 flex flex-col gap-3 sm:gap-4">

                {images.map(
                  (image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImage(index)
                      }
                      className={`group relative aspect-square overflow-hidden rounded-2xl border bg-white transition-all ${
                        selectedImage === index
                          ? "border-black shadow-lg"
                          : "border-black/10 hover:border-black/40"
                      }`}
                    >
                      <Image
                        src={getImageUrl(image)}
                        alt={`${product.name} image ${index + 1}`}
                        fill
                        sizes="80px"
                        className="object-contain p-2 transition duration-500 group-hover:scale-110"
                        loading={
                          index === 0
                            ? "eager"
                            : "lazy"
                        }
                      />
                    </button>
                  )
                )}

                {images.length < 4 &&
                  Array.from({
                    length:
                      4 - images.length,
                  }).map(
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="aspect-square rounded-2xl border border-dashed border-black/10 bg-white/50"
                      />
                    )
                  )}
              </div>

              <div className="relative col-span-3 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.07)]">

                <div className="absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eeeae2] blur-3xl" />

                  <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#f4f0e8] blur-3xl" />

                  <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#f1eee8] blur-3xl" />
                </div>

                {product.featured && (
                  <div className="absolute left-6 top-6 z-10">
                    <span className="rounded-full bg-black px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white shadow-lg">
                      Featured
                    </span>
                  </div>
                )}

                {isPreorder && (
                  <div className="absolute left-6 top-16 z-10 mt-2">
                    <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-black shadow-lg">
                      Pre-order
                    </span>
                  </div>
                )}

                <div className="absolute right-5 top-5 z-10 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.15em] text-gray-500 backdrop-blur-md">
                  {images.length > 0
                    ? selectedImage + 1
                    : 0}{" "}
                  / {images.length}
                </div>

                <div className="relative flex aspect-[4/5] items-center justify-center p-8 sm:p-12 lg:p-16">

                  {images.length > 0 ? (
                    <Image
                      src={getImageUrl(
                        images[selectedImage]
                      )}
                      alt={product.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 55vw"
                      className="object-contain drop-shadow-[0_35px_50px_rgba(0,0,0,0.18)] transition-all duration-700 ease-out hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      No image available
                    </div>
                  )}

                  {isPreorder && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                      <span className="rounded-full border border-black/20 bg-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] shadow-xl">
                        Pre-order Available
                      </span>
                    </div>
                  )}

                  {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                      <span className="rounded-full border border-black/20 bg-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] shadow-xl">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          (current) =>
                            current === 0
                              ? images.length - 1
                              : current - 1
                        )
                      }
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-xl shadow-md transition hover:bg-black hover:text-white"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          (current) =>
                            current ===
                            images.length - 1
                              ? 0
                              : current + 1
                        )
                      }
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-xl shadow-md transition hover:bg-black hover:text-white"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCT INFORMATION */}

          <div className="flex flex-col justify-center">

            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500">
              {product.brand ||
                "ORENTEMIST"}
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {renderStars(
                averageRating,
                "text-base"
              )}

              <span className="text-sm text-gray-500">
                {averageRating.toFixed(1)}
              </span>

              <span className="text-gray-300">
                |
              </span>

              <a
                href="#reviews"
                className="text-sm text-gray-500 underline underline-offset-4 transition hover:text-black"
              >
                {reviewCount}{" "}
                {reviewCount === 1
                  ? "review"
                  : "reviews"}
              </a>
            </div>

            <div className="mt-7 flex items-end justify-between gap-6">

              <div>
                <p className="text-2xl font-medium tracking-tight sm:text-3xl">
                  {formatPrice(
                    selectedVariant
                      ? selectedVariant.price
                      : product.price
                  )}
                </p>

                {product.size && (
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedVariant
                      ? selectedVariant.size
                      : product.size}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={
                  handleShareProduct
                }
                aria-label="Share product"
                title="Share product"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-black hover:bg-black hover:text-white"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="18"
                    cy="5"
                    r="3"
                  />
                  <circle
                    cx="6"
                    cy="12"
                    r="3"
                  />
                  <circle
                    cx="18"
                    cy="19"
                    r="3"
                  />
                  <path d="m8.6 13.5 6.8 4" />
                  <path d="m15.4 6.5-6.8 4" />
                </svg>
              </button>
            </div>

            {/* VARIANTS */}

            {Array.isArray(
              product.variants
            ) &&
              product.variants.length > 0 && (
                <div className="mt-7">

                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Select Size
                  </p>

                  <div className="flex flex-wrap gap-3">

                    {product.variants.map(
                      (variant) => {

                        const variantAvailable =
                          variant.in_stock &&
                          Number(
                            variant.stock_quantity
                          ) > 0;

                        const isSelected =
                          selectedVariant?.id ===
                          variant.id;

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={
                              !variantAvailable &&
                              !productAllowsPreorder
                            }
                            onClick={() => {
                              setSelectedVariant(
                                variant
                              );

                              setQuantity(1);
                            }}
                            className={`rounded-full border px-5 py-3 text-sm transition ${
                              isSelected
                                ? "border-black bg-black text-white"
                                : variantAvailable
                                ? "border-black/10 bg-white hover:border-black"
                                : productAllowsPreorder
                                ? "border-black/20 bg-white hover:border-black"
                                : "cursor-not-allowed border-black/10 bg-gray-100 text-gray-400 line-through"
                            }`}
                          >
                            {variant.size}

                            {!variantAvailable &&
                              productAllowsPreorder && (
                                <span className="ml-2 text-[9px] uppercase tracking-wider">
                                  Pre-order
                                </span>
                              )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* STATUS */}

            <div className="mt-6">

              <span
                className={`inline-flex rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  status === "In Stock"
                    ? "bg-black text-white"
                    : status ===
                      "Low Stock"
                    ? "bg-[#eee8dc] text-black"
                    : status ===
                      "Pre-order Available"
                    ? "bg-black text-white"
                    : "border border-black/10 bg-white text-gray-500"
                }`}
              >
                {status}
              </span>

              <p className="mt-3 text-xs text-gray-500">
                {statusDescription}
              </p>

              {isPreorder &&
                product.preorder_release_date && (
                  <p className="mt-2 text-xs text-gray-500">
                    Expected availability:{" "}
                    <span className="font-medium text-black">
                      {new Date(
                        product.preorder_release_date
                      ).toLocaleDateString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </p>
                )}
            </div>

            {/* DESCRIPTION */}

            {product.description && (
              <div className="mt-9 border-t border-black/10 pt-7">

                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                  Description
                </p>

                <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* FRAGRANCE NOTES */}

            {product.fragrance_notes && (
              <div className="mt-7 border-t border-black/10 pt-7">

                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                  Fragrance Notes
                </p>

                <p className="mt-4 text-sm leading-7 text-gray-600">
                  {product.fragrance_notes}
                </p>
              </div>
            )}

            {/* PRE-ORDER MESSAGE */}

            {isPreorder && (
              <div className="mt-7 rounded-2xl border border-black/10 bg-white p-5">

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Pre-order Information
                </p>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {product.preorder_message ||
                    "Available for pre-order"}
                </p>

                <p className="mt-3 text-xs leading-5 text-gray-400">
                  Your payment is processed immediately. This fragrance will be shipped when it becomes available.
                </p>
              </div>
            )}

            {/* QUANTITY */}

            <div className="mt-8">

              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Quantity
              </p>

              <div className="flex h-14 w-fit items-center overflow-hidden rounded-full border border-black/10 bg-white">

                <button
                  type="button"
                  onClick={
                    handleDecreaseQuantity
                  }
                  disabled={!isAvailable}
                  className="flex h-full w-14 items-center justify-center text-lg transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>

                <span className="flex w-12 justify-center text-sm font-medium">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={
                    handleIncreaseQuantity
                  }
                  disabled={!isAvailable}
                  className="flex h-full w-14 items-center justify-center text-lg transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  !isAvailable ||
                  addingToCart
                }
                className="h-14 rounded-full border border-black bg-white text-sm font-medium transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
              >
                {addingToCart
                  ? "Adding..."
                  : isPreorder
                  ? "Add Pre-order"
                  : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={
                  handleBuyNow
                }
                disabled={
                  !isAvailable ||
                  addingToCart
                }
                className="h-14 rounded-full bg-black text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isPreorder
                  ? "Pre-order Now"
                  : "Buy Now"}
              </button>
            </div>

            {/* TRUST BOXES */}

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">
                  Authentic
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Genuine fragrances only.
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">
                  Delivery
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Secure nationwide delivery.
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">
                  Quality
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Carefully selected fragrances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* REVIEWS */}
      {/* ================================================= */}

      <section
        id="reviews"
        className="border-t border-black/10 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">

          <div className="grid gap-10 lg:grid-cols-[0.35fr_0.65fr]">

            {/* SUMMARY */}

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                Customer Reviews
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                What customers say
              </h2>

              <div className="mt-7 rounded-3xl border border-black/10 bg-[#f8f7f4] p-7">

                <div className="flex items-end gap-3">
                  <span className="text-5xl font-semibold tracking-tight">
                    {averageRating.toFixed(1)}
                  </span>

                  <span className="pb-2 text-sm text-gray-400">
                    / 5
                  </span>
                </div>

                <div className="mt-3">
                  {renderStars(
                    averageRating,
                    "text-lg"
                  )}
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  Based on {reviewCount}{" "}
                  {reviewCount === 1
                    ? "customer review"
                    : "customer reviews"}
                </p>
              </div>
            </div>

            {/* REVIEWS */}

            <div>

              {/* WRITE REVIEW */}

              <div className="mb-6 rounded-3xl border border-black/10 bg-[#f8f7f4] p-6 sm:p-7">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                      Share your experience
                    </p>

                    <h3 className="mt-2 text-xl font-semibold">
                      {isLoggedIn
                        ? "How was this fragrance?"
                        : "Love the scent? Tell us about it."}
                    </h3>
                  </div>

                  {!isLoggedIn && (
                    <Link
                      href={`/login?next=/products/${product.id}%23reviews`}
                      className="text-xs font-medium underline underline-offset-4 transition hover:opacity-50"
                    >
                      Log in or sign up
                    </Link>
                  )}
                </div>

                {isLoggedIn ? (
                  purchaseCheckLoading ? (
                    <div className="mt-5 rounded-2xl border border-black/10 bg-white p-6">
                      <p className="text-sm text-gray-500">
                        Checking your purchase...
                      </p>
                    </div>
                  ) : hasPurchased ? (
                    <form
                      onSubmit={
                        handleSubmitReview
                      }
                      className="mt-6"
                    >
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Your rating
                      </p>

                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setReviewRating(
                                  star
                                )
                              }
                              className={`text-3xl transition hover:scale-110 ${
                                star <=
                                reviewRating
                                  ? "text-[#c89b3c]"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </button>
                          )
                        )}
                      </div>

                      <textarea
                        value={
                          reviewComment
                        }
                        onChange={(event) =>
                          setReviewComment(
                            event.target
                              .value
                          )
                        }
                        rows={4}
                        minLength={
                          MIN_REVIEW_LENGTH
                        }
                        maxLength={
                          MAX_REVIEW_LENGTH
                        }
                        placeholder="Tell us how it smells, how long it lasts, and what you think..."
                        className="mt-5 w-full resize-none rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm outline-none transition focus:border-black"
                      />

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          Minimum{" "}
                          {
                            MIN_REVIEW_LENGTH
                          }{" "}
                          characters
                        </span>

                        <span className="text-[10px] text-gray-400">
                          {
                            reviewCommentLength
                          }
                          /
                          {
                            MAX_REVIEW_LENGTH
                          }
                        </span>
                      </div>

                      {reviewMessage && (
                        <p className="mt-3 text-sm text-gray-500">
                          {reviewMessage}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={
                          submittingReview ||
                          !isReviewValid
                        }
                        className="mt-4 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {submittingReview
                          ? "Submitting..."
                          : "Submit Review"}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-black/10 bg-white p-6">

                      <h4 className="text-sm font-semibold">
                        Purchase required to leave a review
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        You can only review fragrances you have purchased.
                      </p>

                      <Link
                        href="/products"
                        className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
                      >
                        Explore Fragrances
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="mt-5 rounded-2xl border border-black/10 bg-white p-6">

                    <h4 className="text-sm font-semibold">
                      Log in or sign up to leave a review
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Share your experience with this fragrance.
                    </p>

                    <Link
                      href={`/login?next=/products/${product.id}%23reviews`}
                      className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
                    >
                      Log In / Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* REVIEW LIST */}

              {reviewsLoading ? (
                <div className="space-y-4">

                  {[1, 2, 3].map(
                    (item) => (
                      <div
                        key={item}
                        className="animate-pulse rounded-3xl border border-black/10 p-7"
                      >
                        <div className="h-3 w-24 rounded bg-gray-200" />
                        <div className="mt-4 h-3 w-20 rounded bg-gray-200" />
                        <div className="mt-5 h-3 w-full rounded bg-gray-200" />
                        <div className="mt-2 h-3 w-4/5 rounded bg-gray-200" />
                      </div>
                    )
                  )}
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-black/10 bg-[#f8f7f4] px-6 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl text-[#c89b3c] shadow-sm">
                    ★
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    No reviews yet
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    Be the first customer to share your experience with this fragrance.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {reviews.map(
                    (review) => {

                      const isOwnReview =
                        isLoggedIn &&
                        currentUserId !==
                          null &&
                        Number(
                          review.user
                        ) ===
                          Number(
                            currentUserId
                          );

                      return (
                        <article
                          key={review.id}
                          className="rounded-3xl border border-black/10 bg-[#f8f7f4] p-6 sm:p-7"
                        >

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                            <div>

                              <p className="text-sm font-semibold">
                                {review.username ||
                                  review.user
                                    ?.username ||
                                  review.user
                                    ?.name ||
                                  "Customer"}
                              </p>

                              <div className="mt-2">
                                {renderStars(
                                  review.rating
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-3 sm:items-end">

                              {review.created_at && (
                                <p className="text-xs text-gray-400">
                                  {new Date(
                                    review.created_at
                                  ).toLocaleDateString(
                                    "en-NG",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              )}

                              {isOwnReview && (
                                <div className="flex items-center gap-4">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditReview(
                                        review
                                      )
                                    }
                                    className="text-xs font-medium underline underline-offset-4"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openDeleteReview(
                                        review
                                      )
                                    }
                                    className="text-xs font-medium text-red-600 underline underline-offset-4"
                                  >
                                    Delete
                                  </button>

                                </div>
                              )}
                            </div>
                          </div>

                          {review.comment && (
                            <p className="mt-6 text-sm leading-7 text-gray-600">
                              {review.comment}
                            </p>
                          )}

                          {review.updated_at &&
                            review.created_at &&
                            new Date(
                              review.updated_at
                            ).getTime() >
                              new Date(
                                review.created_at
                              ).getTime() +
                                1000 && (
                              <p className="mt-4 text-[10px] text-gray-400">
                                Edited
                              </p>
                            )}
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* RELATED PRODUCTS */}
      {/* ================================================= */}

      {relatedProducts.length > 0 && (
        <section className="border-t border-black/10 bg-[#f8f7f4]">

          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                  You may also like
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Discover another signature scent
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                  More fragrances selected from the same collection.
                </p>
              </div>

              <Link
                href="/products"
                className="text-xs font-medium uppercase tracking-[0.15em] underline underline-offset-4"
              >
                View Collection
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {relatedProducts.map(
                (relatedProduct) => {

                  const relatedStock =
                    Number(
                      relatedProduct.stock_quantity
                    ) || 0;

                  const relatedPreorder =
                    relatedStock === 0 &&
                    relatedProduct.is_preorder ===
                      true;

                  return (
                    <Link
                      key={relatedProduct.id}
                      href={`/products/${relatedProduct.id}`}
                      className="group overflow-hidden rounded-3xl border border-black/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
                    >

                      <div className="relative aspect-[4/5] overflow-hidden bg-[#f3f0ea]">

                        <Image
                          src={getImageUrl(
                            relatedProduct.image
                          )}
                          alt={
                            relatedProduct.name
                          }
                          fill
                          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                          className="object-contain p-7 transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {relatedProduct.featured && (
                          <span className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-white">
                            Featured
                          </span>
                        )}

                        {relatedPreorder && (
                          <span className="absolute right-4 top-4 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.18em]">
                            Pre-order
                          </span>
                        )}
                      </div>

                      <div className="p-5">

                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                          {relatedProduct.brand ||
                            "ORENTEMIST"}
                        </p>

                        <h3 className="mt-2 line-clamp-1 text-base font-semibold">
                          {relatedProduct.name}
                        </h3>

                        <div className="mt-3 flex items-center justify-between">

                          <p className="text-sm font-medium">
                            {formatPrice(
                              relatedProduct.price
                            )}
                          </p>

                          <span className="text-xs text-gray-400">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================================================= */}
      {/* BRAND STATEMENT */}
      {/* ================================================= */}

      <section className="bg-black px-5 py-20 text-white sm:px-8">

        <div className="mx-auto max-w-4xl text-center">

          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">
            ORENTEMIST
          </p>

          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            A fragrance that becomes part of your identity.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/60">
            Discover carefully selected fragrances created for people who appreciate character, elegance and unforgettable presence.
          </p>

          <Link
            href="/products"
            className="mt-9 inline-flex rounded-full bg-white px-7 py-3 text-sm font-medium text-black"
          >
            Explore Collection
          </Link>
        </div>
      </section>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="bg-[#f8f7f4]">

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">

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

      {/* ================================================= */}
      {/* EDIT REVIEW MODAL */}
      {/* ================================================= */}

      {editingReview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-black/10 bg-[#f8f7f4] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="border-b border-black/10 bg-white px-6 py-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                    Your Review
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    Edit your review
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#f8f7f4] text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-6 py-7">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Rating
              </p>

              <div className="mt-4 flex gap-2">

                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setEditRating(
                          star
                        )
                      }
                      className={`text-3xl ${
                        star <= editRating
                          ? "text-[#c89b3c]"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  )
                )}
              </div>

              <textarea
                value={editComment}
                onChange={(event) =>
                  setEditComment(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={
                  MAX_REVIEW_LENGTH
                }
                className="mt-5 w-full resize-none rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm outline-none focus:border-black"
              />

              <div className="mt-2 flex justify-end text-[10px] text-gray-400">
                {editCommentLength}/
                {MAX_REVIEW_LENGTH}
              </div>

              <div className="mt-5 flex gap-3">

                <button
                  type="button"
                  onClick={
                    closeEditModal
                  }
                  disabled={savingEdit}
                  className="flex-1 rounded-full border border-black/10 bg-white py-3 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveEdit
                  }
                  disabled={
                    savingEdit ||
                    !isEditValid
                  }
                  className="flex-1 rounded-full bg-black py-3 text-sm text-white disabled:bg-gray-300"
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* DELETE REVIEW MODAL */}
      {/* ================================================= */}

      {deletingReview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-md rounded-[2rem] bg-[#f8f7f4] p-7 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              !
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Delete your review?
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              This action cannot be undone.
            </p>

            <div className="mt-7 flex gap-3">

              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deletingReviewLoading
                }
                className="flex-1 rounded-full border border-black/10 bg-white py-3 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmDelete
                }
                disabled={
                  deletingReviewLoading
                }
                className="flex-1 rounded-full bg-red-600 py-3 text-sm text-white disabled:bg-gray-300"
              >
                {deletingReviewLoading
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}