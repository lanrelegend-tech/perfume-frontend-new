"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Search,
  Bell,
  MessageCircle,
  UserPlus,
  MoreHorizontal,
  Eye,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

const CUSTOMERS_PER_PAGE = 10;

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    averageSpend: 0,
  });

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("access_token");
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append(
          "search",
          search.trim()
        );
      }

      if (statusFilter !== "All") {
        params.append(
          "status",
          statusFilter.toLowerCase()
        );
      }

      const queryString =
        params.toString();

      const customerUrl =
        `${API_URL}/users/admin/customers/` +
        `${queryString ? `?${queryString}` : ""}`;

      const guestUrl =
        `${API_URL}/users/admin/guests/`;

      const [customerResponse, guestResponse] =
        await Promise.all([
          fetch(customerUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),

          fetch(guestUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

      if (
        customerResponse.status === 401 ||
        guestResponse.status === 401
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

      if (!customerResponse.ok) {
        throw new Error(
          "Failed to load customers"
        );
      }

      if (!guestResponse.ok) {
        throw new Error(
          "Failed to load guests"
        );
      }

      const customerData =
        await customerResponse.json();

      const guestData =
        await guestResponse.json();

      const registeredCustomers =
        Array.isArray(customerData)
          ? customerData
          : customerData.results || [];

      const guestCustomers =
        Array.isArray(guestData)
          ? guestData
          : guestData.results || [];

      const formattedGuests =
        guestCustomers.map(
          (guest) => ({
            ...guest,
            customer_type: "guest",
          })
        );

      const formattedCustomers =
        registeredCustomers.map(
          (customer) => ({
            ...customer,
            customer_type:
              customer.customer_type ||
              "registered",
          })
        );

      const combined = [
        ...formattedCustomers,
        ...formattedGuests,
      ];

      setAllCustomers(combined);

      calculateStats(
        combined
      );
    } catch (err) {
      console.error(
        "CUSTOMERS ERROR:",
        err
      );

      setError(
        "Unable to load customers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (
    customerList
  ) => {
    const active =
      customerList.filter(
        (customer) =>
          customer.customer_type ===
            "registered" &&
          customer.is_active === true
      ).length;

    const totalSpent =
      customerList.reduce(
        (sum, customer) =>
          sum +
          Number(
            customer.total_spent || 0
          ),
        0
      );

    const averageSpend =
      customerList.length > 0
        ? totalSpent /
          customerList.length
        : 0;

    const now = new Date();

    const newThisMonth =
      customerList.filter(
        (customer) => {
          if (
            customer.customer_type ===
            "guest"
          ) {
            return false;
          }

          if (
            !customer.date_joined
          ) {
            return false;
          }

          const joined =
            new Date(
              customer.date_joined
            );

          return (
            joined.getMonth() ===
              now.getMonth() &&
            joined.getFullYear() ===
              now.getFullYear()
          );
        }
      ).length;

    setStats({
      total: customerList.length,
      active,
      newThisMonth,
      averageSpend,
    });
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
  ]);


  const getCustomerName = (
    customer
  ) => {
    if (
      customer.customer_type ===
      "guest"
    ) {
      return "Guest Customer";
    }

    const fullName =
      `${customer.first_name || ""} ${
        customer.last_name || ""
      }`.trim();

    return (
      fullName ||
      customer.username ||
      "Customer"
    );
  };
  
  const filteredCustomers =
    allCustomers.filter(
      (customer) => {
        const searchValue =
          search
            .toLowerCase()
            .trim();

        const name =
          getCustomerName(
            customer
          ).toLowerCase();

        const email =
          (
            customer.email || ""
          ).toLowerCase();

        const matchesSearch =
          !searchValue ||
          name.includes(
            searchValue
          ) ||
          email.includes(
            searchValue
          );

        let matchesStatus =
          true;

        if (
          statusFilter ===
          "Active"
        ) {
          matchesStatus =
            customer.customer_type ===
              "guest" ||
            customer.is_active ===
              true;
        }

        if (
          statusFilter ===
          "Inactive"
        ) {
          matchesStatus =
            customer.customer_type ===
              "registered" &&
            customer.is_active ===
              false;
        }

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  const totalCustomers =
    filteredCustomers.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCustomers /
          CUSTOMERS_PER_PAGE
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const startIndex =
    (safePage - 1) *
    CUSTOMERS_PER_PAGE;

  const visibleCustomers =
    filteredCustomers.slice(
      startIndex,
      startIndex +
        CUSTOMERS_PER_PAGE
    );

  const formatCurrency = (
    amount
  ) => {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(
        amount || 0
      )
    );
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-NG",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  

  const handleViewCustomer = (
    customer
  ) => {
    if (
      customer.customer_type ===
      "guest"
    ) {
      return;
    }

    router.push(
      `/admin/customers/${customer.id}`
    );
  };

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
                Customers
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

          <div className="p-5 sm:p-8">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Customers
                </h1>

                <p className="mt-1 text-sm text-black/45">
                  Manage your ORENTEMIST customers
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    "/admin/customers/new"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85"
              >
                <UserPlus size={17} />
                Add Customer
              </button>
            </div>

            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Customers"
                value={stats.total.toLocaleString()}
                change="Live"
                icon={
                  <Users size={20} />
                }
              />

              <StatCard
                title="Active Customers"
                value={stats.active.toLocaleString()}
                change="Live"
                icon={
                  <UserPlus size={20} />
                }
              />

              <StatCard
                title="New This Month"
                value={stats.newThisMonth.toLocaleString()}
                change="Live"
                icon={
                  <ArrowUpRight size={20} />
                }
              />

              <StatCard
                title="Average Spend"
                value={formatCurrency(
                  stats.averageSpend
                )}
                change="Live"
                icon={
                  <BarChart3 size={20} />
                }
              />
            </div>

            <div className="mb-5 rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                  />

                  <input
                    type="text"
                    placeholder="Search customers or guests..."
                    value={search}
                    onChange={(e) => {
                      setSearch(
                        e.target.value
                      );
                    }}
                   className="w-full rounded-xl border border-black/10 bg-[#fafafa] py-3 pl-11 pr-4 text-base sm:text-sm outline-none transition focus:border-black/30"
                  />
                </div>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                    );
                  }}
                  className="rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-base sm:text-sm outline-none"
                >
                  <option value="All">
                    All Customers
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}

                <button
                  onClick={
                    fetchCustomers
                  }
                  className="ml-3 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            )}

            {loading ? (
              <LoadingState />
            ) : visibleCustomers.length ===
              0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead>
                        <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-black/40">
                          <th className="px-6 py-4 font-medium">
                            Customer
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Type
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Phone
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Orders
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Total Spent
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Status
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Joined
                          </th>

                          <th className="px-6 py-4 text-right font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleCustomers.map(
                          (
                            customer
                          ) => (
                            <tr
                              key={
                                customer.id
                              }
                              className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    name={getCustomerName(
                                      customer
                                    )}
                                    guest={
                                      customer.customer_type ===
                                      "guest"
                                    }
                                  />

                                  <div>
                                    <p className="font-medium">
                                      {getCustomerName(
                                        customer
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-black/40">
                                      {
                                        customer.email
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-5">
                                <CustomerType
                                  type={
                                    customer.customer_type
                                  }
                                />
                              </td>

                              <td className="px-6 py-5 text-sm text-black/60">
                                {customer.phone  ||
                                  "—"}
                              </td>

                              <td className="px-6 py-5 text-sm font-medium">
                                {customer.order_count ||
                                  0}
                              </td>

                              <td className="px-6 py-5 text-sm font-medium">
                                {formatCurrency(
                                  customer.total_spent
                                )}
                              </td>

                              <td className="px-6 py-5">
                                <CustomerStatus
                                  status={
                                    customer.customer_type ===
                                    "guest"
                                      ? "Guest"
                                      : customer.is_active
                                      ? "Active"
                                      : "Inactive"
                                  }
                                />
                              </td>

                              <td className="px-6 py-5 text-sm text-black/50">
                                {formatDate(
                                  customer.date_joined
                                )}
                              </td>

                              <td className="px-6 py-5 text-right">
                                {customer.customer_type ===
                                "guest" ? (
                                  <span className="text-xs text-black/30">
                                    Guest
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleViewCustomer(
                                          customer
                                        )
                                      }
                                      className="rounded-lg p-2 transition hover:bg-black/5"
                                    >
                                      <Eye
                                        size={
                                          17
                                        }
                                      />
                                    </button>

                                    <button className="rounded-lg p-2 transition hover:bg-black/5">
                                      <MoreHorizontal
                                        size={
                                          17
                                        }
                                      />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 lg:hidden">
                  {visibleCustomers.map(
                    (
                      customer
                    ) => (
                      <div
                        key={
                          customer.id
                        }
                        className="rounded-2xl border border-black/10 bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar
                              name={getCustomerName(
                                customer
                              )}
                              guest={
                                customer.customer_type ===
                                "guest"
                              }
                            />

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {getCustomerName(
                                  customer
                                )}
                              </p>

                              <p className="mt-1 truncate text-xs text-black/40">
                                {
                                  customer.email
                                }
                              </p>
                            </div>
                          </div>

                          <CustomerType
                            type={
                              customer.customer_type
                            }
                          />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/5 pt-4">
                          <div>
                            <p className="text-xs text-black/35">
                              Orders
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {customer.order_count ||
                                0}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-black/35">
                              Total Spent
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatCurrency(
                                customer.total_spent
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-black/35">
                              Phone
                            </p>

                            <p className="mt-1 text-sm text-black/65">
                              {customer.phone  ||
                                "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-black/35">
                              Status
                            </p>

                            <p className="mt-1 text-sm text-black/65">
                              {customer.customer_type ===
                              "guest"
                                ? "Guest"
                                : customer.is_active
                                ? "Active"
                                : "Inactive"}
                            </p>
                          </div>
                        </div>

                        {customer.customer_type !==
                          "guest" && (
                          <button
                            onClick={() =>
                              handleViewCustomer(
                                customer
                              )
                            }
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm font-medium"
                          >
                            <Eye
                              size={16}
                            />
                            View Customer
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {!loading &&
              totalCustomers > 0 && (
                <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-black/40">
                    Showing{" "}
                    {startIndex + 1}–
                    {Math.min(
                      startIndex +
                        CUSTOMERS_PER_PAGE,
                      totalCustomers
                    )}{" "}
                    of{" "}
                    {totalCustomers.toLocaleString()}{" "}
                    customers
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={
                        safePage === 1
                      }
                      onClick={() =>
                        setPage(
                          Math.max(
                            1,
                            safePage - 1
                          )
                        )
                      }
                      className="rounded-lg border border-black/10 bg-white p-2 text-black/40 disabled:opacity-30"
                    >
                      <ChevronLeft
                        size={17}
                      />
                    </button>

                    <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                      {safePage}
                    </button>

                    <button
                      disabled={
                        safePage >=
                        totalPages
                      }
                      onClick={() =>
                        setPage(
                          Math.min(
                            totalPages,
                            safePage + 1
                          )
                        )
                      }
                      className="rounded-lg border border-black/10 bg-white p-2 disabled:opacity-30"
                    >
                      <ChevronRight
                        size={17}
                      />
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-10">
      <div className="space-y-5">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="flex animate-pulse items-center gap-4"
            >
              <div className="h-10 w-10 rounded-full bg-black/5" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-black/5" />
                <div className="h-3 w-56 rounded bg-black/5" />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white py-16 text-center">
      <Users
        size={30}
        className="mx-auto text-black/25"
      />

      <h3 className="mt-4 font-medium">
        No customers found
      </h3>

      <p className="mt-1 text-sm text-black/40">
        Try changing your search or filter.
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
          {icon}
        </div>

        <span className="text-xs font-medium text-green-600">
          {change}
        </span>
      </div>

      <p className="mt-5 text-xs text-black/40">
        {title}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function Avatar({
  name,
  guest,
}) {
  const initials = name
    .split(" ")
    .map(
      (word) =>
        word[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        guest
          ? "bg-black/10 text-black/60"
          : "bg-black text-white"
      }`}
    >
      {guest ? (
        <UserRound
          size={17}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function CustomerStatus({
  status,
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        status === "Active"
          ? "bg-green-50 text-green-700"
          : status === "Guest"
          ? "bg-amber-50 text-amber-700"
          : "bg-black/5 text-black/45"
      }`}
    >
      {status}
    </span>
  );
}

function CustomerType({
  type,
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        type === "guest"
          ? "bg-amber-50 text-amber-700"
          : "bg-black/5 text-black/60"
      }`}
    >
      {type === "guest"
        ? "Guest"
        : "Registered"}
    </span>
  );
}