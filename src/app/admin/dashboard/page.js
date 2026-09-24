"use client";

import AdminSidebar from "@/components/AdminSidebar";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Search,
  Bell,
  MessageCircle,
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  UserRound,
  Truck,
  Package,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function AdminDashboard() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================================================
  // AUTH
  // ==================================================

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("access_token");
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    router.replace("/admin/login");
  };

  // ==================================================
  // API HELPERS
  // ==================================================

  const getResults = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  const getCount = (data) => {
    if (Array.isArray(data)) {
      return data.length;
    }

    if (typeof data?.count === "number") {
      return data.count;
    }

    if (Array.isArray(data?.results)) {
      return data.results.length;
    }

    return 0;
  };

  const fetchApi = async (url, token) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTH_ERROR");
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  };

  // ==================================================
  // LOAD DASHBOARD
  // ==================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const [
        productsData,
        ordersData,
        customersData,
      ] = await Promise.all([
        fetchApi(`${API_URL}/products/`, token),
        fetchApi(`${API_URL}/orders/admin/`, token),
        fetchApi(
          `${API_URL}/users/admin/customers/`,
          token
        ),
      ]);

      // ----------------------------------------------
      // STORE CURRENT API RESULTS
      // ----------------------------------------------

      setProducts(getResults(productsData));
      setOrders(getResults(ordersData));
      setCustomers(getResults(customersData));

      // ----------------------------------------------
      // STORE REAL API COUNTS
      // ----------------------------------------------

      setProductCount(getCount(productsData));
      setOrderCount(getCount(ordersData));
      setCustomerCount(getCount(customersData));
    } catch (err) {
      console.error("Dashboard error:", err);

      if (err.message === "AUTH_ERROR") {
        logout();
        return;
      }

      setError(
        "Unable to load dashboard data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    loadDashboard();
  }, [router]);

  // ==================================================
  // HELPERS
  // ==================================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const formatCompactCurrency = (amount) => {
    const value = Number(amount || 0);

    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}m`;
    }

    if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}k`;
    }

    return formatCurrency(value);
  };

  const getOrderAmount = (order) => {
    return Number(
      order?.total_amount ??
        order?.total ??
        order?.amount ??
        order?.grand_total ??
        0
    );
  };

  const getDeliveryFee = (order) => {
    return Number(
      order?.delivery_fee ??
        order?.shipping_fee ??
        order?.shipping_cost ??
        0
    );
  };

  const getOrderDate = (order) => {
    return (
      order?.created_at ||
      order?.created ||
      order?.date ||
      order?.ordered_at ||
      null
    );
  };

  const getProductName = (product) => {
    return (
      product?.name ||
      product?.product_name ||
      product?.title ||
      "Unnamed Product"
    );
  };

  const getProductImage = (product) => {
    return (
      product?.image ||
      product?.image_url ||
      product?.product_image ||
      null
    );
  };

  const getOrderItems = (order) => {
    return Array.isArray(order?.items)
      ? order.items
      : [];
  };

  const getItemProductId = (item) => {
    if (typeof item?.product === "object") {
      return item.product?.id;
    }

    return item?.product;
  };

  const getItemQuantity = (item) => {
    return Number(item?.quantity || 0);
  };

  const getItemName = (item) => {
    return (
      item?.product_name ||
      item?.product?.name ||
      item?.name ||
      "Product"
    );
  };

  const getItemImage = (item) => {
    return (
      item?.product_image ||
      item?.product?.image ||
      item?.image ||
      null
    );
  };

  const getOrderStatus = (order) => {
    return String(
      order?.status || ""
    ).toLowerCase();
  };

  const isPaidOrder = (order) => {
    const paymentStatus = String(
      order?.payment_status || ""
    ).toLowerCase();

    return paymentStatus === "paid";
  };

  // ==================================================
  // DASHBOARD COUNTS
  // ==================================================

  const totalProducts = productCount;

  const totalCustomers = customerCount;

  const totalOrders = orderCount;

  // ==================================================
  // PAID ORDERS
  // ==================================================

  const paidOrders = useMemo(() => {
    return orders.filter(isPaidOrder);
  }, [orders]);

  // ==================================================
  // REVENUE
  // ==================================================

  const revenue = useMemo(() => {
    return paidOrders.reduce((total, order) => {
      return total + getOrderAmount(order);
    }, 0);
  }, [paidOrders]);

  // ==================================================
  // DELIVERY FEES
  // ==================================================

  const deliveryFees = useMemo(() => {
    return paidOrders.reduce((total, order) => {
      return total + getDeliveryFee(order);
    }, 0);
  }, [paidOrders]);

  // ==================================================
  // NET SALES
  // ==================================================

  const netSales = Math.max(
    0,
    revenue - deliveryFees
  );

  // ==================================================
  // PENDING ORDERS
  // ==================================================

  const pendingOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = getOrderStatus(order);

      return (
        status === "pending" ||
        status === "confirmed" ||
        status === "processing"
      );
    }).length;
  }, [orders]);

  // ==================================================
  // SHIPPED ORDERS
  // ==================================================

  const shippedOrders = useMemo(() => {
    return orders.filter((order) => {
      return (
        getOrderStatus(order) === "shipped"
      );
    }).length;
  }, [orders]);

  // ==================================================
  // DELIVERED ORDERS
  // ==================================================

  const deliveredOrders = useMemo(() => {
    return orders.filter((order) => {
      return (
        getOrderStatus(order) === "delivered"
      );
    }).length;
  }, [orders]);

  // ==================================================
  // TOP PRODUCTS
  // ==================================================

  const topProducts = useMemo(() => {
    const productMap = {};

    orders.forEach((order) => {
      if (!isPaidOrder(order)) return;

      const items = getOrderItems(order);

      items.forEach((item) => {
        const productId =
          getItemProductId(item) ||
          `name-${getItemName(item)}`;

        if (!productMap[productId]) {
          productMap[productId] = {
            id: productId,
            name: getItemName(item),
            image: getItemImage(item),
            quantity: 0,
            sales: 0,
          };
        }

        productMap[productId].quantity +=
          getItemQuantity(item);

        productMap[productId].sales += Number(
          item?.subtotal || 0
        );
      });
    });

    return Object.values(productMap)
      .sort(
        (a, b) =>
          b.quantity - a.quantity
      )
      .slice(0, 5);
  }, [orders]);

  // ==================================================
  // REVENUE CHART
  // ==================================================

  const revenueChart = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - i
      );

      days.push({
        date,
        label: date.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
          }
        ),
        amount: 0,
      });
    }

    paidOrders.forEach((order) => {
      const orderDateValue =
        getOrderDate(order);

      if (!orderDateValue) return;

      const orderDate =
        new Date(orderDateValue);

      if (
        Number.isNaN(
          orderDate.getTime()
        )
      ) {
        return;
      }

      days.forEach((day) => {
        if (
          orderDate.getFullYear() ===
            day.date.getFullYear() &&
          orderDate.getMonth() ===
            day.date.getMonth() &&
          orderDate.getDate() ===
            day.date.getDate()
        ) {
          day.amount +=
            getOrderAmount(order);
        }
      });
    });

    return days;
  }, [paidOrders]);

  const maxChartValue = Math.max(
    ...revenueChart.map(
      (item) => item.amount
    ),
    1
  );

  // ==================================================
  // RECENT ORDERS
  // ==================================================

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const dateA = new Date(
          getOrderDate(a) || 0
        ).getTime();

        const dateB = new Date(
          getOrderDate(b) || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [orders]);

  // ==================================================
  // CURRENT DATE
  // ==================================================

  const currentDate = new Date();

  const currentMonth =
    currentDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
      }
    );

  const currentYear =
    currentDate.getFullYear();

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7f6] text-[#171918]">
        <AdminSidebar />

        <section className="lg:ml-[250px] p-5 md:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded bg-gray-200" />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-32 rounded-2xl bg-gray-200"
                  />
                )
              )}
            </div>

            <div className="h-80 rounded-2xl bg-gray-200" />

            <div className="h-96 rounded-2xl bg-gray-200" />
          </div>
        </section>
      </main>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#171918]">
      <AdminSidebar />

      <section className="lg:ml-[250px] p-5 md:p-8">

        {/* HEADER */}

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

          <div>
            <p className="text-sm text-gray-500 mb-1">
              {currentMonth}{" "}
              {currentYear}
            </p>

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Here's what's happening with your store.
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* SEARCH */}

            <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-11 w-[240px]">
              <Search
                size={17}
                className="text-gray-400"
              />

              <input
                type="text"
                placeholder="Search..."
                className="w-full outline-none text-sm bg-transparent"
              />
            </div>

            {/* NOTIFICATIONS */}

            <button
              className="relative w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50"
            >
              <Bell size={18} />

              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* MESSAGES */}

            <button
              className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50"
            >
              <MessageCircle size={18} />
            </button>

            {/* REFRESH */}

            <button
              onClick={loadDashboard}
              className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800"
              title="Refresh dashboard"
            >
              <RefreshCw size={17} />
            </button>

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between gap-4">

            <span>{error}</span>

            <button
              onClick={loadDashboard}
              className="font-medium underline"
            >
              Retry
            </button>

          </div>
        )}

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5 mb-6">

          <StatCard
            title="Total Revenue"
            value={formatCompactCurrency(
              revenue
            )}
            icon={
              <DollarSign size={19} />
            }
            description={`${paidOrders.length} paid orders`}
          />

          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={
              <ShoppingCart size={19} />
            }
            description={`${pendingOrders} currently pending`}
          />

          <StatCard
            title="Customers"
            value={totalCustomers}
            icon={
              <UserRound size={19} />
            }
            description="Registered & guest customers"
          />

          <StatCard
            title="Products"
            value={totalProducts}
            icon={
              <Package size={19} />
            }
            description={`${shippedOrders} orders currently shipped`}
          />

          <StatCard
            title="Delivery Fees"
            value={formatCompactCurrency(
              deliveryFees
            )}
            icon={
              <Truck size={19} />
            }
            description="Delivery fees collected"
          />

          <StatCard
            title="Net Sales"
            value={formatCompactCurrency(
              netSales
            )}
            icon={
              <DollarSign size={19} />
            }
            description="Sales excluding delivery fees"
          />

        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

          {/* REVENUE CHART */}

          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 md:p-6">

            <div className="flex items-center justify-between mb-7">

              <div>
                <h2 className="font-semibold text-lg">
                  Revenue Overview
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Paid orders over the last 7 days
                </p>
              </div>

              <div className="text-right">

                <p className="text-xl font-semibold">
                  {formatCurrency(
                    revenueChart.reduce(
                      (sum, item) =>
                        sum + item.amount,
                      0
                    )
                  )}
                </p>

                <p className="text-xs text-gray-500">
                  Last 7 days
                </p>

              </div>
            </div>

            {/* CHART */}

            <div className="h-[250px] flex items-end gap-3 md:gap-5">

              {revenueChart.map(
                (item) => {
                  const height =
                    (item.amount /
                      maxChartValue) *
                    100;

                  return (
                    <div
                      key={item.date.toISOString()}
                      className="flex-1 h-full flex flex-col justify-end items-center gap-3"
                    >

                      <div className="w-full h-full flex items-end">

                        <div
                          className="w-full rounded-t-lg bg-black transition-all duration-500"
                          style={{
                            height: `${Math.max(
                              height,
                              3
                            )}%`,
                          }}
                          title={formatCurrency(
                            item.amount
                          )}
                        />

                      </div>

                      <span className="text-xs text-gray-400">
                        {item.label}
                      </span>

                    </div>
                  );
                }
              )}

            </div>
          </div>

          {/* ORDER STATUS */}

          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">

            <div className="mb-6">

              <h2 className="font-semibold text-lg">
                Order Status
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Current order breakdown
              </p>

            </div>

            <div className="space-y-5">

              <StatusRow
                label="Pending"
                value={
                  orders.filter(
                    (order) =>
                      getOrderStatus(
                        order
                      ) === "pending"
                  ).length
                }
              />

              <StatusRow
                label="Confirmed"
                value={
                  orders.filter(
                    (order) =>
                      getOrderStatus(
                        order
                      ) === "confirmed"
                  ).length
                }
              />

              <StatusRow
                label="Processing"
                value={
                  orders.filter(
                    (order) =>
                      getOrderStatus(
                        order
                      ) === "processing"
                  ).length
                }
              />

              <StatusRow
                label="Shipped"
                value={
                  shippedOrders
                }
              />

              <StatusRow
                label="Delivered"
                value={
                  deliveredOrders
                }
              />

              <StatusRow
                label="Cancelled"
                value={
                  orders.filter(
                    (order) =>
                      getOrderStatus(
                        order
                      ) === "cancelled"
                  ).length
                }
              />

            </div>
          </div>

        </div>

        {/* SECOND ROW */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

          {/* TOP PRODUCTS */}

          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="font-semibold text-lg">
                  Top Selling Products
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Based on paid orders
                </p>

              </div>

              <button
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                className="text-sm font-medium flex items-center gap-1 hover:underline"
              >
                View all
                <ChevronRight
                  size={15}
                />
              </button>

            </div>

            {topProducts.length ===
            0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                No paid product sales yet.
              </div>
            ) : (
              <div className="space-y-4">

                {topProducts.map(
                  (
                    product,
                    index
                  ) => (
                    <div
                      key={
                        product.id
                      }
                      className="flex items-center gap-4"
                    >

                      <div className="w-8 text-sm text-gray-400">
                        #{index + 1}
                      </div>

                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">

                        {product.image ? (
                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package
                              size={
                                18
                              }
                              className="text-gray-400"
                            />
                          </div>
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="font-medium text-sm truncate">
                          {
                            product.name
                          }
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {
                            product.quantity
                          }{" "}
                          sold
                        </p>

                      </div>

                      <p className="font-medium text-sm">
                        {formatCurrency(
                          product.sales
                        )}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* STORE SUMMARY */}

          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">

            <div className="mb-6">

              <h2 className="font-semibold text-lg">
                Store Summary
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Live information from your API
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <SummaryBox
                icon={
                  <ShoppingCart
                    size={18}
                  />
                }
                label="Paid Orders"
                value={
                  paidOrders.length
                }
              />

              <SummaryBox
                icon={
                  <Truck size={18} />
                }
                label="Shipped"
                value={
                  shippedOrders
                }
              />

              <SummaryBox
                icon={
                  <Package size={18} />
                }
                label="Delivered"
                value={
                  deliveredOrders
                }
              />

              <SummaryBox
                icon={
                  <UserRound
                    size={18}
                  />
                }
                label="Customers"
                value={
                  totalCustomers
                }
              />

            </div>

            <div className="mt-5 rounded-xl bg-[#f5f7f6] p-4">

              <div className="flex items-center justify-between mb-2">

                <span className="text-sm text-gray-500">
                  Net sales
                </span>

                <ArrowUpRight
                  size={16}
                />

              </div>

              <p className="text-2xl font-semibold">
                {formatCurrency(
                  netSales
                )}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Revenue excluding delivery fees
              </p>

            </div>

          </div>

        </div>

        {/* RECENT ORDERS */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

            <div>

              <h2 className="font-semibold text-lg">
                Recent Orders
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Latest orders from your store
              </p>

            </div>

            <button
              onClick={() =>
                router.push(
                  "/admin/orders"
                )
              }
              className="text-sm font-medium flex items-center gap-1 hover:underline"
            >
              View all
              <ChevronRight
                size={15}
              />
            </button>

          </div>

          {recentOrders.length ===
          0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>

                  <tr className="border-b border-gray-100 text-left">

                    <th className="pb-4 text-xs font-medium text-gray-400">
                      ORDER
                    </th>

                    <th className="pb-4 text-xs font-medium text-gray-400">
                      CUSTOMER
                    </th>

                    <th className="pb-4 text-xs font-medium text-gray-400">
                      DATE
                    </th>

                    <th className="pb-4 text-xs font-medium text-gray-400">
                      PAYMENT
                    </th>

                    <th className="pb-4 text-xs font-medium text-gray-400">
                      STATUS
                    </th>

                    <th className="pb-4 text-xs font-medium text-gray-400 text-right">
                      TOTAL
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentOrders.map(
                    (order) => {
                      const orderDate =
                        getOrderDate(
                          order
                        );

                      const status =
                        getOrderStatus(
                          order
                        );

                      const paymentStatus =
                        String(
                          order?.payment_status ||
                            ""
                        ).toLowerCase();

                      return (
                        <tr
                          key={
                            order.id
                          }
                          className="border-b border-gray-50 last:border-0"
                        >

                          <td className="py-4">

                            <button
                              onClick={() =>
                                router.push(
                                  `/admin/orders/${order.id}`
                                )
                              }
                              className="font-medium text-sm hover:underline"
                            >
                              #
                              {order.order_number ||
                                order.id}
                            </button>

                          </td>

                          <td className="py-4">

                            <p className="text-sm font-medium">
                              {order.full_name ||
                                order.customer_name ||
                                order.name ||
                                "Guest Customer"}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {order.email ||
                                "No email"}
                            </p>

                          </td>

                          <td className="py-4 text-sm text-gray-500">

                            {orderDate
                              ? new Date(
                                  orderDate
                                ).toLocaleDateString(
                                  "en-NG",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "—"}

                          </td>

                          <td className="py-4">

                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                paymentStatus ===
                                "paid"
                                  ? "bg-green-50 text-green-600"
                                  : paymentStatus ===
                                    "failed"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-yellow-50 text-yellow-600"
                              }`}
                            >
                              {paymentStatus ||
                                "pending"}
                            </span>

                          </td>

                          <td className="py-4">

                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                status
                              )}`}
                            >
                              {status ||
                                "unknown"}
                            </span>

                          </td>

                          <td className="py-4 text-right font-medium text-sm">
                            {formatCurrency(
                              getOrderAmount(
                                order
                              )
                            )}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* MOBILE SEARCH */}

        <div className="md:hidden mt-6">

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-11">

            <Search
              size={17}
              className="text-gray-400"
            />

            <input
              type="text"
              placeholder="Search..."
              className="w-full outline-none text-sm bg-transparent"
            />

          </div>

        </div>

      </section>
    </main>
  );
}

// ==================================================
// STAT CARD
// ==================================================

function StatCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h3 className="text-2xl font-semibold mt-2">
            {value}
          </h3>

        </div>

        <div className="w-10 h-10 rounded-xl bg-[#f1f3f2] flex items-center justify-center">
          {icon}
        </div>

      </div>

      <div className="mt-5 flex items-center gap-1 text-xs text-gray-500">

        <ArrowUpRight
          size={13}
        />

        <span>
          {description}
        </span>

      </div>

    </div>
  );
}

// ==================================================
// STATUS ROW
// ==================================================

function StatusRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <span className="w-2.5 h-2.5 rounded-full bg-black" />

        <span className="text-sm text-gray-600">
          {label}
        </span>

      </div>

      <span className="font-semibold text-sm">
        {value}
      </span>

    </div>
  );
}

// ==================================================
// SUMMARY BOX
// ==================================================

function SummaryBox({
  icon,
  label,
  value,
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">

      <div className="w-9 h-9 rounded-lg bg-[#f5f7f6] flex items-center justify-center mb-3">
        {icon}
      </div>

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="text-xl font-semibold mt-1">
        {value}
      </p>

    </div>
  );
}

// ==================================================
// STATUS COLOR
// ==================================================

function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-50 text-yellow-600";

    case "confirmed":
      return "bg-blue-50 text-blue-600";

    case "processing":
      return "bg-purple-50 text-purple-600";

    case "shipped":
      return "bg-indigo-50 text-indigo-600";

    case "delivered":
      return "bg-green-50 text-green-600";

    case "cancelled":
      return "bg-red-50 text-red-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
}