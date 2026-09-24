"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Package,
  ShoppingBag,
  TrendingUp,
  Trash2,
  Star,
  CircleDollarSign,
} from "lucide-react";

function getImageUrl(image) {
  if (!image) return "/placeholder-product.jpg";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || ""
  ).replace(/\/$/, "");

  const imagePath = image.startsWith("/")
    ? image
    : `/${image}`;

  return `${baseUrl}${imagePath}`;
}

function getCategoryName(categoryId, categories) {
  if (
    categoryId === null ||
    categoryId === undefined ||
    categoryId === ""
  ) {
    return "Uncategorized";
  }

  const category = categories.find(
    (item) =>
      String(item.id) === String(categoryId)
  );

  return category?.name || "Uncategorized";
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const recentOrders = [
  {
    id: "VLR-1048",
    customer: "David Johnson",
    date: "20 Sep 2026",
    quantity: 2,
    total: 190000,
    status: "Delivered",
  },
  {
    id: "VLR-1041",
    customer: "Sarah Williams",
    date: "17 Sep 2026",
    quantity: 1,
    total: 95000,
    status: "Delivered",
  },
  {
    id: "VLR-1028",
    customer: "Michael Brown",
    date: "13 Sep 2026",
    quantity: 2,
    total: 190000,
    status: "Shipped",
  },
  {
    id: "VLR-1014",
    customer: "Amaka Okafor",
    date: "08 Sep 2026",
    quantity: 1,
    total: 95000,
    status: "Processing",
  },
];

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     FETCH PRODUCT FROM DJANGO
  ===================================================== */

  useEffect(() => {
    if (!params?.id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load products"
          );
        }

        const data = await response.json();

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [];

        const foundProduct = productList.find(
          (item) =>
            String(item.id) ===
            String(params.id)
        );

        if (!foundProduct) {
          setError("Product not found.");
          return;
        }

        setProduct(foundProduct);

      } catch (err) {
        console.error(
          "Product fetch error:",
          err
        );

        setError(
          "Unable to load this product."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id, router]);

  /* =====================================================
     FETCH CATEGORIES
  ===================================================== */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/categories/`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const categoryList = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [];

        setCategories(categoryList);

      } catch (err) {
        console.error(
          "Categories fetch error:",
          err
        );
      }
    };

    fetchCategories();
  }, []);

  /* =====================================================
     FORMAT PRICE
  ===================================================== */

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-black flex items-center justify-center">
        <p className="text-sm text-black/40">
          Loading product...
        </p>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-black flex items-center justify-center px-5">
        <div className="text-center">

          <p className="text-sm text-red-600">
            {error || "Product not found"}
          </p>

          <button
            onClick={() =>
              router.push(
                "/admin/products"
              )
            }
            className="mt-4 rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Back to Products
          </button>

        </div>
      </div>
    );
  }

  /* =====================================================
     REAL PRODUCT DATA
  ===================================================== */

  const categoryName =
    product.category?.name ||
    getCategoryName(
      product.category_id,
      categories
    );

  const productImage =
    getImageUrl(product.image);

  /* =====================================================
     PRODUCT IMAGES
  ===================================================== */

  const productImages = Array.from(
    new Set(
      [
        product.image,
        ...(product.images || []).map(
          (item) => item.image
        ),
      ].filter(Boolean)
    )
  ).slice(0, 4);

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${product.name}?`
    );

    if (!confirmed) return;

    try {
      const token =
        localStorage.getItem("access_token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/admin/${product.id}/`,
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
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        router.push("/admin/login");

        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to delete product"
        );
      }

      router.push("/admin/products");

    } catch (err) {
      console.error(
        "Delete product error:",
        err
      );

      alert(
        "Unable to delete this product."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      {/* Header */}
      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-black hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  Product Details
                </h1>

                {product.featured && (
                  <span className="flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-medium text-white">
                    <Star
                      size={11}
                      fill="currentColor"
                    />
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-black/50">
                View product information and performance
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>

            <button
              onClick={() =>
                router.push(
                  `/admin/products/${params?.id}/edit`
                )
              }
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/80"
            >
              <Edit size={16} />
              Edit Product
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Product Overview */}
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

          {/* Image */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">

            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-black/[0.03]">
              <img
                src={productImage}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src =
                    "/placeholder-product.jpg";
                }}
              />
            </div>

            {/* Product Image Thumbnails */}
            <div className="mt-4 grid grid-cols-4 gap-3">

              {productImages.map(
                (image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-black/[0.02]"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src =
                          "/placeholder-product.jpg";
                      }}
                    />
                  </div>
                )
              )}

              {Array.from({
                length: Math.max(
                  0,
                  4 - productImages.length
                ),
              }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex aspect-square items-center justify-center rounded-lg border border-black/10 bg-black/[0.02]"
                >
                  <Package
                    size={20}
                    strokeWidth={1}
                    className="text-black/20"
                  />
                </div>
              ))}

            </div>
          </div>

          {/* Product Information */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  product.in_stock
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {product.in_stock
                  ? "In Stock"
                  : "Out of Stock"}
              </span>

              <span className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-black/60">
                {categoryName}
              </span>

            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              {product.name}
            </h2>

            <p className="mt-2 text-sm font-medium text-black/45">
              {product.brand}
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-2xl font-semibold">
                {formatPrice(product.price)}
              </span>
            </div>

            <div className="mt-6 border-t border-black/10 pt-6">
              <h3 className="text-sm font-semibold">
                Description
              </h3>

              <p className="mt-3 text-sm leading-7 text-black/60">
                {product.description}
              </p>
            </div>

            <div className="mt-6 border-t border-black/10 pt-6">
              <h3 className="text-sm font-semibold">
                Fragrance Notes
              </h3>

              <p className="mt-3 text-sm leading-7 text-black/60">
                {product.fragrance_notes}
              </p>
            </div>

            <div className="mt-6 grid gap-4 border-t border-black/10 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-black/40">
                  Available Stock
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {product.stock_quantity} units
                </p>
              </div>

              <div>
                <p className="text-xs text-black/40">
                  Size
                </p>

                <p className="mt-1 text-sm font-medium">
                  {product.size}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-black/10 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-black/40">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatDate(
                    product.created_at
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-black/40">
                  Last Updated
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatDate(
                    product.updated_at
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <ShoppingBag size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Total Sold
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {product.totalSold ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <CircleDollarSign size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Total Revenue
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {formatPrice(
                product.revenue ?? 0
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <Package size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Current Stock
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {product.stock_quantity}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <TrendingUp size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Average Sale
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {formatPrice(
                product.totalSold
                  ? product.revenue /
                    product.totalSold
                  : 0
              )}
            </p>
          </div>

        </div>

        {/* Recent Orders */}
        <div className="mt-6 rounded-2xl border border-black/10 bg-white">

          <div className="flex items-center justify-between border-b border-black/10 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-black/45">
                Recent orders containing this product
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/admin/orders")
              }
              className="hidden text-sm font-medium underline underline-offset-4 sm:block"
            >
              View All Orders
            </button>
          </div>

          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">

            <table className="w-full">

              <thead>
                <tr className="border-b border-black/10 text-left text-xs text-black/40">

                  <th className="px-6 py-4 font-medium">
                    Order
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Customer
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Date
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Quantity
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Total
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-black/5 last:border-0"
                  >

                    <td className="px-6 py-4 text-sm font-medium">
                      {order.id}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {order.customer}
                    </td>

                    <td className="px-6 py-4 text-sm text-black/50">
                      {order.date}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {order.quantity}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium">
                      {formatPrice(
                        order.total
                      )}
                    </td>

                    <td className="px-6 py-4">

                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                        {order.status}
                      </span>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-black/5 md:hidden">

            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-5"
              >

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-sm font-semibold">
                      {order.id}
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      {order.customer}
                    </p>

                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {order.status}
                  </span>

                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">

                  <div>

                    <p className="text-[11px] text-black/40">
                      Date
                    </p>

                    <p className="mt-1 text-xs font-medium">
                      {order.date}
                    </p>

                  </div>

                  <div>

                    <p className="text-[11px] text-black/40">
                      Quantity
                    </p>

                    <p className="mt-1 text-xs font-medium">
                      {order.quantity}
                    </p>

                  </div>

                  <div>

                    <p className="text-[11px] text-black/40">
                      Total
                    </p>

                    <p className="mt-1 text-xs font-medium">
                      {formatPrice(
                        order.total
                      )}
                    </p>

                  </div>

                </div>

              </div>
            ))}

          </div>

          <div className="border-t border-black/10 p-5 md:hidden">

            <button
              onClick={() =>
                router.push(
                  "/admin/orders"
                )
              }
              className="w-full rounded-xl border border-black/10 py-3 text-sm font-medium"
            >
              View All Orders
            </button>

          </div>

        </div>

        {/* Mobile Actions */}
        <div className="mt-6 grid gap-3 sm:hidden">

          <button
            onClick={() =>
              router.push(
                `/admin/products/${params?.id}/edit`
              )
            }
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white"
          >
            <Edit size={17} />
            Edit Product
          </button>

          <button
            onClick={handleDelete}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-medium text-red-600"
          >
            <Trash2 size={17} />
            Delete Product
          </button>

        </div>

      </div>
    </div>
  );
}