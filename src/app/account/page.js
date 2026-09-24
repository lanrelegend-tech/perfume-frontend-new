"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");


/* =========================================================
   HELPERS
========================================================= */

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOrderStatus(order) {
  return (
    order?.status ||
    order?.order_status ||
    "Processing"
  );
}

function getStatusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("delivered") ||
    value.includes("completed")
  ) {
    return "bg-black text-white";
  }

  if (
    value.includes("cancel") ||
    value.includes("failed")
  ) {
    return "bg-red-50 text-red-600";
  }

  if (
    value.includes("shipped") ||
    value.includes("transit")
  ) {
    return "bg-blue-50 text-blue-600";
  }

  if (
    value.includes("confirmed") ||
    value.includes("processing")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-black/[0.05] text-black/55";
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [activeSection, setActiveSection] =
    useState("overview");

  const [error, setError] = useState("");


  useEffect(() => {
    loadAccount();
  }, []);


  async function loadAccount() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [
        userResponse,
        profileResponse,
        ordersResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/auth/me/`, {
          headers,
        }),

        fetch(`${API_URL}/auth/profile/`, {
          headers,
        }),

        fetch(`${API_URL}/orders/my-orders/`, {
          headers,
        }),
      ]);


      if (
        userResponse.status === 401 ||
        profileResponse.status === 401 ||
        ordersResponse.status === 401
      ) {
        handleLogout();
        return;
      }


      if (userResponse.ok) {
        const userData =
          await userResponse.json();

        setUser(userData);
      }


      if (profileResponse.ok) {
        const profileData =
          await profileResponse.json();

        setProfile(profileData);
      }


      if (ordersResponse.ok) {
        const ordersData =
          await ordersResponse.json();

        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        } else if (
          Array.isArray(ordersData?.results)
        ) {
          setOrders(ordersData.results);
        }
      }

    } catch (error) {
      console.error(
        "Failed to load account:",
        error
      );

      setError(
        "We couldn't load your account right now."
      );

    } finally {
      setLoading(false);
      setOrdersLoading(false);
    }
  }


  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/login";
  }


  /* =========================================================
     USER DATA
  ========================================================= */

  const displayName =
    profile?.first_name ||
    user?.first_name ||
    user?.username ||
    "Customer";


  const fullName =
    [
      profile?.first_name || user?.first_name,
      profile?.last_name || user?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    "Customer";


  const email =
    profile?.email ||
    user?.email ||
    "";


  const phone =
    profile?.phone ||
    user?.phone ||
    "";


  const address =
    profile?.address ||
    user?.address ||
    "";


  /* =========================================================
     LATEST ORDER PERSONAL INFORMATION
  ========================================================= */

  const latestOrder =
    orders[0] || null;


  const latestOrderIsPickup =
    String(
      latestOrder?.delivery_method || ""
    ).toLowerCase() === "pickup";


  const personalPhone =
    latestOrder?.phone ||
    phone ||
    "";


  const personalAddress =
    latestOrder
      ? latestOrderIsPickup
        ? "Pickup order — no delivery address"
        : [
            latestOrder.address,
            latestOrder.city,
            latestOrder.state,
          ]
            .filter(Boolean)
            .join(", ") || "—"
      : address || "";


  /* =========================================================
     STATS
  ========================================================= */

  const totalOrders =
    orders.length;


  const deliveredOrders =
    orders.filter((order) => {
      const status =
        String(
          getOrderStatus(order)
        ).toLowerCase();

      return (
        status.includes("delivered") ||
        status.includes("completed")
      );
    }).length;


  const activeOrders =
    totalOrders - deliveredOrders;


  if (loading) {
    return <AccountSkeleton />;
  }


  return (
    <main className="min-h-screen bg-[#f6f6f2] text-black pb-24 lg:pb-0">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-[#f6f6f2]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:h-[76px] sm:px-7 lg:px-10">

          <Link
            href="/"
            className="text-[15px] font-semibold tracking-[0.28em] sm:text-lg"
          >
            ORENTEMIST
          </Link>


          <div className="flex items-center gap-2">

            <Link
              href="/products"
              className="flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-black/60"
            >
              Shop
            </Link>

            <Link
              href="/cart"
              className="flex h-10 items-center rounded-full bg-black px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-white"
            >
              Cart
            </Link>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-7 sm:py-10 lg:px-10 lg:py-14">

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="mb-7">

          <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-black/35">
            My Account
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">

            <div>

              <h1 className="text-[30px] font-light leading-tight tracking-[-0.03em] sm:text-4xl">
                Hello, {displayName}.
              </h1>

              <p className="mt-2 max-w-[260px] text-xs leading-5 text-black/40 sm:max-w-none">
                Manage your orders and personal information.
              </p>

            </div>


            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-sm font-light text-white sm:flex">
              {String(displayName)
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        )}


        {/* =================================================
            MOBILE / DESKTOP NAV
        ================================================= */}

        <div className="mb-7 overflow-x-auto scrollbar-none">

          <div className="flex min-w-max gap-2">

            <SectionTab
              active={
                activeSection === "overview"
              }
              onClick={() =>
                setActiveSection("overview")
              }
            >
              Overview
            </SectionTab>


            <SectionTab
              active={
                activeSection === "orders"
              }
              onClick={() =>
                setActiveSection("orders")
              }
            >
              Orders
              {totalOrders > 0 && (
                <span className="ml-2 opacity-50">
                  {totalOrders}
                </span>
              )}
            </SectionTab>


            <SectionTab
              active={
                activeSection === "profile"
              }
              onClick={() =>
                setActiveSection("profile")
              }
            >
              Personal info
            </SectionTab>

          </div>

        </div>


        {/* =================================================
            OVERVIEW
        ================================================= */}

        {activeSection === "overview" && (
          <div>

            {/* STATS */}

            <div className="grid grid-cols-3 gap-2 sm:gap-3">

              <StatCard
                number={totalOrders}
                label="Orders"
              />

              <StatCard
                number={activeOrders}
                label="Active"
              />

              <StatCard
                number={deliveredOrders}
                label="Delivered"
              />

            </div>


            {/* RECENT ORDERS */}

            <section className="mt-9">

              <div className="flex items-end justify-between">

                <div>

                  <p className="text-[9px] uppercase tracking-[0.3em] text-black/30">
                    Activity
                  </p>

                  <h2 className="mt-2 text-2xl font-light tracking-[-0.02em]">
                    Recent orders
                  </h2>

                </div>


                {orders.length > 0 && (
                  <button
                    onClick={() =>
                      setActiveSection("orders")
                    }
                    className="hidden text-[10px] font-medium uppercase tracking-[0.15em] text-black/45 sm:block"
                  >
                    View all →
                  </button>
                )}

              </div>


              <div className="mt-5">

                {ordersLoading ? (
                  <OrderSkeleton />
                ) : orders.length === 0 ? (
                  <EmptyOrders />
                ) : (
                  <div className="space-y-3">
                    {orders
                      .slice(0, 4)
                      .map((order) => (
                        <OrderRow
                          key={order.id}
                          order={order}
                        />
                      ))}
                  </div>
                )}

              </div>

            </section>


            {/* SHOP CTA */}

            <section className="mt-8 overflow-hidden rounded-[24px] bg-black px-6 py-8 text-white sm:px-9 sm:py-10">

              <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                ORENTEMIST
              </p>

              <h2 className="mt-3 max-w-md text-2xl font-light leading-tight sm:text-3xl">
                Discover your next signature scent.
              </h2>

              <Link
                href="/products"
                className="mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-xs font-medium text-black"
              >
                Explore collection
              </Link>

            </section>

          </div>
        )}


        {/* =================================================
            ORDERS
        ================================================= */}

        {activeSection === "orders" && (
          <section>

            <div className="mb-6">

              <p className="text-[9px] uppercase tracking-[0.3em] text-black/30">
                Your history
              </p>

              <h2 className="mt-2 text-3xl font-light tracking-[-0.03em]">
                Orders
              </h2>

              <p className="mt-2 text-xs leading-5 text-black/40">
                Your complete ORENTEMIST order history.
              </p>

            </div>


            {ordersLoading ? (
              <OrderSkeleton />
            ) : orders.length === 0 ? (
              <EmptyOrders />
            ) : (
              <div className="space-y-3">

                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                  />
                ))}

              </div>
            )}

          </section>
        )}


        {/* =================================================
            PERSONAL INFORMATION
        ================================================= */}

        {activeSection === "profile" && (
          <section>

            <div className="mb-6">

              <p className="text-[9px] uppercase tracking-[0.3em] text-black/30">
                Account
              </p>

              <h2 className="mt-2 text-3xl font-light tracking-[-0.03em]">
                Personal information
              </h2>

              <p className="mt-2 max-w-md text-xs leading-5 text-black/40">
                Your account details and the contact information used on your latest order.
              </p>

            </div>


            {/* IDENTITY CARD */}

            <div className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white">

              <div className="flex items-center gap-4 border-b border-black/[0.06] px-5 py-5 sm:px-7">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-sm text-white">
                  {String(displayName)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">

                  <p className="truncate text-sm font-medium">
                    {fullName}
                  </p>

                  <p className="mt-1 truncate text-xs text-black/40">
                    {email || "No email"}
                  </p>

                </div>

              </div>


              <div className="divide-y divide-black/[0.06]">

                <InfoRow
                  label="First name"
                  value={
                    profile?.first_name ||
                    user?.first_name ||
                    "—"
                  }
                />

                <InfoRow
                  label="Last name"
                  value={
                    profile?.last_name ||
                    user?.last_name ||
                    "—"
                  }
                />

                <InfoRow
                  label="Username"
                  value={
                    user?.username || "—"
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    email || "—"
                  }
                />

                <InfoRow
                  label="Phone used for latest order"
                  value={
                    personalPhone || "—"
                  }
                />

                <InfoRow
                  label={
                    latestOrderIsPickup
                      ? "Latest order"
                      : "Address used for latest order"
                  }
                  value={
                    personalAddress || "—"
                  }
                />

              </div>

            </div>


            {/* LAST ORDER NOTE */}

            {latestOrder && (
              <div className="mt-4 rounded-[18px] bg-black/[0.035] px-5 py-5">

                <div className="flex gap-3">

                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs">
                    ✓
                  </div>

                  <div>

                    <p className="text-xs font-medium">
                      Information from your latest order
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-black/45">
                      Your phone and address above come from your most recent order. This keeps your order information accurate even if your account details change later.
                    </p>

                  </div>

                </div>

              </div>
            )}


            {/* SUPPORT */}

            <div className="mt-6 rounded-[22px] border border-black/[0.08] bg-white p-5 sm:p-7">

              <p className="text-[9px] uppercase tracking-[0.28em] text-black/30">
                Need help?
              </p>

              <h3 className="mt-3 text-lg font-light">
                Need to change something?
              </h3>

              <p className="mt-2 text-xs leading-5 text-black/40">
                Contact our team if you need help updating your account or with an existing order.
              </p>

              <Link
                href="/contact"
                className="mt-5 inline-flex min-h-11 items-center rounded-full bg-black px-6 text-xs font-medium text-white"
              >
                Contact us
              </Link>

            </div>

          </section>
        )}

      </div>


      {/* =================================================
          MOBILE BOTTOM NAV
      ================================================= */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.08] bg-[#f6f6f2]/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          <BottomNavItem
            active={
              activeSection === "overview"
            }
            onClick={() =>
              setActiveSection("overview")
            }
            icon="⌂"
            label="Home"
          />

          <BottomNavItem
            active={
              activeSection === "orders"
            }
            onClick={() =>
              setActiveSection("orders")
            }
            icon="□"
            label="Orders"
            badge={
              totalOrders > 0
                ? totalOrders
                : null
            }
          />

          <BottomNavItem
            active={
              activeSection === "profile"
            }
            onClick={() =>
              setActiveSection("profile")
            }
            icon="○"
            label="Profile"
          />

          <Link
            href="/cart"
            className="flex min-h-[52px] min-w-[62px] flex-col items-center justify-center gap-1 rounded-2xl text-black/45"
          >
            <span className="text-lg leading-none">
              +
            </span>

            <span className="text-[9px] font-medium uppercase tracking-[0.12em]">
              Cart
            </span>
          </Link>

        </div>

      </nav>

    </main>
  );
}


/* =========================================================
   SECTION TAB
========================================================= */

function SectionTab({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full px-5 text-xs font-medium transition ${
        active
          ? "bg-black text-white"
          : "border border-black/10 bg-white text-black/50"
      }`}
    >
      {children}
    </button>
  );
}


/* =========================================================
   BOTTOM NAV
========================================================= */

function BottomNavItem({
  active,
  onClick,
  icon,
  label,
  badge,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-[52px] min-w-[62px] flex-col items-center justify-center gap-1 rounded-2xl transition ${
        active
          ? "bg-black text-white"
          : "text-black/45"
      }`}
    >

      <span className="text-lg leading-none">
        {icon}
      </span>

      <span className="text-[9px] font-medium uppercase tracking-[0.12em]">
        {label}
      </span>

      {badge && (
        <span
          className={`absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] ${
            active
              ? "bg-white text-black"
              : "bg-black text-white"
          }`}
        >
          {badge}
        </span>
      )}

    </button>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  number,
  label,
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.07] bg-white px-4 py-5 sm:px-6 sm:py-6">

      <p className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
        {number}
      </p>

      <p className="mt-2 text-[8px] font-medium uppercase tracking-[0.18em] text-black/35 sm:text-[9px]">
        {label}
      </p>

    </div>
  );
}


/* =========================================================
   ORDER ROW
========================================================= */

function OrderRow({
  order,
}) {
  const status =
    getOrderStatus(order);

  const orderNumber =
    order?.order_number ||
    order?.number ||
    `#${order?.id}`;


  const total =
    order?.total_amount ??
    order?.total ??
    order?.total_amount ??
    order?.amount ??
    0;


  const created =
    order?.created_at ||
    order?.date ||
    order?.ordered_at;


  const isPickup =
    String(
      order?.delivery_method || ""
    ).toLowerCase() === "pickup";


  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="block rounded-[20px] border border-black/[0.08] bg-white p-5 transition active:scale-[0.99] sm:p-6"
    >

      {/* TOP */}

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="truncate text-sm font-medium">
            {orderNumber}
          </p>

          <p className="mt-1.5 text-[11px] text-black/35">
            {formatDate(created)}
          </p>

        </div>


        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.12em] ${getStatusStyle(
            status
          )}`}
        >
          {status}
        </span>

      </div>


      {/* FULFILMENT */}

      <div className="mt-5 rounded-[14px] bg-[#f7f7f4] px-4 py-3">

        <div className="flex items-center justify-between gap-3">

          <div>

            <p className="text-[8px] uppercase tracking-[0.18em] text-black/30">
              Fulfilment
            </p>

            <p className="mt-1 text-xs font-medium">
              {isPickup
                ? "Pickup"
                : "Home delivery"}
            </p>

          </div>


          <div className="text-right">

            <p className="text-[8px] uppercase tracking-[0.18em] text-black/30">
              Total
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatPrice(total)}
            </p>

          </div>

        </div>

      </div>


      {/* DELIVERY / PICKUP INFO */}

      <div className="mt-4">

        {isPickup ? (

          <div>

            <p className="text-[8px] uppercase tracking-[0.18em] text-black/30">
              Pickup location
            </p>

            <p className="mt-1.5 text-xs leading-5 text-black/65">
              {order?.pickup_address ||
                "Pickup location available in order details"}
            </p>

          </div>

        ) : (

          <div>

            <p className="text-[8px] uppercase tracking-[0.18em] text-black/30">
              Delivery address
            </p>

            <p className="mt-1.5 text-xs leading-5 text-black/65">
              {[
                order?.address,
                order?.city,
                order?.state,
              ]
                .filter(Boolean)
                .join(", ") ||
                "Address available in order details"}
            </p>

          </div>

        )}

      </div>


      {/* FOOTER */}

      <div className="mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4">

        <p className="text-[10px] text-black/35">
          {order?.phone || "No phone"}
        </p>

        <span className="text-sm text-black/30">
          View order →
        </span>

      </div>

    </Link>
  );
}


/* =========================================================
   PROFILE INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex gap-5 px-5 py-5 sm:px-7">

      <div className="w-[105px] shrink-0">

        <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-black/30">
          {label}
        </p>

      </div>


      <p className="min-w-0 flex-1 break-words text-xs leading-5 text-black/75">
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   EMPTY ORDERS
========================================================= */

function EmptyOrders() {
  return (
    <div className="rounded-[22px] border border-black/[0.08] bg-white px-6 py-14 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f3ef] text-lg">
        ◇
      </div>

      <h3 className="mt-5 text-xl font-light">
        No orders yet
      </h3>

      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-black/40">
        Your fragrance journey starts with discovering your first signature scent.
      </p>

      <Link
        href="/products"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-black px-6 text-xs font-medium text-white"
      >
        Start shopping
      </Link>

    </div>
  );
}


/* =========================================================
   SKELETON
========================================================= */

function OrderSkeleton() {
  return (
    <div className="space-y-3">

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-[190px] animate-pulse rounded-[20px] bg-white"
        />
      ))}

    </div>
  );
}


function AccountSkeleton() {
  return (
    <main className="min-h-screen bg-[#f6f6f2]">

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">

        <div className="h-3 w-20 animate-pulse rounded bg-black/10" />

        <div className="mt-4 h-9 w-64 animate-pulse rounded bg-black/10" />

        <div className="mt-8 grid grid-cols-3 gap-2">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-[18px] bg-white"
            />
          ))}

        </div>

        <div className="mt-7 space-y-3">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-[180px] animate-pulse rounded-[20px] bg-white"
            />
          ))}

        </div>

      </div>

    </main>
  );
}