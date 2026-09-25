"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Save,
  Trash2,
} from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [product, setProduct] = useState({
    name: "",
    brand: "",
    description: "",
    category_id: "",
    price: "",
    size: "",
    fragrance_notes: "",
    image: "",
    stock_quantity: "",
    in_stock: true,
    is_preorder: false,
    preorder_release_date: "",
    preorder_message: "Available for pre-order",
    featured: false,
  });

  const [images, setImages] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // --------------------------------------------------
  // LOAD REAL CATEGORIES FROM DJANGO
  // --------------------------------------------------
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/products/categories/`
        );

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error("Failed to load categories.");
        }

        const categoryList = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : [];

        setCategories(categoryList);

        if (categoryList.length > 0) {
          setProduct((prev) => ({
            ...prev,
            category_id:
              prev.category_id || String(categoryList[0].id),
          }));
        }
      } catch (err) {
        console.error("Category loading error:", err);

        setError(
          "Unable to load product categories. Please check your backend connection."
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (API_URL) {
      loadCategories();
    } else {
      setCategoriesLoading(false);
      setError(
        "NEXT_PUBLIC_API_URL is not configured."
      );
    }
  }, [API_URL]);

  // --------------------------------------------------
  // INPUT CHANGE
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // STOCK CHANGE
  // --------------------------------------------------
  const handleStockChange = (e) => {
    const value = e.target.value;

    setProduct((prev) => {
      const stockQuantity =
        value === "" ? "" : Number(value);

      const hasStock =
        stockQuantity !== "" &&
        stockQuantity > 0;

      return {
        ...prev,
        stock_quantity: value,
        is_preorder: hasStock
          ? false
          : prev.is_preorder,
        in_stock: hasStock,
      };
    });
  };

  // --------------------------------------------------
  // AVAILABILITY CHANGE
  // --------------------------------------------------
  const handleAvailabilityChange = (e) => {
    const isInStock = e.target.value === "true";

    setProduct((prev) => ({
      ...prev,
      in_stock: isInStock,
      is_preorder: isInStock
        ? false
        : prev.is_preorder,
    }));
  };

  // --------------------------------------------------
  // PRE-ORDER TOGGLE
  // --------------------------------------------------
  const togglePreorder = () => {
    const stockQuantity =
      product.stock_quantity === ""
        ? 0
        : Number(product.stock_quantity);

    if (stockQuantity > 0) {
      return;
    }

    setProduct((prev) => ({
      ...prev,
      is_preorder: !prev.is_preorder,
      in_stock: false,
    }));
  };

  // --------------------------------------------------
  // IMAGE UPLOAD
  // --------------------------------------------------
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
      return;
    }

    const newImages = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));

    setImages((prev) => [...prev, ...newImages]);

    if (images.length === 0 && newImages.length > 0) {
      setProduct((prev) => ({
        ...prev,
        image: newImages[0].url,
      }));
    }

    e.target.value = "";
  };

  // --------------------------------------------------
  // REMOVE IMAGE
  // --------------------------------------------------
  const removeImage = (id) => {
    setImages((prev) => {
      const image = prev.find((item) => item.id === id);

      if (image?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(image.url);
      }

      const remainingImages = prev.filter(
        (item) => item.id !== id
      );

      setProduct((current) => ({
        ...current,
        image: remainingImages[0]?.url || "",
      }));

      return remainingImages;
    });
  };

  // --------------------------------------------------
  // FORMAT DJANGO ERRORS
  // --------------------------------------------------
  const formatApiError = (data) => {
    if (!data) {
      return "Failed to create product.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    if (data.message) {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }

    if (typeof data === "object") {
      const messages = Object.entries(data)
        .map(([field, message]) => {
          if (Array.isArray(message)) {
            return `${field}: ${message.join(", ")}`;
          }

          if (typeof message === "object") {
            return `${field}: ${JSON.stringify(message)}`;
          }

          return `${field}: ${message}`;
        })
        .join(" ");

      if (messages) {
        return messages;
      }
    }

    return "Failed to create product.";
  };

  // --------------------------------------------------
  // SAVE PRODUCT
  // --------------------------------------------------
  const handleSave = async (publish = false) => {
    setError("");

    if (!product.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!product.brand.trim()) {
      setError("Brand is required.");
      return;
    }

    if (!product.description.trim()) {
      setError("Product description is required.");
      return;
    }

    if (!product.category_id) {
      setError("Please select a category.");
      return;
    }

    if (!product.price || Number(product.price) <= 0) {
      setError("Please enter a valid product price.");
      return;
    }

    const stockQuantity =
      product.stock_quantity === ""
        ? 0
        : Number(product.stock_quantity);

    if (
      Number.isNaN(stockQuantity) ||
      stockQuantity < 0
    ) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    if (
      stockQuantity === 0 &&
      product.is_preorder &&
      !product.preorder_message.trim()
    ) {
      setError(
        "Please enter a pre-order message."
      );
      return;
    }

    if (!API_URL) {
      setError(
        "NEXT_PUBLIC_API_URL is not configured."
      );
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    setLoading(true);

    try {
      // ------------------------------------------------
      // FINAL PRODUCT STATE
      // ------------------------------------------------
      const hasStock = stockQuantity > 0;

      const allowPreorder =
        stockQuantity === 0 &&
        product.is_preorder === true;

      // ------------------------------------------------
      // CREATE FORMDATA
      // ------------------------------------------------
      const formData = new FormData();

      formData.append(
        "name",
        product.name.trim()
      );

      formData.append(
        "brand",
        product.brand.trim()
      );

      formData.append(
        "description",
        product.description.trim()
      );

      formData.append(
        "category_id",
        String(product.category_id)
      );

      formData.append(
        "price",
        String(Number(product.price))
      );

      formData.append(
        "size",
        product.size.trim()
      );

      formData.append(
        "fragrance_notes",
        product.fragrance_notes.trim()
      );

      formData.append(
        "stock_quantity",
        String(stockQuantity)
      );

      formData.append(
        "in_stock",
        hasStock ? "true" : "false"
      );

      formData.append(
        "is_preorder",
        allowPreorder ? "true" : "false"
      );

      formData.append(
        "featured",
        product.featured ? "true" : "false"
      );

      if (
        allowPreorder &&
        product.preorder_release_date
      ) {
        formData.append(
          "preorder_release_date",
          product.preorder_release_date
        );
      }

      formData.append(
        "preorder_message",
        product.preorder_message.trim()
      );

      // ------------------------------------------------
      // SEND REAL IMAGE FILE
      // ------------------------------------------------
      if (
        images.length > 0 &&
        images[0].file
      ) {
        formData.append(
          "image",
          images[0].file
        );
      }

      // ------------------------------------------------
      // CREATE PRODUCT
      // ------------------------------------------------
      const response = await fetch(
        `${API_URL}/products/admin/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      // ------------------------------------------------
      // AUTH ERROR
      // ------------------------------------------------
      if (
        response.status === 401 ||
        response.status === 403
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

      // ------------------------------------------------
      // API ERROR
      // ------------------------------------------------
      if (!response.ok) {
        setError(formatApiError(data));
        return;
      }

      // ------------------------------------------------
      // UPLOAD ADDITIONAL IMAGES
      // ------------------------------------------------
      if (
        data?.id &&
        images.length > 1
      ) {
        const additionalImages =
          images.slice(1);

        const imageFormData = new FormData();

        imageFormData.append(
          "product",
          String(data.id)
        );

        additionalImages.forEach((image) => {
          if (image.file) {
            imageFormData.append(
              "images",
              image.file
            );
          }
        });

        const imageResponse = await fetch(
          `${API_URL}/products/admin/images/bulk/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: imageFormData,
          }
        );

        const imageData =
          await imageResponse
            .json()
            .catch(() => ({}));

        if (!imageResponse.ok) {
          console.error(
            "Additional image upload failed:",
            imageData
          );

          setError(
            "Product was created, but some additional images could not be uploaded."
          );

          setSaved(true);

          setTimeout(() => {
            router.push(
              "/admin/products"
            );
            router.refresh();
          }, 1500);

          return;
        }
      }

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------
      setSaved(true);

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error(
        "Create product error:",
        err
      );

      setError(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory =
    categories.find(
      (category) =>
        String(category.id) ===
        String(product.category_id)
    )?.name || "—";

  const stockQuantity =
    product.stock_quantity === ""
      ? 0
      : Number(product.stock_quantity);

  const hasStock = stockQuantity > 0;

  const isPreorder =
    !hasStock && product.is_preorder;

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      {/* Header */}
      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Add Product
              </h1>

              <p className="mt-1 text-sm text-black/50">
                Create a new product for your store
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-black bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />

              {loading
                ? "Saving..."
                : "Save Draft"}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} />

              {loading
                ? "Saving..."
                : "Publish Product"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Basic Information */}
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Basic Information
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Add the main information about your product.
                </p>
              </div>

              <div className="grid gap-5">
                {/* Product Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    placeholder="e.g. ORENTEMIST Noir"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                  />
                </div>

                {/* Brand + Category */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Brand
                    </label>

                    <input
                      type="text"
                      name="brand"
                      value={product.brand}
                      onChange={handleChange}
                      placeholder="e.g. ORENTEMIST"
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Category
                    </label>

                    <select
                      name="category_id"
                      value={product.category_id}
                      onChange={handleChange}
                      disabled={
                        categoriesLoading ||
                        loading
                      }
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-black/5"
                    >
                      {categoriesLoading ? (
                        <option value="">
                          Loading categories...
                        </option>
                      ) : categories.length ===
                        0 ? (
                        <option value="">
                          No categories found
                        </option>
                      ) : (
                        <>
                          <option value="">
                            Select category
                          </option>

                          {categories.map(
                            (category) => (
                              <option
                                key={category.id}
                                value={category.id}
                              >
                                {category.name}
                              </option>
                            )
                          )}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Write a description for your product..."
                    className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                  />

                  <p className="mt-2 text-xs text-black/40">
                    Describe the fragrance, ingredients, scent profile
                    and anything customers should know.
                  </p>
                </div>

                {/* Fragrance Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Fragrance Notes
                  </label>

                  <textarea
                    name="fragrance_notes"
                    value={product.fragrance_notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="e.g. Oud, Amber, Vanilla"
                    className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                  />
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Pricing
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Set the selling price and product size.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Selling Price
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-black/40">
                      ₦
                    </span>

                    <input
                      type="number"
                      name="price"
                      value={product.price}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className="h-12 w-full rounded-xl border border-black/10 bg-white pl-9 pr-4 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Size
                  </label>

                  <input
                    type="text"
                    name="size"
                    value={product.size}
                    onChange={handleChange}
                    placeholder="e.g. 100ml"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>
            </section>

            {/* Inventory */}
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Inventory
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Manage the quantity currently available.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Stock */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Stock Quantity
                  </label>

                  <input
                    type="number"
                    name="stock_quantity"
                    value={product.stock_quantity}
                    onChange={handleStockChange}
                    placeholder="0"
                    min="0"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black"
                  />

                  <p className="mt-2 text-xs text-black/40">
                    Enter 0 when the product is currently out of stock.
                  </p>
                </div>

                {/* Availability */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Availability
                  </label>

                  <select
                    name="in_stock"
                    value={
                      hasStock
                        ? "true"
                        : "false"
                    }
                    onChange={
                      handleAvailabilityChange
                    }
                    disabled={hasStock}
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-black/5"
                  >
                    <option value="true">
                      In Stock
                    </option>

                    <option value="false">
                      Out of Stock
                    </option>
                  </select>

                  <p className="mt-2 text-xs text-black/40">
                    Availability is automatically set from the stock quantity.
                  </p>
                </div>
              </div>
            </section>

            {/* Images */}
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Product Images
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Upload high-quality images of your product.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-black/5"
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(image.id)
                      }
                      disabled={loading}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/80 text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-black/20 bg-black/[0.02] transition hover:border-black hover:bg-black/[0.04]">
                  <ImagePlus
                    size={24}
                    className="text-black/40"
                  />

                  <span className="mt-2 text-xs font-medium">
                    Add Image
                  </span>

                  <span className="mt-1 text-[10px] text-black/40">
                    PNG, JPG, WEBP
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h2 className="text-base font-semibold">
                Publishing
              </h2>

              {/* Product Status */}
              <div className="mt-5 rounded-xl border border-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      Product Status
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      {hasStock
                        ? "Available for normal purchase"
                        : isPreorder
                        ? "Out of stock, but available for pre-order"
                        : "Out of stock and unavailable for purchase"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      hasStock
                        ? "bg-emerald-50 text-emerald-700"
                        : isPreorder
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {hasStock
                      ? "In Stock"
                      : isPreorder
                      ? "Pre-order"
                      : "Sold Out"}
                  </span>
                </div>
              </div>

              {/* Pre-order */}
              {!hasStock && (
                <div className="mt-4 rounded-xl border border-black/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        Allow Pre-orders
                      </p>

                      <p className="mt-1 text-xs text-black/45">
                        Let customers purchase this product while it is out of stock.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={togglePreorder}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        product.is_preorder
                          ? "bg-black"
                          : "bg-black/10"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          product.is_preorder
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {product.is_preorder && (
                    <div className="mt-4 space-y-4">
                      {/* Release Date */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Release Date
                        </label>

                        <input
                          type="date"
                          name="preorder_release_date"
                          value={
                            product.preorder_release_date
                          }
                          onChange={handleChange}
                          className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black"
                        />

                        <p className="mt-2 text-xs text-black/40">
                          Optional. Leave blank if you don't know the exact date.
                        </p>
                      </div>

                      {/* Pre-order Message */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Pre-order Message
                        </label>

                        <input
                          type="text"
                          name="preorder_message"
                          value={
                            product.preorder_message
                          }
                          onChange={handleChange}
                          placeholder="e.g. Ships within 4 days of your order"
                          className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black"
                        />

                        <p className="mt-2 text-xs text-black/40">
                          Tell customers when they should expect their order.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Featured */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-black/10 p-4">
                <div>
                  <p className="text-sm font-medium">
                    Featured Product
                  </p>

                  <p className="mt-1 text-xs text-black/45">
                    Show on featured sections
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProduct((prev) => ({
                      ...prev,
                      featured:
                        !prev.featured,
                    }))
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    product.featured
                      ? "bg-black"
                      : "bg-black/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      product.featured
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Product Summary */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h2 className="text-base font-semibold">
                Product Summary
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Brand
                  </span>

                  <span className="text-sm font-medium">
                    {product.brand || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Category
                  </span>

                  <span className="text-sm font-medium">
                    {selectedCategory}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Size
                  </span>

                  <span className="text-sm font-medium">
                    {product.size || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Price
                  </span>

                  <span className="text-sm font-medium">
                    {product.price
                      ? `₦${Number(
                          product.price
                        ).toLocaleString()}`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Stock
                  </span>

                  <span className="text-sm font-medium">
                    {stockQuantity} units
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Status
                  </span>

                  <span className="text-sm font-medium">
                    {hasStock
                      ? "In Stock"
                      : isPreorder
                      ? "Pre-order"
                      : "Sold Out"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Images
                  </span>

                  <span className="text-sm font-medium">
                    {images.length}
                  </span>
                </div>
              </div>
            </section>

            {/* Mobile Actions */}
            <div className="space-y-3 sm:hidden">
              <button
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={17} />

                {loading
                  ? "Saving..."
                  : "Publish Product"}
              </button>

              <button
                onClick={() => handleSave(false)}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />

                {loading
                  ? "Saving..."
                  : "Save Draft"}
              </button>

              <button
                onClick={() => router.back()}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saved && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl">
          <Check size={17} />
          Product created successfully
        </div>
      )}
    </div>
  );
}