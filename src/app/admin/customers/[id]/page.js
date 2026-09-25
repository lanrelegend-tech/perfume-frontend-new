"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import {
  BarChart3,
  ShoppingBag,
  Search,
  Bell,
  MessageCircle,
  ArrowLeft,
  UserRound,
  Mail as MailIcon,
  Phone,
  MapPin,
  ShoppingCart,
  CreditCard,
  CalendarDays,
  MoreHorizontal,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [callModal, setCallModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          router.push("/admin/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/users/admin/customers/${params?.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          router.push("/admin/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.message ||
              "Unable to load customer."
          );
        }

        setCustomer(data);
      } catch (err) {
        console.error("Customer details error:", err);

        setError(
          err.message ||
            "Unable to load customer."
        );
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchCustomer();
    }
  }, [params?.id, router]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCustomerName = () => {
    if (!customer) {
      return "Customer";
    }

    const fullName = [
      customer.first_name,
      customer.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      customer.username ||
      customer.email ||
      "Customer"
    );
  };
const getAddress = () => {
  if (!latestOrder) {
    return ["No delivery address saved."];
  }

  return latestOrderAddress.length
    ? latestOrderAddress
    : ["No delivery address saved."];
};

  const orders = customer?.order_history || [];

const latestOrder = orders[0] || null;

const latestOrderPhone =
  latestOrder?.phone || "";

const latestOrderAddress = latestOrder
  ? [
      latestOrder.address,
      latestOrder.city,
      latestOrder.state,
    ].filter(Boolean)
  : [];

  const totalOrders = Number(
    customer?.order_count ||
      orders.length ||
      0
  );

  const totalSpent = Number(
    customer?.total_spent || 0
  );

  const averageOrder =
    totalOrders > 0
      ? totalSpent / totalOrders
      : 0;

  const status = customer?.is_active
    ? "Active"
    : "Inactive";

  /*
  |--------------------------------------------------------------------------
  | CALL CUSTOMER
  |--------------------------------------------------------------------------
  */

  const openCallModal = () => {
    setActionModal(false);
    setCallModal(true);
  };

  const closeCallModal = () => {
    setCallModal(false);
  };
const callCustomer = () => {
  if (!latestOrderPhone) {
    return;
  }

  window.location.href = `tel:${latestOrderPhone}`;
};

  /*
  |--------------------------------------------------------------------------
  | MESSAGE CUSTOMER
  |--------------------------------------------------------------------------
  */

  const openMessageModal = () => {
    setActionModal(false);
    setMessageModal(true);
  };

  const closeMessageModal = () => {
    if (actionLoading) {
      return;
    }

    setMessageModal(false);
  };

  const sendMessage = async () => {
  if (!customer?.email) {
    setNotice({
      type: "error",
      title: "No email address",
      message:
        "This customer does not have an email address.",
    });

    return;
  }

  if (!messageText.trim()) {
    setNotice({
      type: "error",
      title: "Message is empty",
      message:
        "Please enter a message before sending.",
    });

    return;
  }

  const token =
    localStorage.getItem("access_token");

  if (!token) {
    router.push("/admin/login");
    return;
  }

  try {
    setActionLoading(true);

    const response = await fetch(
      `${API_URL}/users/admin/customers/${customer.id}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText.trim(),
        }),
      }
    );

    const data =
      await response.json().catch(() => ({}));

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
        data.detail ||
          data.error ||
          "Unable to send message."
      );
    }

    setMessageText("");
    setMessageModal(false);

    setNotice({
      type: "success",
      title: "Message sent",
      message:
        `Your message was sent to ${getCustomerName()}.`,
    });

  } catch (error) {

    console.error(
      "Customer message error:",
      error
    );

    setNotice({
      type: "error",
      title: "Message failed",
      message:
        error.message ||
        "Unable to send the message. Please try again.",
    });

  } finally {
    setActionLoading(false);
  }
};
  /*
  |--------------------------------------------------------------------------
  | CUSTOMER ACTIONS
  |--------------------------------------------------------------------------
  */

  const openActionModal = () => {
    setActionModal(true);
  };

  const closeActionModal = () => {
    setActionModal(false);
  };

  const openConfirmModal = () => {
    setActionModal(false);
    setConfirmModal(true);
  };

  const closeConfirmModal = () => {
    if (actionLoading) {
      return;
    }

    setConfirmModal(false);
  };

  /*
  |--------------------------------------------------------------------------
  | BAN / UNBAN
  |--------------------------------------------------------------------------
  */

  const toggleCustomerStatus = async () => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `${API_URL}/users/admin/customers/${customer.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !customer.is_active,
          }),
        }
      );

      const data = await response.json();

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
          data.detail ||
            data.error ||
            "Unable to update customer status."
        );
      }

      setCustomer(data);
      setConfirmModal(false);

      setNotice({
        type: "success",
        title: data.is_active
          ? "Customer unbanned"
          : "Customer banned",
        message: data.is_active
          ? `${getCustomerName()} can now sign in again.`
          : `${getCustomerName()} can no longer sign in to their account.`,
      });
    } catch (error) {
      console.error(
        "Customer status update error:",
        error
      );

      setNotice({
        type: "error",
        title: "Action failed",
        message:
          error.message ||
          "Unable to update customer status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    router.push("/admin/login");
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] text-black">
        <AdminSidebar />

        <main className="lg:ml-[250px]">
          <div className="pt-16 lg:pt-0">
            <header className="flex h-[82px] items-center justify-between border-b border-black/10 bg-white px-5 sm:px-8">
              <div>
                <p className="text-xs text-black/40">
                  ORENTEMIST ADMIN
                </p>

                <h2 className="text-xl font-semibold">
                  Customer Details
                </h2>
              </div>
            </header>

            <div className="p-5 sm:p-8">
              <div className="animate-pulse rounded-2xl border border-black/10 bg-white p-8">
                <div className="h-5 w-48 rounded bg-black/5" />
                <div className="mt-4 h-4 w-72 rounded bg-black/5" />
                <div className="mt-8 h-32 rounded-xl bg-black/5" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] text-black">
        <AdminSidebar />

        <main className="lg:ml-[250px]">
          <div className="pt-16 lg:pt-0">
            <header className="flex h-[82px] items-center justify-between border-b border-black/10 bg-white px-5 sm:px-8">
              <div>
                <p className="text-xs text-black/40">
                  ORENTEMIST ADMIN
                </p>

                <h2 className="text-xl font-semibold">
                  Customer Details
                </h2>
              </div>
            </header>

            <div className="p-5 sm:p-8">
              <button
                onClick={() =>
                  router.push("/admin/customers")
                }
                className="mb-6 flex items-center gap-2 text-sm text-black/50 transition hover:text-black"
              >
                <ArrowLeft size={16} />
                Back to Customers
              </button>

              <div className="rounded-2xl border border-red-200 bg-white p-5 sm:p-8">
                <h2 className="font-semibold">
                  Unable to load customer
                </h2>

                <p className="mt-2 break-words text-sm text-black/50">
                  {error || "Customer not found."}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f7f5] text-black">
      <AdminSidebar />

      <main className="lg:ml-[250px]">
        <div className="pt-16 lg:pt-0">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="border-b border-black/10 bg-white">
            <div className="flex min-h-[82px] items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/40 sm:text-xs">
                  ORENTEMIST ADMIN
                </p>

                <h2 className="mt-1 truncate text-lg font-semibold sm:text-xl">
                  Customer Details
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="hidden rounded-xl border border-black/10 p-3 transition hover:bg-black/5 sm:block"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-black/10 p-3 transition hover:bg-black/5"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                </button>

                <button
                  type="button"
                  onClick={openMessageModal}
                  className="rounded-xl border border-black/10 p-3 transition hover:bg-black/5"
                  aria-label="Message customer"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">

            {/* =================================================
                BACK
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                router.push("/admin/customers")
              }
              className="mb-5 flex items-center gap-2 text-sm text-black/50 transition hover:text-black sm:mb-6"
            >
              <ArrowLeft size={16} />
              Back to Customers
            </button>

            {/* =================================================
                PROFILE
            ================================================= */}

            <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <Avatar
                    name={getCustomerName()}
                    large
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h1 className="max-w-full break-words text-xl font-semibold sm:text-2xl">
                        {getCustomerName()}
                      </h1>

                      <StatusBadge status={status} />
                    </div>

                    <p className="mt-2 text-xs text-black/45 sm:text-sm">
                      Customer since{" "}
                      {formatDate(
                        customer.date_joined
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <button
                    type="button"
                    onClick={openMessageModal}
                    className="flex items-center justify-center gap-2 rounded-xl border border-black/10 px-3 py-3 text-sm transition hover:bg-black/5 sm:px-4"
                  >
                    <MailIcon size={16} />
                    <span>Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={openCallModal}
                    disabled={!latestOrderPhone}
                    className="flex items-center justify-center gap-2 rounded-xl bg-black px-3 py-3 text-sm text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                  >
                    <Phone size={16} />
                    <span>Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={openActionModal}
                    className="col-span-2 flex items-center justify-center rounded-xl border border-black/10 p-3 transition hover:bg-black/5 sm:col-span-1"
                    title="Customer actions"
                    aria-label="Customer actions"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="mt-5 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:mt-6 sm:gap-4 xl:grid-cols-4">

              <StatCard
                title="Total Orders"
                value={totalOrders}
                icon={<ShoppingCart size={20} />}
              />

              <StatCard
                title="Total Spent"
                value={formatCurrency(totalSpent)}
                icon={<CreditCard size={20} />}
              />

              <StatCard
                title="Average Order"
                value={formatCurrency(averageOrder)}
                icon={<BarChart3 size={20} />}
              />

              <StatCard
                title="Customer Since"
                value={formatDate(customer.date_joined)}
                icon={<CalendarDays size={20} />}
              />

            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

              {/* =================================================
                  LEFT
              ================================================= */}

              <div className="min-w-0 space-y-5 sm:space-y-6">

                {/* =================================================
                    ORDERS
                ================================================= */}

                <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">

                  <div className="flex flex-col gap-3 border-b border-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">

                    <div className="min-w-0">
                      <h2 className="font-semibold">
                        Recent Orders
                      </h2>

                      <p className="mt-1 text-xs text-black/40">
                        Customer purchase history
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push("/admin/orders")
                      }
                      className="self-start text-xs font-medium underline underline-offset-4 sm:self-auto"
                    >
                      View all
                    </button>

                  </div>

                  <div className="overflow-x-auto">
                    {orders.length > 0 ? (
                      <table className="w-full min-w-[650px]">
                        <thead>
                          <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-black/35">
                            <th className="whitespace-nowrap px-4 py-4 font-medium sm:px-5">
                              Order
                            </th>

                            <th className="whitespace-nowrap px-4 py-4 font-medium sm:px-5">
                              Date
                            </th>

                            <th className="whitespace-nowrap px-4 py-4 font-medium sm:px-5">
                              Items
                            </th>

                            <th className="whitespace-nowrap px-4 py-4 font-medium sm:px-5">
                              Amount
                            </th>

                            <th className="whitespace-nowrap px-4 py-4 font-medium sm:px-5">
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {orders.map((order) => (
                            <tr
                              key={order.id}
                              onClick={() =>
                                router.push(
                                  `/admin/orders/${order.id}`
                                )
                              }
                              className="cursor-pointer border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                            >
                              <td className="whitespace-nowrap px-4 py-5 text-sm font-medium sm:px-5">
                                {order.order_number ||
                                  `#${order.id}`}
                              </td>

                              <td className="whitespace-nowrap px-4 py-5 text-sm text-black/50 sm:px-5">
                                {formatDate(
                                  order.created_at
                                )}
                              </td>

                              <td className="px-4 py-5 text-sm text-black/60 sm:px-5">
                                —
                              </td>

                              <td className="whitespace-nowrap px-4 py-5 text-sm font-medium sm:px-5">
                                {formatCurrency(
                                  order.total_amount
                                )}
                              </td>

                              <td className="px-4 py-5 sm:px-5">
                                <span className="inline-flex whitespace-nowrap rounded-full bg-black/5 px-3 py-1 text-xs font-medium capitalize text-black/65">
                                  {order.status ||
                                    "pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-5 py-10 text-center text-sm text-black/40">
                        This customer has no orders yet.
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    ACTIVITY
                ================================================= */}

                <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6">

                  <h2 className="font-semibold">
                    Customer Activity
                  </h2>

                  <div className="mt-6 space-y-6">

                    {orders.length > 0 && (
                      <Activity
                        title="Latest order"
                        description={`${
                          orders[0].order_number ||
                          `Order #${orders[0].id}`
                        } was ${
                          orders[0].status ||
                          "placed"
                        }.`}
                        date={formatDate(
                          orders[0].created_at
                        )}
                        icon={
                          <ShoppingBag size={17} />
                        }
                      />
                    )}

                    <Activity
                      title="Profile created"
                      description="Customer created their ORENTEMIST account."
                      date={formatDate(
                        customer.date_joined
                      )}
                      icon={
                        <UserRound size={17} />
                      }
                    />

                  </div>
                </section>
              </div>

              {/* =================================================
                  RIGHT
              ================================================= */}

              <div className="min-w-0 space-y-5 sm:space-y-6">

                {/* =================================================
                    CONTACT
                ================================================= */}

                <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                      <UserRound size={18} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-semibold">
                        Contact Information
                      </h2>

                      <p className="text-xs text-black/40">
                        Customer contact details
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">

                    <DetailRow
                      icon={<UserRound size={16} />}
                      label="Full Name"
                      value={getCustomerName()}
                    />

                    <DetailRow
                      icon={<MailIcon size={16} />}
                      label="Email"
                      value={customer.email || "—"}
                    />

                   <DetailRow
  icon={<Phone size={16} />}
  label="Phone"
  value={latestOrderPhone || "—"}
/>

                  </div>
                </section>

                {/* =================================================
                    ADDRESS
                ================================================= */}

                <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                      <MapPin size={18} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-semibold">
                        Delivery Address
                      </h2>

                      <p className="text-xs text-black/40">
  Address from most recent order
</p>
                    </div>
                  </div>



                  <div className="mt-5 overflow-hidden rounded-xl bg-[#f7f7f5] p-4 text-sm leading-6 text-black/65">
                    {getAddress().map(
                      (line, index) => (
                        <p
                          key={`${line}-${index}`}
                          className="break-words"
                        >
                          {line}
                        </p>
                      )
                    )}

                    <p>Nigeria</p>
                  </div>
                </section>

                {/* =================================================
                    ACCOUNT
                ================================================= */}

                <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">

                  <h2 className="font-semibold">
                    Account Information
                  </h2>

                  <div className="mt-5 space-y-4">

                    <InfoRow
                      label="Status"
                      value={status}
                      badge
                    />

                    <InfoRow
                      label="Customer ID"
                      value={`CUS-${String(
                        customer.id
                      ).padStart(4, "0")}`}
                    />

                    <InfoRow
                      label="Joined"
                      value={formatDate(
                        customer.date_joined
                      )}
                    />

                    <InfoRow
                      label="Orders"
                      value={totalOrders}
                    />

                  </div>
                </section>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <section className="rounded-2xl bg-black p-4 text-white sm:p-5">

                  <h2 className="font-semibold">
                    Customer Actions
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-white/45">
                    Quickly contact or manage this customer's account.
                  </p>

                  <div className="mt-5 space-y-2">

                    <button
                      type="button"
                      onClick={openMessageModal}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90"
                    >
                      <MessageCircle size={16} />
                      Message Customer
                    </button>

                    <button
                      type="button"
                      onClick={openCallModal}
                      disabled={!latestOrderPhone }
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Phone size={16} />
                      Call Customer
                    </button>

                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================
          CALL MODAL
      ===================================================== */}

      {callModal && (
        <ModalOverlay onClose={closeCallModal}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                  <Phone size={20} />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  Call Customer
                </h3>

                <p className="mt-1 text-sm text-black/45">
                  Contact this customer directly.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCallModal}
                className="shrink-0 rounded-xl p-2 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={getCustomerName()} />

                <div className="min-w-0">
                  <p className="break-words font-medium">
                    {getCustomerName()}
                  </p>

                  <p className="mt-1 break-all text-sm text-black/45">
                    {latestOrderPhone  ||
                      "No phone number saved"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={closeCallModal}
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-black/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={callCustomer}
                disabled={!latestOrderPhone }
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Phone size={16} />
                Call Now
              </button>

            </div>
          </div>
        </ModalOverlay>
      )}

      {/* =====================================================
          MESSAGE MODAL
      ===================================================== */}

      {messageModal && (
        <ModalOverlay onClose={closeMessageModal}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                  <MessageCircle size={20} />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  Message Customer
                </h3>

                <p className="mt-1 break-words text-sm text-black/45">
                  Write a message to {getCustomerName()}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeMessageModal}
                className="shrink-0 rounded-xl p-2 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">
              <div className="flex min-w-0 items-center gap-3">

                <Avatar name={getCustomerName()} />

                <div className="min-w-0">
                  <p className="break-words font-medium">
                    {getCustomerName()}
                  </p>

                  <p className="mt-1 break-all text-sm text-black/45">
                    {customer.email ||
                      "No email address saved"}
                  </p>
                </div>

              </div>
            </div>

            <textarea
              value={messageText}
              onChange={(event) =>
                setMessageText(event.target.value)
              }
              placeholder="Write your message..."
              rows={6}
              className="mt-5 w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] p-4 text-base outline-none transition placeholder:text-black/30 focus:border-black/30 sm:text-sm"
            />

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={closeMessageModal}
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-black/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={sendMessage}
               disabled={
  !customer.email ||
  !messageText.trim() ||
  actionLoading
}
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
              >
               <Send size={16} />
{actionLoading ? "Sending..." : "Send Message"}
              </button>

            </div>
          </div>
        </ModalOverlay>
      )}

      {/* =====================================================
          ACTION MENU MODAL
      ===================================================== */}

      {actionModal && (
        <ModalOverlay onClose={closeActionModal}>
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">
                  Customer Actions
                </p>

                <h3 className="mt-2 break-words text-xl font-semibold">
                  {getCustomerName()}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeActionModal}
                className="shrink-0 rounded-xl p-2 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 space-y-2">

              <button
                type="button"
                onClick={() => {
                  closeActionModal();
                  setMessageModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:bg-black/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                  <MessageCircle size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Message Customer
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Send an email message
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeActionModal();
                  setCallModal(true);
                }}
                disabled={!latestOrderPhone }
                className="flex w-full items-center gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                  <Phone size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Call Customer
                  </p>

                  <p className="mt-1 break-all text-xs text-black/40">
                    {latestOrderPhone  ||
                      "No phone number saved"}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeActionModal();
                  setConfirmModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-red-100 p-4 text-left transition hover:bg-red-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <UserRound size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-700">
                    {customer.is_active
                      ? "Ban Customer"
                      : "Unban Customer"}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    {customer.is_active
                      ? "Disable this customer's account"
                      : "Restore this customer's account"}
                  </p>
                </div>
              </button>

            </div>

            <button
              type="button"
              onClick={closeActionModal}
              className="mt-5 w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* =====================================================
          BAN / UNBAN CONFIRMATION
      ===================================================== */}

      {confirmModal && (
        <ModalOverlay onClose={closeConfirmModal}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                  <UserRound size={20} />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  {customer.is_active
                    ? "Ban customer?"
                    : "Unban customer?"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  {customer.is_active
                    ? "This customer will no longer be able to sign in. Their orders and account history will remain."
                    : "This customer will be able to sign in to their account again."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={actionLoading}
                className="shrink-0 rounded-xl p-2 text-black/40 hover:bg-black/5 disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">

              <div className="flex min-w-0 items-center gap-3">

                <Avatar name={getCustomerName()} />

                <div className="min-w-0">
                  <p className="break-words font-medium">
                    {getCustomerName()}
                  </p>

                  <p className="mt-1 break-all text-xs text-black/40">
                    {customer.email}
                  </p>
                </div>

              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={actionLoading}
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-black/5 disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={toggleCustomerStatus}
                disabled={actionLoading}
                className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/85 disabled:opacity-50"
              >
                {actionLoading
                  ? customer.is_active
                    ? "Banning..."
                    : "Unbanning..."
                  : customer.is_active
                  ? "Ban Customer"
                  : "Unban Customer"}
              </button>

            </div>
          </div>
        </ModalOverlay>
      )}

      {/* =====================================================
          SUCCESS / ERROR NOTICE
      ===================================================== */}

      {notice && (
        <ModalOverlay onClose={() => setNotice(null)}>
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 text-center shadow-2xl sm:p-6">

            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                notice.type === "success"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {notice.type === "success" ? (
                <CheckCircle2 size={26} />
              ) : (
                <AlertCircle size={26} />
              )}
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              {notice.title}
            </h3>

            <p className="mt-2 break-words text-sm leading-6 text-black/50">
              {notice.message}
            </p>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
            >
              Done
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| MODAL OVERLAY
|--------------------------------------------------------------------------
*/

function ModalOverlay({
  children,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="my-auto w-full">
        {children}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| AVATAR
|--------------------------------------------------------------------------
*/

function Avatar({
  name,
  large,
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-black font-semibold text-white ${
        large
          ? "h-14 w-14 text-base sm:h-16 sm:w-16 sm:text-lg"
          : "h-10 w-10 text-xs"
      }`}
    >
      {initials || "CU"}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function StatusBadge({
  status,
}) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
        status === "Active"
          ? "bg-green-50 text-green-700"
          : "bg-black/5 text-black/45"
      }`}
    >
      {status}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-black/10 bg-white p-4 sm:p-5">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
        {icon}
      </div>

      <p className="mt-4 text-xs text-black/40 sm:mt-5">
        {title}
      </p>

      <p className="mt-1 break-words text-lg font-semibold sm:text-xl">
        {value}
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex min-w-0 gap-3">

      <div className="mt-0.5 shrink-0 text-black/35">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-black/40">
          {label}
        </p>

        <p className="mt-1 break-all text-sm font-medium">
          {value}
        </p>
      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INFO ROW
|--------------------------------------------------------------------------
*/

function InfoRow({
  label,
  value,
  badge,
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="shrink-0 text-xs text-black/40">
        {label}
      </span>

      {badge ? (
        <StatusBadge status={value} />
      ) : (
        <span className="min-w-0 break-all text-right text-sm font-medium">
          {value}
        </span>
      )}

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ACTIVITY
|--------------------------------------------------------------------------
*/

function Activity({
  title,
  description,
  date,
  icon,
}) {
  return (
    <div className="flex min-w-0 gap-4">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <div className="flex flex-col justify-between gap-1 sm:flex-row">

          <h3 className="text-sm font-medium">
            {title}
          </h3>

          <span className="shrink-0 text-xs text-black/35">
            {date}
          </span>

        </div>

        <p className="mt-1 break-words text-xs leading-5 text-black/45">
          {description}
        </p>

      </div>

    </div>
  );
}