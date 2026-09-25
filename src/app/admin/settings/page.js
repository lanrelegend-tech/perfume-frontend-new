"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Mail,
  Truck,
  Bell,
  Shield,
  Plus,
  ArrowLeft,
  Trash2,
  Edit3,
  X,
  Check,
  Search,
  MapPin,
  Package,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("store");

  // ==================================================
  // SETTINGS LOADING / SAVING
  // ==================================================

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // ==================================================
  // STORE SETTINGS
  // ==================================================

  const [storeName, setStoreName] = useState("ORENTEMIST");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  const [currency, setCurrency] = useState("NGN");
  const [freeShippingThreshold, setFreeShippingThreshold] =
    useState("");

  // ==================================================
  // SOCIAL / CONTACT SETTINGS
  // ==================================================

  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  // ==================================================
  // NOTIFICATIONS / MAINTENANCE
  // ==================================================

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // ==================================================
  // SHIPPING
  // ==================================================

  const [shippingRates, setShippingRates] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);

  const [shippingError, setShippingError] = useState("");
  const [shippingSuccess, setShippingSuccess] = useState("");

  const [newDeliveryType, setNewDeliveryType] =
    useState("state");

  const [newState, setNewState] = useState("");
  const [newDeliveryFee, setNewDeliveryFee] = useState("");
  const [newPickupAddress, setNewPickupAddress] =
    useState("");

  const [editingShippingId, setEditingShippingId] =
    useState(null);

  const [editingDeliveryFee, setEditingDeliveryFee] =
    useState("");

  const [editingPickupAddress, setEditingPickupAddress] =
    useState("");

  const [editingState, setEditingState] = useState("");

  const [shippingSearch, setShippingSearch] =
    useState("");

  // ==================================================
  // AUTH
  // ==================================================

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("access_token");
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const handleUnauthorized = (response) => {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }

      window.location.href = "/admin/login";

      return true;
    }

    return false;
  };

  // ==================================================
  // GENERAL ERROR MESSAGE
  // ==================================================

  const getApiError = (data, fallback) => {
    if (!data) {
      return fallback;
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    const fields = [
      "store_name",
      "store_email",
      "store_phone",
      "store_address",
      "currency",
      "free_shipping_threshold",
      "instagram_url",
      "facebook_url",
      "tiktok_url",
      "maintenance_mode",
    ];

    for (const field of fields) {
      if (Array.isArray(data[field]) && data[field][0]) {
        return data[field][0];
      }
    }

    return fallback;
  };

  // ==================================================
  // LOAD STORE SETTINGS
  // ==================================================

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      setSettingsError("");

      const response = await fetch(
        `${API_URL}/settings/admin/`,
        {
          method: "GET",
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            "Failed to load store settings."
          )
        );
      }

      setStoreName(data.store_name || "");
      setStoreEmail(data.store_email || "");
      setStorePhone(data.store_phone || "");
      setStoreAddress(data.store_address || "");

      setCurrency(data.currency || "NGN");

      setFreeShippingThreshold(
        data.free_shipping_threshold !== null &&
          data.free_shipping_threshold !== undefined
          ? String(data.free_shipping_threshold)
          : ""
      );

      setMaintenanceMode(
        Boolean(data.maintenance_mode)
      );

      setInstagramUrl(data.instagram_url || "");
      setFacebookUrl(data.facebook_url || "");
      setTiktokUrl(data.tiktok_url || "");
    } catch (error) {
      console.error(
        "Settings load error:",
        error
      );

      setSettingsError(
        error.message ||
          "Failed to load store settings."
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  // ==================================================
  // SAVE STORE SETTINGS
  // ==================================================

  const saveSettings = async () => {
    setSettingsError("");
    setSettingsSuccess("");

    if (!storeName.trim()) {
      setSettingsError(
        "Store name is required."
      );
      return;
    }

    if (!storeEmail.trim()) {
      setSettingsError(
        "Store email is required."
      );
      return;
    }

    if (
      freeShippingThreshold !== "" &&
      Number(freeShippingThreshold) < 0
    ) {
      setSettingsError(
        "Free shipping threshold cannot be negative."
      );
      return;
    }

    try {
      setSettingsSaving(true);

      const payload = {
        store_name: storeName.trim(),
        store_email: storeEmail.trim(),
        store_phone: storePhone.trim(),
        store_address: storeAddress.trim(),
        currency: currency.trim() || "NGN",
        free_shipping_threshold:
          freeShippingThreshold === ""
            ? null
            : freeShippingThreshold,
        maintenance_mode: maintenanceMode,
        instagram_url: instagramUrl.trim(),
        facebook_url: facebookUrl.trim(),
        tiktok_url: tiktokUrl.trim(),
      };

      const response = await fetch(
        `${API_URL}/settings/admin/`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiError(
            data,
            "Failed to save store settings."
          )
        );
      }

      setStoreName(data.store_name || "");
      setStoreEmail(data.store_email || "");
      setStorePhone(data.store_phone || "");
      setStoreAddress(data.store_address || "");

      setCurrency(data.currency || "NGN");

      setFreeShippingThreshold(
        data.free_shipping_threshold !== null &&
          data.free_shipping_threshold !== undefined
          ? String(data.free_shipping_threshold)
          : ""
      );

      setMaintenanceMode(
        Boolean(data.maintenance_mode)
      );

      setInstagramUrl(data.instagram_url || "");
      setFacebookUrl(data.facebook_url || "");
      setTiktokUrl(data.tiktok_url || "");

      setSettingsSuccess(
        "Store settings saved successfully."
      );

      setTimeout(() => {
        setSettingsSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Settings save error:",
        error
      );

      setSettingsError(
        error.message ||
          "Failed to save store settings."
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  // ==================================================
  // LOAD SHIPPING
  // ==================================================

  const loadShippingRates = async () => {
    try {
      setShippingLoading(true);
      setShippingError("");

      const response = await fetch(
        `${API_URL}/shipping/`,
        {
          method: "GET",
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to load shipping options."
        );
      }

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setShippingRates(results);
    } catch (error) {
      console.error(
        "Shipping load error:",
        error
      );

      setShippingError(
        error.message ||
          "Failed to load shipping options."
      );
    } finally {
      setShippingLoading(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "shipping") {
      loadShippingRates();
    }
  }, [activeTab]);

  // ==================================================
  // SHIPPING FORM
  // ==================================================

  const resetShippingForm = () => {
    setNewDeliveryType("state");
    setNewState("");
    setNewDeliveryFee("");
    setNewPickupAddress("");
  };

  const showShippingSuccess = (message) => {
    setShippingSuccess(message);

    setTimeout(() => {
      setShippingSuccess("");
    }, 3000);
  };

  // ==================================================
  // ADD SHIPPING
  // ==================================================

  const addShippingOption = async (event) => {
    event.preventDefault();

    setShippingError("");
    setShippingSuccess("");

    if (
      newDeliveryType === "state" &&
      !newState.trim()
    ) {
      setShippingError(
        "Please enter the state name."
      );
      return;
    }

    if (
      newDeliveryType === "pickup" &&
      !newPickupAddress.trim()
    ) {
      setShippingError(
        "Please enter the pickup address."
      );
      return;
    }

    if (
      newDeliveryFee === "" ||
      Number(newDeliveryFee) < 0
    ) {
      setShippingError(
        "Please enter a valid delivery fee."
      );
      return;
    }

    try {
      setShippingSaving(true);

      const payload = {
        delivery_type: newDeliveryType,
        state:
          newDeliveryType === "state"
            ? newState.trim()
            : null,
        delivery_fee: newDeliveryFee,
        pickup_address:
          newDeliveryType === "pickup"
            ? newPickupAddress.trim()
            : "",
        is_active: true,
      };

      const response = await fetch(
        `${API_URL}/shipping/`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.state?.[0] ||
            data?.delivery_fee?.[0] ||
            data?.pickup_address?.[0] ||
            data?.message ||
            "Failed to add shipping option."
        );
      }

      setShippingRates((current) => [
        ...current,
        data,
      ]);

      resetShippingForm();

      showShippingSuccess(
        "Shipping option added successfully."
      );
    } catch (error) {
      console.error(
        "Add shipping error:",
        error
      );

      setShippingError(
        error.message ||
          "Failed to add shipping option."
      );
    } finally {
      setShippingSaving(false);
    }
  };

  // ==================================================
  // START EDITING
  // ==================================================

  const startEditing = (shipping) => {
    setEditingShippingId(shipping.id);

    setEditingState(
      shipping.state || ""
    );

    setEditingDeliveryFee(
      shipping.delivery_fee?.toString() || "0"
    );

    setEditingPickupAddress(
      shipping.pickup_address || ""
    );

    setShippingError("");
    setShippingSuccess("");
  };

  // ==================================================
  // CANCEL EDITING
  // ==================================================

  const cancelEditing = () => {
    setEditingShippingId(null);
    setEditingState("");
    setEditingDeliveryFee("");
    setEditingPickupAddress("");
  };

  // ==================================================
  // UPDATE SHIPPING
  // ==================================================

  const updateShippingOption = async (
    shipping
  ) => {
    setShippingError("");
    setShippingSuccess("");

    if (
      shipping.delivery_type === "state" &&
      !editingState.trim()
    ) {
      setShippingError(
        "State name is required."
      );
      return;
    }

    if (
      shipping.delivery_type === "pickup" &&
      !editingPickupAddress.trim()
    ) {
      setShippingError(
        "Pickup address is required."
      );
      return;
    }

    if (
      editingDeliveryFee === "" ||
      Number(editingDeliveryFee) < 0
    ) {
      setShippingError(
        "Please enter a valid delivery fee."
      );
      return;
    }

    try {
      setShippingSaving(true);

      const payload = {
        delivery_type:
          shipping.delivery_type,
        state:
          shipping.delivery_type === "state"
            ? editingState.trim()
            : null,
        delivery_fee:
          editingDeliveryFee,
        pickup_address:
          shipping.delivery_type === "pickup"
            ? editingPickupAddress.trim()
            : "",
        is_active:
          shipping.is_active,
      };

      const response = await fetch(
        `${API_URL}/shipping/${shipping.id}/`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.state?.[0] ||
            data?.delivery_fee?.[0] ||
            data?.pickup_address?.[0] ||
            data?.message ||
            "Failed to update shipping option."
        );
      }

      setShippingRates((current) =>
        current.map((item) =>
          item.id === shipping.id
            ? data
            : item
        )
      );

      cancelEditing();

      showShippingSuccess(
        "Shipping option updated successfully."
      );
    } catch (error) {
      console.error(
        "Update shipping error:",
        error
      );

      setShippingError(
        error.message ||
          "Failed to update shipping option."
      );
    } finally {
      setShippingSaving(false);
    }
  };

  // ==================================================
  // TOGGLE SHIPPING
  // ==================================================

  const toggleShippingOption = async (
    shipping
  ) => {
    setShippingError("");
    setShippingSuccess("");

    try {
      setShippingSaving(true);

      const response = await fetch(
        `${API_URL}/shipping/${shipping.id}/`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            is_active:
              !shipping.is_active,
          }),
        }
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to update shipping status."
        );
      }

      setShippingRates((current) =>
        current.map((item) =>
          item.id === shipping.id
            ? data
            : item
        )
      );

      showShippingSuccess(
        data.is_active
          ? "Shipping option enabled."
          : "Shipping option disabled."
      );
    } catch (error) {
      console.error(
        "Toggle shipping error:",
        error
      );

      setShippingError(
        error.message ||
          "Failed to update shipping status."
      );
    } finally {
      setShippingSaving(false);
    }
  };

  // ==================================================
  // DELETE SHIPPING
  // ==================================================

  const deleteShippingOption = async (
    shipping
  ) => {
    const label =
      shipping.delivery_type === "pickup"
        ? "this pickup option"
        : shipping.state;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${label}?`
    );

    if (!confirmed) {
      return;
    }

    setShippingError("");
    setShippingSuccess("");

    try {
      setShippingSaving(true);

      const response = await fetch(
        `${API_URL}/shipping/${shipping.id}/`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (handleUnauthorized(response)) {
        return;
      }

      if (!response.ok) {
        let data = {};

        try {
          data = await response.json();
        } catch {}

        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to delete shipping option."
        );
      }

      setShippingRates((current) =>
        current.filter(
          (item) =>
            item.id !== shipping.id
        )
      );

      showShippingSuccess(
        "Shipping option deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete shipping error:",
        error
      );

      setShippingError(
        error.message ||
          "Failed to delete shipping option."
      );
    } finally {
      setShippingSaving(false);
    }
  };

  // ==================================================
  // SHIPPING SEARCH
  // ==================================================

  const filteredShippingRates =
    shippingRates.filter((shipping) => {
      const search = shippingSearch
        .trim()
        .toLowerCase();

      if (!search) {
        return true;
      }

      const state =
        shipping.state?.toLowerCase() || "";

      const type =
        shipping.delivery_type?.toLowerCase() ||
        "";

      const address =
        shipping.pickup_address?.toLowerCase() ||
        "";

      return (
        state.includes(search) ||
        type.includes(search) ||
        address.includes(search)
      );
    });

  // ==================================================
  // SHIPPING STATS
  // ==================================================

  const activeShippingCount =
    shippingRates.filter(
      (item) => item.is_active
    ).length;

  const inactiveShippingCount =
    shippingRates.filter(
      (item) => !item.is_active
    ).length;

  const pickupCount =
    shippingRates.filter(
      (item) =>
        item.delivery_type === "pickup"
    ).length;

  // ==================================================
  // TABS
  // ==================================================

  const tabs = [
    {
      id: "store",
      label: "Store",
      icon: Store,
    },
    {
      id: "contact",
      label: "Contact",
      icon: Mail,
    },
    {
      id: "shipping",
      label: "Shipping",
      icon: Truck,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
    },
  ];

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black">
       
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
         <button
          onClick={() => window.history.back()}
          className="mb-5 flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Settings
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your store settings and delivery
                options.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSettings}
              disabled={settingsLoading}
              className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  settingsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>

        {/* SETTINGS ERROR */}
        {settingsError && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{settingsError}</span>

            <button
              type="button"
              onClick={() =>
                setSettingsError("")
              }
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* SETTINGS SUCCESS */}
        {settingsSuccess && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check size={17} />
            {settingsSuccess}
          </div>
        )}

        {/* TABS */}
        <div className="mb-8 overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              const active =
                activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================
            LOADING SETTINGS
        ================================================== */}

        {settingsLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-gray-400"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading store settings...
            </p>
          </div>
        ) : (
          <>
            {/* ==================================================
                STORE
            ================================================== */}

            {activeTab === "store" && (
              <div className="max-w-3xl">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">
                      Store Information
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      These details are saved directly to your
                      store settings API.
                    </p>
                  </div>

                  <div className="space-y-5">

                    {/* STORE NAME */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Store Name
                      </label>

                      <input
                        value={storeName}
                        onChange={(e) =>
                          setStoreName(
                            e.target.value
                          )
                        }
                        placeholder="ORENTEMIST"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                      />
                    </div>

                    {/* STORE EMAIL */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Store Email
                      </label>

                      <input
                        type="email"
                        value={storeEmail}
                        onChange={(e) =>
                          setStoreEmail(
                            e.target.value
                          )
                        }
                        placeholder="store@example.com"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                      />
                    </div>

                    {/* STORE PHONE */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Store Phone
                      </label>

                      <input
                        value={storePhone}
                        onChange={(e) =>
                          setStorePhone(
                            e.target.value
                          )
                        }
                        placeholder="+234..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                      />
                    </div>

                    {/* STORE ADDRESS */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Store Address
                      </label>

                      <textarea
                        value={storeAddress}
                        onChange={(e) =>
                          setStoreAddress(
                            e.target.value
                          )
                        }
                        rows={4}
                        placeholder="Enter your store address"
                        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                      />
                    </div>

                    {/* CURRENCY */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Currency
                      </label>

                      <select
                        value={currency}
                        onChange={(e) =>
                          setCurrency(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base sm:text-sm outline-none focus:border-black"
                      >
                        <option value="NGN">
                          NGN — Nigerian Naira
                        </option>

                        <option value="USD">
                          USD — US Dollar
                        </option>

                        <option value="GBP">
                          GBP — British Pound
                        </option>

                        <option value="EUR">
                          EUR — Euro
                        </option>
                      </select>
                    </div>

                    {/* FREE SHIPPING */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Free Shipping Threshold
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          ₦
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            freeShippingThreshold
                          }
                          onChange={(e) =>
                            setFreeShippingThreshold(
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 outline-none focus:border-black"
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Orders at or above this amount can
                        qualify for free shipping.
                      </p>
                    </div>

                    {/* SAVE */}
                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={settingsSaving}
                      className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={17} />

                      {settingsSaving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================
                CONTACT
            ================================================== */}

            {activeTab === "contact" && (
              <div className="max-w-3xl">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">
                      Contact & Social Information
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Manage the contact and social links used
                      by your storefront.
                    </p>
                  </div>

                  <div className="space-y-5">

                    {/* EMAIL */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Contact Email
                      </label>

                      <input
                        type="email"
                        value={storeEmail}
                        onChange={(e) =>
                          setStoreEmail(
                            e.target.value
                          )
                        }
                        placeholder="support@example.com"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        This uses your store email setting.
                      </p>
                    </div>

                    {/* PHONE */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Contact Phone
                      </label>

                      <input
                        value={storePhone}
                        onChange={(e) =>
                          setStorePhone(
                            e.target.value
                          )
                        }
                        placeholder="+234..."
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        This uses your store phone setting.
                      </p>
                    </div>

                    {/* INSTAGRAM */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Instagram URL
                      </label>

                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) =>
                          setInstagramUrl(
                            e.target.value
                          )
                        }
                        placeholder="https://instagram.com/yourstore"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                      />
                    </div>

                    {/* FACEBOOK */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Facebook URL
                      </label>

                      <input
                        type="url"
                        value={facebookUrl}
                        onChange={(e) =>
                          setFacebookUrl(
                            e.target.value
                          )
                        }
                        placeholder="https://facebook.com/yourstore"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none text-base sm:text-sm  focus:border-black"
                      />
                    </div>

                    {/* TIKTOK */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        TikTok URL
                      </label>

                      <input
                        type="url"
                        value={tiktokUrl}
                        onChange={(e) =>
                          setTiktokUrl(
                            e.target.value
                          )
                        }
                        placeholder="https://tiktok.com/@yourstore"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                      />
                    </div>

                    {/* SAVE */}
                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={settingsSaving}
                      className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={17} />

                      {settingsSaving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================
                SHIPPING
            ================================================== */}

            {activeTab === "shipping" && (
              <div className="space-y-6">

                <div>
                  <h2 className="text-xl font-semibold">
                    Shipping Management
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Set a separate delivery price for every
                    state and create pickup options.
                  </p>
                </div>

                {/* SHIPPING ERROR */}
                {shippingError && (
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{shippingError}</span>

                    <button
                      type="button"
                      onClick={() =>
                        setShippingError("")
                      }
                      className="shrink-0"
                    >
                      <X size={17} />
                    </button>
                  </div>
                )}

                {/* SHIPPING SUCCESS */}
                {shippingSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <Check size={17} />
                    {shippingSuccess}
                  </div>
                )}

                {/* STATS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ShippingStat
                    label="Total Options"
                    value={
                      shippingRates.length
                    }
                  />

                  <ShippingStat
                    label="Active"
                    value={
                      activeShippingCount
                    }
                  />

                  <ShippingStat
                    label="Inactive"
                    value={
                      inactiveShippingCount
                    }
                  />

                  <ShippingStat
                    label="Pickup"
                    value={pickupCount}
                  />
                </div>

                {/* ADD SHIPPING */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">
                      Add Delivery Option
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Add a state delivery rate or pickup
                      location.
                    </p>
                  </div>

                  <form
                    onSubmit={
                      addShippingOption
                    }
                    className="space-y-5"
                  >

                    {/* TYPE */}
                    <div>
                      <label className="mb-3 block text-sm font-medium">
                        Delivery Option
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">

                        <button
                          type="button"
                          onClick={() =>
                            setNewDeliveryType(
                              "state"
                            )
                          }
                          className={`rounded-xl border p-4 text-left transition ${
                            newDeliveryType ===
                            "state"
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Truck size={19} />

                            <div>
                              <p className="font-medium">
                                State Delivery
                              </p>

                              <p
                                className={`mt-1 text-xs ${
                                  newDeliveryType ===
                                  "state"
                                    ? "text-gray-300"
                                    : "text-gray-500"
                                }`}
                              >
                                Charge a specific price for
                                a state.
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setNewDeliveryType(
                              "pickup"
                            )
                          }
                          className={`rounded-xl border p-4 text-left transition ${
                            newDeliveryType ===
                            "pickup"
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin size={19} />

                            <div>
                              <p className="font-medium">
                                Pickup
                              </p>

                              <p
                                className={`mt-1 text-xs ${
                                  newDeliveryType ===
                                  "pickup"
                                    ? "text-gray-300"
                                    : "text-gray-500"
                                }`}
                              >
                                Customer picks up from your
                                address.
                              </p>
                            </div>
                          </div>
                        </button>

                      </div>
                    </div>

                    {/* STATE */}
                    {newDeliveryType ===
                      "state" && (
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          State
                        </label>

                        <input
                          value={newState}
                          onChange={(e) =>
                            setNewState(
                              e.target.value
                            )
                          }
                          placeholder="e.g. Lagos"
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                        />
                      </div>
                    )}

                    {/* PICKUP */}
                    {newDeliveryType ===
                      "pickup" && (
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Pickup Address
                        </label>

                        <textarea
                          value={
                            newPickupAddress
                          }
                          onChange={(e) =>
                            setNewPickupAddress(
                              e.target.value
                            )
                          }
                          rows={4}
                          placeholder="e.g. 12 Allen Avenue, Ikeja, Lagos"
                          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                        />
                      </div>
                    )}

                    {/* FEE */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Delivery Fee
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          ₦
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            newDeliveryFee
                          }
                          onChange={(e) =>
                            setNewDeliveryFee(
                              e.target.value
                            )
                          }
                          placeholder="5000"
                          className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        shippingSaving
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={17} />

                      {shippingSaving
                        ? "Adding..."
                        : "Add Delivery Option"}
                    </button>
                  </form>
                </div>

                {/* EXISTING SHIPPING */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                  <div className="border-b border-gray-200 p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div>
                        <h3 className="text-lg font-semibold">
                          Delivery Options
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Manage prices and pickup locations.
                        </p>
                      </div>

                      <div className="relative w-full lg:w-80">
                        <Search
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          value={
                            shippingSearch
                          }
                          onChange={(e) =>
                            setShippingSearch(
                              e.target.value
                            )
                          }
                          placeholder="Search state or address..."
                          className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  </div>

                  {shippingLoading ? (
                    <div className="p-10 text-center text-sm text-gray-500">
                      Loading shipping options...
                    </div>
                  ) : filteredShippingRates.length ===
                    0 ? (
                    <div className="p-10 text-center">
                      <Package
                        size={35}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium">
                        No delivery options found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Add your first state or pickup option
                        above.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">

                      {filteredShippingRates.map(
                        (shipping) => {
                          const isEditing =
                            editingShippingId ===
                            shipping.id;

                          return (
                            <div
                              key={
                                shipping.id
                              }
                              className="p-5 sm:p-6"
                            >

                              {!isEditing ? (
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                  <div className="flex min-w-0 items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                                      {shipping.delivery_type ===
                                      "pickup" ? (
                                        <MapPin
                                          size={19}
                                        />
                                      ) : (
                                        <Truck
                                          size={19}
                                        />
                                      )}
                                    </div>

                                    <div className="min-w-0">

                                      <div className="flex flex-wrap items-center gap-2">

                                        <h4 className="font-semibold">
                                          {shipping.delivery_type ===
                                          "pickup"
                                            ? "Pickup"
                                            : shipping.state}
                                        </h4>

                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-600">
                                          {
                                            shipping.delivery_type
                                          }
                                        </span>

                                        <span
                                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                            shipping.is_active
                                              ? "bg-green-100 text-green-700"
                                              : "bg-gray-100 text-gray-500"
                                          }`}
                                        >
                                          {shipping.is_active
                                            ? "Active"
                                            : "Inactive"}
                                        </span>
                                      </div>

                                      {shipping.delivery_type ===
                                        "pickup" &&
                                        shipping.pickup_address && (
                                          <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                                            <MapPin
                                              size={15}
                                              className="mt-0.5 shrink-0"
                                            />

                                            <span>
                                              {
                                                shipping.pickup_address
                                              }
                                            </span>
                                          </div>
                                        )}

                                      <p className="mt-2 text-lg font-semibold">
                                        ₦
                                        {Number(
                                          shipping.delivery_fee
                                        ).toLocaleString(
                                          "en-NG",
                                          {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">

                                    <button
                                      type="button"
                                      disabled={
                                        shippingSaving
                                      }
                                      onClick={() =>
                                        toggleShippingOption(
                                          shipping
                                        )
                                      }
                                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:border-black disabled:opacity-50"
                                    >
                                      {shipping.is_active ? (
                                        <ToggleRight
                                          size={18}
                                        />
                                      ) : (
                                        <ToggleLeft
                                          size={18}
                                        />
                                      )}

                                      {shipping.is_active
                                        ? "Disable"
                                        : "Enable"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditing(
                                          shipping
                                        )
                                      }
                                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:border-black"
                                    >
                                      <Edit3
                                        size={16}
                                      />

                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        shippingSaving
                                      }
                                      onClick={() =>
                                        deleteShippingOption(
                                          shipping
                                        )
                                      }
                                      className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <Trash2
                                        size={16}
                                      />

                                      Delete
                                    </button>

                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">

                                  <div className="flex items-center justify-between">

                                    <div>
                                      <h4 className="font-semibold">
                                        Edit{" "}
                                        {shipping.delivery_type ===
                                        "pickup"
                                          ? "Pickup"
                                          : shipping.state}
                                      </h4>

                                      <p className="mt-1 text-xs text-gray-500">
                                        Update this delivery
                                        option.
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={
                                        cancelEditing
                                      }
                                      className="rounded-lg p-2 hover:bg-white"
                                    >
                                      <X size={18} />
                                    </button>
                                  </div>

                                  {shipping.delivery_type ===
                                    "state" && (
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">
                                        State
                                      </label>

                                      <input
                                        value={
                                          editingState
                                        }
                                        onChange={(e) =>
                                          setEditingState(
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none text-base sm:text-sm focus:border-black"
                                      />
                                    </div>
                                  )}

                                  {shipping.delivery_type ===
                                    "pickup" && (
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">
                                        Pickup Address
                                      </label>

                                      <textarea
                                        value={
                                          editingPickupAddress
                                        }
                                        onChange={(e) =>
                                          setEditingPickupAddress(
                                            e.target.value
                                          )
                                        }
                                        rows={4}
                                        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="mb-2 block text-sm font-medium">
                                      Delivery Fee
                                    </label>

                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        ₦
                                      </span>

                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                          editingDeliveryFee
                                        }
                                        onChange={(e) =>
                                          setEditingDeliveryFee(
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-9 pr-4 outline-none focus:border-black"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-3">

                                    <button
                                      type="button"
                                      disabled={
                                        shippingSaving
                                      }
                                      onClick={() =>
                                        updateShippingOption(
                                          shipping
                                        )
                                      }
                                      className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                      <Check
                                        size={17}
                                      />

                                      {shippingSaving
                                        ? "Saving..."
                                        : "Save Changes"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={
                                        cancelEditing
                                      }
                                      className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium hover:border-black"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            {activeTab === "notifications" && (
              <div className="max-w-3xl">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">
                      Notifications & Store Status
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Manage the maintenance state of your
                      storefront.
                    </p>
                  </div>

                  <div className="space-y-4">

                    <button
                      type="button"
                      onClick={() =>
                        setMaintenanceMode(
                          !maintenanceMode
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-black"
                    >
                      <div>
                        <p className="font-medium">
                          Maintenance Mode
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Temporarily place the storefront
                          into maintenance mode.
                        </p>
                      </div>

                      {maintenanceMode ? (
                        <ToggleRight
                          size={30}
                        />
                      ) : (
                        <ToggleLeft
                          size={30}
                        />
                      )}
                    </button>

                    <div
                      className={`rounded-xl border p-4 text-sm ${
                        maintenanceMode
                          ? "border-orange-200 bg-orange-50 text-orange-700"
                          : "border-green-200 bg-green-50 text-green-700"
                      }`}
                    >
                      {maintenanceMode
                        ? "Maintenance mode is currently enabled."
                        : "Your storefront is currently active."}
                    </div>

                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={settingsSaving}
                      className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={17} />

                      {settingsSaving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================
                SECURITY
            ================================================== */}

            {activeTab === "security" && (
              <div className="max-w-3xl">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">
                      Security
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Manage administrator access to store
                      settings.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                    <div className="flex items-start gap-3">
                      <Shield
                        size={20}
                        className="mt-0.5"
                      />

                      <div>
                        <p className="font-medium">
                          Administrator Access
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Store settings and shipping changes
                          are protected by your backend
                          administrator authentication.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==================================================
// SHIPPING STAT
// ==================================================

function ShippingStat({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}