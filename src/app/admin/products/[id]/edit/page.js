"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Save,
  Trash2,
  Package,
  Clock3,
  CalendarDays,
} from "lucide-react";

function getImageUrl(image) {
  if (!image) return "/placeholder-product.jpg";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || ""
  ).replace(/\/$/, "");

  const imagePath = image.startsWith("/")
    ? image
    : `/${image}`;

  return `${baseUrl}${imagePath}`;
}

function normalizeImage(
  image,
  index = 0,
  isMain = false
) {
  if (!image) return null;

  if (typeof image === "string") {
    return {
      id: `existing-${index}-${image}`,
      name: `Product image ${index + 1}`,
      url: getImageUrl(image),
      existing: true,
      isMain,
    };
  }

  const imageValue =
    image.image ||
    image.url ||
    image.file ||
    "";

  if (!imageValue) return null;

  return {
    id:
      image.id ||
      `existing-${index}-${imageValue}`,
    name:
      image.name ||
      `Product image ${index + 1}`,
    url: getImageUrl(imageValue),
    existing: true,
    isMain,
  };
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params?.id;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);

  const [deletedImageIds, setDeletedImageIds] =
    useState([]);

  const [deletedMainImage, setDeletedMainImage] =
    useState(false);

  const [promotedMainImageId, setPromotedMainImageId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD PRODUCT
  ===================================================== */

  useEffect(() => {
    if (!productId || !API_URL) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token");

        if (!token) {
          router.push("/admin/login");
          return;
        }

        const productsResponse = await fetch(
          `${API_URL}/products/`
        );

        if (!productsResponse.ok) {
          throw new Error(
            "Failed to load products"
          );
        }

        const productsData =
          await productsResponse.json();

        const productList = Array.isArray(
          productsData
        )
          ? productsData
          : Array.isArray(
              productsData.results
            )
          ? productsData.results
          : [];

        const foundProduct =
          productList.find(
            (item) =>
              String(item.id) ===
              String(productId)
          );

        if (!foundProduct) {
          throw new Error(
            "Product not found"
          );
        }

        const stockQuantity =
          Number(
            foundProduct.stock_quantity
          ) || 0;

        const formattedProduct = {
          ...foundProduct,

          category_id:
            foundProduct.category_id ??
            foundProduct.category?.id ??
            "",

          price:
            foundProduct.price !== null &&
            foundProduct.price !== undefined
              ? String(foundProduct.price)
              : "",

          stock_quantity:
            foundProduct.stock_quantity !==
              null &&
            foundProduct.stock_quantity !==
              undefined
              ? String(
                  foundProduct.stock_quantity
                )
              : "0",

          /*
           * Stock controls the real availability.
           */
          in_stock:
            stockQuantity > 0,

          /*
           * Pre-orders are only active when
           * stock is zero.
           */
          is_preorder:
            stockQuantity === 0 &&
            foundProduct.is_preorder === true,

          featured:
            Boolean(
              foundProduct.featured
            ),

          preorder_release_date:
            foundProduct.preorder_release_date ||
            "",

          preorder_message:
            foundProduct.preorder_message ||
            "",
        };

        setProduct(formattedProduct);

        /* =================================================
           PRODUCT IMAGES
        ================================================= */

        const galleryImages =
          Array.isArray(
            foundProduct.images
          )
            ? foundProduct.images
            : [];

        const mainImage = foundProduct.image
          ? normalizeImage(
              foundProduct.image,
              0,
              true
            )
          : null;

        const galleryNormalizedImages =
          galleryImages
            .map((image, index) =>
              normalizeImage(
                image,
                index + 1,
                false
              )
            )
            .filter(Boolean);

        const allBackendImages = [
          mainImage,
          ...galleryNormalizedImages,
        ].filter(Boolean);

        const uniqueImages =
          allBackendImages.filter(
            (image, index, array) =>
              index ===
              array.findIndex(
                (item) =>
                  item.url === image.url
              )
          );

        setImages(uniqueImages);

        setDeletedImageIds([]);
        setDeletedMainImage(false);
        setPromotedMainImageId(null);

        /* =================================================
           CATEGORIES
        ================================================= */

        const categoriesResponse =
          await fetch(
            `${API_URL}/products/categories/`
          );

        if (categoriesResponse.ok) {
          const categoriesData =
            await categoriesResponse.json();

          const categoryList =
            Array.isArray(
              categoriesData
            )
              ? categoriesData
              : Array.isArray(
                  categoriesData.results
                )
              ? categoriesData.results
              : [];

          setCategories(categoryList);
        }
      } catch (err) {
        console.error(
          "Edit product load error:",
          err
        );

        setError(
          err.message ||
            "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId, router, API_URL]);

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     STOCK CHANGE
  ===================================================== */

  const handleStockChange = (e) => {
    const value = e.target.value;

    const stockQuantity =
      value === ""
        ? 0
        : Math.max(
            0,
            Number(value) || 0
          );

    setProduct((prev) => ({
      ...prev,

      stock_quantity:
        value === ""
          ? ""
          : String(stockQuantity),

      /*
       * Automatically determine normal
       * availability from stock.
       */
      in_stock:
        stockQuantity > 0,

      /*
       * If stock becomes available,
       * pre-order is automatically disabled.
       */
      is_preorder:
        stockQuantity === 0
          ? Boolean(prev.is_preorder)
          : false,
    }));
  };

  /* =====================================================
     PRE-ORDER TOGGLE
  ===================================================== */

  const handlePreorderToggle = () => {
    const stockQuantity =
      Number(
        product?.stock_quantity
      ) || 0;

    /*
     * Never allow pre-order when there
     * is existing stock.
     */
    if (stockQuantity > 0) {
      setProduct((prev) => ({
        ...prev,
        is_preorder: false,
      }));

      return;
    }

    setProduct((prev) => ({
      ...prev,
      is_preorder:
        !prev.is_preorder,
    }));
  };

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageUpload = (e) => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) return;

    const hasMainImage = images.some(
      (image) =>
        image.isMain === true
    );

    const newImages = files.map(
      (file, index) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        file,
        existing: false,
        isMain:
          !hasMainImage &&
          index === 0,
      })
    );

    if (
      !hasMainImage &&
      newImages.length > 0
    ) {
      setDeletedMainImage(false);
      setPromotedMainImageId(null);
    }

    setImages((prev) => [
      ...prev,
      ...newImages,
    ]);

    e.target.value = "";
  };

  /* =====================================================
     REMOVE IMAGE
  ===================================================== */

  const removeImage = (id) => {
    const image = images.find(
      (item) => item.id === id
    );

    if (!image) return;

    const remainingImages =
      images.filter(
        (item) => item.id !== id
      );

    if (image.isMain) {
      const nextMainImage =
        remainingImages[0];

      if (nextMainImage) {
        nextMainImage.isMain = true;

        setDeletedMainImage(false);

        if (
          nextMainImage.existing &&
          typeof nextMainImage.id ===
            "number"
        ) {
          setPromotedMainImageId(
            nextMainImage.id
          );
        } else {
          setPromotedMainImageId(null);
        }
      } else {
        setDeletedMainImage(true);
        setPromotedMainImageId(null);
      }
    } else if (
      image.existing &&
      typeof image.id === "number"
    ) {
      setDeletedImageIds(
        (prevIds) => {
          if (
            prevIds.includes(image.id)
          ) {
            return prevIds;
          }

          return [
            ...prevIds,
            image.id,
          ];
        }
      );
    }

    if (
      image.url?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(image.url);
    }

    setImages(remainingImages);
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = async () => {
    if (!product) return;

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        router.push("/admin/login");
        return;
      }

      /*
       * Empty stock = 0.
       */
      const stockQuantity =
        product.stock_quantity === ""
          ? 0
          : Math.max(
              0,
              Number(
                product.stock_quantity
              ) || 0
            );

      /*
       * Final purchase state.
       */
      const hasStock =
        stockQuantity > 0;

      const finalPreorder =
        !hasStock &&
        product.is_preorder === true;

      const payload = {
        name: product.name,
        brand: product.brand,
        description:
          product.description,

        category_id:
          product.category_id === "" ||
          product.category_id === null
            ? null
            : Number(
                product.category_id
              ),

        price: Number(
          product.price
        ) || 0,

        size: product.size,

        fragrance_notes:
          product.fragrance_notes,

        /*
         * Stock is always saved as a
         * valid number.
         */
        stock_quantity:
          stockQuantity,

        /*
         * Stock > 0 = in stock.
         * Stock = 0 = out of stock.
         */
        in_stock:
          hasStock,

        /*
         * Pre-order only exists when
         * stock is zero.
         */
        is_preorder:
          finalPreorder,

        /*
         * Optional pre-order information.
         */
        preorder_release_date:
          finalPreorder &&
          product.preorder_release_date
            ? product.preorder_release_date
            : null,

        preorder_message:
          finalPreorder &&
          product.preorder_message
            ? product.preorder_message
            : "",

        featured:
          Boolean(
            product.featured
          ),
      };

      /* =================================================
         DELETE MAIN IMAGE
      ================================================= */

      if (
        deletedMainImage &&
        !images.some(
          (image) =>
            image.isMain === true
        )
      ) {
        payload.image = null;
      }

      /* =================================================
         UPDATE PRODUCT
      ================================================= */

      const response = await fetch(
        `${API_URL}/products/admin/${productId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

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

      if (!response.ok) {
        let message =
          "Failed to update product.";

        try {
          const errorData =
            await response.json();

          console.error(
            "Update product response:",
            errorData
          );

          if (
            errorData &&
            typeof errorData ===
              "object"
          ) {
            const firstError =
              Object.values(
                errorData
              )[0];

            if (
              Array.isArray(
                firstError
              )
            ) {
              message =
                firstError[0];
            } else if (
              typeof firstError ===
              "string"
            ) {
              message =
                firstError;
            }
          }
        } catch {
          // Keep default error
        }

        throw new Error(message);
      }

      /* =================================================
         NEW MAIN IMAGE
      ================================================= */

      const newMainImage =
        images.find(
          (image) =>
            !image.existing &&
            image.file &&
            image.isMain === true
        );

      if (newMainImage) {
        const mainImageFormData =
          new FormData();

        mainImageFormData.append(
          "image",
          newMainImage.file
        );

        const mainImageResponse =
          await fetch(
            `${API_URL}/products/admin/${productId}/`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: mainImageFormData,
            }
          );

        if (
          mainImageResponse.status ===
            401 ||
          mainImageResponse.status ===
            403
        ) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "refresh_token"
          );

          router.push(
            "/admin/login"
          );

          return;
        }

        if (
          !mainImageResponse.ok
        ) {
          throw new Error(
            "Product was updated, but the main product image could not be uploaded."
          );
        }
      }

      /* =================================================
         PROMOTE EXISTING IMAGE
      ================================================= */

      if (
        promotedMainImageId !== null
      ) {
        const promoteResponse =
          await fetch(
            `${API_URL}/products/admin/images/${promotedMainImageId}/`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (
          promoteResponse.status ===
            401 ||
          promoteResponse.status ===
            403
        ) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "refresh_token"
          );

          router.push(
            "/admin/login"
          );

          return;
        }

        if (
          !promoteResponse.ok
        ) {
          throw new Error(
            "Product was updated, but the new main image could not be saved."
          );
        }
      }

      /* =================================================
         DELETE GALLERY IMAGES
      ================================================= */

      if (
        deletedImageIds.length > 0
      ) {
        for (
          const imageId of
            deletedImageIds
        ) {
          const deleteResponse =
            await fetch(
              `${API_URL}/products/admin/images/${imageId}/`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          if (
            deleteResponse.status ===
              401 ||
            deleteResponse.status ===
              403
          ) {
            localStorage.removeItem(
              "access_token"
            );

            localStorage.removeItem(
              "refresh_token"
            );

            router.push(
              "/admin/login"
            );

            return;
          }

          if (
            !deleteResponse.ok
          ) {
            throw new Error(
              "Product was updated, but one or more images could not be deleted."
            );
          }
        }
      }

      /* =================================================
         NEW GALLERY IMAGES
      ================================================= */

      const newImageFiles =
        images
          .filter(
            (image) =>
              !image.existing &&
              image.file &&
              !image.isMain
          )
          .map(
            (image) => image.file
          );

      if (
        newImageFiles.length > 0
      ) {
        const imageFormData =
          new FormData();

        imageFormData.append(
          "product",
          String(productId)
        );

        newImageFiles.forEach(
          (file) => {
            imageFormData.append(
              "images",
              file
            );
          }
        );

        const imageResponse =
          await fetch(
            `${API_URL}/products/admin/images/bulk/`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: imageFormData,
            }
          );

        if (
          imageResponse.status ===
            401 ||
          imageResponse.status ===
            403
        ) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "refresh_token"
          );

          router.push(
            "/admin/login"
          );

          return;
        }

        if (!imageResponse.ok) {
          throw new Error(
            "Product was updated, but image upload failed."
          );
        }
      }

      setSaved(true);

      setTimeout(() => {
        router.push(
          `/admin/products/${productId}`
        );
      }, 1200);
    } catch (err) {
      console.error(
        "Save product error:",
        err
      );

      setError(
        err.message ||
          "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-black flex items-center justify-center">
        <p className="text-sm text-black/40">
          Loading product...
        </p>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-black flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-sm text-red-600">
            {error ||
              "Product not found."}
          </p>

          <button
            onClick={() =>
              router.push(
                "/admin/products"
              )
            }
            className="mt-4 rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     LIVE STOCK STATE
  ===================================================== */

  const stockQuantity =
    product.stock_quantity === ""
      ? 0
      : Number(
          product.stock_quantity
        ) || 0;

  const hasStock =
    stockQuantity > 0;

  const isPreorder =
    !hasStock &&
    product.is_preorder === true;

  const isSoldOut =
    !hasStock &&
    product.is_preorder !== true;

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:bg-black hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Edit Product
              </h1>

              <p className="mt-1 text-sm text-black/50">
                Update product information and inventory
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              onClick={() =>
                router.back()
              }
              className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* =================================================
              MAIN
          ================================================= */}

          <div className="space-y-6">
            {/* BASIC INFORMATION */}
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Basic Information
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Update the main information about your product.
                </p>
              </div>

              <div className="grid gap-5">
                {/* NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      product.name || ""
                    }
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base sm:text-sm outline-none transition focus:border-black"
                  />
                </div>

                {/* BRAND + CATEGORY */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Brand
                    </label>

                    <input
                      type="text"
                      name="brand"
                      value={
                        product.brand || ""
                      }
                      onChange={handleChange}
                      placeholder="e.g. ORENTEMIST"
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base sm:text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Category
                    </label>

                    <select
                      name="category_id"
                      value={
                        product.category_id ??
                        ""
                      }
                      onChange={
                        handleChange
                      }
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base sm:text-sm outline-none focus:border-black"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      product.description ||
                      ""
                    }
                    onChange={handleChange}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-base sm:text-sm outline-none transition focus:border-black"
                  />
                </div>

                {/* FRAGRANCE NOTES */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Fragrance Notes
                  </label>

                  <input
                    type="text"
                    name="fragrance_notes"
                    value={
                      product.fragrance_notes ||
                      ""
                    }
                    onChange={handleChange}
                    placeholder="e.g. Oud, Amber, Vanilla"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base sm:text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                  />

                  <p className="mt-2 text-xs text-black/40">
                    Add the main fragrance notes separated by commas.
                  </p>
                </div>
              </div>
            </section>

            {/* PRICING */}
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Pricing
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Update the selling price for this product.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
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
                      value={
                        product.price || ""
                      }
                      onChange={handleChange}
                      min="0"
                      className="h-12 w-full rounded-xl border border-black/10 bg-white pl-9 pr-4 text-base sm:text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Size
                  </label>

                  <input
                    type="text"
                    name="size"
                    value={
                      product.size || ""
                    }
                    onChange={handleChange}
                    placeholder="e.g. 100ml"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base sm:text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                INVENTORY + PRE-ORDER
            ================================================= */}

            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Inventory & Availability
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Manage current stock and pre-order availability.
                </p>
              </div>

              {/* STOCK */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Current Stock
                </label>

                <input
                  type="number"
                  name="stock_quantity"
                  value={
                    product.stock_quantity ??
                    ""
                  }
                  onChange={
                    handleStockChange
                  }
                  min="0"
                  placeholder="0"
                  className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base sm:text-sm outline-none focus:border-black"
                />

                <p className="mt-2 text-xs text-black/40">
                  Enter 0 when the product is out of stock.
                </p>
              </div>

              {/* LIVE STATUS */}
              <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      hasStock
                        ? "bg-emerald-50 text-emerald-700"
                        : isPreorder
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <Package size={18} />
                  </div>

                  <div>
                    <p className="text-xs text-black/40">
                      Current Status
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {hasStock &&
                        "In Stock"}

                      {isPreorder &&
                        "Pre-order Available"}

                      {isSoldOut &&
                        "Sold Out"}
                    </p>
                  </div>
                </div>
              </div>

              {/* PRE-ORDER SETTINGS */}
              {!hasStock && (
                <div className="mt-5 border-t border-black/10 pt-5">
                  <button
                    type="button"
                    onClick={
                      handlePreorderToggle
                    }
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-black/10 p-4 text-left transition hover:bg-black/[0.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                        <Clock3 size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          Allow Pre-orders
                        </p>

                        <p className="mt-1 max-w-md text-xs leading-5 text-black/45">
                          Let customers purchase this product while it is out of stock.
                        </p>
                      </div>
                    </div>

                    <span
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
                    </span>
                  </button>

                  {/* PRE-ORDER OPTIONS */}
                  {isPreorder && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="mb-4 flex items-start gap-3">
                        <Clock3
                          size={18}
                          className="mt-0.5 shrink-0 text-amber-700"
                        />

                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            Pre-order settings
                          </p>

                          <p className="mt-1 text-xs leading-5 text-amber-800/70">
                            Customers will be able to pay for this product even though the current stock is zero.
                          </p>
                        </div>
                      </div>

                      {/* RELEASE DATE */}
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-950">
                          <CalendarDays
                            size={15}
                          />
                          Expected Release Date
                          <span className="font-normal text-amber-800/50">
                            (Optional)
                          </span>
                        </label>

                        <input
                          type="date"
                          name="preorder_release_date"
                          value={
                            product.preorder_release_date ||
                            ""
                          }
                          onChange={
                            handleChange
                          }
                          className="h-12 w-full rounded-xl border border-amber-200 bg-white px-4 text-base sm:text-sm outline-none focus:border-amber-500"
                        />

                        <p className="mt-2 text-xs text-amber-800/60">
                          Leave blank if you do not know the exact release date.
                        </p>
                      </div>

                      {/* PREORDER MESSAGE */}
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-amber-950">
                          Pre-order Message
                          <span className="ml-1 font-normal text-amber-800/50">
                            (Optional)
                          </span>
                        </label>

                        <textarea
                          name="preorder_message"
                          value={
                            product.preorder_message ||
                            ""
                          }
                          onChange={
                            handleChange
                          }
                          rows={3}
                          maxLength={255}
                          placeholder="e.g. Ships within 4 days of your order"
                          className="w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-base sm:text-sm outline-none focus:border-amber-500"
                        />

                        <p className="mt-2 text-xs text-amber-800/60">
                          This message can be shown to customers on the product page.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SOLD OUT */}
                  {isSoldOut && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/60 p-4">
                      <div className="flex items-start gap-3">
                        <Package
                          size={18}
                          className="mt-0.5 shrink-0 text-red-600"
                        />

                        <div>
                          <p className="text-sm font-semibold text-red-900">
                            Product is Sold Out
                          </p>

                          <p className="mt-1 text-xs leading-5 text-red-800/70">
                            Customers cannot purchase this product until stock is added or pre-orders are enabled.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STOCK EXISTS */}
              {hasStock && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-700"
                    />

                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        Product is In Stock
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-800/70">
                        Customers will see the normal Buy Now option. Pre-order settings are disabled while stock is available.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                IMAGES
            ================================================= */}

            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Product Images
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Add or remove product images.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`group relative aspect-square overflow-hidden rounded-xl bg-black/5 ${
                      image.isMain
                        ? "border-2 border-black"
                        : "border border-black/10"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src =
                          "/placeholder-product.jpg";
                      }}
                    />

                    {image.isMain && (
                      <div className="absolute left-2 top-2 rounded-lg bg-black px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-white">
                        MAIN IMAGE
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          image.id
                        )
                      }
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/80 text-white opacity-0 transition group-hover:opacity-100"
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
                    onChange={
                      handleImageUpload
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </section>
          </div>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <div className="space-y-6">
            {/* PUBLISHING */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h2 className="text-base font-semibold">
                Publishing
              </h2>

              <div className="mt-5 rounded-xl border border-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      Product Status
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      {hasStock
                        ? "Available for customers"
                        : isPreorder
                        ? "Available for pre-order"
                        : "Currently unavailable"}
                    </p>
                  </div>

                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                      hasStock
                        ? "bg-emerald-50 text-emerald-700"
                        : isPreorder
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {hasStock &&
                      "In Stock"}

                    {isPreorder &&
                      "Pre-order"}

                    {isSoldOut &&
                      "Sold Out"}
                  </span>
                </div>
              </div>

              {/* FEATURED */}
              <button
                type="button"
                onClick={() =>
                  setProduct((prev) => ({
                    ...prev,
                    featured:
                      !prev.featured,
                  }))
                }
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-black/10 p-4 text-left"
              >
                <div>
                  <p className="text-sm font-medium">
                    Featured Product
                  </p>

                  <p className="mt-1 text-xs text-black/45">
                    Show on featured sections
                  </p>
                </div>

                <span
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
                </span>
              </button>
            </section>

            {/* SUMMARY */}
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
                    {product.brand ||
                      "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Size
                  </span>

                  <span className="text-sm font-medium">
                    {product.size ||
                      "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Price
                  </span>

                  <span className="text-sm font-medium">
                    ₦
                    {Number(
                      product.price || 0
                    ).toLocaleString(
                      "en-NG"
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Stock
                  </span>

                  <span className="text-sm font-medium">
                    {stockQuantity}{" "}
                    units
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
                    Featured
                  </span>

                  <span className="text-sm font-medium">
                    {product.featured
                      ? "Yes"
                      : "No"}
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

            {/* MOBILE ACTIONS */}
            <div className="space-y-3 sm:hidden">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={17} />

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                onClick={() =>
                  router.back()
                }
                className="flex h-12 w-full items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && !loading && (
        <div className="fixed bottom-5 left-1/2 z-50 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {error}
        </div>
      )}

      {/* SAVED */}
      {saved && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl">
          <Check size={17} />
          Product updated successfully
        </div>
      )}
    </div>
  );
}