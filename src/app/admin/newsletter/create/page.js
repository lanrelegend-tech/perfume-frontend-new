"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import {
  ArrowLeft,
  Upload,
  Mail,
  Users,
  UserCheck,
  UserPlus,
  Eye,
  Send,
  Save,
  X,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Monitor,
  UserRound,
  ShoppingBag,
  Ban,
  RefreshCw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function CreateNewsletterCampaignPage() {
  const router = useRouter();

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    preview: "",
    heading: "",
    body: "",
    buttonText: "",
    buttonUrl: "",
    heroImage: "",
    senderName: "ORENTEMIST",
    senderEmail: "hello@orentemist.online",
  });

  const [recipientType, setRecipientType] =
    useState("subscribers");

  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] =
    useState(true);

  const [selectedSubscribers, setSelectedSubscribers] =
    useState([]);

  const [subscriberSearch, setSubscriberSearch] =
    useState("");

  const [excludeEmails, setExcludeEmails] =
    useState([]);

  const [excludeEmailInput, setExcludeEmailInput] =
    useState("");

  const [audienceLoading, setAudienceLoading] =
    useState(false);

  const [audienceData, setAudienceData] =
    useState({
      recipient_count: 0,
      counts: {
        subscribers: 0,
        users: 0,
        customers: 0,
        everyone: 0,
      },
      excluded_count: 0,
    });

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testLoading, setTestLoading] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [testEmail, setTestEmail] = useState("");

  const [notice, setNotice] = useState(null);

  const [showPreview, setShowPreview] =
    useState(false);

  const [previewDevice, setPreviewDevice] =
    useState("desktop");

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

  const handleUnauthorized = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/admin/login";
  };

  const showNotice = (
    type,
    title,
    message
  ) => {
    setNotice({
      type,
      title,
      message,
    });

    setTimeout(() => {
      setNotice(null);
    }, 5000);
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
            data.error ||
            "Unable to load subscribers."
        );
      }

      const list = Array.isArray(data)
        ? data
        : data.results || [];

      setSubscribers(list);
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

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const activeSubscribers = useMemo(() => {
    return subscribers.filter(
      (subscriber) =>
        subscriber.status === "Subscribed" ||
        subscriber.status === "subscribed" ||
        subscriber.is_subscribed === true
    );
  }, [subscribers]);

  const filteredSubscribers = useMemo(() => {
    const query =
      subscriberSearch.trim().toLowerCase();

    if (!query) {
      return activeSubscribers;
    }

    return activeSubscribers.filter(
      (subscriber) => {
        const name = [
          subscriber.first_name,
          subscriber.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const email = String(
          subscriber.email || ""
        ).toLowerCase();

        return (
          name.includes(query) ||
          email.includes(query)
        );
      }
    );
  }, [
    activeSubscribers,
    subscriberSearch,
  ]);

  const selectedSubscriberObjects =
    useMemo(() => {
      return activeSubscribers.filter(
        (subscriber) => {
          const id =
            subscriber.id ||
            subscriber.email;

          return selectedSubscribers.includes(id);
        }
      );
    }, [
      activeSubscribers,
      selectedSubscribers,
    ]);

  const recipientCount =
    audienceData.recipient_count || 0;

  const updateField = (
    field,
    value
  ) => {
    setCampaignForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleSubscriber = (id) => {
    setSelectedSubscribers(
      (previous) =>
        previous.includes(id)
          ? previous.filter(
              (item) => item !== id
            )
          : [...previous, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds =
      filteredSubscribers.map(
        (subscriber) =>
          subscriber.id ||
          subscriber.email
      );

    setSelectedSubscribers((previous) => {
      const combined = [
        ...previous,
        ...visibleIds,
      ];

      return [...new Set(combined)];
    });
  };

  const clearSelected = () => {
    setSelectedSubscribers([]);
  };

  const addExcludeEmail = () => {
    const email =
      excludeEmailInput
        .trim()
        .toLowerCase();

    if (!email) {
      return;
    }

    if (!email.includes("@")) {
      showNotice(
        "error",
        "Invalid email",
        "Enter a valid email address."
      );
      return;
    }

    if (excludeEmails.includes(email)) {
      setExcludeEmailInput("");
      return;
    }

    setExcludeEmails((previous) => [
      ...previous,
      email,
    ]);

    setExcludeEmailInput("");
  };

  const removeExcludeEmail = (email) => {
    setExcludeEmails((previous) =>
      previous.filter(
        (item) => item !== email
      )
    );
  };

  const getAudiencePayload = () => {
    let include = [];

    if (recipientType === "subscribers") {
      include = ["subscribers"];
    }

    if (recipientType === "users") {
      include = ["users"];
    }

    if (recipientType === "customers") {
      include = ["customers"];
    }

    if (recipientType === "both") {
      include = [
        "subscribers",
        "customers",
      ];
    }

    if (recipientType === "everyone") {
      include = ["everyone"];
    }

    if (recipientType === "selected") {
      include = ["selected"];
    }

    return {
      include,
      exclude: [],
      exclude_emails: excludeEmails,
      selected_subscriber_ids:
        selectedSubscribers,
    };
  };

  const previewAudience = async () => {
    try {
      setAudienceLoading(true);

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/newsletter/audience/preview/`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(
            getAudiencePayload()
          ),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const data =
        await response.json().catch(
          () => ({})
        );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            data.message ||
            "Unable to calculate audience."
        );
      }

      setAudienceData({
        recipient_count:
          Number(
            data.recipient_count ||
              data.count ||
              0
          ),
        counts:
          data.counts || {
            subscribers: 0,
            users: 0,
            customers: 0,
            everyone: 0,
          },
        excluded_count:
          Number(
            data.excluded_count || 0
          ),
      });
    } catch (error) {
      console.error(
        "Audience preview error:",
        error
      );

      showNotice(
        "error",
        "Audience preview failed",
        error.message ||
          "Unable to calculate recipients."
      );

      setAudienceData({
        recipient_count: 0,
        counts: {
          subscribers: 0,
          users: 0,
          customers: 0,
          everyone: 0,
        },
        excluded_count: 0,
      });
    } finally {
      setAudienceLoading(false);
    }
  };

  useEffect(() => {
    if (loadingSubscribers) {
      return;
    }

    const timeout = setTimeout(() => {
      previewAudience();
    }, 250);

    return () => clearTimeout(timeout);
  }, [
    recipientType,
    selectedSubscribers,
    excludeEmails,
    loadingSubscribers,
  ]);

  const validateCampaign = () => {
    if (!campaignForm.name.trim()) {
      showNotice(
        "error",
        "Campaign name required",
        "Enter a name for this newsletter campaign."
      );

      return false;
    }

    if (!campaignForm.subject.trim()) {
      showNotice(
        "error",
        "Subject required",
        "Enter an email subject."
      );

      return false;
    }

    if (!campaignForm.heading.trim()) {
      showNotice(
        "error",
        "Heading required",
        "Enter the main newsletter heading."
      );

      return false;
    }

    if (!campaignForm.body.trim()) {
      showNotice(
        "error",
        "Newsletter content required",
        "Add some content to your newsletter."
      );

      return false;
    }

    if (
      campaignForm.buttonText.trim() &&
      !campaignForm.buttonUrl.trim()
    ) {
      showNotice(
        "error",
        "Button URL required",
        "Add a URL for your newsletter button."
      );

      return false;
    }

    if (recipientType === "selected") {
      if (
        selectedSubscribers.length === 0
      ) {
        showNotice(
          "error",
          "No recipients selected",
          "Select at least one subscriber."
        );

        return false;
      }
    }

    if (recipientCount === 0) {
      showNotice(
        "error",
        "No recipients",
        "Choose at least one recipient before continuing."
      );

      return false;
    }

    return true;
  };

  const handleImageUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showNotice(
        "error",
        "Invalid image",
        "Please select an image file."
      );

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotice(
        "error",
        "Image too large",
        "Please choose an image smaller than 10MB."
      );

      return;
    }

    try {
      setUploadingImage(true);

      const localPreview =
        URL.createObjectURL(file);

      updateField(
        "heroImage",
        localPreview
      );

      showNotice(
        "success",
        "Image selected",
        "The image is now shown in your newsletter preview."
      );
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      showNotice(
        "error",
        "Image upload failed",
        "Unable to select the image."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const buildPreviewHtml = () => {
    const escapeHtml = (value) => {
      return String(value || "")
        .replaceAll(
          "&",
          "&amp;"
        )
        .replaceAll(
          "<",
          "&lt;"
        )
        .replaceAll(
          ">",
          "&gt;"
        )
        .replaceAll(
          '"',
          "&quot;"
        )
        .replaceAll(
          "'",
          "&#039;"
        );
    };

    const bodyHtml = escapeHtml(
      campaignForm.body
    ).replace(
      /\n/g,
      "<br />"
    );

    const hero =
      campaignForm.heroImage
        ? `
        <img
          src="${escapeHtml(
            campaignForm.heroImage
          )}"
          alt="ORENTEMIST"
          style="
            width:100%;
            display:block;
            max-height:420px;
            object-fit:cover;
          "
        />
      `
        : "";

    const button =
      campaignForm.buttonText &&
      campaignForm.buttonUrl
        ? `
          <div style="text-align:center;margin-top:30px;">
            <a
              href="${escapeHtml(
                campaignForm.buttonUrl
              )}"
              style="
                display:inline-block;
                background:#000;
                color:#fff;
                text-decoration:none;
                padding:14px 28px;
                border-radius:8px;
                font-family:Arial,sans-serif;
                font-size:14px;
                font-weight:600;
              "
            >
              ${escapeHtml(
                campaignForm.buttonText
              )}
            </a>
          </div>
        `
        : "";

    return `
      <div
        style="
          margin:0;
          padding:40px 20px;
          background:#f5f5f5;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <div
          style="
            width:100%;
            max-width:680px;
            margin:0 auto;
            background:#ffffff;
            overflow:hidden;
          "
        >
          ${hero}

          <div
            style="
              padding:42px 34px;
            "
          >
            <div
              style="
                margin-bottom:28px;
                font-size:12px;
                font-weight:700;
                letter-spacing:3px;
                text-align:center;
                color:#000;
              "
            >
              ORENTEMIST
            </div>

            <h1
              style="
                margin:0;
                color:#111;
                font-size:32px;
                line-height:1.2;
                text-align:center;
                font-weight:600;
              "
            >
              ${escapeHtml(
                campaignForm.heading
              )}
            </h1>

            <div
              style="
                margin-top:25px;
                color:#555;
                font-size:15px;
                line-height:1.8;
                text-align:left;
              "
            >
              ${bodyHtml}
            </div>

            ${button}

            <div
              style="
                margin-top:45px;
                padding-top:22px;
                border-top:1px solid #eee;
                text-align:center;
                color:#999;
                font-size:11px;
                line-height:1.6;
              "
            >
              You are receiving this email because
              you subscribed to ORENTEMIST newsletters.
              <br />
              © ORENTEMIST
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const buildCampaignPayload = () => {
    return {
      name: campaignForm.name.trim(),
      subject:
        campaignForm.subject.trim(),
      preview:
        campaignForm.preview.trim(),
      heading:
        campaignForm.heading.trim(),
      body:
        campaignForm.body.trim(),
      button_text:
        campaignForm.buttonText.trim(),
      button_url:
        campaignForm.buttonUrl.trim(),
      hero_image:
        campaignForm.heroImage,
      sender_name:
        campaignForm.senderName.trim(),
      sender_email:
        campaignForm.senderEmail.trim(),

      recipient_type:
        recipientType,

      recipient_ids:
        selectedSubscribers,

      include:
        getAudiencePayload().include,

      exclude:
        getAudiencePayload().exclude,

      exclude_emails:
        excludeEmails,

      selected_subscriber_ids:
        selectedSubscribers,

      audience_config: {
        include:
          getAudiencePayload().include,
        exclude:
          getAudiencePayload().exclude,
        exclude_emails:
          excludeEmails,
        selected_subscriber_ids:
          selectedSubscribers,
      },
    };
  };

  const createCampaign = async () => {
    const response = await fetch(
      `${API_URL}/newsletter/campaigns/`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(
          buildCampaignPayload()
        ),
      }
    );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      handleUnauthorized();
      return null;
    }

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.error ||
          data.message ||
          "Unable to create newsletter."
      );
    }

    return data;
  };

  const handleSaveDraft = async () => {
    if (!validateCampaign()) {
      return;
    }

    try {
      setSaving(true);

      const data =
        await createCampaign();

      if (!data) {
        return;
      }

      showNotice(
        "success",
        "Draft saved",
        "Your newsletter campaign has been saved as a draft."
      );
    } catch (error) {
      console.error(
        "Save campaign error:",
        error
      );

      showNotice(
        "error",
        "Unable to save draft",
        error.message ||
          "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!validateCampaign()) {
      return;
    }

    const confirmed =
      window.confirm(
        `Send this newsletter to ${recipientCount.toLocaleString()} recipient${
          recipientCount === 1
            ? ""
            : "s"
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSending(true);

      const createData =
        await createCampaign();

      if (!createData) {
        return;
      }

      const campaignId =
        createData.id ||
        createData.campaign_id ||
        createData.brevo_campaign_id ||
        createData.campaign
          ?.id ||
        createData.campaign
          ?.brevo_campaign_id;

      if (!campaignId) {
        throw new Error(
          "Campaign was created but no campaign ID was returned."
        );
      }

      const sendResponse =
        await fetch(
          `${API_URL}/newsletter/campaigns/${campaignId}/send/`,
          {
            method: "POST",
            headers: authHeaders(),
          }
        );

      if (
        sendResponse.status === 401 ||
        sendResponse.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const sendData =
        await sendResponse
          .json()
          .catch(() => ({}));

      if (!sendResponse.ok) {
        throw new Error(
          sendData.detail ||
            sendData.error ||
            sendData.message ||
            "Unable to send newsletter."
        );
      }

      showNotice(
        "success",
        "Newsletter sent",
        `Your newsletter has been sent to ${recipientCount.toLocaleString()} recipient${
          recipientCount === 1
            ? ""
            : "s"
        }.`
      );

      setTimeout(() => {
        router.push(
          "/admin/newsletter"
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Send campaign error:",
        error
      );

      showNotice(
        "error",
        "Newsletter failed",
        error.message ||
          "Unable to send newsletter."
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      showNotice(
        "error",
        "Test email required",
        "Enter an email address for the test."
      );

      return;
    }

    if (!campaignForm.subject.trim()) {
      showNotice(
        "error",
        "Subject required",
        "Add an email subject before sending a test."
      );

      return;
    }

    try {
      setTestLoading(true);

      const payload =
        buildCampaignPayload();

      payload.name =
        campaignForm.name.trim() ||
        "ORENTEMIST Test Newsletter";

      payload.recipient_type =
        "subscribers";

      payload.recipient_ids = [];

      const response =
        await fetch(
          `${API_URL}/newsletter/campaigns/`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(
              payload
            ),
          }
        );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            data.message ||
            "Unable to prepare test newsletter."
        );
      }

      const campaignId =
        data.id ||
        data.campaign_id ||
        data.brevo_campaign_id ||
        data.campaign
          ?.id ||
        data.campaign
          ?.brevo_campaign_id;

      if (!campaignId) {
        throw new Error(
          "Unable to identify the test campaign."
        );
      }

      const testResponse =
        await fetch(
          `${API_URL}/newsletter/campaigns/test/`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              email:
                testEmail.trim(),
              campaign_id:
                campaignId,
            }),
          }
        );

      if (
        testResponse.status === 401 ||
        testResponse.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      const testData =
        await testResponse
          .json()
          .catch(() => ({}));

      if (!testResponse.ok) {
        throw new Error(
          testData.detail ||
            testData.error ||
            testData.message ||
            "Unable to send test email."
        );
      }

      showNotice(
        "success",
        "Test email sent",
        `The test newsletter was sent to ${testEmail.trim()}.`
      );
    } catch (error) {
      console.error(
        "Test email error:",
        error
      );

      showNotice(
        "error",
        "Test failed",
        error.message ||
          "Unable to send test email."
      );
    } finally {
      setTestLoading(false);
    }
  };

  const previewHtml =
    buildPreviewHtml();

  const audienceOptions = [
    {
      id: "subscribers",
      title: "Newsletter Subscribers",
      description:
        "People who explicitly subscribed to receive ORENTEMIST newsletters.",
      icon: Mail,
      count:
        audienceData.counts
          ?.subscribers ??
        activeSubscribers.length,
    },
    {
      id: "users",
      title: "Registered Users",
      description:
        "Customers who have an ORENTEMIST account and an email address.",
      icon: UserPlus,
      count:
        audienceData.counts?.users ??
        0,
    },
    {
      id: "customers",
      title: "Customers Who Bought",
      description:
        "Email addresses from customers with successful paid orders, including guest buyers.",
      icon: ShoppingBag,
      count:
        audienceData.counts
          ?.customers ??
        0,
    },
    {
      id: "both",
      title: "Subscribers + Customers",
      description:
        "Combines active newsletter subscribers with customers who have purchased.",
      icon: Users,
      count:
        (audienceData.counts
          ?.subscribers || 0) +
        (audienceData.counts
          ?.customers || 0),
    },
    {
      id: "everyone",
      title: "Everyone",
      description:
        "Combines all available subscriber, registered-user and customer email audiences with duplicates removed.",
      icon: UserCheck,
      count:
        audienceData.counts
          ?.everyone ??
        0,
    },
    {
      id: "selected",
      title: "Selected Subscribers",
      description:
        "Choose exactly which active newsletter subscribers should receive this campaign.",
      icon: UserRound,
      count:
        selectedSubscribers.length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black">
      <AdminSidebar />

      <main className="lg:ml-[280px]">
        <div className="pt-16 lg:pt-0">

          {/* NOTICE */}

          {notice && (
            <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-md">
              <div
                className={`rounded-2xl border bg-white p-4 shadow-2xl ${
                  notice.type ===
                  "error"
                    ? "border-red-200"
                    : "border-green-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 ${
                      notice.type ===
                      "error"
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {notice.type ===
                    "error" ? (
                      <AlertCircle
                        size={20}
                      />
                    ) : (
                      <CheckCircle2
                        size={20}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {notice.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-black/55">
                      {notice.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotice(null)
                    }
                    className="text-black/30 hover:text-black"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HEADER */}

          <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
            <div className="flex min-h-[82px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() =>
                    router.push(
                      "/admin/newsletter"
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold sm:text-2xl">
                    Create Campaign
                  </h2>

                  <p className="mt-1 hidden text-xs text-black/45 sm:block sm:text-sm">
                    Build and send an ORENTEMIST newsletter
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={
                    saving ||
                    sending
                  }
                  className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                >
                  {saving ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={15} />
                  )}

                  <span className="hidden sm:inline">
                    Save Draft
                  </span>
                </button>

                <button
                  onClick={handleSendCampaign}
                  disabled={
                    saving ||
                    sending
                  }
                  className="flex items-center gap-2 rounded-xl bg-black px-3 py-2.5 text-sm font-medium text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                >
                  {sending ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={15} />
                  )}

                  <span className="hidden sm:inline">
                    Send Newsletter
                  </span>

                  <span className="sm:hidden">
                    Send
                  </span>
                </button>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">

              {/* LEFT */}

              <div className="space-y-6">

                {/* CAMPAIGN DETAILS */}

                <section className="rounded-2xl border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-5">
                    <h3 className="font-semibold">
                      Campaign Details
                    </h3>

                    <p className="mt-1 text-xs text-black/40">
                      Set the basic information for your newsletter.
                    </p>
                  </div>

                  <div className="space-y-5 p-5">

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Campaign Name
                      </label>

                      <input
                        value={
                          campaignForm.name
                        }
                        onChange={(event) =>
                          updateField(
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="e.g. September New Arrivals"
                        className="h-11 w-full rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Email Subject
                      </label>

                      <input
                        value={
                          campaignForm.subject
                        }
                        onChange={(event) =>
                          updateField(
                            "subject",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Discover the latest from ORENTEMIST"
                        className="h-11 w-full rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Preview Text
                      </label>

                      <input
                        value={
                          campaignForm.preview
                        }
                        onChange={(event) =>
                          updateField(
                            "preview",
                            event.target.value
                          )
                        }
                        placeholder="The short preview shown beside the subject in the inbox"
                        className="h-11 w-full rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                      />

                      <p className="mt-2 text-xs text-black/35">
                        Keep this short. It appears next to the subject in many email clients.
                      </p>
                    </div>

                  </div>
                </section>

                {/* HERO IMAGE */}

                <section className="rounded-2xl border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-5">
                    <h3 className="font-semibold">
                      Hero Image
                    </h3>

                    <p className="mt-1 text-xs text-black/40">
                      Add a large image at the top of your newsletter.
                    </p>
                  </div>

                  <div className="p-5">
                    {campaignForm.heroImage ? (
                      <div className="relative overflow-hidden rounded-2xl border border-black/10">
                        <img
                          src={
                            campaignForm.heroImage
                          }
                          alt="Newsletter hero"
                          className="h-[260px] w-full object-cover sm:h-[340px]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              "heroImage",
                              ""
                            )
                          }
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur hover:bg-white"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-black/[0.02] px-5 text-center transition hover:border-black/30 hover:bg-black/[0.04]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={
                            handleImageUpload
                          }
                          className="hidden"
                        />

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
                          {uploadingImage ? (
                            <Loader2
                              size={22}
                              className="animate-spin"
                            />
                          ) : (
                            <Upload size={22} />
                          )}
                        </div>

                        <p className="mt-4 text-sm font-medium">
                          Upload hero image
                        </p>

                        <p className="mt-1 max-w-sm text-xs leading-5 text-black/40">
                          JPG, PNG or WebP. Your final image will be hosted on Cloudinary so it can load inside emails.
                        </p>
                      </label>
                    )}
                  </div>
                </section>

                {/* CONTENT */}

                <section className="rounded-2xl border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-5">
                    <h3 className="font-semibold">
                      Newsletter Content
                    </h3>

                    <p className="mt-1 text-xs text-black/40">
                      Write the content your subscribers will receive.
                    </p>
                  </div>

                  <div className="space-y-5 p-5">

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Heading
                      </label>

                      <input
                        value={
                          campaignForm.heading
                        }
                        onChange={(event) =>
                          updateField(
                            "heading",
                            event.target.value
                          )
                        }
                        placeholder="A new fragrance experience"
                        className="h-11 w-full rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Details / Body
                      </label>

                      <textarea
                        value={
                          campaignForm.body
                        }
                        onChange={(event) =>
                          updateField(
                            "body",
                            event.target.value
                          )
                        }
                        rows={9}
                        placeholder="Write the main details of your newsletter here..."
                        className="w-full resize-y rounded-xl border border-black/10 px-4 py-3 text-base leading-7 outline-none focus:border-black sm:text-sm"
                      />

                      <p className="mt-2 text-xs text-black/35">
                        Separate paragraphs with a new line.
                      </p>
                    </div>

                  </div>
                </section>

                {/* BUTTON */}

                <section className="rounded-2xl border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-5">
                    <h3 className="font-semibold">
                      Call To Action
                    </h3>

                    <p className="mt-1 text-xs text-black/40">
                      Add an optional button to your newsletter.
                    </p>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Button Text
                      </label>

                      <input
                        value={
                          campaignForm.buttonText
                        }
                        onChange={(event) =>
                          updateField(
                            "buttonText",
                            event.target.value
                          )
                        }
                        placeholder="Shop Now"
                        className="h-11 w-full rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Button URL
                      </label>

                      <input
                        type="url"
                        value={
                          campaignForm.buttonUrl
                        }
                        onChange={(event) =>
                          updateField(
                            "buttonUrl",
                            event.target.value
                          )
                        }
                        placeholder="https://www.orentemist.online/shop"
                        className="h-11 w-full rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                      />
                    </div>

                  </div>
                </section>

                {/* RECIPIENTS */}

                <section className="rounded-2xl border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-5">

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">
                          Recipients
                        </h3>

                        <p className="mt-1 text-xs text-black/40">
                          Choose who should receive this campaign.
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {audienceLoading && (
                          <Loader2
                            size={15}
                            className="animate-spin text-black/40"
                          />
                        )}

                        <div className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white">
                          {recipientCount.toLocaleString()} recipient
                          {recipientCount === 1
                            ? ""
                            : "s"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">

                    {/* AUDIENCE OPTIONS */}

                    {audienceOptions.map(
                      (option) => {
                        const Icon =
                          option.icon;

                        const active =
                          recipientType ===
                          option.id;

                        return (
                          <button
                            key={
                              option.id
                            }
                            type="button"
                            onClick={() =>
                              setRecipientType(
                                option.id
                              )
                            }
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              active
                                ? "border-black bg-black text-white"
                                : "border-black/10 hover:border-black/30"
                            }`}
                          >
                            <div className="flex items-start gap-4">

                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                  active
                                    ? "bg-white text-black"
                                    : "bg-black/5"
                                }`}
                              >
                                <Icon
                                  size={
                                    19
                                  }
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">

                                  <p className="text-sm font-semibold">
                                    {
                                      option.title
                                    }
                                  </p>

                                  {active && (
                                    <Check
                                      size={
                                        18
                                      }
                                    />
                                  )}
                                </div>

                                <p
                                  className={`mt-1 text-xs leading-5 ${
                                    active
                                      ? "text-white/60"
                                      : "text-black/40"
                                  }`}
                                >
                                  {
                                    option.description
                                  }
                                </p>

                                <p
                                  className={`mt-2 text-xs font-medium ${
                                    active
                                      ? "text-white/80"
                                      : "text-black/60"
                                  }`}
                                >
                                  {option.count.toLocaleString()} available
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}

                    {/* SELECTED SUBSCRIBERS */}

                    {recipientType ===
                      "selected" && (
                      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">
                              Select subscribers
                            </p>

                            <p className="mt-1 text-xs text-black/40">
                              Select the exact subscribers who should receive this campaign.
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={
                                selectAllVisible
                              }
                              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium hover:bg-black/5"
                            >
                              Select visible
                            </button>

                            <button
                              type="button"
                              onClick={
                                clearSelected
                              }
                              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium hover:bg-black/5"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <input
                            value={
                              subscriberSearch
                            }
                            onChange={(
                              event
                            ) =>
                              setSubscriberSearch(
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Search subscriber name or email..."
                            className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-base outline-none focus:border-black sm:text-sm"
                          />
                        </div>

                        <div className="mt-4 max-h-[380px] overflow-y-auto rounded-xl border border-black/10 bg-white">

                          {loadingSubscribers ? (
                            <div className="flex min-h-[160px] items-center justify-center">
                              <Loader2
                                size={
                                  22
                                }
                                className="animate-spin text-black/40"
                              />
                            </div>
                          ) : filteredSubscribers.length ===
                            0 ? (
                            <div className="p-8 text-center">
                              <Mail
                                size={
                                  25
                                }
                                className="mx-auto text-black/20"
                              />

                              <p className="mt-3 text-sm font-medium">
                                No subscribers found
                              </p>

                              <p className="mt-1 text-xs text-black/40">
                                Try another search.
                              </p>
                            </div>
                          ) : (
                            filteredSubscribers.map(
                              (
                                subscriber
                              ) => {
                                const id =
                                  subscriber.id ||
                                  subscriber.email;

                                const selected =
                                  selectedSubscribers.includes(
                                    id
                                  );

                                const name =
                                  [
                                    subscriber.first_name,
                                    subscriber.last_name,
                                  ]
                                    .filter(
                                      Boolean
                                    )
                                    .join(
                                      " "
                                    );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      id
                                    }
                                    onClick={() =>
                                      toggleSubscriber(
                                        id
                                      )
                                    }
                                    className={`flex w-full items-center gap-3 border-b border-black/5 p-3 text-left last:border-b-0 hover:bg-black/[0.02] ${
                                      selected
                                        ? "bg-black/[0.04]"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                        selected
                                          ? "bg-black text-white"
                                          : "bg-black/5"
                                      }`}
                                    >
                                      {selected ? (
                                        <Check
                                          size={
                                            16
                                          }
                                        />
                                      ) : (
                                        <Mail
                                          size={
                                            15
                                          }
                                        />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium">
                                        {name ||
                                          "Subscriber"}
                                      </p>

                                      <p className="truncate text-xs text-black/45">
                                        {
                                          subscriber.email
                                        }
                                      </p>
                                    </div>
                                  </button>
                                );
                              }
                            )
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-black/40">
                            {filteredSubscribers.length.toLocaleString()} visible
                          </span>

                          <span className="font-medium">
                            {selectedSubscribers.length.toLocaleString()} selected
                          </span>
                        </div>
                      </div>
                    )}

                    {/* EXCLUSIONS */}

                    <div className="rounded-2xl border border-black/10 bg-white p-4">

                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5">
                          <Ban
                            size={18}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            Exclude individual emails
                          </p>

                          <p className="mt-1 text-xs leading-5 text-black/40">
                            These emails will be removed from the final audience even if they belong to another selected group.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <input
                          value={
                            excludeEmailInput
                          }
                          onChange={(
                            event
                          ) =>
                            setExcludeEmailInput(
                              event
                                .target
                                .value
                            )
                          }
                          onKeyDown={(
                            event
                          ) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              event.preventDefault();
                              addExcludeEmail();
                            }
                          }}
                          type="email"
                          placeholder="email@example.com"
                          className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                        />

                        <button
                          type="button"
                          onClick={
                            addExcludeEmail
                          }
                          className="h-11 shrink-0 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-black/80"
                        >
                          Add
                        </button>
                      </div>

                      {excludeEmails.length >
                        0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {excludeEmails.map(
                            (email) => (
                              <div
                                key={
                                  email
                                }
                                className="flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5"
                              >
                                <span className="max-w-[230px] truncate text-xs">
                                  {
                                    email
                                  }
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeExcludeEmail(
                                      email
                                    )
                                  }
                                  className="shrink-0 text-black/40 hover:text-black"
                                >
                                  <X
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    </div>

                    {/* AUDIENCE SUMMARY */}

                    <div className="rounded-2xl bg-black p-5 text-white">

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-white/50">
                            Final audience
                          </p>

                          <p className="mt-1 text-3xl font-semibold">
                            {recipientCount.toLocaleString()}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={
                            previewAudience
                          }
                          disabled={
                            audienceLoading
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50"
                        >
                          {audienceLoading ? (
                            <Loader2
                              size={
                                17
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <RefreshCw
                              size={
                                17
                              }
                            />
                          )}
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                        <div className="rounded-xl bg-white/10 p-3">
                          <p className="text-[11px] text-white/45">
                            Subscribers
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {(
                              audienceData
                                .counts
                                ?.subscribers ||
                              0
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/10 p-3">
                          <p className="text-[11px] text-white/45">
                            Users
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {(
                              audienceData
                                .counts
                                ?.users ||
                              0
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/10 p-3">
                          <p className="text-[11px] text-white/45">
                            Customers
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {(
                              audienceData
                                .counts
                                ?.customers ||
                              0
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/10 p-3">
                          <p className="text-[11px] text-white/45">
                            Excluded
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {(
                              audienceData
                                .excluded_count ||
                              0
                            ).toLocaleString()}
                          </p>
                        </div>

                      </div>

                      <p className="mt-4 text-xs leading-5 text-white/45">
                        Duplicate email addresses are counted only once in the final audience.
                      </p>
                    </div>

                  </div>
                </section>

                {/* TEST EMAIL */}

                <section className="rounded-2xl border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-5">
                    <h3 className="font-semibold">
                      Test Newsletter
                    </h3>

                    <p className="mt-1 text-xs text-black/40">
                      Send a test copy before sending the campaign to your audience.
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="email"
                        value={
                          testEmail
                        }
                        onChange={(
                          event
                        ) =>
                          setTestEmail(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="your@email.com"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 px-4 text-base outline-none focus:border-black sm:text-sm"
                      />

                      <button
                        type="button"
                        onClick={
                          handleSendTest
                        }
                        disabled={
                          testLoading ||
                          saving ||
                          sending
                        }
                        className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 text-sm font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {testLoading ? (
                          <Loader2
                            size={
                              15
                            }
                            className="animate-spin"
                          />
                        ) : (
                          <Mail
                            size={
                              15
                            }
                          />
                        )}

                        Send Test
                      </button>
                    </div>
                  </div>
                </section>

              </div>

              {/* RIGHT */}

              <div className="space-y-6">

                {/* PREVIEW */}

                <section className="sticky top-[105px] rounded-2xl border border-black/10 bg-white">

                  <div className="border-b border-black/10 p-5">
                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <h3 className="font-semibold">
                          Newsletter Preview
                        </h3>

                        <p className="mt-1 text-xs text-black/40">
                          See how the newsletter will look.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowPreview(
                            true
                          )
                        }
                        className="flex h-9 items-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-medium hover:bg-black/5"
                      >
                        <Eye
                          size={
                            14
                          }
                        />

                        Full Preview
                      </button>

                    </div>
                  </div>

                  <div className="p-4 sm:p-5">

                    <div className="mb-4 flex items-center justify-between rounded-xl bg-black/[0.03] p-1">

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDevice(
                            "desktop"
                          )
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                          previewDevice ===
                          "desktop"
                            ? "bg-white shadow-sm"
                            : "text-black/45"
                        }`}
                      >
                        <Monitor
                          size={
                            14
                          }
                        />

                        Desktop
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDevice(
                            "mobile"
                          )
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                          previewDevice ===
                          "mobile"
                            ? "bg-white shadow-sm"
                            : "text-black/45"
                        }`}
                      >
                        <Smartphone
                          size={
                            14
                          }
                        />

                        Mobile
                      </button>

                    </div>

                    <div className="flex min-h-[620px] items-start justify-center overflow-hidden rounded-2xl border border-black/10 bg-[#eeeeee] p-3">

                      <div
                        className={`overflow-hidden bg-white shadow-sm transition-all ${
                          previewDevice ===
                          "mobile"
                            ? "w-[375px] max-w-full"
                            : "w-full"
                        }`}
                      >
                        <iframe
                          title="Newsletter preview"
                          srcDoc={
                            previewHtml
                          }
                          className="block h-[650px] w-full border-0"
                        />
                      </div>

                    </div>

                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FULL PREVIEW MODAL */}

      {showPreview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6">

          <div className="flex h-full max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex min-h-[70px] items-center justify-between gap-4 border-b border-black/10 px-4 sm:px-6">

              <div>
                <h3 className="text-sm font-semibold sm:text-base">
                  Newsletter Preview
                </h3>

                <p className="mt-1 hidden text-xs text-black/40 sm:block">
                  {campaignForm.subject ||
                    "No subject yet"}
                </p>
              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setPreviewDevice(
                      "desktop"
                    )
                  }
                  className={`flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium ${
                    previewDevice ===
                    "desktop"
                      ? "bg-black text-white"
                      : "border border-black/10"
                  }`}
                >
                  <Monitor
                    size={
                      14
                    }
                  />

                  <span className="hidden sm:inline">
                    Desktop
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewDevice(
                      "mobile"
                    )
                  }
                  className={`flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium ${
                    previewDevice ===
                    "mobile"
                      ? "bg-black text-white"
                      : "border border-black/10"
                  }`}
                >
                  <Smartphone
                    size={
                      14
                    }
                  />

                  <span className="hidden sm:inline">
                    Mobile
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowPreview(
                      false
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 hover:bg-black/5"
                >
                  <X size={17} />
                </button>

              </div>
            </div>

            <div className="flex flex-1 items-start justify-center overflow-auto bg-[#eeeeee] p-4 sm:p-8">

              <div
                className={`overflow-hidden bg-white shadow-xl ${
                  previewDevice ===
                  "mobile"
                    ? "w-[375px] max-w-full"
                    : "w-full max-w-[760px]"
                }`}
              >
                <iframe
                  title="Full newsletter preview"
                  srcDoc={
                    previewHtml
                  }
                  className="block min-h-[800px] w-full border-0"
                />
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}