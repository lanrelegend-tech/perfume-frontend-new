"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Trash2,
  MessageCircle,
  Search,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [deleteReview, setDeleteReview] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 8;

  useEffect(() => {
    fetchReviews();
  }, []);

  const getToken = () => {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("token")
    );
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(`${API_URL}/reviews/admin/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        router.push("/admin/login");
        return;
      }

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
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReview) return;

    try {
      setDeleting(true);

      const token = getToken();

      const response = await fetch(
        `${API_URL}/reviews/admin/${deleteReview.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      setReviews((currentReviews) =>
        currentReviews.filter(
          (review) => review.id !== deleteReview.id
        )
      );

      setDeleteReview(null);
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const searchText = search.toLowerCase();

    const username =
      review.username ||
      review.user?.username ||
      review.user?.email ||
      "";

    const productName =
      review.product_name ||
      review.product?.name ||
      "";

    const comment = review.comment || "";

    return (
      username.toLowerCase().includes(searchText) ||
      productName.toLowerCase().includes(searchText) ||
      comment.toLowerCase().includes(searchText)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReviews.length / reviewsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * reviewsPerPage;

  const currentReviews = filteredReviews.slice(
    startIndex,
    startIndex + reviewsPerPage
  );

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={15}
            className={
              star <= rating
                ? "fill-black text-black"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">
      <AdminSidebar />

      <main className="ml-0 lg:ml-64">
        <div className="border-b border-black/10 bg-white px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <MessageCircle size={23} />

                <h1 className="text-2xl font-semibold tracking-tight">
                  Reviews
                </h1>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Manage customer product reviews and
                moderation.
              </p>
            </div>

            <div className="relative w-full xl:w-80">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search reviews..."
                className="h-11 w-full rounded-xl border border-black/10 bg-[#f8f8f7] pl-10 pr-10 text-sm outline-none transition focus:border-black"
              />

              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="p-5 sm:p-8">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                Total Reviews
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {reviews.length}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                5 Star Reviews
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  reviews.filter(
                    (review) =>
                      Number(review.rating) === 5
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                Average Rating
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {reviews.length
                  ? (
                      reviews.reduce(
                        (total, review) =>
                          total +
                          Number(review.rating || 0),
                        0
                      ) / reviews.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <div className="border-b border-black/10 px-5 py-4">
              <h2 className="font-semibold">
                Customer Reviews
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {filteredReviews.length} review
                {filteredReviews.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            {loading ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : currentReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
                <MessageCircle
                  size={40}
                  className="text-gray-300"
                />

                <h3 className="mt-4 font-semibold">
                  No reviews found
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  {search
                    ? "Try a different search."
                    : "There are no customer reviews yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/10 bg-[#fafafa] text-left text-xs uppercase tracking-wider text-gray-400">
                        <th className="px-5 py-4">
                          Customer
                        </th>

                        <th className="px-5 py-4">
                          Product
                        </th>

                        <th className="px-5 py-4">
                          Rating
                        </th>

                        <th className="px-5 py-4">
                          Review
                        </th>

                        <th className="px-5 py-4">
                          Date
                        </th>

                        <th className="px-5 py-4 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentReviews.map(
                        (review) => {
                          const customer =
                            review.username ||
                            review.user?.username ||
                            review.user?.email ||
                            "Customer";

                          const product =
                            review.product_name ||
                            review.product?.name ||
                            "Product";

                          return (
                            <tr
                              key={review.id}
                              className="border-b border-black/5 last:border-0"
                            >
                              <td className="px-5 py-5">
                                <div className="max-w-[170px] truncate font-medium">
                                  {customer}
                                </div>

                                {review.user?.email && (
                                  <div className="mt-1 max-w-[170px] truncate text-xs text-gray-400">
                                    {
                                      review.user
                                        .email
                                    }
                                  </div>
                                )}
                              </td>

                              <td className="px-5 py-5">
                                <div className="max-w-[180px] truncate text-sm">
                                  {product}
                                </div>
                              </td>

                              <td className="px-5 py-5">
                                {renderStars(
                                  Number(
                                    review.rating
                                  )
                                )}
                              </td>

                              <td className="max-w-[320px] px-5 py-5">
                                <p className="line-clamp-2 text-sm text-gray-600">
                                  {review.comment ||
                                    "No comment"}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-5 py-5 text-sm text-gray-500">
                                {formatDate(
                                  review.created_at
                                )}
                              </td>

                              <td className="px-5 py-5 text-right">
                                <button
                                  onClick={() =>
                                    setDeleteReview(
                                      review
                                    )
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                                  title="Delete review"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-black/5 lg:hidden">
                  {currentReviews.map(
                    (review) => {
                      const customer =
                        review.username ||
                        review.user?.username ||
                        review.user?.email ||
                        "Customer";

                      const product =
                        review.product_name ||
                        review.product?.name ||
                        "Product";

                      return (
                        <div
                          key={review.id}
                          className="p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {customer}
                              </p>

                              <p className="mt-1 truncate text-sm text-gray-400">
                                {product}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                setDeleteReview(
                                  review
                                )
                              }
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            {renderStars(
                              Number(review.rating)
                            )}

                            <span className="text-xs text-gray-400">
                              {formatDate(
                                review.created_at
                              )}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-gray-600">
                            {review.comment ||
                              "No comment"}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </>
            )}

            {!loading &&
              filteredReviews.length > 0 && (
                <div className="flex items-center justify-between border-t border-black/10 px-5 py-4">
                  <p className="text-xs text-gray-400">
                    Page {safePage} of {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={safePage === 1}
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(1, page - 1)
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <button
                      disabled={
                        safePage === totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1
                            )
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
          </div>
        </section>
      </main>

      {deleteReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle
                size={23}
                className="text-red-500"
              />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Delete this review?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This will permanently remove the
              customer review. This action cannot be
              undone.
            </p>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {deleteReview.username ||
                    deleteReview.user?.username ||
                    deleteReview.user?.email ||
                    "Customer"}
                </span>

                {renderStars(
                  Number(deleteReview.rating)
                )}
              </div>

              {deleteReview.comment && (
                <p className="mt-3 line-clamp-3 text-sm text-gray-500">
                  "{deleteReview.comment}"
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  setDeleteReview(null)
                }
                disabled={deleting}
                className="h-11 flex-1 rounded-xl border border-black/10 font-medium transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-11 flex-1 rounded-xl bg-black font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}