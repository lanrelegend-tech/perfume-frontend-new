"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Save,
  Trash2,
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

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);

  const [deletedImageIds, setDeletedImageIds] =
    useState([]);

  const [deletedMainImage, setDeletedMainImage] =
    useState(false);

  /*
   * Stores the ID of an existing gallery image
   * that was promoted to the new MAIN IMAGE.
   */
  const [promotedMainImageId, setPromotedMainImageId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;

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
          `${process.env.NEXT_PUBLIC_API_URL}/products/`
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
          : Array.isArray(productsData.results)
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

          in_stock:
            Boolean(foundProduct.in_stock),

          featured:
            Boolean(foundProduct.featured),
        };

        setProduct(formattedProduct);

        /*
         * Product.image is the MAIN image.
         *
         * Product.images[] contains
         * additional gallery images.
         */
        const galleryImages =
          Array.isArray(foundProduct.images)
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

        const categoriesResponse =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/products/categories/`
          );

        if (categoriesResponse.ok) {
          const categoriesData =
            await categoriesResponse.json();

          const categoryList =
            Array.isArray(categoriesData)
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
  }, [productId, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * Add new images.
   *
   * If there is currently no main image,
   * the FIRST newly selected image becomes
   * the new main image.
   *
   * Any other selected images become
   * gallery images.
   */
  const handleImageUpload = (e) => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) return;

    const hasMainImage = images.some(
      (image) => image.isMain === true
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

    /*
     * We found a replacement main image,
     * so do not clear Product.image.
     */
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

  /*
   * Remove an image.
   */
  const removeImage = (id) => {
    const image = images.find(
      (item) => item.id === id
    );

    if (!image) return;

    const remainingImages = images.filter(
      (item) => item.id !== id
    );

    /*
     * If the MAIN image is deleted,
     * promote the next available image
     * to MAIN IMAGE.
     */
    if (image.isMain) {
      const nextMainImage =
        remainingImages[0];

      if (nextMainImage) {
        nextMainImage.isMain = true;

        setDeletedMainImage(false);

        /*
         * If the replacement is an existing
         * gallery image, remember its ID so
         * the backend can make it the new
         * Product.image.
         */
        if (
          nextMainImage.existing &&
          typeof nextMainImage.id === "number"
        ) {
          setPromotedMainImageId(
            nextMainImage.id
          );
        } else {
          /*
           * A new local file will be uploaded
           * through the existing main-image
           * upload logic.
           */
          setPromotedMainImageId(null);
        }
      } else {
        /*
         * No image remains.
         */
        setDeletedMainImage(true);
        setPromotedMainImageId(null);
      }
    } else if (
      /*
       * Existing gallery image being deleted.
       */
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

    /*
     * Clean up temporary preview URLs.
     */
    if (
      image.url?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(image.url);
    }

    setImages(remainingImages);
  };

  const handleSave = async () => {
    if (!product) return;

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const payload = {
        name: product.name,
        brand: product.brand,
        description: product.description,
        category_id:
          product.category_id === "" ||
          product.category_id === null
            ? null
            : Number(
                product.category_id
              ),
        price: Number(product.price),
        size: product.size,
        fragrance_notes:
          product.fragrance_notes,
        stock_quantity: Number(
          product.stock_quantity
        ),
        in_stock:
          Boolean(product.in_stock),
        featured:
          Boolean(product.featured),
      };

      /*
       * If there is no replacement main image,
       * clear Product.image.
       */
      if (
        deletedMainImage &&
        !images.some(
          (image) =>
            image.isMain === true
        )
      ) {
        payload.image = null;
      }

      /*
       * Update normal product information.
       */
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/admin/${productId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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
          // Keep default error message
        }

        throw new Error(message);
      }

      /*
       * Find the newly selected MAIN image.
       *
       * This is uploaded to Product.image,
       * NOT ProductImage/gallery.
       */
      const newMainImage = images.find(
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
            `${process.env.NEXT_PUBLIC_API_URL}/products/admin/${productId}/`,
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

        if (!mainImageResponse.ok) {
          let message =
            "Product was updated, but the main product image could not be uploaded.";

          try {
            const errorData =
              await mainImageResponse.json();

            console.error(
              "Main image upload response:",
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
            // Keep default error message
          }

          throw new Error(message);
        }
      }

      /*
       * If an existing gallery image was promoted
       * to MAIN IMAGE, tell the backend to make it
       * the Product.image without deleting it.
       */
      if (
        promotedMainImageId !== null
      ) {
        const promoteResponse =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/products/admin/images/${promotedMainImageId}/`,
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

        if (!promoteResponse.ok) {
          throw new Error(
            "Product was updated, but the new main image could not be saved."
          );
        }
      }

      /*
       * Delete existing gallery images
       * that the user removed.
       */
      if (
        deletedImageIds.length > 0
      ) {
        for (
          const imageId of
            deletedImageIds
        ) {
          const deleteResponse =
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/products/admin/images/${imageId}/`,
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
            console.error(
              `Failed to delete image ${imageId}`
            );

            throw new Error(
              "Product was updated, but one or more images could not be deleted."
            );
          }
        }
      }

      /*
       * Upload NEW GALLERY images.
       *
       * IMPORTANT:
       * The new main image is excluded here.
       */
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
            `${process.env.NEXT_PUBLIC_API_URL}/products/admin/images/bulk/`,
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
          console.error(
            "Image upload failed"
          );

          throw new Error(
            "Product was updated, but image upload failed."
          );
        }
      }

      setSaved(true);

      setTimeout(() => {
        router.push(
          "/admin/products"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-black flex items-center justify-center">
        <p className="text-sm text-black/40">
          Loading product...
        </p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      {/* Header */}
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
              onClick={() => router.back()}
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

      {/* Content */}
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main */}
          <div className="space-y-6">
            {/* Basic Information */}
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
                {/* Name */}
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
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black"
                  />
                </div>

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
                      placeholder="e.g. VELRA"
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
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
                      className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black"
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

                {/* Description */}
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
                    className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>

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
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                  />

                  <p className="mt-2 text-xs text-black/40">
                    Add the main fragrance notes separated by commas.
                  </p>
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
                      className="h-12 w-full rounded-xl border border-black/10 bg-white pl-9 pr-4 text-sm outline-none focus:border-black"
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
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
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
                  Manage stock and product availability.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Stock Quantity
                  </label>

                  <input
                    type="number"
                    name="stock_quantity"
                    value={
                      product.stock_quantity ??
                      "0"
                    }
                    onChange={handleChange}
                    min="0"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Availability
                  </label>

                  <select
                    name="in_stock"
                    value={
                      product.in_stock
                        ? "true"
                        : "false"
                    }
                    onChange={(e) =>
                      setProduct(
                        (prev) => ({
                          ...prev,
                          in_stock:
                            e.target
                              .value ===
                            "true",
                        })
                      )
                    }
                    className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black"
                  >
                    <option value="true">
                      In Stock
                    </option>

                    <option value="false">
                      Out of Stock
                    </option>
                  </select>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <h2 className="text-base font-semibold">
                Publishing
              </h2>

              <div className="mt-5 rounded-xl border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Product Status
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      {product.in_stock
                        ? "Available for customers"
                        : "Currently unavailable"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      product.in_stock
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-black/5 text-black/50"
                    }`}
                  >
                    {product.in_stock
                      ? "In Stock"
                      : "Out of Stock"}
                  </span>
                </div>
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

            {/* Summary */}
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
                      product.price ||
                        0
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
                    {
                      product.stock_quantity
                    }{" "}
                    units
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-black/50">
                    Availability
                  </span>

                  <span className="text-sm font-medium">
                    {product.in_stock
                      ? "In Stock"
                      : "Out of Stock"}
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
                onClick={() => router.back()}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notification */}
      {error && !loading && (
        <div className="fixed bottom-5 left-1/2 z-50 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {error}
        </div>
      )}

      {/* Saved Notification */}
      {saved && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-xl">
          <Check size={17} />
          Product updated successfully
        </div>
      )}
    </div>
  );
}