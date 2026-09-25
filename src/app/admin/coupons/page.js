"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  Copy,
  X,
  Percent,
  CircleDollarSign,
  CalendarDays,
  Ticket,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function CouponsPage() {
  const router = useRouter();

  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    minOrder: "",
    maximumDiscount: "",
    usageLimit: "",
    expires: "",
    isActive: true,
  });

  /*
  |--------------------------------------------------------------------------
  | AUTH
  |--------------------------------------------------------------------------
  */

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    router.push("/admin/login");
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH COUPONS
  |--------------------------------------------------------------------------
  */

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/coupons/admin/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to manage coupons."
        );
      }

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to load coupons."
        );
      }

      const data = await response.json();

      /*
        Django pagination support.

        If the API returns:
        {
          count: 10,
          results: [...]
        }

        we use results.

        If it returns:
        [...]
        
        we use the array directly.
      */
      const couponList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setCoupons(couponList);
    } catch (err) {
      console.error("COUPON FETCH ERROR:", err);

      setError(
        err.message ||
          "Failed to load coupons."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const formatDate = (date) => {
    if (!date) return "No expiry";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsedDate);
  };

  const getDateInputValue = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();

    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const isExpired = (coupon) => {
    if (!coupon.expires_at) return false;

    return (
      new Date(coupon.expires_at).getTime() <
      Date.now()
    );
  };

  const getCouponStatus = (coupon) => {
    if (isExpired(coupon)) {
      return "Expired";
    }

    if (coupon.is_active) {
      return "Active";
    }

    return "Inactive";
  };

  const getDiscountType = (coupon) => {
    return (
      coupon.discount_type ||
      coupon.type ||
      "percentage"
    );
  };

  const getDiscountValue = (coupon) => {
    return Number(
      coupon.discount_value ??
        coupon.value ??
        0
    );
  };

  const getMinimumOrder = (coupon) => {
    return Number(
      coupon.minimum_order_amount ??
        coupon.minOrder ??
        0
    );
  };

  const getMaximumDiscount = (coupon) => {
    return Number(
      coupon.maximum_discount ??
        0
    );
  };

  const getUsageLimit = (coupon) => {
    return Number(
      coupon.usage_limit ??
        0
    );
  };

  const getUsedCount = (coupon) => {
    return Number(
      coupon.used_count ??
        coupon.used ??
        0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | FILTERING
  |--------------------------------------------------------------------------
  */

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const code = String(
        coupon.code || ""
      ).toLowerCase();

      const matchesSearch = code.includes(
        search.toLowerCase()
      );

      const status = getCouponStatus(coupon);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    coupons,
    search,
    statusFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */

  const activeCoupons = coupons.filter(
    (coupon) =>
      getCouponStatus(coupon) === "Active"
  ).length;

  const expiredCoupons = coupons.filter(
    (coupon) =>
      getCouponStatus(coupon) === "Expired"
  ).length;

  const totalUses = coupons.reduce(
    (total, coupon) =>
      total + getUsedCount(coupon),
    0
  );

  /*
  |--------------------------------------------------------------------------
  | MODAL
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setForm({
      code: "",
      type: "percentage",
      value: "",
      minOrder: "",
      maximumDiscount: "",
      usageLimit: "",
      expires: "",
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    resetForm();

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code || "",
      type: getDiscountType(coupon),
      value: getDiscountValue(coupon),
      minOrder: getMinimumOrder(coupon),
      maximumDiscount:
        getMaximumDiscount(coupon) || "",
      usageLimit:
        getUsageLimit(coupon) || "",
      expires: getDateInputValue(
        coupon.expires_at
      ),
      isActive:
        coupon.is_active !== false,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCoupon(null);
    resetForm();
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const code = form.code
      .trim()
      .toUpperCase()
      .replace(/\s/g, "");

    const value = Number(form.value);

    const minOrder = Number(
      form.minOrder || 0
    );

    const maximumDiscount =
      Number(
        form.maximumDiscount || 0
      );

    const usageLimit =
      Number(form.usageLimit || 0);

    if (!code) {
      setError(
        "Please enter a coupon code."
      );
      return;
    }

    if (!form.value || value <= 0) {
      setError(
        "Please enter a valid discount value."
      );
      return;
    }

    if (
      form.type === "percentage" &&
      value > 100
    ) {
      setError(
        "Percentage discount cannot be more than 100%."
      );
      return;
    }

    if (minOrder < 0) {
      setError(
        "Minimum order amount cannot be negative."
      );
      return;
    }

    if (maximumDiscount < 0) {
      setError(
        "Maximum discount cannot be negative."
      );
      return;
    }

    if (usageLimit < 0) {
      setError(
        "Usage limit cannot be negative."
      );
      return;
    }

    if (!form.expires) {
      setError(
        "Please select an expiry date."
      );
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      /*
        Convert the date input into an ISO datetime
        because the Django field is expires_at.
      */
      const expiresAt = new Date(
        `${form.expires}T23:59:59`
      ).toISOString();

      const payload = {
        code,
        discount_type: form.type,
        discount_value: value,
        minimum_order_amount: minOrder,
        maximum_discount:
          maximumDiscount || 0,
        usage_limit:
          usageLimit || 0,
        expires_at: expiresAt,
        is_active: form.isActive,
      };

      const url = editingCoupon
        ? `${API_URL}/coupons/admin/${editingCoupon.id}/`
        : `${API_URL}/coupons/admin/`;

      const method = editingCoupon
        ? "PATCH"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to manage coupons."
        );
      }

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        const firstError =
          errorData &&
          typeof errorData === "object"
            ? Object.values(
                errorData
              ).flat()[0]
            : null;

        throw new Error(
          firstError ||
            errorData?.detail ||
            "Failed to save coupon."
        );
      }

      const savedCoupon =
        await response.json();

      if (editingCoupon) {
        setCoupons((current) =>
          current.map((coupon) =>
            coupon.id === editingCoupon.id
              ? savedCoupon
              : coupon
          )
        );

        setSuccess(
          "Coupon updated successfully."
        );
      } else {
        setCoupons((current) => [
          savedCoupon,
          ...current,
        ]);

        setSuccess(
          "Coupon created successfully."
        );
      }

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
    } catch (err) {
      console.error(
        "COUPON SAVE ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to save coupon."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const deleteCoupon = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this coupon?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/coupons/admin/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to delete coupons."
        );
      }

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to delete coupon."
        );
      }

      setCoupons((current) =>
        current.filter(
          (coupon) =>
            coupon.id !== id
        )
      );

      setSuccess(
        "Coupon deleted successfully."
      );
    } catch (err) {
      console.error(
        "COUPON DELETE ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to delete coupon."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOGGLE ACTIVE / INACTIVE
  |--------------------------------------------------------------------------
  */

  const toggleStatus = async (coupon) => {
    if (isExpired(coupon)) {
      setError(
        "This coupon has expired. Change the expiry date before activating it again."
      );
      return;
    }

    try {
      setTogglingId(coupon.id);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/coupons/admin/${coupon.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active:
              !coupon.is_active,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to update coupons."
        );
      }

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to update coupon status."
        );
      }

      const updatedCoupon =
        await response.json();

      setCoupons((current) =>
        current.map((item) =>
          item.id === coupon.id
            ? updatedCoupon
            : item
        )
      );

      setSuccess(
        updatedCoupon.is_active
          ? "Coupon activated."
          : "Coupon deactivated."
      );
    } catch (err) {
      console.error(
        "COUPON STATUS ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to update coupon status."
      );
    } finally {
      setTogglingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COPY
  |--------------------------------------------------------------------------
  */

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setSuccess(
        `Coupon ${code} copied.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch {
      setError(
        "Could not copy coupon code."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    router.push("/admin/login");
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <AdminSidebar />

        <main className="lg:ml-[250px]">
          <div className="flex min-h-screen items-center justify-center pt-16 lg:pt-0">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={30}
                className="animate-spin"
              />

              <p className="text-sm text-black/50">
                Loading coupons...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

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
                Coupons
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
                <MessageCircle
                  size={18}
                />
              </button>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {/* PAGE HEADER */}

            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Discount Codes
                </h1>

                <p className="mt-1 text-sm text-black/45">
                  Create and manage promotional
                  discounts
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={fetchCoupons}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

                <button
                  onClick={openCreateModal}
                  className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85"
                >
                  <Plus size={17} />

                  Create Coupon
                </button>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{error}</p>

                <button
                  onClick={() =>
                    setError("")
                  }
                  className="shrink-0 rounded-lg p-1 hover:bg-red-100"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                <p>{success}</p>

                <button
                  onClick={() =>
                    setSuccess("")
                  }
                  className="shrink-0 rounded-lg p-1 hover:bg-green-100"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* STATS */}

            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Coupons"
                value={coupons.length}
                subtitle="All discount codes"
                icon={
                  <Ticket size={20} />
                }
              />

              <StatCard
                title="Active"
                value={activeCoupons}
                subtitle="Currently available"
                icon={<TagIcon />}
              />

              <StatCard
                title="Expired"
                value={expiredCoupons}
                subtitle="No longer available"
                icon={
                  <CalendarDays size={20} />
                }
              />

              <StatCard
                title="Total Uses"
                value={totalUses.toLocaleString()}
                subtitle="Coupon redemptions"
                icon={
                  <Percent size={20} />
                }
              />
            </div>

            {/* FILTERS */}

            <div className="mb-5 rounded-2xl border border-black/10 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_200px]">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                  />

                  <input
                    type="text"
                    placeholder="Search coupon code..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-black/10 bg-[#fafafa] py-3 pl-11 pr-4 text-base sm:text-sm outline-none focus:border-black/30"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-base sm:text-sm outline-none"
                >
                  <option value="All">
                    All Status
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                  <option value="Expired">
                    Expired
                  </option>
                </select>
              </div>
            </div>

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead>
                    <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-black/40">
                      <th className="px-6 py-4 font-medium">
                        Coupon
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Discount
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Min. Order
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Max. Discount
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Usage
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Expires
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
                    {filteredCoupons.map(
                      (coupon) => {
                        const type =
                          getDiscountType(
                            coupon
                          );

                        const value =
                          getDiscountValue(
                            coupon
                          );

                        const used =
                          getUsedCount(
                            coupon
                          );

                        const usageLimit =
                          getUsageLimit(
                            coupon
                          );

                        const status =
                          getCouponStatus(
                            coupon
                          );

                        return (
                          <tr
                            key={coupon.id}
                            className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                                  <Ticket
                                    size={18}
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">
                                      {
                                        coupon.code
                                      }
                                    </p>

                                    <button
                                      onClick={() =>
                                        copyCode(
                                          coupon.code
                                        )
                                      }
                                      className="rounded-md p-1 text-black/35 hover:bg-black/5 hover:text-black"
                                      title="Copy code"
                                    >
                                      <Copy
                                        size={
                                          14
                                        }
                                      />
                                    </button>
                                  </div>

                                  <p className="mt-1 text-xs text-black/40">
                                    {type ===
                                    "percentage"
                                      ? "Percentage discount"
                                      : "Fixed discount"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-sm font-medium">
                              {type ===
                              "percentage"
                                ? `${value}% OFF`
                                : `${formatCurrency(
                                    value
                                  )} OFF`}
                            </td>

                            <td className="px-6 py-5 text-sm text-black/60">
                              {getMinimumOrder(
                                coupon
                              )
                                ? formatCurrency(
                                    getMinimumOrder(
                                      coupon
                                    )
                                  )
                                : "No minimum"}
                            </td>

                            <td className="px-6 py-5 text-sm text-black/60">
                              {getMaximumDiscount(
                                coupon
                              )
                                ? formatCurrency(
                                    getMaximumDiscount(
                                      coupon
                                    )
                                  )
                                : "No limit"}
                            </td>

                            <td className="px-6 py-5">
                              <div className="w-32">
                                <div className="mb-1 flex justify-between text-xs">
                                  <span className="text-black/50">
                                    {used}
                                  </span>

                                  <span className="text-black/35">
                                    {usageLimit ||
                                      "∞"}
                                  </span>
                                </div>

                                {usageLimit >
                                  0 && (
                                  <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                                    <div
                                      className="h-full rounded-full bg-black"
                                      style={{
                                        width: `${Math.min(
                                          (used /
                                            usageLimit) *
                                            100,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-5 text-sm text-black/60">
                              {formatDate(
                                coupon.expires_at
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <StatusBadge
                                status={
                                  status
                                }
                              />
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() =>
                                    toggleStatus(
                                      coupon
                                    )
                                  }
                                  disabled={
                                    togglingId ===
                                    coupon.id
                                  }
                                  className="rounded-lg p-2 hover:bg-black/5 disabled:opacity-40"
                                  title={
                                    coupon.is_active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                >
                                  {togglingId ===
                                  coupon.id ? (
                                    <Loader2
                                      size={
                                        16
                                      }
                                      className="animate-spin"
                                    />
                                  ) : coupon.is_active ? (
                                    <ToggleRight
                                      size={
                                        18
                                      }
                                    />
                                  ) : (
                                    <ToggleLeft
                                      size={
                                        18
                                      }
                                    />
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    openEditModal(
                                      coupon
                                    )
                                  }
                                  className="rounded-lg p-2 hover:bg-black/5"
                                  title="Edit"
                                >
                                  <Pencil
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  onClick={() =>
                                    deleteCoupon(
                                      coupon.id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    coupon.id
                                  }
                                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                                  title="Delete"
                                >
                                  {deletingId ===
                                  coupon.id ? (
                                    <Loader2
                                      size={
                                        16
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={
                                        16
                                      }
                                    />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE */}

            <div className="space-y-3 lg:hidden">
              {filteredCoupons.map(
                (coupon) => {
                  const type =
                    getDiscountType(
                      coupon
                    );

                  const value =
                    getDiscountValue(
                      coupon
                    );

                  const used =
                    getUsedCount(
                      coupon
                    );

                  const usageLimit =
                    getUsageLimit(
                      coupon
                    );

                  const status =
                    getCouponStatus(
                      coupon
                    );

                  return (
                    <div
                      key={coupon.id}
                      className="rounded-2xl border border-black/10 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                            <Ticket
                              size={18}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {
                                  coupon.code
                                }
                              </h3>

                              <button
                                onClick={() =>
                                  copyCode(
                                    coupon.code
                                  )
                                }
                                className="text-black/35"
                              >
                                <Copy
                                  size={14}
                                />
                              </button>
                            </div>

                            <p className="mt-1 text-xs text-black/40">
                              {type ===
                              "percentage"
                                ? `${value}% discount`
                                : `${formatCurrency(
                                    value
                                  )} discount`}
                            </p>
                          </div>
                        </div>

                        <StatusBadge
                          status={
                            status
                          }
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/5 pt-4">
                        <InfoItem
                          label="Minimum Order"
                          value={
                            getMinimumOrder(
                              coupon
                            )
                              ? formatCurrency(
                                  getMinimumOrder(
                                    coupon
                                  )
                                )
                              : "None"
                          }
                        />

                        <InfoItem
                          label="Max Discount"
                          value={
                            getMaximumDiscount(
                              coupon
                            )
                              ? formatCurrency(
                                  getMaximumDiscount(
                                    coupon
                                  )
                                )
                              : "None"
                          }
                        />

                        <InfoItem
                          label="Expires"
                          value={formatDate(
                            coupon.expires_at
                          )}
                        />

                        <InfoItem
                          label="Used"
                          value={`${used} / ${
                            usageLimit ||
                            "∞"
                          }`}
                        />
                      </div>

                      <div className="mt-5 flex gap-2 border-t border-black/5 pt-4">
                        <button
                          onClick={() =>
                            toggleStatus(
                              coupon
                            )
                          }
                          disabled={
                            togglingId ===
                            coupon.id
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm disabled:opacity-40"
                        >
                          {togglingId ===
                          coupon.id ? (
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                          ) : coupon.is_active ? (
                            <ToggleRight
                              size={17}
                            />
                          ) : (
                            <ToggleLeft
                              size={17}
                            />
                          )}

                          {coupon.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          onClick={() =>
                            openEditModal(
                              coupon
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm"
                        >
                          <Pencil
                            size={15}
                          />

                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteCoupon(
                              coupon.id
                            )
                          }
                          disabled={
                            deletingId ===
                            coupon.id
                          }
                          className="rounded-xl border border-red-100 px-4 py-3 text-red-500 disabled:opacity-40"
                        >
                          {deletingId ===
                          coupon.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={16}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* EMPTY */}

            {filteredCoupons.length ===
              0 && (
              <div className="rounded-2xl border border-black/10 bg-white py-16 text-center">
                <Ticket
                  size={30}
                  className="mx-auto text-black/20"
                />

                <h3 className="mt-4 font-medium">
                  No coupons found
                </h3>

                <p className="mt-1 text-sm text-black/40">
                  {search ||
                  statusFilter !==
                    "All"
                    ? "Try another search or filter."
                    : "Create your first coupon."}
                </p>

                {!search &&
                  statusFilter ===
                    "All" && (
                    <button
                      onClick={
                        openCreateModal
                      }
                      className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
                    >
                      <Plus
                        size={16}
                        className="mr-2 inline"
                      />
                      Create Coupon
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingCoupon
                    ? "Edit Coupon"
                    : "Create Coupon"}
                </h2>

                <p className="mt-1 text-xs text-black/40">
                  Set the discount rules for
                  this coupon.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* CODE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Coupon Code
                </label>

                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value
                        .toUpperCase()
                        .replace(
                          /\s/g,
                          ""
                        ),
                    })
                  }
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm uppercase outline-none focus:border-black/30"
                />
              </div>

              {/* TYPE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Discount Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "percentage",
                      })
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm ${
                      form.type ===
                      "percentage"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <Percent
                      size={16}
                    />

                    Percentage
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "fixed",
                      })
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm ${
                      form.type ===
                      "fixed"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <CircleDollarSign
                      size={16}
                    />

                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* VALUE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Discount Value
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={
                      form.type ===
                      "percentage"
                        ? "100"
                        : undefined
                    }
                    step="0.01"
                    placeholder={
                      form.type ===
                      "percentage"
                        ? "10"
                        : "15000"
                    }
                    value={form.value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        value:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 pr-12 text-sm outline-none focus:border-black/30"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-black/40">
                    {form.type ===
                    "percentage"
                      ? "%"
                      : "₦"}
                  </span>
                </div>
              </div>

              {/* MINIMUM ORDER */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Minimum Order Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="50000"
                  value={form.minOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minOrder:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/30"
                />

                <p className="mt-1 text-xs text-black/35">
                  Leave 0 for no minimum.
                </p>
              </div>

              {/* MAXIMUM DISCOUNT */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Maximum Discount
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="50000"
                  value={
                    form.maximumDiscount
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maximumDiscount:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/30"
                />

                <p className="mt-1 text-xs text-black/35">
                  Mainly useful for percentage
                  discounts. Leave 0 for no
                  maximum.
                </p>
              </div>

              {/* USAGE LIMIT */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Usage Limit
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="100"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      usageLimit:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/30"
                />

                <p className="mt-1 text-xs text-black/35">
                  Leave 0 for unlimited usage.
                </p>
              </div>

              {/* EXPIRY */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Expiry Date
                </label>

                <input
                  type="date"
                  value={form.expires}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expires:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </div>

              {/* ACTIVE */}

              <div className="rounded-xl border border-black/10 bg-[#fafafa] p-4">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      Active Coupon
                    </p>

                    <p className="mt-1 text-xs text-black/40">
                      Customers can use this
                      coupon when active.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isActive:
                          e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-black"
                  />
                </label>
              </div>

              {/* MODAL ERROR */}

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex gap-3 border-t border-black/10 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-medium disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingCoupon
                    ? "Save Changes"
                    : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTS
|--------------------------------------------------------------------------
*/

function TagIcon() {
  return <Ticket size={20} />;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
        {icon}
      </div>

      <p className="mt-5 text-xs text-black/40">
        {title}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-black/35">
        {subtitle}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active:
      "bg-green-50 text-green-700",

    Inactive:
      "bg-black/5 text-black/50",

    Expired:
      "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-black/5 text-black"
      }`}
    >
      {status}
    </span>
  );
}

function InfoItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs text-black/35">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}