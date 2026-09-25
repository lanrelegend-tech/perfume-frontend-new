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
  CalendarDays,
  Clock3,
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

function getOrderList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/*
  Tries to find order items from several common API shapes.
*/
function getOrderItems(order) {
  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.order_items)) {
    return order.order_items;
  }

  if (Array.isArray(order?.orderItems)) {
    return order.orderItems;
  }

  if (Array.isArray(order?.products)) {
    return order.products;
  }

  if (Array.isArray(order?.line_items)) {
    return order.line_items;
  }

  return [];
}

/*
  Gets the product ID from an order item.
*/
function getItemProductId(item) {
  if (item?.product_id !== undefined) {
    return item.product_id;
  }

  if (item?.productId !== undefined) {
    return item.productId;
  }

  if (item?.product?.id !== undefined) {
    return item.product.id;
  }

  if (item?.product_detail?.id !== undefined) {
    return item.product_detail.id;
  }

  return null;
}

/*
  Gets quantity from an order item.
*/
function getItemQuantity(item) {
  const quantity =
    item?.quantity ??
    item?.qty ??
    item?.count ??
    0;

  const parsed = Number(quantity);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : 0;
}

/*
  Gets the price actually charged for the item.
*/
function getItemPrice(item) {
  const price =
    item?.price ??
    item?.unit_price ??
    item?.unitPrice ??
    item?.product_price ??
    item?.productPrice ??
    item?.product?.price ??
    0;

  const parsed = Number(price);

  return Number.isFinite(parsed) ? parsed : 0;
}

/*
  Gets customer name from an order.
*/
function getCustomerName(order) {
  if (order?.customer?.name) {
    return order.customer.name;
  }

  if (order?.user?.name) {
    return order.user.name;
  }

  if (order?.customer_name) {
    return order.customer_name;
  }

  if (order?.customerName) {
    return order.customerName;
  }

  if (order?.user_name) {
    return order.user_name;
  }

  if (order?.user?.first_name || order?.user?.last_name) {
    return [
      order.user.first_name,
      order.user.last_name,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (order?.user?.email) {
    return order.user.email;
  }

  if (order?.email) {
    return order.email;
  }

  return "Customer";
}

/*
  Gets order number from an order.
*/
function getOrderNumber(order) {
  return (
    order?.order_number ??
    order?.orderNumber ??
    order?.reference ??
    order?.order_id ??
    order?.id ??
    "—"
  );
}

/*
  Gets order date.
*/
function getOrderDate(order) {
  return (
    order?.created_at ??
    order?.createdAt ??
    order?.date ??
    order?.ordered_at ??
    order?.order_date ??
    null
  );
}

/*
  Gets order status.
*/
function getOrderStatus(order) {
  const status =
    order?.status ??
    order?.order_status ??
    order?.orderStatus ??
    "Processing";

  return String(status);
}

/*
  Some APIs return the product directly inside the
  order object instead of inside items.
*/
function orderContainsProduct(order, productId) {
  const items = getOrderItems(order);

  if (items.length > 0) {
    return items.some(
      (item) =>
        String(getItemProductId(item)) ===
        String(productId)
    );
  }

  if (
    order?.product_id !== undefined &&
    String(order.product_id) === String(productId)
  ) {
    return true;
  }

  if (
    order?.product?.id !== undefined &&
    String(order.product.id) === String(productId)
  ) {
    return true;
  }

  return false;
}

/*
  Converts an API order into the exact data
  needed by the Recent Orders table.
*/
function buildProductOrder(order, productId) {
  const items = getOrderItems(order);

  const matchingItems = items.filter(
    (item) =>
      String(getItemProductId(item)) ===
      String(productId)
  );

  let quantity = 0;
  let total = 0;

  if (matchingItems.length > 0) {
    matchingItems.forEach((item) => {
      const itemQuantity =
        getItemQuantity(item);

      const itemPrice =
        getItemPrice(item);

      quantity += itemQuantity;
      total += itemQuantity * itemPrice;
    });
  } else {
    /*
      Fallback for APIs where the order itself
      represents one product.
    */
    const itemQuantity =
      getItemQuantity(order);

    const itemPrice =
      getItemPrice(order);

    quantity = itemQuantity;
    total = itemQuantity * itemPrice;
  }

  return {
    id: String(getOrderNumber(order)),
    customer: getCustomerName(order),
    date: getOrderDate(order),
    quantity,
    total,
    status: getOrderStatus(order),
  };
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] =
    useState(true);

  const [error, setError] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  /* =====================================================
     FETCH PRODUCT
  ===================================================== */

  useEffect(() => {
    if (!params?.id || !API_URL) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products/`
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
  }, [params?.id, API_URL]);

  /* =====================================================
     FETCH CATEGORIES
  ===================================================== */

  useEffect(() => {
    if (!API_URL) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_URL}/products/categories/`
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
  }, [API_URL]);

  /* =====================================================
     FETCH REAL ORDERS
  ===================================================== */

  useEffect(() => {
    if (
      !API_URL ||
      !params?.id
    ) {
      return;
    }

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem(
                "access_token"
              )
            : null;

        /*
          Try the admin orders endpoint first.
          If your backend exposes the orders list
          through /orders/ instead, the fallback
          will use that.
        */
        const endpoints = [
          `${API_URL}/orders/admin/`,
          `${API_URL}/orders/`,
        ];

        let orderData = null;
        let foundResponse = false;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(
              endpoint,
              {
                headers: token
                  ? {
                      Authorization: `Bearer ${token}`,
                    }
                  : {},
              }
            );

            if (
              response.status === 401 ||
              response.status === 403
            ) {
              continue;
            }

            if (!response.ok) {
              continue;
            }

            orderData = await response.json();
            foundResponse = true;
            break;
          } catch {
            continue;
          }
        }

        if (!foundResponse) {
          setOrders([]);
          return;
        }

        const orderList =
          getOrderList(orderData);

        const productOrders =
          orderList
            .filter((order) =>
              orderContainsProduct(
                order,
                params.id
              )
            )
            .map((order) =>
              buildProductOrder(
                order,
                params.id
              )
            )
            .filter(
              (order) =>
                order.quantity > 0
            )
            .sort((a, b) => {
              const dateA = new Date(
                a.date || 0
              ).getTime();

              const dateB = new Date(
                b.date || 0
              ).getTime();

              return dateB - dateA;
            });

        setOrders(productOrders);
      } catch (err) {
        console.error(
          "Orders fetch error:",
          err
        );

        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [params?.id, API_URL]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] text-black">
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
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-5 text-black">
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
     PRODUCT STATUS
  ===================================================== */

  const stockQuantity =
    Number(product.stock_quantity) || 0;

  const hasStock =
    stockQuantity > 0;

  const isPreorder =
    stockQuantity === 0 &&
    product.is_preorder === true;

  const isSoldOut =
    stockQuantity === 0 &&
    product.is_preorder !== true;

  /* =====================================================
     REAL SALES ANALYTICS
  ===================================================== */

  const totalSold = orders.reduce(
    (sum, order) =>
      sum + Number(order.quantity || 0),
    0
  );

  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const averageSale =
    totalSold > 0
      ? totalRevenue / totalSold
      : 0;

  /* =====================================================
     CATEGORY
  ===================================================== */

  const categoryName =
    product.category?.name ||
    getCategoryName(
      product.category_id,
      categories
    );

  /* =====================================================
     IMAGE
  ===================================================== */

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
        localStorage.getItem(
          "access_token"
        );

      const response = await fetch(
        `${API_URL}/products/admin/${product.id}/`,
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
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

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
      {/* =================================================
          HEADER
      ================================================= */}

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
              <div className="flex flex-wrap items-center gap-2">
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
        {/* =================================================
            PRODUCT OVERVIEW
        ================================================= */}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* IMAGE */}
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

            {/* THUMBNAILS */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {productImages.map(
                (image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-black/[0.02]"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${
                        index + 1
                      }`}
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

          {/* PRODUCT INFORMATION */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
            {/* STATUS BADGES */}
            <div className="flex flex-wrap items-center gap-2">
              {hasStock && (
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  In Stock
                </span>
              )}

              {isPreorder && (
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  Pre-order Available
                </span>
              )}

              {isSoldOut && (
                <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
                  Sold Out
                </span>
              )}

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

            {/* PRE-ORDER INFORMATION */}
            {isPreorder && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Clock3 size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Pre-orders are available
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800/80">
                      Customers can purchase this product even though it currently has no stock.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-amber-200 pt-4">
                  {product.preorder_release_date && (
                    <div className="flex items-center gap-3">
                      <CalendarDays
                        size={16}
                        className="text-amber-700"
                      />

                      <div>
                        <p className="text-xs text-amber-700/70">
                          Expected Release
                        </p>

                        <p className="mt-0.5 text-sm font-medium text-amber-900">
                          {formatDate(
                            product.preorder_release_date
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {product.preorder_message && (
                    <div>
                      <p className="text-xs text-amber-700/70">
                        Customer Message
                      </p>

                      <p className="mt-1 text-sm font-medium text-amber-900">
                        {product.preorder_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SOLD OUT INFORMATION */}
            {isSoldOut && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Package size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Sold Out
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-800/70">
                      This product has no stock and pre-orders are currently disabled.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div className="mt-6 border-t border-black/10 pt-6">
              <h3 className="text-sm font-semibold">
                Description
              </h3>

              <p className="mt-3 text-sm leading-7 text-black/60">
                {product.description ||
                  "No description available."}
              </p>
            </div>

            {/* FRAGRANCE NOTES */}
            <div className="mt-6 border-t border-black/10 pt-6">
              <h3 className="text-sm font-semibold">
                Fragrance Notes
              </h3>

              <p className="mt-3 text-sm leading-7 text-black/60">
                {product.fragrance_notes ||
                  "No fragrance notes available."}
              </p>
            </div>

            {/* STOCK + SIZE */}
            <div className="mt-6 grid gap-4 border-t border-black/10 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-black/40">
                  Available Stock
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {stockQuantity} units
                </p>
              </div>

              <div>
                <p className="text-xs text-black/40">
                  Size
                </p>

                <p className="mt-1 text-sm font-medium">
                  {product.size || "—"}
                </p>
              </div>
            </div>

            {/* CREATED + UPDATED */}
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

        {/* =================================================
            PERFORMANCE
        ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* TOTAL SOLD */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <ShoppingBag size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Total Sold
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {totalSold}
            </p>
          </div>

          {/* TOTAL REVENUE */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <CircleDollarSign size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Total Revenue
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {formatPrice(
                totalRevenue
              )}
            </p>
          </div>

          {/* CURRENT STOCK */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <Package size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Current Stock
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {stockQuantity}
            </p>
          </div>

          {/* AVERAGE SALE */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5">
              <TrendingUp size={19} />
            </div>

            <p className="mt-4 text-sm text-black/45">
              Average Sale
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {formatPrice(
                averageSale
              )}
            </p>
          </div>
        </div>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-black/10 bg-white">
          <div className="flex items-center justify-between border-b border-black/10 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-black/45">
                Real orders containing this product
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  "/admin/orders"
                )
              }
              className="hidden text-sm font-medium underline underline-offset-4 sm:block"
            >
              View All Orders
            </button>
          </div>

          {/* DESKTOP */}
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
                {ordersLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-black/40"
                    >
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-black/40"
                    >
                      No orders found for this product.
                    </td>
                  </tr>
                ) : (
                  orders
                    .slice(0, 10)
                    .map((order) => (
                      <tr
                        key={`${order.id}-${order.date}`}
                        className="border-b border-black/5 last:border-0"
                      >
                        <td className="px-6 py-4 text-sm font-medium">
                          {order.id}
                        </td>

                        <td className="px-6 py-4 text-sm">
                          {order.customer}
                        </td>

                        <td className="px-6 py-4 text-sm text-black/50">
                          {formatDate(
                            order.date
                          )}
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
                          <span className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-black/65">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="divide-y divide-black/5 md:hidden">
            {ordersLoading ? (
              <div className="p-6 text-center text-sm text-black/40">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-center text-sm text-black/40">
                No orders found for this product.
              </div>
            ) : (
              orders
                .slice(0, 10)
                .map((order) => (
                  <div
                    key={`${order.id}-${order.date}`}
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

                      <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium text-black/65">
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[11px] text-black/40">
                          Date
                        </p>

                        <p className="mt-1 text-xs font-medium">
                          {formatDate(
                            order.date
                          )}
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
                ))
            )}
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

        {/* =================================================
            MOBILE ACTIONS
        ================================================= */}

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