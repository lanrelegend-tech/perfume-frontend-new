"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  ChevronDown,
  DollarSign,
  Download,
  Package,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Loader2,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);

  if (amount >= 1000000000) {
    return `₦${(amount / 1000000000).toFixed(1)}B`;
  }

  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  }

  if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}K`;
  }

  return `₦${amount.toFixed(0)}`;
};

const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const possibleKeys = [
    "access",
    "access_token",
    "accessToken",
    "token",
    "authToken",
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
};

const getHeaders = () => {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const getResults = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.customers)) {
    return data.customers;
  }

  return [];
};

const getOrderDate = (order) => {
  return (
    order?.created_at ||
    order?.created ||
    order?.date ||
    order?.updated_at ||
    null
  );
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

const getOrderStatus = (order) => {
  return String(order?.status || "").toLowerCase();
};

const getProductName = (item) => {
  return (
    item?.product_name ||
    item?.product?.name ||
    item?.name ||
    "Unknown Product"
  );
};

const getProductCategory = (item) => {
  return (
    item?.category_name ||
    item?.category ||
    item?.product?.category_name ||
    item?.product?.category?.name ||
    "Uncategorized"
  );
};

const getItemQuantity = (item) => {
  return Number(item?.quantity || 0);
};

const getItemSubtotal = (item) => {
  return Number(
    item?.subtotal ??
      item?.total ??
      Number(item?.product_price || item?.price || 0) *
        Number(item?.quantity || 0)
  );
};

/* =========================================================
   DISCOUNT HELPER
========================================================= */

const getDiscountInfo = (order) => {
  const explicitDiscount = Number(
    order?.discount_amount ??
      order?.coupon_discount_amount ??
      order?.discount ??
      0
  );

  if (explicitDiscount > 0) {
    return {
      amount: explicitDiscount,
      label: formatCurrency(explicitDiscount),
      hasAmount: true,
      percent: null,
    };
  }

  const value = Number(
    order?.coupon_discount_value || 0
  );

  const type = String(
    order?.coupon_discount_type || ""
  ).toLowerCase();

  if (!value) {
    return {
      amount: 0,
      label: "None",
      hasAmount: true,
      percent: null,
    };
  }

  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  const subtotal = items.reduce(
    (sum, item) =>
      sum + getItemSubtotal(item),
    0
  );

  const isPercentage = [
    "percentage",
    "percent",
    "%",
  ].includes(type);

  if (isPercentage) {
    if (subtotal > 0) {
      const amount =
        (subtotal * value) / 100;

      return {
        amount,
        label: formatCurrency(amount),
        hasAmount: true,
        percent: value,
      };
    }

    return {
      amount: 0,
      label: `${value}%`,
      hasAmount: false,
      percent: value,
    };
  }

  return {
    amount: value,
    label: formatCurrency(value),
    hasAmount: true,
    percent: null,
  };
};

/*
  An order counts toward revenue/sales when payment is paid
  or when the order has progressed beyond pending.
*/
const isCompletedOrder = (order) => {
  const paymentStatus = String(
    order?.payment_status || ""
  ).toLowerCase();

  const status = getOrderStatus(order);

  if (paymentStatus === "paid") {
    return true;
  }

  return [
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ].includes(status);
};

const getPeriodStart = (range) => {
  const now = new Date();

  if (range === "7 Days") {
    const date = new Date(now);
    date.setDate(date.getDate() - 7);
    return date;
  }

  if (range === "30 Days") {
    const date = new Date(now);
    date.setDate(date.getDate() - 30);
    return date;
  }

  const date = new Date(now);
  date.setFullYear(date.getFullYear() - 1);
  return date;
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  title,
  value,
  change,
  positive = true,
  description,
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
          <Icon size={20} />
        </div>

        {change !== null &&
          change !== undefined && (
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                positive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {positive ? (
                <ArrowUp size={13} />
              ) : (
                <ArrowDown size={13} />
              )}

              {change}
            </div>
          )}
      </div>

      <p className="mt-5 text-sm text-black/50">
        {title}
      </p>

      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-black">
        {value}
      </h3>

      <p className="mt-2 text-xs text-black/40">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({ name }) {
  const safeName = name || "Customer";

  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
      {initials || "CU"}
    </div>
  );
}

/* =========================================================
   DELIVERY STATUS CARD
========================================================= */

function DeliveryStatusCard({
  icon: Icon,
  title,
  count,
  description,
}) {
  return (
    <div className="rounded-xl border border-black/[0.07] bg-[#fafafa] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-black/45">
            {title}
          </p>

          <p className="mt-1 text-xl font-semibold">
            {count}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-black/40">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalyticsPage() {
  const router = useRouter();

  const [range, setRange] = useState("30 Days");

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [exporting, setExporting] =
    useState(false);

  /* =======================================================
     LOAD ANALYTICS
  ======================================================= */

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const headers = getHeaders();

      const [
        ordersResponse,
        customersResponse,
        dashboardResponse,
      ] = await Promise.allSettled([
        fetch(`${API_URL}/orders/admin/`, {
          method: "GET",
          headers,
        }),

        fetch(
          `${API_URL}/users/admin/customers/`,
          {
            method: "GET",
            headers,
          }
        ),

        fetch(
          `${API_URL}/orders/admin/dashboard/`,
          {
            method: "GET",
            headers,
          }
        ),
      ]);

      let loadedOrders = [];
      let loadedCustomers = [];
      let loadedDashboard = null;

      if (
        ordersResponse.status ===
          "fulfilled" &&
        ordersResponse.value.ok
      ) {
        const data =
          await ordersResponse.value.json();

        loadedOrders = getResults(data);
      }

      if (
        customersResponse.status ===
          "fulfilled" &&
        customersResponse.value.ok
      ) {
        const data =
          await customersResponse.value.json();

        loadedCustomers = getResults(data);
      }

      if (
        dashboardResponse.status ===
          "fulfilled" &&
        dashboardResponse.value.ok
      ) {
        loadedDashboard =
          await dashboardResponse.value.json();
      }

      if (loadedOrders.length === 0) {
        if (
          ordersResponse.status ===
            "fulfilled" &&
          !ordersResponse.value.ok
        ) {
          const data =
            await ordersResponse.value
              .json()
              .catch(() => ({}));

          throw new Error(
            data?.detail ||
              data?.error ||
              "Unable to load admin orders."
          );
        }
      }

      setOrders(loadedOrders);
      setCustomers(loadedCustomers);
      setDashboard(loadedDashboard);
    } catch (err) {
      console.error(
        "Analytics loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     PERIOD ORDERS
  ======================================================= */

  const periodOrders = useMemo(() => {
    const startDate =
      getPeriodStart(range);

    return orders.filter((order) => {
      const rawDate =
        getOrderDate(order);

      if (!rawDate) {
        return false;
      }

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return date >= startDate;
    });
  }, [orders, range]);

  /* =======================================================
     COMPLETED ORDERS
  ======================================================= */

  const completedOrders = useMemo(() => {
    return periodOrders.filter(
      isCompletedOrder
    );
  }, [periodOrders]);

  /* =======================================================
     TOTAL REVENUE
  ======================================================= */

  const totalRevenue = useMemo(() => {
    return completedOrders.reduce(
      (total, order) =>
        total + getOrderAmount(order),
      0
    );
  }, [completedOrders]);
  

  /* =======================================================
     TOTAL ORDERS
  ======================================================= */

  const totalOrders =
    completedOrders.length;

  /* =======================================================
     ITEMS SOLD
  ======================================================= */

  const totalItemsSold = useMemo(() => {
    return completedOrders.reduce(
      (total, order) => {
        const items = Array.isArray(
          order?.items
        )
          ? order.items
          : [];

        return (
          total +
          items.reduce(
            (sum, item) =>
              sum +
              getItemQuantity(item),
            0
          )
        );
      },
      0
    );
  }, [completedOrders]);

  /* =======================================================
     DELIVERY FEES
  ======================================================= */

  const totalDeliveryFees = useMemo(() => {
    return completedOrders.reduce(
      (total, order) =>
        total + getDeliveryFee(order),
      0
    );
  }, [completedOrders]);
  const netSales = Math.max(
  0,
  totalRevenue - totalDeliveryFees
);

  /* =======================================================
     TOTAL DISCOUNTS
  ======================================================= */

  const totalDiscounts = useMemo(() => {
    return completedOrders.reduce(
      (total, order) =>
        total +
        getDiscountInfo(order).amount,
      0
    );
  }, [completedOrders]);

  /* =======================================================
     CUSTOMERS
  ======================================================= */

  const totalCustomers = useMemo(() => {
    if (customers.length > 0) {
      return customers.length;
    }

    if (dashboard) {
      return Number(
        dashboard?.total_customers ??
          dashboard?.customers ??
          dashboard?.customer_count ??
          0
      );
    }

    return 0;
  }, [customers, dashboard]);

  /* =======================================================
     AVERAGE ORDER VALUE
  ======================================================= */

  const averageOrderValue =
    totalOrders > 0
      ? totalRevenue / totalOrders
      : 0;

  /* =======================================================
     DELIVERY STATUS
  ======================================================= */

  const deliveryStats = useMemo(() => {
    const stats = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
    };

    periodOrders.forEach((order) => {
      const status =
        getOrderStatus(order);

      if (
        [
          "pending",
          "pending_payment",
          "awaiting_payment",
        ].includes(status)
      ) {
        stats.pending += 1;
      } else if (
        [
          "processing",
          "confirmed",
          "paid",
        ].includes(status)
      ) {
        stats.processing += 1;
      } else if (
        status === "shipped"
      ) {
        stats.shipped += 1;
      } else if (
        status === "delivered"
      ) {
        stats.delivered += 1;
      }
    });

    return stats;
  }, [periodOrders]);

  /* =======================================================
     REVENUE CHART
  ======================================================= */

  const chartData = useMemo(() => {
    const now = new Date();

    if (range === "12 Months") {
      const months = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - i,
          1
        );

        months.push({
          key: `${date.getFullYear()}-${date.getMonth()}`,
          label: date.toLocaleDateString(
            "en-NG",
            {
              month: "short",
            }
          ),
          revenue: 0,
          orders: 0,
        });
      }

      completedOrders.forEach((order) => {
        const rawDate =
          getOrderDate(order);

        if (!rawDate) return;

        const date = new Date(rawDate);

        if (Number.isNaN(date.getTime())) {
          return;
        }

        const key = `${date.getFullYear()}-${date.getMonth()}`;

        const month = months.find(
          (item) => item.key === key
        );

        if (month) {
          month.revenue +=
            getOrderAmount(order);

          month.orders += 1;
        }
      });

      return months;
    }

    const days =
      range === "7 Days" ? 7 : 30;

    const result = [];

    for (
      let i = days - 1;
      i >= 0;
      i--
    ) {
      const date = new Date(now);

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - i
      );

      result.push({
        key: getDateKey(date),

        label:
          days === 30
            ? date.toLocaleDateString(
                "en-NG",
                {
                  day: "numeric",
                  month: "short",
                }
              )
            : date.toLocaleDateString(
                "en-NG",
                {
                  weekday: "short",
                }
              ),

        revenue: 0,
        orders: 0,
      });
    }

    completedOrders.forEach((order) => {
      const rawDate =
        getOrderDate(order);

      if (!rawDate) return;

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = getDateKey(date);

      const day = result.find(
        (item) => item.key === key
      );

      if (day) {
        day.revenue +=
          getOrderAmount(order);

        day.orders += 1;
      }
    });

    return result;
  }, [completedOrders, range]);

  const maxRevenue = Math.max(
    ...chartData.map(
      (item) => item.revenue
    ),
    1
  );

  /* =======================================================
     TOP PRODUCTS
  ======================================================= */

  const topProducts = useMemo(() => {
    const productMap = {};

    completedOrders.forEach((order) => {
      const items = Array.isArray(
        order?.items
      )
        ? order.items
        : [];

      items.forEach((item) => {
        const name =
          getProductName(item);

        if (!productMap[name]) {
          productMap[name] = {
            name,
            category:
              getProductCategory(item),
            sales: 0,
            revenue: 0,
          };
        }

        productMap[name].sales +=
          getItemQuantity(item);

        productMap[name].revenue +=
          getItemSubtotal(item);
      });
    });

    return Object.values(productMap)
      .sort(
        (a, b) =>
          b.revenue - a.revenue
      )
      .slice(0, 5);
  }, [completedOrders]);

  /* =======================================================
     CATEGORY DATA
  ======================================================= */

  const categoryData = useMemo(() => {
    const categoryMap = {};

    completedOrders.forEach((order) => {
      const items = Array.isArray(
        order?.items
      )
        ? order.items
        : [];

      items.forEach((item) => {
        const category =
          getProductCategory(item);

        if (!categoryMap[category]) {
          categoryMap[category] = 0;
        }

        categoryMap[category] +=
          getItemSubtotal(item);
      });
    });

    const total = Object.values(
      categoryMap
    ).reduce(
      (sum, value) => sum + value,
      0
    );

    return Object.entries(categoryMap)
      .map(([name, revenue]) => ({
        name,
        revenue,
        percentage:
          total > 0
            ? Math.round(
                (revenue / total) * 100
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.revenue - a.revenue
      )
      .slice(0, 6);
  }, [completedOrders]);

  /* =======================================================
     RECENT SALES
  ======================================================= */

  const recentSales = useMemo(() => {
    return [...completedOrders]
      .sort((a, b) => {
        const dateA = new Date(
          getOrderDate(a) || 0
        );

        const dateB = new Date(
          getOrderDate(b) || 0
        );

        return dateB - dateA;
      })
      .slice(0, 5)
      .map((order) => {
        const firstItem =
          Array.isArray(order?.items)
            ? order.items[0]
            : null;

        const userName = [
          order?.user?.first_name,
          order?.user?.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        const customer =
          order?.full_name ||
          userName ||
          order?.customer?.name ||
          order?.email ||
          "Customer";

        const date = getOrderDate(
          order
        )
          ? new Date(
              getOrderDate(order)
            )
          : null;

        const discount =
          getDiscountInfo(order);

        return {
          id:
            order?.order_number ||
            `#${order?.id || "N/A"}`,

          customer,

          product:
            getProductName(firstItem),

          amount:
            getOrderAmount(order),

          discount:
            discount.label,

          coupon:
            order?.coupon_code || "",

          delivery:
            getDeliveryFee(order),

          status:
            order?.status || "N/A",

          date: date
            ? date.toLocaleDateString(
                "en-NG",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              )
            : "N/A",
        };
      });
  }, [completedOrders]);

  /* =======================================================
     NEW VS RETURNING
  ======================================================= */

  const newVsReturning = useMemo(() => {
    const uniqueCustomers = {};

    completedOrders.forEach((order) => {
      const key =
        order?.email ||
        order?.user?.id ||
        order?.user?.email ||
        order?.full_name ||
        `order-${order?.id}`;

      if (!uniqueCustomers[key]) {
        uniqueCustomers[key] = 0;
      }

      uniqueCustomers[key] += 1;
    });

    let newCustomers = 0;
    let returningCustomers = 0;

    Object.values(
      uniqueCustomers
    ).forEach((count) => {
      if (count > 1) {
        returningCustomers += 1;
      } else {
        newCustomers += 1;
      }
    });

    const total =
      newCustomers +
      returningCustomers;

    return [
      {
        label: "New Customers",
        value: newCustomers,
        percentage:
          total > 0
            ? Math.round(
                (newCustomers /
                  total) *
                  100
              )
            : 0,
      },

      {
        label: "Returning Customers",
        value: returningCustomers,
        percentage:
          total > 0
            ? Math.round(
                (returningCustomers /
                  total) *
                  100
              )
            : 0,
      },
    ];
  }, [completedOrders]);

  const totalCategoryRevenue =
    categoryData.reduce(
      (sum, category) =>
        sum + category.revenue,
      0
    );

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function handleViewOrders() {
    router.push("/admin/orders");
  }

  /* =======================================================
     EXPORT
  ======================================================= */

  function handleExportReport() {
    try {
      setExporting(true);

      const rows = [
        [
          "Order",
          "Customer",
          "Items Sold",
          "Amount",
          "Discount",
          "Coupon Code",
          "Delivery Fee",
          "Status",
          "Payment Status",
          "Date",
        ],
      ];

      completedOrders.forEach((order) => {
        const items = Array.isArray(
          order?.items
        )
          ? order.items
          : [];

        const itemsSold =
          items.reduce(
            (sum, item) =>
              sum +
              getItemQuantity(item),
            0
          );

        const discount =
          getDiscountInfo(order);

        rows.push([
          order?.order_number ||
            order?.id ||
            "",

          order?.full_name ||
            order?.email ||
            "Customer",

          itemsSold,

          getOrderAmount(order),

          discount.label,

          order?.coupon_code || "",

          getDeliveryFee(order),

          order?.status || "",

          order?.payment_status || "",

          getOrderDate(order)
            ? new Date(
                getOrderDate(order)
              ).toLocaleDateString(
                "en-NG"
              )
            : "",
        ]);
      });

      const csv = rows
        .map((row) =>
          row
            .map((value) => {
              const stringValue =
                String(value ?? "");

              return `"${stringValue.replace(
                /"/g,
                '""'
              )}"`;
            })
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download = `orentemist-analytics-${range
        .toLowerCase()
        .replace(" ", "-")}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Export error:",
        err
      );
    } finally {
      setExporting(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] text-black">
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-7 h-10 w-24 animate-pulse rounded-xl bg-black/10" />

          <div className="mb-7">
            <div className="h-4 w-28 animate-pulse rounded bg-black/10" />

            <div className="mt-3 h-10 w-52 animate-pulse rounded bg-black/10" />

            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-black/10" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              )
            )}
          </div>

          <div className="mt-5 h-[400px] animate-pulse rounded-2xl bg-white shadow-sm" />

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />

            <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
          </div>
        </main>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        {/* BACK BUTTON */}

        <button
          onClick={() =>
            window.history.back()
          }
          className="mb-5 flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>

            <button
              onClick={loadAnalytics}
              className="w-fit rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* HEADER */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-black/45">
              <BarChart3 size={16} />

              <span>Admin</span>

              <span>/</span>

              <span>Analytics</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Store Analytics
            </h1>

            <p className="mt-2 text-sm text-black/50">
              Monitor sales, products, customers,
              discounts and deliveries from one
              place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleExportReport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />

              {exporting
                ? "Exporting..."
                : "Export Report"}
            </button>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50"
              />

              <select
                value={range}
                onChange={(e) =>
                  setRange(e.target.value)
                }
                className="w-full appearance-none rounded-xl border border-black/10 bg-white py-3 pl-10 pr-10 text-sm font-medium outline-none transition focus:border-black sm:w-[170px]"
              >
                <option>7 Days</option>
                <option>30 Days</option>
                <option>12 Months</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/50"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN STATS
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">

          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={formatCurrency(
              totalRevenue
            )}
            change={null}
            description={`Revenue from completed orders in ${range.toLowerCase()}`}
          />

          <StatCard
            icon={ShoppingCart}
            title="Total Orders"
            value={totalOrders.toLocaleString()}
            change={null}
            description={`Completed orders in ${range.toLowerCase()}`}
          />

          <StatCard
            icon={Package}
            title="Items Sold"
            value={totalItemsSold.toLocaleString()}
            change={null}
            description={`Products sold in ${range.toLowerCase()}`}
          />

          <StatCard
            icon={Tag}
            title="Discounts"
            value={formatCurrency(
              totalDiscounts
            )}
            change={null}
            description={`Discounts applied in ${range.toLowerCase()}`}
          />

          <StatCard
            icon={Truck}
            title="Delivery Fees"
            value={formatCurrency(
              totalDeliveryFees
            )}
            change={null}
            description="Delivery fees collected from orders"
          />
<StatCard
  icon={DollarSign}
  title="Net Sales"
  value={formatCurrency(netSales)}
  change={null}
  description="Sales excluding delivery fees"
/>
        </div>

        {/* =================================================
            AVERAGE ORDER VALUE
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-black/40">
                Average Order Value
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                {formatCurrency(
                  averageOrderValue
                )}
              </h2>

              <p className="mt-2 text-sm text-black/45">
                Average revenue generated per
                completed order.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        {/* =================================================
            REVENUE CHART
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Revenue Overview
              </h2>

              <p className="mt-1 text-sm text-black/45">
                Revenue performance for the selected
                period.
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-black/40">
                Total Revenue
              </p>

              <p className="text-lg font-semibold">
                {formatCurrency(
                  totalRevenue
                )}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative h-[300px]">

              <div className="absolute inset-0 flex flex-col justify-between">
                {[100, 75, 50, 25, 0].map(
                  (value) => (
                    <div
                      key={value}
                      className="flex items-center gap-3"
                    >
                      <span className="w-12 text-right text-[10px] text-black/35">
                        {formatCompactCurrency(
                          (maxRevenue *
                            value) /
                            100
                        )}
                      </span>

                      <div className="h-px flex-1 bg-black/[0.07]" />
                    </div>
                  )
                )}
              </div>

              <div className="absolute bottom-0 left-[58px] right-0 top-0 flex items-end justify-between gap-1 sm:gap-2">

                {chartData.map(
                  (item) => {
                    const height =
                      maxRevenue > 0
                        ? (item.revenue /
                            maxRevenue) *
                          100
                        : 0;

                    return (
                      <div
                        key={item.key}
                        className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                      >
                        <div className="relative flex h-[calc(100%-25px)] w-full items-end justify-center">

                          <div
                            className="w-full max-w-[52px] rounded-t-lg bg-black transition-all duration-300 group-hover:bg-black/75"
                            style={{
                              height: `${Math.max(
                                height,
                                item.revenue >
                                  0
                                  ? 4
                                  : 0
                              )}%`,
                            }}
                          >
                            {item.revenue >
                              0 && (
                              <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2 py-1 text-[10px] text-white group-hover:block">
                                {formatCompactCurrency(
                                  item.revenue
                                )}
                              </div>
                            )}
                          </div>

                        </div>

                        <span className="mt-2 max-w-full truncate text-[9px] text-black/40 sm:text-xs">
                          {item.label}
                        </span>
                      </div>
                    );
                  }
                )}

              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            DELIVERY OVERVIEW
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Delivery Overview
              </h2>

              <p className="mt-1 text-sm text-black/45">
                Understand where your orders currently
                are.
              </p>
            </div>

            <button
              onClick={handleViewOrders}
              className="self-start text-xs font-semibold underline underline-offset-4"
            >
              Manage Orders
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <DeliveryStatusCard
              icon={Clock3}
              title="Pending"
              count={deliveryStats.pending}
              description="Orders waiting to be processed."
            />

            <DeliveryStatusCard
              icon={Loader2}
              title="Processing"
              count={
                deliveryStats.processing
              }
              description="Orders being prepared for delivery."
            />

            <DeliveryStatusCard
              icon={PackageCheck}
              title="Shipped"
              count={
                deliveryStats.shipped
              }
              description="Orders handed over for delivery."
            />

            <DeliveryStatusCard
              icon={CheckCircle2}
              title="Delivered"
              count={
                deliveryStats.delivered
              }
              description="Orders successfully delivered."
            />

          </div>
        </div>

        {/* =================================================
            ORDERS PERFORMANCE + CUSTOMER INSIGHTS
        ================================================= */}

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">

          {/* ORDERS PERFORMANCE */}

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Orders Performance
                </h2>

                <p className="mt-1 text-sm text-black/45">
                  Orders placed during this period.
                </p>
              </div>

              <ShoppingCart
                size={20}
                className="text-black/30"
              />
            </div>

            <div className="mt-7 space-y-5">

              {chartData.length === 0 ? (
                <p className="text-sm text-black/40">
                  No order data available.
                </p>
              ) : (
                chartData.map((item) => {
                  const maxOrders =
                    Math.max(
                      ...chartData.map(
                        (entry) =>
                          entry.orders
                      ),
                      1
                    );

                  const width =
                    maxOrders > 0
                      ? (item.orders /
                          maxOrders) *
                        100
                      : 0;

                  return (
                    <div
                      key={item.key}
                    >
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium">
                          {item.label}
                        </span>

                        <span className="text-black/45">
                          {item.orders} orders
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full rounded-full bg-black transition-all"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}

            </div>
          </div>

          {/* CUSTOMER INSIGHTS */}

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">

            <div>
              <h2 className="text-lg font-semibold">
                Customer Insights
              </h2>

              <p className="mt-1 text-sm text-black/45">
                New vs returning customers.
              </p>
            </div>

            <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row">

              <div
                className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
                style={{
                  background:
                    `conic-gradient(#000 0deg ${
                      newVsReturning[0]
                        .percentage * 3.6
                    }deg, #e5e5e5 ${
                      newVsReturning[0]
                        .percentage * 3.6
                    }deg 360deg)`,
                }}
              >
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-semibold">
                    {totalCustomers}
                  </span>

                  <span className="text-[10px] text-black/40">
                    Customers
                  </span>
                </div>
              </div>

              <div className="w-full space-y-5">

                {newVsReturning.map(
                  (item, index) => (
                    <div
                      key={item.label}
                    >
                      <div className="flex items-center gap-2">

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            index === 0
                              ? "bg-black"
                              : "bg-black/15"
                          }`}
                        />

                        <span className="text-sm">
                          {item.label}
                        </span>
                      </div>

                      <div className="mt-1 flex items-baseline gap-2">

                        <span className="text-xl font-semibold">
                          {item.value}
                        </span>

                        <span className="text-xs text-black/40">
                          {item.percentage}%
                        </span>

                      </div>
                    </div>
                  )
                )}

              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            TOP PRODUCTS + CATEGORY
        ================================================= */}

        <div className="mt-5 grid gap-5 xl:grid-cols-2">

          {/* TOP PRODUCTS */}

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Top Products
                </h2>

                <p className="mt-1 text-sm text-black/45">
                  Products generating the most sales.
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                className="text-xs font-semibold underline underline-offset-4"
              >
                View All
              </button>

            </div>

            <div className="mt-6 space-y-4">

              {topProducts.length === 0 ? (
                <div className="rounded-xl border border-black/[0.06] p-5 text-center text-sm text-black/40">
                  No product sales available
                  for this period.
                </div>
              ) : (
                topProducts.map(
                  (product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center gap-3 rounded-xl border border-black/[0.06] p-3"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-semibold text-white">
                        {index + 1}
                      </div>

                      <div className="flex min-w-0 flex-1 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1f1f1]">
                          <ShoppingBag
                            size={18}
                            className="text-black/45"
                          />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-black/40">
                            {product.category}
                          </p>

                          <p className="mt-1 text-xs font-medium text-black/60">
                            {product.sales} items sold
                          </p>

                        </div>
                      </div>

                      <div className="shrink-0 text-right">

                        <p className="text-sm font-semibold">
                          {formatCompactCurrency(
                            product.revenue
                          )}
                        </p>

                        <p className="mt-1 text-[10px] text-black/40">
                          Revenue
                        </p>

                      </div>

                    </div>
                  )
                )
              )}

            </div>
          </div>

          {/* SALES BY CATEGORY */}

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">

            <div>
              <h2 className="text-lg font-semibold">
                Sales by Category
              </h2>

              <p className="mt-1 text-sm text-black/45">
                Revenue distribution across categories.
              </p>
            </div>

            <div className="mt-7 space-y-6">

              {categoryData.length === 0 ? (
                <div className="rounded-xl bg-[#f7f7f7] p-5 text-center text-sm text-black/40">
                  No category sales available.
                </div>
              ) : (
                categoryData.map(
                  (category) => (
                    <div
                      key={category.name}
                    >

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-sm font-medium">
                          {category.name}
                        </span>

                        <div className="text-right">

                          <span className="text-sm font-semibold">
                            {category.percentage}%
                          </span>

                          <span className="ml-2 text-xs text-black/40">
                            {formatCompactCurrency(
                              category.revenue
                            )}
                          </span>

                        </div>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-black/5">

                        <div
                          className="h-full rounded-full bg-black"
                          style={{
                            width: `${category.percentage}%`,
                          }}
                        />

                      </div>
                    </div>
                  )
                )
              )}

            </div>

            <div className="mt-8 rounded-xl bg-[#f7f7f7] p-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-black/50">
                  Total Category Revenue
                </span>

                <span className="text-base font-semibold">
                  {formatCompactCurrency(
                    totalCategoryRevenue
                  )}
                </span>

              </div>

            </div>
          </div>
        </div>

        {/* =================================================
            RECENT SALES
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Recent Sales
              </h2>

              <p className="mt-1 text-sm text-black/45">
                Latest completed orders, including
                discounts and delivery fees.
              </p>
            </div>

            <button
              onClick={handleViewOrders}
              className="self-start text-xs font-semibold underline underline-offset-4"
            >
              View All Orders
            </button>

          </div>

          {/* DESKTOP */}

          <div className="mt-6 hidden overflow-x-auto md:block">

            {recentSales.length === 0 ? (
              <div className="py-10 text-center text-sm text-black/40">
                No recent sales available.
              </div>
            ) : (
              <table className="w-full min-w-[1050px]">

                <thead>
                  <tr className="border-b border-black/[0.07] text-left">

                    <th className="pb-3 text-xs font-medium text-black/40">
                      Order
                    </th>

                    <th className="pb-3 text-xs font-medium text-black/40">
                      Customer
                    </th>

                    <th className="pb-3 text-xs font-medium text-black/40">
                      Product
                    </th>

                    <th className="pb-3 text-xs font-medium text-black/40">
                      Discount
                    </th>

                    <th className="pb-3 text-xs font-medium text-black/40">
                      Delivery
                    </th>

                    <th className="pb-3 text-xs font-medium text-black/40">
                      Date
                    </th>

                    <th className="pb-3 text-right text-xs font-medium text-black/40">
                      Amount
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {recentSales.map(
                    (sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-black/[0.05] last:border-0"
                      >

                        <td className="py-4 text-sm font-semibold">
                          {sale.id}
                        </td>

                        <td className="py-4">

                          <div className="flex items-center gap-3">

                            <Avatar
                              name={
                                sale.customer
                              }
                            />

                            <span className="text-sm">
                              {sale.customer}
                            </span>

                          </div>
                        </td>

                        <td className="py-4 text-sm text-black/60">
                          {sale.product}
                        </td>

                        <td className="py-4">

                          <div>
                            <p
                              className={`text-sm ${
                                sale.discount ===
                                "None"
                                  ? "text-black/40"
                                  : "font-semibold text-black"
                              }`}
                            >
                              {sale.discount}
                            </p>

                            {sale.coupon && (
                              <p className="mt-1 text-[10px] uppercase tracking-wide text-black/35">
                                {sale.coupon}
                              </p>
                            )}
                          </div>

                        </td>

                        <td className="py-4 text-sm text-black/60">
                          {sale.delivery > 0
                            ? formatCurrency(
                                sale.delivery
                              )
                            : "Free"}
                        </td>

                        <td className="py-4 text-sm text-black/50">
                          {sale.date}
                        </td>

                        <td className="py-4 text-right text-sm font-semibold">
                          {formatCurrency(
                            sale.amount
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>
            )}

          </div>

          {/* MOBILE */}

          <div className="mt-5 space-y-3 md:hidden">

            {recentSales.length === 0 ? (
              <div className="py-10 text-center text-sm text-black/40">
                No recent sales available.
              </div>
            ) : (
              recentSales.map(
                (sale) => (
                  <div
                    key={sale.id}
                    className="rounded-xl border border-black/[0.07] p-4"
                  >

                    <div className="flex items-center gap-3">

                      <Avatar
                        name={
                          sale.customer
                        }
                      />

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold">
                          {sale.customer}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {sale.id} ·{" "}
                          {sale.date}
                        </p>

                      </div>

                      <p className="text-sm font-semibold">
                        {formatCurrency(
                          sale.amount
                        )}
                      </p>

                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-3">

                      <div>
                        <p className="text-xs text-black/40">
                          Product
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {sale.product}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-black/40">
                          Discount
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {sale.discount}
                        </p>

                        {sale.coupon && (
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-black/35">
                            {sale.coupon}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-black/40">
                          Delivery
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {sale.delivery > 0
                            ? formatCurrency(
                                sale.delivery
                              )
                            : "Free"}
                        </p>
                      </div>

                    </div>

                  </div>
                )
              )
            )}

          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-black/10 bg-black p-5 text-white shadow-sm sm:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-xs uppercase tracking-wider text-white/45">
                Store Summary
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {totalItemsSold.toLocaleString()} items sold
              </h2>

              <p className="mt-2 max-w-xl text-sm text-white/50">
                You generated{" "}
                {formatCurrency(
                  totalRevenue
                )}{" "}
                from{" "}
                {totalOrders.toLocaleString()}{" "}
                completed orders during the selected
                period, with{" "}
                {formatCurrency(
                  totalDiscounts
                )}{" "}
                in discounts applied.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] text-white/45">
                  Items Sold
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {totalItemsSold.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] text-white/45">
                  Discounts
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCompactCurrency(
                    totalDiscounts
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] text-white/45">
                  Delivery Fees
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCompactCurrency(
                    totalDeliveryFees
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] text-white/45">
                  Delivered
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {deliveryStats.delivered}
                </p>
              </div>

            </div>

          </div>
        </div>

      </main>
    </div>
  );
}