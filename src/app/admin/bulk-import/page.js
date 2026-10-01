"use client";

import { useMemo, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.orentemist.online/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const emptyProduct = {
  name: "",
  brand: "",
  price: "",
  size: "",
  category: "",
  gender: "",
  concentration: "",
  description: "",
  fragrance_notes: "",
  stock_quantity: "",
  featured: false,
  is_preorder: false,
  preorder_message: "",
  preorder_release_date: "",
  image: null,
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function csvToRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(cell);
      cell = "";

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (cell !== "" || row.length) {
    row.push(cell);

    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function parseCSV(text) {
  const rows = csvToRows(text);

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);

  return rows.slice(1).map((values) => {
    const object = {};

    headers.forEach((header, index) => {
      object[header] = values[index] ?? "";
    });

    return object;
  });
}

function getExtension(filename) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export default function BulkImportPage() {
  const [products, setProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);

  const [draggingImages, setDraggingImages] = useState(false);
  const [draggingData, setDraggingData] = useState(false);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("products");
  const [showPreview, setShowPreview] = useState(false);

  const imageInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const zipInputRef = useRef(null);

  const validProducts = useMemo(
    () => products.filter((product) => product.name.trim()),
    [products]
  );

  function addProduct() {
    setProducts((current) => [
      ...current,
      {
        ...emptyProduct,
        id: makeId(),
      },
    ]);
  }

  function removeProduct(id) {
    setProducts((current) =>
      current.filter((product) => product.id !== id)
    );
  }

  function updateProduct(id, field, value) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              [field]: value,
            }
          : product
      )
    );
  }

  function clearAll() {
    if (!window.confirm("Clear all imported products and images?")) {
      return;
    }

    setProducts([]);
    setImages([]);
    setCsvFile(null);
    setZipFile(null);
    setMessage("");
    setError("");
    setProgress(0);
  }

  function validateFiles(files) {
    const valid = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `${file.name} is larger than the 50MB limit.`
        );
        continue;
      }

      valid.push(file);
    }

    return valid;
  }

  function handleImages(files) {
    const selected = validateFiles(
      Array.from(files || []).filter((file) =>
        file.type.startsWith("image/")
      )
    );

    if (!selected.length) {
      return;
    }

    const newImages = selected.map((file) => ({
      id: makeId(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImages((current) => [...current, ...newImages]);
    setMessage(`${selected.length} image(s) added.`);
    setError("");
  }

  function removeImage(id) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);

      if (image?.url) {
        URL.revokeObjectURL(image.url);
      }

      return current.filter((item) => item.id !== id);
    });
  }

  async function handleCSV(file) {
    if (!file) {
      return;
    }

    if (getExtension(file.name) !== "csv") {
      setError("Please select a CSV file.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const text = await file.text();
      const rows = parseCSV(text);

      if (!rows.length) {
        throw new Error("The CSV file contains no products.");
      }

      const imported = rows.map((row) => ({
        ...emptyProduct,

        id: makeId(),

        name: row.name || "",
        brand: row.brand || "",
        price: row.price || "",
        size: row.size || "",
        category:
          row.category ||
          row.category_name ||
          "",
        gender: row.gender || "",
        concentration: row.concentration || "",
        description: row.description || "",
        fragrance_notes:
          row.fragrance_notes ||
          row.fragrance_note ||
          row.notes ||
          "",
        stock_quantity:
          row.stock_quantity ||
          row.stock ||
          row.quantity ||
          "",

        featured:
          String(row.featured || "").toLowerCase() === "true" ||
          String(row.featured || "") === "1",

        is_preorder:
          String(row.is_preorder || "").toLowerCase() === "true" ||
          String(row.is_preorder || "") === "1",

        preorder_message:
          row.preorder_message || "",

        preorder_release_date:
          row.preorder_release_date || "",

        csv_image:
          row.image ||
          row.image_name ||
          row.image_filename ||
          "",
      }));

      setProducts(imported);
      setCsvFile(file);

      setMessage(
        `${imported.length} product(s) loaded from ${file.name}.`
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to read the CSV file."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDataDrop(event) {
    event.preventDefault();
    setDraggingData(false);

    const files = Array.from(event.dataTransfer.files || []);

    const csv = files.find(
      (file) => getExtension(file.name) === "csv"
    );

    const zip = files.find(
      (file) => getExtension(file.name) === "zip"
    );

    if (csv) {
      handleCSV(csv);
    }

    if (zip) {
      setZipFile(zip);
      setMessage(`ZIP selected: ${zip.name}`);
      setError("");
    }
  }

  function handleImageDrop(event) {
    event.preventDefault();
    setDraggingImages(false);

    handleImages(event.dataTransfer.files);
  }

  function matchImage(product) {
    if (!product.csv_image) {
      return null;
    }

    const wanted = product.csv_image
      .trim()
      .toLowerCase();

    return (
      images.find(
        (image) =>
          image.name.toLowerCase() === wanted
      ) ||
      images.find(
        (image) =>
          image.name
            .toLowerCase()
            .includes(wanted)
      ) ||
      null
    );
  }

  function assignMatchedImages() {
    setProducts((current) =>
      current.map((product) => {
        const match = matchImage(product);

        return match
          ? {
              ...product,
              image: match.file,
            }
          : product;
      })
    );

    setMessage("Matching images assigned to products.");
  }

  function downloadTemplate() {
    const headers = [
      "name",
      "brand",
      "price",
      "size",
      "category",
      "gender",
      "concentration",
      "description",
      "fragrance_notes",
      "stock_quantity",
      "featured",
      "is_preorder",
      "preorder_message",
      "preorder_release_date",
      "image",
    ];

    const example = [
      "Vintage Radio",
      "Lattafa",
      "30000",
      "100ML",
      "Perfume",
      "Unisex",
      "Eau de Parfum",
      "Product description",
      "Top: Citrus; Heart: Floral; Base: Musk",
      "20",
      "false",
      "false",
      "",
      "",
      "vintage-radio.jpg",
    ];

    const csv =
      headers.join(",") +
      "\n" +
      example
        .map((value) => {
          const stringValue = String(value);

          if (
            stringValue.includes(",") ||
            stringValue.includes('"')
          ) {
            return `"${stringValue.replaceAll('"', '""')}"`;
          }

          return stringValue;
        })
        .join(",");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "product-import-template.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function importProducts() {
    if (!validProducts.length) {
      setError(
        "Add at least one product with a product name."
      );
      return;
    }

    setImporting(true);
    setProgress(0);
    setError("");
    setMessage("");

    try {
      /*
       * This endpoint should be connected to your Django
       * bulk-import endpoint.
       *
       * The frontend is intentionally sending multipart/form-data
       * so products and images can be handled together.
       */

      const formData = new FormData();

      formData.append(
        "products",
        JSON.stringify(
          validProducts.map((product) => ({
            name: product.name,
            brand: product.brand,
            price: product.price,
            size: product.size,
            category: product.category,
            gender: product.gender,
            concentration: product.concentration,
            description: product.description,
            fragrance_notes:
              product.fragrance_notes,
            stock_quantity:
              product.stock_quantity,
            featured: product.featured,
            is_preorder:
              product.is_preorder,
            preorder_message:
              product.preorder_message,
            preorder_release_date:
              product.preorder_release_date,
          }))
        )
      );

      images.forEach((image) => {
        formData.append(
          "images",
          image.file,
          image.name
        );
      });

      if (zipFile) {
        formData.append(
          "zip_file",
          zipFile,
          zipFile.name
        );
      }

      /*
       * Change this URL if your Django endpoint uses
       * another route.
       */
      const response = await fetch(
        `${API_URL}/products/bulk-import/`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      setProgress(70);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "Bulk import failed."
        );
      }

      setProgress(100);

      setMessage(
        data?.message ||
          `${validProducts.length} product(s) imported successfully.`
      );
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong during the import."
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 text-[#171512] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
              Admin / Products
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Bulk Product Importer
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Add products manually, upload a CSV, drag and
              drop images, or prepare a complete product
              batch before sending it to your backend.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-black hover:text-white"
            >
              Download CSV Template
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* STATUS */}
        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}

        {/* TABS */}
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-black/10 bg-white p-2">
          {[
            ["products", "Products"],
            ["images", "Images"],
            ["preview", "Preview"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium whitespace-nowrap transition ${
                activeTab === value
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {label}

              {value === "products" &&
                ` (${products.length})`}

              {value === "images" &&
                ` (${images.length})`}
            </button>
          ))}
        </div>

        {/* IMPORT AREA */}
        {activeTab === "products" && (
          <>
            <div className="mb-6 grid gap-5 lg:grid-cols-2">
              {/* CSV / ZIP */}
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDraggingData(true);
                }}
                onDragLeave={() =>
                  setDraggingData(false)
                }
                onDrop={handleDataDrop}
                className={`rounded-3xl border-2 border-dashed p-8 transition ${
                  draggingData
                    ? "border-black bg-white"
                    : "border-black/10 bg-white"
                }`}
              >
                <div className="mb-4 text-3xl">
                  📦
                </div>

                <h2 className="text-lg font-semibold">
                  Drop CSV or ZIP
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Drop your product spreadsheet or ZIP
                  package here.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      csvInputRef.current?.click()
                    }
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Choose CSV
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      zipInputRef.current?.click()
                    }
                    className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium"
                  >
                    Choose ZIP
                  </button>
                </div>

                {csvFile && (
                  <div className="mt-5 rounded-xl bg-neutral-50 p-3 text-sm">
                    <strong>CSV:</strong>{" "}
                    {csvFile.name}
                  </div>
                )}

                {zipFile && (
                  <div className="mt-2 rounded-xl bg-neutral-50 p-3 text-sm">
                    <strong>ZIP:</strong>{" "}
                    {zipFile.name}
                  </div>
                )}

                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) =>
                    handleCSV(
                      event.target.files?.[0]
                    )
                  }
                />

                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0];

                    if (file) {
                      setZipFile(file);
                      setMessage(
                        `ZIP selected: ${file.name}`
                      );
                      setError("");
                    }
                  }}
                />
              </div>

              {/* IMAGE DROP */}
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDraggingImages(true);
                }}
                onDragLeave={() =>
                  setDraggingImages(false)
                }
                onDrop={handleImageDrop}
                className={`rounded-3xl border-2 border-dashed p-8 transition ${
                  draggingImages
                    ? "border-black bg-white"
                    : "border-black/10 bg-white"
                }`}
              >
                <div className="mb-4 text-3xl">
                  🖼️
                </div>

                <h2 className="text-lg font-semibold">
                  Drag & Drop Product Images
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Drop JPG, PNG, WEBP or other supported
                  image files here.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    imageInputRef.current?.click()
                  }
                  className="mt-5 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white"
                >
                  Choose Images
                </button>

                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleImages(
                      event.target.files
                    )
                  }
                />

                <div className="mt-5 text-sm text-neutral-500">
                  {images.length} image(s) loaded
                </div>
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold">
                  {products.length} product(s)
                </div>

                <div className="text-sm text-neutral-500">
                  {validProducts.length} ready for import
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addProduct}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
                >
                  + Add Product
                </button>

                <button
                  type="button"
                  onClick={assignMatchedImages}
                  disabled={!images.length}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Match Images
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("preview")
                  }
                  disabled={!products.length}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium disabled:opacity-40"
                >
                  Preview
                </button>

                <button
                  type="button"
                  onClick={importProducts}
                  disabled={
                    importing ||
                    !validProducts.length
                  }
                  className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {importing
                    ? "Importing..."
                    : "Import Products"}
                </button>
              </div>
            </div>

            {/* PROGRESS */}
            {importing && (
              <div className="mb-5 rounded-2xl border border-black/10 bg-white p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Importing products...</span>
                  <span>{progress}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* PRODUCT LIST */}
            <div className="space-y-4">
              {!products.length && (
                <div className="rounded-3xl border border-black/10 bg-white px-6 py-16 text-center">
                  <div className="text-4xl">📦</div>

                  <h2 className="mt-4 text-lg font-semibold">
                    No products yet
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                    Upload a CSV, drag products into the
                    importer, or add products manually.
                  </p>

                  <button
                    type="button"
                    onClick={addProduct}
                    className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
                  >
                    Add Your First Product
                  </button>
                </div>
              )}

              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="rounded-3xl border border-black/10 bg-white p-5"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                        Product {index + 1}
                      </div>

                      <div className="mt-1 font-semibold">
                        {product.name ||
                          "Untitled Product"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeProduct(product.id)
                      }
                      className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["name", "Product Name"],
                      ["brand", "Brand"],
                      ["price", "Price"],
                      ["size", "Size"],
                      ["category", "Category"],
                      ["gender", "Gender"],
                      ["concentration", "Concentration"],
                      [
                        "stock_quantity",
                        "Stock Quantity",
                      ],
                      [
                        "fragrance_notes",
                        "Fragrance Notes",
                      ],
                      [
                        "csv_image",
                        "Image Filename",
                      ],
                    ].map(([field, label]) => (
                      <label
                        key={field}
                        className={
                          field ===
                          "fragrance_notes"
                            ? "md:col-span-2"
                            : ""
                        }
                      >
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {label}
                        </span>

                        <input
                          type={
                            field === "price" ||
                            field ===
                              "stock_quantity"
                              ? "number"
                              : "text"
                          }
                          value={
                            product[field] ?? ""
                          }
                          onChange={(event) =>
                            updateProduct(
                              product.id,
                              field,
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black"
                        />
                      </label>
                    ))}

                    <label className="md:col-span-2 lg:col-span-3">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Description
                      </span>

                      <textarea
                        rows={4}
                        value={
                          product.description
                        }
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "description",
                            event.target.value
                          )
                        }
                        className="w-full resize-y rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-black"
                      />
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={Boolean(
                          product.featured
                        )}
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "featured",
                            event.target.checked
                          )
                        }
                      />

                      <span className="text-sm font-medium">
                        Featured Product
                      </span>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={Boolean(
                          product.is_preorder
                        )}
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "is_preorder",
                            event.target.checked
                          )
                        }
                      />

                      <span className="text-sm font-medium">
                        Pre-order
                      </span>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Pre-order Release Date
                      </span>

                      <input
                        type="date"
                        value={
                          product.preorder_release_date
                        }
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "preorder_release_date",
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
                      />
                    </label>

                    <label className="md:col-span-2 lg:col-span-3">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Pre-order Message
                      </span>

                      <input
                        type="text"
                        value={
                          product.preorder_message
                        }
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "preorder_message",
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* IMAGE TAB */}
        {activeTab === "images" && (
          <section>
            <div className="mb-6 rounded-3xl border border-black/10 bg-white p-6">
              <h2 className="text-xl font-semibold">
                Image Library
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Upload all your product images here. The
                importer can match them to products using
                the image filename from your CSV.
              </p>

              <button
                type="button"
                onClick={() =>
                  imageInputRef.current?.click()
                }
                className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Add More Images
              </button>
            </div>

            {!images.length ? (
              <div className="rounded-3xl border border-black/10 bg-white p-16 text-center text-sm text-neutral-500">
                No images uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-black/10 bg-white"
                  >
                    <div className="aspect-square bg-neutral-100">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-3">
                      <div
                        className="truncate text-xs font-medium"
                        title={image.name}
                      >
                        {image.name}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(image.id)
                        }
                        className="mt-2 text-xs font-medium text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PREVIEW */}
        {activeTab === "preview" && (
          <section>
            <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Import Preview
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Review everything before sending it to
                  Django.
                </p>
              </div>

              <button
                type="button"
                onClick={importProducts}
                disabled={
                  importing ||
                  !validProducts.length
                }
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {importing
                  ? "Importing..."
                  : `Import ${validProducts.length} Product(s)`}
              </button>
            </div>

            <div className="grid gap-4">
              {validProducts.map(
                (product, index) => {
                  const matchedImage =
                    product.image
                      ? images.find(
                          (image) =>
                            image.file ===
                            product.image
                        )
                      : matchImage(product);

                  return (
                    <div
                      key={product.id}
                      className="rounded-3xl border border-black/10 bg-white p-5"
                    >
                      <div className="flex gap-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                          {matchedImage ? (
                            <img
                              src={matchedImage.url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-2xl">
                              🖼️
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                            Product {index + 1}
                          </div>

                          <h3 className="mt-1 text-lg font-semibold">
                            {product.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                            {product.brand && (
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                                {product.brand}
                              </span>
                            )}

                            {product.price && (
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                                ₦{product.price}
                              </span>
                            )}

                            {product.size && (
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                                {product.size}
                              </span>
                            )}

                            {product.category && (
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                                {product.category}
                              </span>
                            )}

                            {product.stock_quantity !==
                              "" && (
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                                Stock:{" "}
                                {
                                  product.stock_quantity
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}