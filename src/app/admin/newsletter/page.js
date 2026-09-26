"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Search,
  Mail,
  Users,
  UserCheck,
  UserX,
  Send,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function NewsletterPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("subscribers");

  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedSubscriber, setSelectedSubscriber] =
    useState(null);

  const [menuId, setMenuId] = useState(null);

  const [notice, setNotice] = useState(null);

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const authHeaders = () => {
    const token = getToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const showNotice = (type, title, message) => {
    setNotice({
      type,
      title,
      message,
    });

    setTimeout(() => {
      setNotice(null);
    }, 5000);
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/admin/login";
  };

  const fetchSubscribers = async () => {
    try {
      setLoadingSubscribers(true);

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/newsletter/subscribers/`,
        {
          headers: authHeaders(),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to load subscribers."
        );
      }

      setSubscribers(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (error) {
      console.error(
        "Newsletter subscribers error:",
        error
      );

      showNotice(
        "error",
        "Unable to load subscribers",
        error.message ||
          "Please try again."
      );
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/newsletter/campaigns/`,
        {
          headers: authHeaders(),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to load campaigns."
        );
      }

      setCampaigns(
        Array.isArray(data)
          ? data
          : data.campaigns || data.results || []
      );
    } catch (error) {
      console.error(
        "Newsletter campaigns error:",
        error
      );

      showNotice(
        "error",
        "Unable to load campaigns",
        error.message ||
          "Please try again."
      );
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    if (activeTab === "campaigns") {
      fetchCampaigns();
    }
  }, [activeTab]);

  const filteredSubscribers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subscribers.filter((subscriber) => {
      const name = String(
        subscriber.name ||
          subscriber.first_name ||
          ""
      ).toLowerCase();

      const email = String(
        subscriber.email || ""
      ).toLowerCase();

      const rawStatus = String(
        subscriber.status || ""
      ).toLowerCase();

      const normalizedStatus =
        subscriber.status === "subscribed" ||
        subscriber.status === "Subscribed" ||
        subscriber.is_subscribed === true
          ? "Subscribed"
          : "Unsubscribed";

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        normalizedStatus === statusFilter;

      const validStatus =
        rawStatus === "" ||
        rawStatus === "subscribed" ||
        rawStatus === "unsubscribed" ||
        subscriber.is_subscribed !== undefined;

      return (
        matchesSearch &&
        matchesStatus &&
        validStatus
      );
    });
  }, [
    subscribers,
    search,
    statusFilter,
  ]);

  const subscribedCount = subscribers.filter(
    (subscriber) =>
      subscriber.status === "Subscribed" ||
      subscriber.status === "subscribed" ||
      subscriber.is_subscribed === true
  ).length;

  const unsubscribedCount =
    subscribers.length - subscribedCount;

  const totalSubscribers = subscribers.length;

  const campaignsSent = campaigns.filter(
    (campaign) =>
      String(
        campaign.status || ""
      ).toLowerCase() === "sent"
  ).length;

  const getSubscriberName = (subscriber) => {
    if (!subscriber) {
      return "Subscriber";
    }

    const fullName = [
      subscriber.first_name,
      subscriber.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      subscriber.name ||
      fullName ||
      subscriber.email ||
      "Subscriber"
    );
  };

  const getInitials = (name) => {
    if (!name) {
      return "S";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

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

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black">
      <AdminSidebar />

      <main className="lg:ml-[280px]">
        <div className="pt-16 lg:pt-0">
          {/* HEADER */}

          <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
            <div className="flex min-h-[82px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold sm:text-2xl">
                  Newsletter
                </h2>

                <p className="mt-1 text-xs text-black/45 sm:text-sm">
                  Manage subscribers and newsletter campaigns
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    "/admin/newsletter/create"
                  )
                }
                className="flex shrink-0 items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/80"
              >
                <Plus size={16} />

                <span className="hidden sm:inline">
                  Create Campaign
                </span>

                <span className="sm:hidden">
                  Create
                </span>
              </button>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {/* STATS */}

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                  <Users size={20} />
                </div>

                <p className="mt-5 text-xs text-black/45">
                  Total Subscribers
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {totalSubscribers.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5">
                  <UserCheck size={20} />
                </div>

                <p className="mt-5 text-xs text-black/45">
                  Active Subscribers
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {subscribedCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5">
                  <UserX size={20} />
                </div>

                <p className="mt-5 text-xs text-black/45">
                  Unsubscribed
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {unsubscribedCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5">
                  <Mail size={20} />
                </div>

                <p className="mt-5 text-xs text-black/45">
                  Campaigns Sent
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {campaignsSent.toLocaleString()}
                </p>
              </div>
            </div>

            {/* TABS */}

            <div className="mt-8 flex gap-2 overflow-x-auto border-b border-black/10">
              <button
                onClick={() =>
                  setActiveTab("subscribers")
                }
                className={`shrink-0 border-b-2 px-4 pb-3 text-sm font-medium transition ${
                  activeTab === "subscribers"
                    ? "border-black text-black"
                    : "border-transparent text-black/40"
                }`}
              >
                Subscribers
              </button>

              <button
                onClick={() =>
                  setActiveTab("campaigns")
                }
                className={`shrink-0 border-b-2 px-4 pb-3 text-sm font-medium transition ${
                  activeTab === "campaigns"
                    ? "border-black text-black"
                    : "border-transparent text-black/40"
                }`}
              >
                Campaign History
              </button>
            </div>

            {/* SUBSCRIBERS */}

            {activeTab === "subscribers" && (
              <section className="mt-6">
                <div className="rounded-2xl border border-black/10 bg-white">
                  <div className="flex flex-col gap-4 border-b border-black/10 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Newsletter Subscribers
                      </h3>

                      <p className="mt-1 text-xs text-black/40">
                        People currently subscribed to ORENTEMIST newsletters
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
                        />

                        <input
                          value={search}
                          onChange={(event) =>
                            setSearch(
                              event.target.value
                            )
                          }
                          placeholder="Search subscribers..."
                          className="h-10 w-full rounded-xl border border-black/10 bg-white pl-9 pr-4 text-base outline-none transition focus:border-black sm:w-[230px] sm:text-sm"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(
                            event.target.value
                          )
                        }
                        className="h-10 rounded-xl border border-black/10 bg-white px-3 text-base outline-none focus:border-black sm:text-sm"
                      >
                        <option value="All">
                          All Status
                        </option>

                        <option value="Subscribed">
                          Subscribed
                        </option>

                        <option value="Unsubscribed">
                          Unsubscribed
                        </option>
                      </select>

                      <button
                        onClick={fetchSubscribers}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-medium hover:bg-black/5"
                      >
                        <RefreshCw size={15} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {loadingSubscribers ? (
                    <div className="flex min-h-[280px] items-center justify-center">
                      <Loader2
                        size={22}
                        className="animate-spin text-black/40"
                      />
                    </div>
                  ) : filteredSubscribers.length ===
                    0 ? (
                    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
                      <Users
                        size={30}
                        className="text-black/20"
                      />

                      <p className="mt-4 text-sm font-medium">
                        No subscribers found
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        Try changing your search or status filter.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* DESKTOP */}

                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-black/10 text-left">
                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Subscriber
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Email
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Joined
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Status
                              </th>

                              <th className="px-5 py-4 text-right text-xs font-medium text-black/40">
                                Action
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredSubscribers.map(
                              (subscriber) => {
                                const name =
                                  getSubscriberName(
                                    subscriber
                                  );

                                const isSubscribed =
                                  subscriber.status ===
                                    "Subscribed" ||
                                  subscriber.status ===
                                    "subscribed" ||
                                  subscriber.is_subscribed ===
                                    true;

                                return (
                                  <tr
                                    key={
                                      subscriber.id ||
                                      subscriber.email
                                    }
                                    className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                                  >
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                                          {getInitials(
                                            name
                                          )}
                                        </div>

                                        <span className="text-sm font-medium">
                                          {name}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-5 py-4 text-sm text-black/55">
                                      {subscriber.email ||
                                        "—"}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-black/55">
                                      {formatDate(
                                        subscriber.created_at ||
                                          subscriber.joined
                                      )}
                                    </td>

                                    <td className="px-5 py-4">
                                      <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                          isSubscribed
                                            ? "bg-green-50 text-green-700"
                                            : "bg-red-50 text-red-600"
                                        }`}
                                      >
                                        {isSubscribed
                                          ? "Subscribed"
                                          : "Unsubscribed"}
                                      </span>
                                    </td>

                                    <td className="relative px-5 py-4 text-right">
                                      <button
                                        onClick={() =>
                                          setMenuId(
                                            menuId ===
                                              subscriber.id
                                              ? null
                                              : subscriber.id
                                          )
                                        }
                                        className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
                                      >
                                        <MoreHorizontal
                                          size={18}
                                        />
                                      </button>

                                      {menuId ===
                                        subscriber.id && (
                                        <div className="absolute right-5 top-14 z-20 w-36 rounded-xl border border-black/10 bg-white p-1 text-left shadow-xl">
                                          <button
                                            onClick={() => {
                                              setSelectedSubscriber(
                                                subscriber
                                              );

                                              setMenuId(
                                                null
                                              );
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                                          >
                                            <Eye
                                              size={15}
                                            />
                                            View
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE */}

                      <div className="divide-y divide-black/5 md:hidden">
                        {filteredSubscribers.map(
                          (subscriber) => {
                            const name =
                              getSubscriberName(
                                subscriber
                              );

                            const isSubscribed =
                              subscriber.status ===
                                "Subscribed" ||
                              subscriber.status ===
                                "subscribed" ||
                              subscriber.is_subscribed ===
                                true;

                            return (
                              <div
                                key={
                                  subscriber.id ||
                                  subscriber.email
                                }
                                className="p-5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                                      {getInitials(
                                        name
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">
                                        {name}
                                      </p>

                                      <p className="mt-0.5 truncate text-xs text-black/45">
                                        {subscriber.email ||
                                          "—"}
                                      </p>
                                    </div>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                                      isSubscribed
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-600"
                                    }`}
                                  >
                                    {isSubscribed
                                      ? "Subscribed"
                                      : "Unsubscribed"}
                                  </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-black/35">
                                      Joined
                                    </p>

                                    <p className="mt-1 text-xs font-medium">
                                      {formatDate(
                                        subscriber.created_at ||
                                          subscriber.joined
                                      )}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() =>
                                      setSelectedSubscriber(
                                        subscriber
                                      )
                                    }
                                    className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:bg-black/5"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-3 border-t border-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-black/40">
                      Showing{" "}
                      {filteredSubscribers.length}{" "}
                      subscriber
                      {filteredSubscribers.length ===
                      1
                        ? ""
                        : "s"}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        disabled
                        className="rounded-lg border border-black/10 p-2 text-black/20"
                      >
                        <ChevronLeft size={15} />
                      </button>

                      <button className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white">
                        1
                      </button>

                      <button
                        disabled
                        className="rounded-lg border border-black/10 p-2 text-black/20"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* CAMPAIGN HISTORY */}

            {activeTab === "campaigns" && (
              <section className="mt-6">
                <div className="rounded-2xl border border-black/10 bg-white">
                  <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Campaign History
                      </h3>

                      <p className="mt-1 text-xs text-black/40">
                        Newsletter campaigns created and sent through Brevo
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={fetchCampaigns}
                        className="flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium hover:bg-black/5"
                      >
                        <RefreshCw size={15} />
                        Refresh
                      </button>

                      <button
                        onClick={() =>
                          router.push(
                            "/admin/newsletter/create"
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-black/80"
                      >
                        <Plus size={15} />
                        New Campaign
                      </button>
                    </div>
                  </div>

                  {loadingCampaigns ? (
                    <div className="flex min-h-[280px] items-center justify-center">
                      <Loader2
                        size={22}
                        className="animate-spin text-black/40"
                      />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
                      <Mail
                        size={32}
                        className="text-black/20"
                      />

                      <p className="mt-4 text-sm font-medium">
                        No campaigns yet
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        Your newsletter campaign history will appear here.
                      </p>

                      <button
                        onClick={() =>
                          router.push(
                            "/admin/newsletter/create"
                          )
                        }
                        className="mt-5 flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-black/80"
                      >
                        <Plus size={15} />
                        Create Campaign
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* DESKTOP */}

                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-black/10 text-left">
                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Campaign
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Recipients
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Sent
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Opened
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Clicked
                              </th>

                              <th className="px-5 py-4 text-xs font-medium text-black/40">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {campaigns.map(
                              (campaign) => (
                                <tr
                                  key={
                                    campaign.id ||
                                    campaign.brevo_campaign_id
                                  }
                                  className="border-b border-black/5 last:border-0"
                                >
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5">
                                        <Mail
                                          size={16}
                                        />
                                      </div>

                                      <div className="min-w-0">
                                        <span className="block truncate text-sm font-medium">
                                          {campaign.subject ||
                                            campaign.name ||
                                            "Untitled campaign"}
                                        </span>

                                        {campaign.name &&
                                          campaign.subject && (
                                            <span className="mt-0.5 block truncate text-xs text-black/35">
                                              {campaign.name}
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-5 py-4 text-sm text-black/55">
                                    {Number(
                                      campaign.recipients ||
                                        campaign.recipientsCount ||
                                        0
                                    ).toLocaleString()}
                                  </td>

                                  <td className="px-5 py-4 text-sm text-black/55">
                                    {formatDate(
                                      campaign.sentAt ||
                                        campaign.sent_at ||
                                        campaign.created_at
                                    )}
                                  </td>

                                  <td className="px-5 py-4 text-sm font-medium">
                                    {campaign.opened ||
                                      campaign.openedRate ||
                                      "—"}
                                  </td>

                                  <td className="px-5 py-4 text-sm font-medium">
                                    {campaign.clicked ||
                                      campaign.clickRate ||
                                      "—"}
                                  </td>

                                  <td className="px-5 py-4">
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        String(
                                          campaign.status ||
                                            ""
                                        ).toLowerCase() ===
                                        "sent"
                                          ? "bg-green-50 text-green-700"
                                          : "bg-black/5 text-black/60"
                                      }`}
                                    >
                                      {campaign.status ||
                                        "Draft"}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE */}

                      <div className="divide-y divide-black/5 md:hidden">
                        {campaigns.map(
                          (campaign) => (
                            <div
                              key={
                                campaign.id ||
                                campaign.brevo_campaign_id
                              }
                              className="p-5"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/5">
                                  <Mail
                                    size={17}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-medium">
                                    {campaign.subject ||
                                      campaign.name ||
                                      "Untitled campaign"}
                                  </p>

                                  <p className="mt-1 text-xs text-black/40">
                                    {formatDate(
                                      campaign.sentAt ||
                                        campaign.sent_at ||
                                        campaign.created_at
                                    )}
                                  </p>
                                </div>

                                <span
                                  className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                                    String(
                                      campaign.status ||
                                        ""
                                    ).toLowerCase() ===
                                    "sent"
                                      ? "bg-green-50 text-green-700"
                                      : "bg-black/5 text-black/60"
                                  }`}
                                >
                                  {campaign.status ||
                                    "Draft"}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-3">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-black/35">
                                    Recipients
                                  </p>

                                  <p className="mt-1 text-sm font-medium">
                                    {Number(
                                      campaign.recipients ||
                                        campaign.recipientsCount ||
                                        0
                                    ).toLocaleString()}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-black/35">
                                    Opened
                                  </p>

                                  <p className="mt-1 text-sm font-medium">
                                    {campaign.opened ||
                                      campaign.openedRate ||
                                      "—"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-black/35">
                                    Clicked
                                  </p>

                                  <p className="mt-1 text-sm font-medium">
                                    {campaign.clicked ||
                                      campaign.clickRate ||
                                      "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* NOTICE */}

      {notice && (
        <div className="fixed bottom-5 right-5 z-[80] w-[calc(100%-40px)] max-w-sm">
          <div
            className={`rounded-2xl border bg-white p-4 shadow-2xl ${
              notice.type === "success"
                ? "border-green-200"
                : "border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {notice.type === "success" ? (
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-green-600"
                />
              ) : (
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {notice.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-black/55">
                  {notice.message}
                </p>
              </div>

              <button
                onClick={() => setNotice(null)}
                className="ml-auto rounded-lg p-1 text-black/35 hover:bg-black/5"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIBER DETAILS */}

      {selectedSubscriber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 p-5">
              <div>
                <h3 className="text-lg font-semibold">
                  Subscriber Details
                </h3>

                <p className="mt-1 text-xs text-black/40">
                  Newsletter subscriber information
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedSubscriber(null)
                }
                className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  {getInitials(
                    getSubscriberName(
                      selectedSubscriber
                    )
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="truncate text-base font-semibold">
                    {getSubscriberName(
                      selectedSubscriber
                    )}
                  </h4>

                  <p className="mt-1 break-all text-sm text-black/45">
                    {selectedSubscriber.email ||
                      "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-black/10 p-4">
                  <p className="text-xs text-black/40">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedSubscriber.is_subscribed ===
                      false ||
                    selectedSubscriber.status ===
                      "Unsubscribed"
                      ? "Unsubscribed"
                      : "Subscribed"}
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 p-4">
                  <p className="text-xs text-black/40">
                    Email Address
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {selectedSubscriber.email ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-black/10 p-4">
                  <p className="text-xs text-black/40">
                    Subscribed Since
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(
                      selectedSubscriber.created_at ||
                        selectedSubscriber.joined
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedSubscriber(null)
                }
                className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}