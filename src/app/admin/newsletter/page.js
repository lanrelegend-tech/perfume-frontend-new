"use client";

import { useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import {
  Search,
  Mail,
  Users,
  UserCheck,
  UserX,
  Send,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
} from "lucide-react";

const subscribers = [
  {
    id: 1,
    name: "David Johnson",
    email: "david@example.com",
    joined: "12 Jan 2026",
    status: "Subscribed",
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "sarah@example.com",
    joined: "28 Jan 2026",
    status: "Subscribed",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@example.com",
    joined: "03 Feb 2026",
    status: "Subscribed",
  },
  {
    id: 4,
    name: "Amaka Okafor",
    email: "amaka@example.com",
    joined: "14 Feb 2026",
    status: "Subscribed",
  },
  {
    id: 5,
    name: "Daniel Smith",
    email: "daniel@example.com",
    joined: "20 Feb 2026",
    status: "Unsubscribed",
  },
  {
    id: 6,
    name: "Blessing Adeyemi",
    email: "blessing@example.com",
    joined: "01 Mar 2026",
    status: "Subscribed",
  },
  {
    id: 7,
    name: "James Wilson",
    email: "james@example.com",
    joined: "11 Mar 2026",
    status: "Subscribed",
  },
  {
    id: 8,
    name: "Aisha Mohammed",
    email: "aisha@example.com",
    joined: "18 Mar 2026",
    status: "Subscribed",
  },
  {
    id: 9,
    name: "Samuel Adams",
    email: "samuel@example.com",
    joined: "24 Mar 2026",
    status: "Subscribed",
  },
  {
    id: 10,
    name: "Grace Peter",
    email: "grace@example.com",
    joined: "02 Apr 2026",
    status: "Subscribed",
  },
];

const campaigns = [
  {
    id: 1,
    subject: "New Arrivals Are Here",
    recipients: 1248,
    sent: "18 Sep 2026",
    opened: "68.4%",
    clicked: "24.7%",
    status: "Sent",
  },
  {
    id: 2,
    subject: "20% Off Selected Fragrances",
    recipients: 1192,
    sent: "10 Sep 2026",
    opened: "72.1%",
    clicked: "31.5%",
    status: "Sent",
  },
  {
    id: 3,
    subject: "ORENTEMIST Weekend Collection",
    recipients: 1156,
    sent: "02 Sep 2026",
    opened: "65.8%",
    clicked: "19.2%",
    status: "Sent",
  },
  {
    id: 4,
    subject: "Exclusive VIP Offer",
    recipients: 984,
    sent: "24 Aug 2026",
    opened: "76.3%",
    clicked: "36.8%",
    status: "Sent",
  },
];

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function NewsletterPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("subscribers");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
const [menuId, setMenuId] = useState(null);
const [selectedSubscriber, setSelectedSubscriber] = useState(null);

  const [campaignForm, setCampaignForm] = useState({
    subject: "",
    preview: "",
    content: "",
  });

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((subscriber) => {
      const matchesSearch =
        subscriber.name.toLowerCase().includes(search.toLowerCase()) ||
        subscriber.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || subscriber.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const subscribedCount = subscribers.filter(
    (subscriber) => subscriber.status === "Subscribed"
  ).length;

  const unsubscribedCount = subscribers.filter(
    (subscriber) => subscriber.status === "Unsubscribed"
  ).length;

  const handleCampaignSubmit = (e) => {
    e.preventDefault();

    alert("Newsletter campaign created successfully.");
    setShowCampaignModal(false);

    setCampaignForm({
      subject: "",
      preview: "",
      content: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black">
      {/* Sidebar */}
     <AdminSidebar />

      {/* Main */}
      <main className="lg:ml-[250px]">
  <div className="pt-16 lg:pt-0">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
          <div className="flex h-[82px] items-center justify-between px-5 sm:px-8">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">
                Newsletter
              </h2>
              <p className="mt-1 text-xs text-black/45 sm:text-sm">
                Manage subscribers and email campaigns
              </p>
            </div>

            <button
              onClick={() => setShowCampaignModal(true)}
              className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/80"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Create Campaign</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                  <Users size={20} />
                </div>
                <span className="text-xs text-green-600">+12.4%</span>
              </div>

              <p className="mt-5 text-xs text-black/45">Total Subscribers</p>
              <p className="mt-1 text-2xl font-semibold">1,248</p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5">
                  <UserCheck size={20} />
                </div>
                <span className="text-xs text-green-600">+8.2%</span>
              </div>

              <p className="mt-5 text-xs text-black/45">Active Subscribers</p>
              <p className="mt-1 text-2xl font-semibold">{subscribedCount}</p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5">
                  <UserX size={20} />
                </div>
                <span className="text-xs text-black/35">This month</span>
              </div>

              <p className="mt-5 text-xs text-black/45">Unsubscribed</p>
              <p className="mt-1 text-2xl font-semibold">
                {unsubscribedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/5">
                  <Mail size={20} />
                </div>
                <span className="text-xs text-green-600">+5.6%</span>
              </div>

              <p className="mt-5 text-xs text-black/45">Campaigns Sent</p>
              <p className="mt-1 text-2xl font-semibold">24</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-2 border-b border-black/10">
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`border-b-2 px-4 pb-3 text-sm font-medium transition ${
                activeTab === "subscribers"
                  ? "border-black text-black"
                  : "border-transparent text-black/40"
              }`}
            >
              Subscribers
            </button>

            <button
              onClick={() => setActiveTab("campaigns")}
              className={`border-b-2 px-4 pb-3 text-sm font-medium transition ${
                activeTab === "campaigns"
                  ? "border-black text-black"
                  : "border-transparent text-black/40"
              }`}
            >
              Campaign History
            </button>
          </div>

          {/* Subscribers */}
          {activeTab === "subscribers" && (
            <section className="mt-6">
              <div className="rounded-2xl border border-black/10 bg-white">
                {/* Toolbar */}
                <div className="flex flex-col gap-4 border-b border-black/10 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold">Newsletter Subscribers</h3>
                    <p className="mt-1 text-xs text-black/40">
                      Manage people subscribed to your newsletter
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
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search subscribers..."
                        className="h-10 w-full rounded-xl border border-black/10 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-black sm:w-[230px]"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black"
                    >
                      <option value="All">All Status</option>
                      <option value="Subscribed">Subscribed</option>
                      <option value="Unsubscribed">Unsubscribed</option>
                    </select>
                  </div>
                </div>

                {/* Desktop Table */}
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
                      {filteredSubscribers.map((subscriber) => (
                        <tr
                          key={subscriber.id}
                          className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                                {getInitials(subscriber.name)}
                              </div>

                              <span className="text-sm font-medium">
                                {subscriber.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-black/55">
                            {subscriber.email}
                          </td>

                          <td className="px-5 py-4 text-sm text-black/55">
                            {subscriber.joined}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                subscriber.status === "Subscribed"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {subscriber.status}
                            </span>
                          </td>

                          <td className="relative px-5 py-4 text-right">
                            <button
                              onClick={() =>
                                setMenuId(
                                  menuId === subscriber.id
                                    ? null
                                    : subscriber.id
                                )
                              }
                              className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {menuId === subscriber.id && (
                              <div className="absolute right-5 top-14 z-20 w-36 rounded-xl border border-black/10 bg-white p-1 text-left shadow-xl">
                               <button
  onClick={() => {
    setSelectedSubscriber(subscriber);
    setMenuId(null);
  }}
  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
>
  <Eye size={15} />
  View
</button>

                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-black/5">
                                  <Edit size={15} />
                                  Edit
                                </button>

                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                  <Trash2 size={15} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="divide-y divide-black/5 md:hidden">
                  {filteredSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                            {getInitials(subscriber.name)}
                          </div>

                          <div>
                            <p className="text-sm font-medium">
                              {subscriber.name}
                            </p>
                            <p className="mt-0.5 text-xs text-black/45">
                              {subscriber.email}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            subscriber.status === "Subscribed"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {subscriber.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-black/35">
                            Joined
                          </p>
                          <p className="mt-1 text-xs font-medium">
                            {subscriber.joined}
                          </p>
                        </div>
<button
  onClick={() => setSelectedSubscriber(subscriber)}
  className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium hover:bg-black/5"
>
  View
</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-black/10 px-5 py-4">
                  <p className="text-xs text-black/40">
                    Showing {filteredSubscribers.length} of 1,248 subscribers
                  </p>

                  <div className="flex items-center gap-1">
                    <button className="rounded-lg border border-black/10 p-2 text-black/40 hover:bg-black/5">
                      <ChevronLeft size={15} />
                    </button>

                    <button className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white">
                      1
                    </button>

                    <button className="rounded-lg border border-black/10 px-3 py-2 text-xs hover:bg-black/5">
                      2
                    </button>

                    <button className="rounded-lg border border-black/10 px-3 py-2 text-xs hover:bg-black/5">
                      3
                    </button>

                    <button className="rounded-lg border border-black/10 p-2 text-black/40 hover:bg-black/5">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
{/* Subscriber Details Modal */}
{selectedSubscriber && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-black/10 p-5">
        <div>
          <h3 className="text-lg font-semibold">Subscriber Details</h3>
          <p className="mt-1 text-xs text-black/40">
            Newsletter subscriber information
          </p>
        </div>

        <button
          onClick={() => setSelectedSubscriber(null)}
          className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
            {getInitials(selectedSubscriber.name)}
          </div>

          <div>
            <h4 className="text-base font-semibold">
              {selectedSubscriber.name}
            </h4>
            <p className="mt-1 text-sm text-black/45">
              {selectedSubscriber.email}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-black/10 p-4">
            <p className="text-xs text-black/40">Status</p>
            <p className="mt-1 text-sm font-medium">
              {selectedSubscriber.status}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 p-4">
            <p className="text-xs text-black/40">Email Address</p>
            <p className="mt-1 break-all text-sm font-medium">
              {selectedSubscriber.email}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 p-4">
            <p className="text-xs text-black/40">Subscribed Since</p>
            <p className="mt-1 text-sm font-medium">
              {selectedSubscriber.joined}
            </p>
          </div>

          <div className="rounded-xl border border-black/10 p-4">
            <p className="text-xs text-black/40">Subscriber ID</p>
            <p className="mt-1 text-sm font-medium">
              #{selectedSubscriber.id}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedSubscriber(null)}
          className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/80"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
          {/* Campaign History */}
          {activeTab === "campaigns" && (
            <section className="mt-6">
              <div className="rounded-2xl border border-black/10 bg-white">
                <div className="flex items-center justify-between border-b border-black/10 p-5">
                  <div>
                    <h3 className="font-semibold">Campaign History</h3>
                    <p className="mt-1 text-xs text-black/40">
                      View your previous newsletter campaigns
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="hidden items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-medium text-white sm:flex"
                  >
                    <Plus size={15} />
                    New Campaign
                  </button>
                </div>

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
                      {campaigns.map((campaign) => (
                        <tr
                          key={campaign.id}
                          className="border-b border-black/5 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5">
                                <Mail size={16} />
                              </div>
                              <span className="text-sm font-medium">
                                {campaign.subject}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-black/55">
                            {campaign.recipients.toLocaleString()}
                          </td>

                          <td className="px-5 py-4 text-sm text-black/55">
                            {campaign.sent}
                          </td>

                          <td className="px-5 py-4 text-sm font-medium">
                            {campaign.opened}
                          </td>

                          <td className="px-5 py-4 text-sm font-medium">
                            {campaign.clicked}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              {campaign.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Campaigns */}
                <div className="divide-y divide-black/5 md:hidden">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/5">
                          <Mail size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {campaign.subject}
                          </p>
                          <p className="mt-1 text-xs text-black/40">
                            {campaign.sent}
                          </p>
                        </div>

                        <span className="ml-auto rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-700">
                          Sent
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-black/35">
                            Recipients
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {campaign.recipients.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-black/35">
                            Opened
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {campaign.opened}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-black/35">
                            Clicked
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {campaign.clicked}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
        </div>
      </main>

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 p-5">
              <div>
                <h3 className="text-lg font-semibold">Create Newsletter</h3>
                <p className="mt-1 text-xs text-black/40">
                  Create a campaign for your subscribers
                </p>
              </div>

              <button
                onClick={() => setShowCampaignModal(false)}
                className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCampaignSubmit} className="p-5">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Subject
                  </label>

                  <input
                    required
                    value={campaignForm.subject}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        subject: e.target.value,
                      })
                    }
                    placeholder="e.g. New ORENTEMIST Collection Has Arrived"
                    className="h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Preview Text
                  </label>

                  <input
                    value={campaignForm.preview}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        preview: e.target.value,
                      })
                    }
                    placeholder="Short preview shown in the inbox"
                    className="h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email Content
                  </label>

                  <textarea
                    required
                    rows={8}
                    value={campaignForm.content}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        content: e.target.value,
                      })
                    }
                    placeholder="Write your newsletter content..."
                    className="w-full resize-none rounded-xl border border-black/10 p-4 text-sm outline-none focus:border-black"
                  />
                </div>

                <div className="rounded-xl bg-black/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <Check size={16} />
                    <p className="text-sm font-medium">
                      1,248 subscribers will receive this campaign
                    </p>
                  </div>

                  <p className="mt-1 pl-6 text-xs text-black/40">
                    Only active subscribers will receive the email.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/80"
                >
                  <Send size={15} />
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}