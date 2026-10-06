"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import {
  API_URL,
  fetchWithAdminAuth,
  getCsrfToken,
} from "@/lib/adminAuth";
import {
  Search,
  Bell,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Truck,
  PackageCheck,
  X,
  ShoppingBag,
} from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [markingPickupId, setMarkingPickupId] = useState(null);

  /*
   * Convert the backend order into the
   * format used by this page.
   */
  const formatOrder = (order) => {
    const customerName =
      order.full_name ||
      order.customer_name ||
      order.name ||
      (
        `${order.first_name || ""} ${
          order.last_name || ""
        }`
      ).trim() ||
      order.email ||
      "Guest Customer";

    const orderNumber =
      order.order_number ||
      order.order_no ||
      order.number ||
      `#${order.id}`;

    const amount = Number(
      order.total_amount ??
        order.total ??
        order.amount ??
        0
    );

    const paymentStatus =
      order.payment_status ||
      order.payment ||
      "pending";

    const orderStatus =
      order.status ||
      "pending";

    let itemCount = 0;

    if (Array.isArray(order.items)) {
      itemCount = order.items.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 1),
        0
      );
    } else if (
      Array.isArray(order.order_items)
    ) {
      itemCount =
        order.order_items.reduce(
          (total, item) =>
            total +
            Number(item.quantity || 1),
          0
        );
    } else {
      itemCount = Number(
        order.item_count ||
          order.items_count ||
          order.quantity ||
          0
      );
    }

    return {
      ...order,
      id: order.id,
      orderNumber,
      customerName,
      email:
        order.email ||
        order.customer_email ||
        "",
      date:
        order.created_at ||
        order.created ||
        order.date ||
        null,
      items: itemCount,
      amount,
      paymentStatus,
      orderStatus,
    };
  };
/*
 * Load ALL real orders from Django.
 * The API is paginated, so keep following "next"
 * until every order has been loaded.
 */
const fetchOrders = async () => {
  try {
    setLoading(true);
    setError("");

    let allOrders = [];
    let nextUrl = `${API_URL}/orders/admin/`;

    while (nextUrl) {
      const response = await fetchWithAdminAuth(
        nextUrl,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Orders API returned ${response.status}`
        );
      }

      const data =
        await response.json();

      /*
       * DRF pagination returns:
       *
       * {
       *   count: 150,
       *   next: "...?page=2",
       *   previous: null,
       *   results: [...]
       * }
       */

      const pageOrders =
        Array.isArray(data.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

      allOrders = [
        ...allOrders,
        ...pageOrders,
      ];

      /*
       * Continue to the next page until
       * Django returns next: null.
       */
      nextUrl = data.next || null;
    }

    const formattedOrders =
      allOrders.map(formatOrder);

    setOrders(formattedOrders);

  } catch (err) {
    console.error(
      "ORDERS API ERROR:",
      err
    );

    setError(
      "Unable to load orders. Please try again."
    );

  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchOrders();
  }, []);

  /*
   * Normalize status values.
   */
  const normalizeStatus = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  /*
   * Format status for display.
   */
  const displayStatus = (value) => {
    const normalized =
      normalizeStatus(value);

    const statusMap = {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      canceled: "Cancelled",
      paid: "Paid",
      failed: "Failed",
      refunded: "Refunded",
    };

    if (statusMap[normalized]) {
      return statusMap[normalized];
    }

    if (!value) {
      return "Pending";
    }

    return (
      String(value)
        .charAt(0)
        .toUpperCase() +
      String(value)
        .slice(1)
        .toLowerCase()
    );
  };

  /*
   * Search + status filtering.
   */
  const filteredOrders = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim();

    return orders.filter((order) => {
      const orderNumber =
        String(
          order.orderNumber || ""
        ).toLowerCase();

      const customer =
        String(
          order.customerName || ""
        ).toLowerCase();

      const email =
        String(
          order.email || ""
        ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        orderNumber.includes(
          searchValue
        ) ||
        customer.includes(
          searchValue
        ) ||
        email.includes(
          searchValue
        );

      const currentStatus =
        normalizeStatus(
          order.orderStatus
        );

      let matchesStatus = true;

      if (status !== "All") {
        const selectedStatus =
          normalizeStatus(status);

        matchesStatus =
          currentStatus ===
          selectedStatus;
      }

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [orders, search, status]);

  /*
   * Statistics from REAL orders.
   */
  const statistics = useMemo(() => {
    const total = orders.length;

    const pending =
      orders.filter(
        (order) =>
          normalizeStatus(
            order.orderStatus
          ) === "pending"
      ).length;

    const processing =
      orders.filter(
        (order) =>
          normalizeStatus(
            order.orderStatus
          ) === "processing"
      ).length;

    const delivered =
      orders.filter(
        (order) =>
          normalizeStatus(
            order.orderStatus
          ) === "delivered"
      ).length;

    return {
      total,
      pending,
      processing,
      delivered,
    };
  }, [orders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(Number(amount || 0));
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-NG",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const handleViewOrder = (order) => {
    if (!order.id) {
      return;
    }

    router.push(
      `/admin/orders/${order.id}`
    );
  };

  const canMarkPickupReady = (order) => {
    return (
      order.delivery_method === "pickup" &&
      normalizeStatus(order.orderStatus) === "processing" &&
      normalizeStatus(order.paymentStatus) === "paid"
    );
  };

  const markPickupReady = async (order) => {
    if (!canMarkPickupReady(order)) return;

    const confirmed = window.confirm(
      "Mark this order as ready for pickup? The customer will receive the pickup-ready email."
    );

    if (!confirmed) return;

    try {
      setMarkingPickupId(order.id);
      setError("");

      const csrfToken = await getCsrfToken();
      const response = await fetchWithAdminAuth(
        `${API_URL}/orders/admin/${order.id}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ status: "shipped" }),
        }
      );

      if (!response) {
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.status?.[0] ||
            data?.detail ||
            "Unable to mark the order ready for pickup."
        );
      }

      await fetchOrders();
    } catch (err) {
      console.error("PICKUP READY ERROR:", err);
      setError(
        err.message ||
          "Unable to mark the order ready for pickup."
      );
    } finally {
      setMarkingPickupId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">
      <AdminSidebar />

      <main className="lg:ml-[250px]">
        <div className="pt-16 lg:pt-0">

          {/* HEADER */}
          <header className="flex h-[82px] items-center justify-between border-b border-black/10 bg-white px-5 sm:px-8">
            <div>
              <p className="text-xs text-black/40">
                ORENTEMIST ADMIN
              </p>

              <h2 className="text-xl font-semibold">
                Orders
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-xl border border-black/10 p-3 sm:block">
                <Search size={18} />
              </button>

              <button className="rounded-xl border border-black/10 p-3">
                <Bell size={18} />
              </button>

              <button className="rounded-xl border border-black/10 p-3">
                <MessageCircle size={18} />
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="p-5 sm:p-8">

            {/* TITLE */}
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-2 text-xs text-black/40">
                <span>Dashboard</span>

                <ChevronRight size={13} />

                <span>Orders</span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight">
                Orders
              </h1>

              <p className="mt-1 text-sm text-black/45">
                Manage and track all ORENTEMIST customer orders.
              </p>
            </div>

            {/* STATS */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MiniCard
                label="Total Orders"
                value={statistics.total.toLocaleString()}
              />

              <MiniCard
                label="Pending"
                value={statistics.pending.toLocaleString()}
              />

              <MiniCard
                label="Processing"
                value={statistics.processing.toLocaleString()}
              />

              <MiniCard
                label="Delivered"
                value={statistics.delivered.toLocaleString()}
              />
            </div>

            {/* ORDERS */}
            <div className="rounded-2xl border border-black/10 bg-white">

              {/* FILTER BAR */}
              <div className="border-b border-black/10 p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                  {/* SEARCH */}
                  <div className="relative w-full xl:max-w-[380px]">
                    <Search
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                    />

                    <input
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search order, customer..."
                      className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-11 pr-10 text-base outline-none transition focus:border-black/30 sm:text-sm"
                    />

                    {search && (
                      <button
                        onClick={() =>
                          setSearch("")
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* FILTER */}
                  <div className="flex flex-wrap gap-3">
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) =>
                          setStatus(
                            e.target.value
                          )
                        }
                        className="h-11 appearance-none rounded-xl border border-black/10 bg-white pl-4 pr-10 text-base outline-none sm:text-sm"
                      >
                        <option value="All">
                          All
                        </option>

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Confirmed">
                          Confirmed
                        </option>

                        <option value="Processing">
                          Processing
                        </option>

                        <option value="Shipped">
                          Shipped
                        </option>

                        <option value="Delivered">
                          Delivered
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>
                      </select>

                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
                      />
                    </div>

                    <button className="flex h-11 items-center gap-2 rounded-xl border border-black/10 px-4 text-sm">
                      <Truck size={15} />
                      Delivery
                    </button>
                  </div>
                </div>
              </div>

              {/* LOADING */}
              {loading && (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black" />

                  <p className="mt-4 text-sm text-black/40">
                    Loading orders...
                  </p>
                </div>
              )}

              {/* ERROR */}
              {!loading && error && (
                <div className="px-6 py-16 text-center">
                  <ShoppingBag
                    size={35}
                    className="mx-auto mb-4 text-red-300"
                  />

                  <h3 className="font-medium">
                    Unable to load orders
                  </h3>

                  <p className="mt-1 text-sm text-black/40">
                    {error}
                  </p>

                  <button
                    onClick={fetchOrders}
                    className="mt-5 rounded-xl bg-black px-5 py-3 text-sm text-white"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* ORDERS */}
              {!loading && !error && (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1050px]">
                      <thead>
                        <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-black/40">
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
                            Items
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Amount
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Payment
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Status
                          </th>

                          <th className="px-6 py-4 text-right font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredOrders.map(
                          (order) => (
                            <tr
                              key={order.id}
                              className="border-b border-black/5 transition hover:bg-black/[0.02]"
                            >
                              <td className="px-6 py-5">
                                <p className="font-medium">
                                  {
                                    order.orderNumber
                                  }
                                </p>

                                <p className="mt-1 text-xs text-black/40">
                                  ORENTEMIST Store
                                </p>
                              </td>

                              <td className="px-6 py-5">
                                <p className="text-sm font-medium">
                                  {
                                    order.customerName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-black/40">
                                  {order.email ||
                                    "—"}
                                </p>
                              </td>

                              <td className="px-6 py-5 text-sm text-black/60">
                                {formatDate(
                                  order.date
                                )}
                              </td>

                              <td className="px-6 py-5 text-sm">
                                {order.items ||
                                  0}
                              </td>

                              <td className="px-6 py-5 text-sm font-medium">
                                {formatCurrency(
                                  order.amount
                                )}
                              </td>

                              <td className="px-6 py-5">
                                <PaymentBadge
                                  status={displayStatus(
                                    order.paymentStatus
                                  )}
                                />
                              </td>

                              <td className="px-6 py-5">
                                <OrderStatus
                                  status={displayStatus(
                                    order.orderStatus
                                  )}
                                />
                              </td>

                              <td className="relative px-6 py-5 text-right">
                                {canMarkPickupReady(order) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markPickupReady(order)
                                    }
                                    disabled={
                                      markingPickupId === order.id
                                    }
                                    className="mr-2 inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {markingPickupId === order.id ? (
                                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    ) : (
                                      <PackageCheck size={15} />
                                    )}
                                    Ready for Pickup
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      openMenu ===
                                        order.id
                                        ? null
                                        : order.id
                                    )
                                  }
                                  className="rounded-lg p-2 transition hover:bg-black/5"
                                >
                                  <MoreHorizontal
                                    size={18}
                                  />
                                </button>

                                {openMenu ===
                                  order.id && (
                                  <div className="absolute right-6 top-14 z-20 w-44 rounded-xl border border-black/10 bg-white p-1 text-left shadow-xl">
                                    <button
                                      onClick={() =>
                                        handleViewOrder(
                                          order
                                        )
                                      }
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                                    >
                                      <Eye
                                        size={
                                          15
                                        }
                                      />
                                      View Order
                                    </button>

                                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-black/5">
                                      <Truck
                                        size={
                                          15
                                        }
                                      />
                                      Track Order
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE */}
                  <div className="divide-y divide-black/5 md:hidden">
                    {filteredOrders.map(
                      (order) => (
                        <div
                          key={order.id}
                          className="p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">
                                {
                                  order.orderNumber
                                }
                              </p>

                              <p className="mt-1 text-sm text-black/60">
                                {
                                  order.customerName
                                }
                              </p>

                              <p className="mt-1 text-xs text-black/40">
                                {formatDate(
                                  order.date
                                )}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu ===
                                    order.id
                                    ? null
                                    : order.id
                                )
                              }
                              className="rounded-lg p-1"
                            >
                              <MoreHorizontal
                                size={18}
                              />
                            </button>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-black/40">
                                Amount
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {formatCurrency(
                                  order.amount
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-black/40">
                                Items
                              </p>

                              <p className="mt-1 text-sm">
                                {order.items ||
                                  0}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-black/40">
                                Payment
                              </p>

                              <div className="mt-1">
                                <PaymentBadge
                                  status={displayStatus(
                                    order.paymentStatus
                                  )}
                                />
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-black/40">
                                Status
                              </p>

                              <div className="mt-1">
                                <OrderStatus
                                  status={displayStatus(
                                    order.orderStatus
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          {openMenu ===
                            order.id && (
                            <div className="mt-4 flex gap-2">
                              {canMarkPickupReady(order) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    markPickupReady(order)
                                  }
                                  disabled={
                                    markingPickupId === order.id
                                  }
                                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <PackageCheck size={15} />
                                  Ready for Pickup
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleViewOrder(
                                    order
                                  )
                                }
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white"
                              >
                                <Eye
                                  size={15}
                                />
                                View Order
                              </button>

                              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm"
                              >
                                <Truck
                                  size={15}
                                />
                                Track
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* EMPTY */}
                  {filteredOrders.length ===
                    0 && (
                    <div className="px-6 py-16 text-center">
                      <ShoppingBag
                        size={35}
                        className="mx-auto mb-4 text-black/20"
                      />

                      <h3 className="font-medium">
                        No orders found
                      </h3>

                      <p className="mt-1 text-sm text-black/40">
                        Try changing your search
                        or status filter.
                      </p>
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="flex flex-col justify-between gap-4 border-t border-black/10 px-5 py-4 text-sm text-black/45 sm:flex-row sm:items-center">
                    <p>
                      Showing{" "}
                      <span className="font-medium text-black">
                        {
                          filteredOrders.length
                        }
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-black">
                        {orders.length}
                      </span>{" "}
                      orders
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =================================
   STAT CARD
================================= */

function MiniCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <p className="text-xs text-black/40">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

/* =================================
   PAYMENT BADGE
================================= */

function PaymentBadge({ status }) {
  const normalized =
    String(status || "").toLowerCase();

  const isPaid =
    normalized === "paid";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        isPaid
          ? "bg-green-50 text-green-700"
          : "bg-yellow-50 text-yellow-700"
      }`}
    >
      {status || "Pending"}
    </span>
  );
}

/* =================================
   ORDER STATUS
================================= */

function OrderStatus({ status }) {
  const styles = {
    Pending:
      "bg-yellow-50 text-yellow-700",

    Confirmed:
      "bg-blue-50 text-blue-700",

    Processing:
      "bg-blue-50 text-blue-700",

    Shipped:
      "bg-purple-50 text-purple-700",

    Delivered:
      "bg-green-50 text-green-700",

    Cancelled:
      "bg-red-50 text-red-700",

    Failed:
      "bg-red-50 text-red-700",

    Refunded:
      "bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-black/5 text-black"
      }`}
    >
      {status || "Pending"}
    </span>
  );
}
