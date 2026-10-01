"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.orentemist.online/api";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const DRAFT_DB_NAME = "orentemist-bulk-import";
const DRAFT_STORE_NAME = "drafts";
const DRAFT_KEY = "current";

const COLUMNS = [
  {
    key: "image",
    label: "Image",
    width: 90,
    type: "image",
  },
  {
    key: "name",
    label: "Name *",
    width: 220,
    required: true,
  },
  {
    key: "brand",
    label: "Brand",
    width: 150,
  },
  {
    key: "price",
    label: "Price *",
    width: 120,
    required: true,
    type: "number",
  },
  {
    key: "size",
    label: "Size",
    width: 110,
  },
  {
    key: "category",
    label: "Category",
    width: 150,
  },
  {
    key: "gender",
    label: "Gender",
    width: 120,
  },
  {
    key: "concentration",
    label: "Concentration",
    width: 150,
  },
  {
    key: "description",
    label: "Description",
    width: 280,
    multiline: true,
  },
  {
    key: "fragrance_notes",
    label: "Fragrance Notes",
    width: 250,
    multiline: true,
  },
  {
    key: "stock_quantity",
    label: "Stock",
    width: 110,
    type: "number",
  },
  {
    key: "in_stock",
    label: "In Stock",
    width: 100,
    type: "boolean",
  },
  {
    key: "featured",
    label: "Featured",
    width: 100,
    type: "boolean",
  },
  {
    key: "is_preorder",
    label: "Preorder",
    width: 100,
    type: "boolean",
  },
  {
    key: "preorder_message",
    label: "Preorder Message",
    width: 220,
  },
  {
    key: "preorder_release_date",
    label: "Release Date",
    width: 150,
    type: "date",
  },
];

const CSV_HEADERS = [
  "image",
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
  "in_stock",
  "featured",
  "is_preorder",
  "preorder_message",
  "preorder_release_date",
];

function makeId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createEmptyRow() {
  return {
    id: makeId(),
    imageFile: null,
    imageUrl: "",
    imageName: "",
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
    in_stock: true,
    featured: false,
    is_preorder: false,
    preorder_message: "",
    preorder_release_date: "",
  };
}

function createRows(count = 10) {
  return Array.from({ length: count }, () =>
    createEmptyRow()
  );
}

function openBulkDraftDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(
        new Error(
          "IndexedDB is not available in this browser."
        )
      );
      return;
    }

    const request = window.indexedDB.open(
      DRAFT_DB_NAME,
      1
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveBulkDraft(draft) {
  const db = await openBulkDraftDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      DRAFT_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(
      DRAFT_STORE_NAME
    );

    const request = store.put(draft, DRAFT_KEY);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      reject(transaction.error);
      db.close();
    };
  });
}

async function loadBulkDraft() {
  const db = await openBulkDraftDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      DRAFT_STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(
      DRAFT_STORE_NAME
    );

    const request = store.get(DRAFT_KEY);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      reject(transaction.error);
      db.close();
    };
  });
}

async function clearBulkDraft() {
  const db = await openBulkDraftDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      DRAFT_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(
      DRAFT_STORE_NAME
    );

    const request = store.delete(DRAFT_KEY);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      reject(transaction.error);
      db.close();
    };
  });
}

function escapeCSV(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);

  return result;
}

function parseCSV(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (!lines.length) {
    return [];
  }

  const headers = parseCSVLine(lines[0]).map((header) =>
    header.trim()
  );

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);

    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

export default function BulkImportPage() {
  const [rows, setRows] = useState(() =>
    createRows(10)
  );

  const [selectedRows, setSelectedRows] = useState([]);

  const [imageLibrary, setImageLibrary] = useState([]);

  const [zipFile, setZipFile] = useState(null);

  const [search, setSearch] = useState("");

  const [showAssets, setShowAssets] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [importProgress, setImportProgress] = useState(0);

  const [draftReady, setDraftReady] = useState(false);

  const [draftRestored, setDraftRestored] =
    useState(false);

  const [draftSaving, setDraftSaving] = useState(false);

  const [lastSavedAt, setLastSavedAt] =
    useState(null);

  const [activeCell, setActiveCell] = useState(null);

  const [dragging, setDragging] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  const fileInputRef = useRef(null);

  const csvInputRef = useRef(null);

  const zipInputRef = useRef(null);

  const draftSaveTimerRef = useRef(null);

  const rowsRef = useRef(rows);

  const imageLibraryRef =
    useRef(imageLibrary);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    imageLibraryRef.current = imageLibrary;
  }, [imageLibrary]);

  const populatedRows = useMemo(() => {
    return rows.filter(
      (row) =>
        String(row.name || "").trim() ||
        String(row.brand || "").trim() ||
        String(row.price || "").trim() ||
        row.imageFile
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.name,
        row.brand,
        row.category,
        row.gender,
        row.size,
        row.concentration,
        row.description,
        row.fragrance_notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [rows, search]);

  const validation = useMemo(() => {
    const errors = [];

    populatedRows.forEach((row, index) => {
      const rowNumber = index + 1;

      if (!String(row.name || "").trim()) {
        errors.push(
          `Row ${rowNumber}: product name is required.`
        );
      }

      if (
        row.price === "" ||
        row.price === null ||
        row.price === undefined
      ) {
        errors.push(
          `Row ${rowNumber}: price is required.`
        );
      } else if (
        Number.isNaN(Number(row.price))
      ) {
        errors.push(
          `Row ${rowNumber}: price must be a number.`
        );
      }

      if (
        row.stock_quantity !== "" &&
        row.stock_quantity !== null &&
        row.stock_quantity !== undefined &&
        Number.isNaN(Number(row.stock_quantity))
      ) {
        errors.push(
          `Row ${rowNumber}: stock quantity must be a number.`
        );
      }
    });

    return errors;
  }, [populatedRows]);

  const draftRowsForStorage = useCallback(
    (sourceRows) =>
      sourceRows.map((row) => ({
        ...row,
        imageUrl: "",
      })),
    []
  );

  const draftLibraryForStorage =
    useCallback(
      (sourceLibrary) =>
        sourceLibrary.map((item) => ({
          ...item,
          url: "",
        })),
      []
    );

  const saveDraftNow = useCallback(
    async ({
      silent = false,
      rowsToSave = rowsRef.current,
      libraryToSave = imageLibraryRef.current,
      zipToSave = zipFile,
      searchToSave = search,
      showAssetsToSave = showAssets,
    } = {}) => {
      if (!silent) {
        setDraftSaving(true);
        setMessage("");
        setError("");
      }

      try {
        await saveBulkDraft({
          rows: draftRowsForStorage(rowsToSave),
          imageLibrary:
            draftLibraryForStorage(
              libraryToSave
            ),
          zipFile: zipToSave || null,
          search: searchToSave,
          showAssets: showAssetsToSave,
          savedAt: Date.now(),
        });

        setDraftReady(true);
        setLastSavedAt(Date.now());

        if (!silent) {
          setMessage(
            "Draft saved successfully. Your products and uploaded files are stored in this browser."
          );
        }
      } catch (saveError) {
        console.error(
          "Bulk draft save failed:",
          saveError
        );

        if (!silent) {
          setError(
            "Could not save the draft in this browser. Please check browser storage permissions."
          );
        }
      } finally {
        if (!silent) {
          setDraftSaving(false);
        }
      }
    },
    [
      draftLibraryForStorage,
      draftRowsForStorage,
      search,
      showAssets,
      zipFile,
    ]
  );

  const scheduleDraftSave = useCallback(() => {
    if (!draftReady) {
      return;
    }

    if (draftSaveTimerRef.current) {
      window.clearTimeout(
        draftSaveTimerRef.current
      );
    }

    draftSaveTimerRef.current =
      window.setTimeout(() => {
        void saveDraftNow({
          silent: true,
        });
      }, 700);
  }, [draftReady, saveDraftNow]);

  useEffect(() => {
    let cancelled = false;

    async function restoreDraft() {
      try {
        const draft = await loadBulkDraft();

        if (cancelled) {
          return;
        }

        if (!draft) {
          setDraftReady(true);
          setDraftRestored(false);
          return;
        }

        const restoredRows = Array.isArray(
          draft.rows
        )
          ? draft.rows.map((row) => {
              const restoredRow = {
                ...row,
                imageUrl: "",
              };

              if (restoredRow.imageFile) {
                restoredRow.imageUrl =
                  URL.createObjectURL(
                    restoredRow.imageFile
                  );
              }

              return restoredRow;
            })
          : createRows(10);

        const restoredLibrary =
          Array.isArray(
            draft.imageLibrary
          )
            ? draft.imageLibrary.map((item) => ({
                ...item,
                url: item.file
                  ? URL.createObjectURL(
                      item.file
                    )
                  : "",
              }))
            : [];

        setRows(restoredRows);
        setImageLibrary(restoredLibrary);
        setZipFile(draft.zipFile || null);
        setSearch(draft.search || "");
        setShowAssets(
          Boolean(draft.showAssets)
        );
        setDraftReady(true);
        setDraftRestored(true);
        setLastSavedAt(
          draft.savedAt || null
        );
        setMessage(
          "Your saved bulk-import draft has been restored."
        );
      } catch (restoreError) {
        console.error(
          "Bulk draft restore failed:",
          restoreError
        );

        if (!cancelled) {
          setDraftReady(true);
          setError(
            "The saved draft could not be restored. You can continue with a new draft."
          );
        }
      }
    }

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    scheduleDraftSave();
  }, [
    rows,
    imageLibrary,
    zipFile,
    search,
    showAssets,
    draftReady,
    scheduleDraftSave,
  ]);

  useEffect(() => {
    return () => {
      if (draftSaveTimerRef.current) {
        window.clearTimeout(
          draftSaveTimerRef.current
        );
      }

      imageLibraryRef.current.forEach(
        (item) => {
          if (item.url) {
            URL.revokeObjectURL(item.url);
          }
        }
      );

      rowsRef.current.forEach((row) => {
        if (
          row.imageUrl &&
          row.imageFile
        ) {
          URL.revokeObjectURL(
            row.imageUrl
          );
        }
      });
    };
  }, []);

  function revokeRowImage(row) {
    if (row?.imageUrl && row?.imageFile) {
      URL.revokeObjectURL(row.imageUrl);
    }
  }

  function revokeLibraryImage(item) {
    if (item?.url) {
      URL.revokeObjectURL(item.url);
    }
  }

  function updateRow(rowId, key, value) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [key]: value,
            }
          : row
      )
    );
  }

  function addRows(count = 1) {
    setRows((current) => [
      ...current,
      ...createRows(count),
    ]);
  }

  function deleteRow(rowId) {
    setRows((current) => {
      const row = current.find(
        (item) => item.id === rowId
      );

      if (row) {
        revokeRowImage(row);
      }

      return current.filter(
        (item) => item.id !== rowId
      );
    });

    setSelectedRows((current) =>
      current.filter((id) => id !== rowId)
    );
  }

  function duplicateRow(rowId) {
    setRows((current) => {
      const index = current.findIndex(
        (row) => row.id === rowId
      );

      if (index === -1) {
        return current;
      }

      const original = current[index];

      const copy = {
        ...original,
        id: makeId(),
        imageFile: original.imageFile,
        imageUrl: original.imageFile
          ? URL.createObjectURL(
              original.imageFile
            )
          : "",
      };

      const next = [...current];

      next.splice(index + 1, 0, copy);

      return next;
    });
  }

  function toggleRowSelected(rowId) {
    setSelectedRows((current) =>
      current.includes(rowId)
        ? current.filter(
            (id) => id !== rowId
          )
        : [...current, rowId]
    );
  }

  function toggleAllRows() {
    if (
      selectedRows.length === rows.length
    ) {
      setSelectedRows([]);
      return;
    }

    setSelectedRows(
      rows.map((row) => row.id)
    );
  }

  function deleteSelectedRows() {
    if (!selectedRows.length) {
      return;
    }

    const selectedSet = new Set(
      selectedRows
    );

    setRows((current) => {
      current.forEach((row) => {
        if (selectedSet.has(row.id)) {
          revokeRowImage(row);
        }
      });

      return current.filter(
        (row) => !selectedSet.has(row.id)
      );
    });

    setSelectedRows([]);
  }

  function removeRowImage(rowId) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        revokeRowImage(row);

        return {
          ...row,
          imageFile: null,
          imageUrl: "",
          imageName: "",
        };
      })
    );
  }

  function addImageFiles(files) {
    const validFiles = Array.from(files).filter(
      (file) => {
        if (!file.type.startsWith("image/")) {
          return false;
        }

        if (file.size > MAX_FILE_SIZE) {
          return false;
        }

        return true;
      }
    );

    if (!validFiles.length) {
      setError(
        "No valid image files were selected. Images must be under 20MB."
      );
      return;
    }

    const items = validFiles.map((file) => ({
      id: makeId(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImageLibrary((current) => [
      ...current,
      ...items,
    ]);

    setShowAssets(true);
    setError("");
    setMessage(
      `${items.length} image${
        items.length === 1 ? "" : "s"
      } added to the image library.`
    );
  }

  function handleImageInput(event) {
    const files = event.target.files;

    if (files?.length) {
      addImageFiles(files);
    }

    event.target.value = "";
  }

  function removeLibraryImage(imageId) {
    setImageLibrary((current) => {
      const item = current.find(
        (image) => image.id === imageId
      );

      if (item) {
        revokeLibraryImage(item);
      }

      return current.filter(
        (image) => image.id !== imageId
      );
    });
  }

  function assignImageToRow(rowId, imageItem) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        revokeRowImage(row);

        return {
          ...row,
          imageFile: imageItem.file,
          imageUrl:
            imageItem.file
              ? URL.createObjectURL(
                  imageItem.file
                )
              : "",
          imageName: imageItem.name,
        };
      })
    );
  }

  function matchImagesToRows() {
    const lookup = new Map();

    imageLibrary.forEach((item) => {
      const baseName = item.name
        .replace(/\.[^/.]+$/, "")
        .trim()
        .toLowerCase();

      lookup.set(baseName, item);
      lookup.set(
        item.name.trim().toLowerCase(),
        item
      );
    });

    let matched = 0;

    setRows((current) =>
      current.map((row) => {
        const name = String(
          row.name || ""
        )
          .trim()
          .toLowerCase();

        if (!name) {
          return row;
        }

        const found =
          lookup.get(name) ||
          lookup.get(
            `${name}.jpg`
          ) ||
          lookup.get(
            `${name}.jpeg`
          ) ||
          lookup.get(
            `${name}.png`
          ) ||
          lookup.get(
            `${name}.webp`
          );

        if (!found) {
          return row;
        }

        revokeRowImage(row);

        matched += 1;

        return {
          ...row,
          imageFile: found.file,
          imageUrl:
            found.file
              ? URL.createObjectURL(
                  found.file
                )
              : "",
          imageName: found.name,
        };
      })
    );

    setMessage(
      matched
        ? `${matched} image${
            matched === 1 ? "" : "s"
          } matched to product names.`
        : "No image names matched product names."
    );
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    const files = event.dataTransfer.files;

    if (files?.length) {
      addImageFiles(files);
    }
  }

  async function handleZipFile(file) {
    if (!file) {
      return;
    }

    if (
      !file.name.toLowerCase().endsWith(".zip")
    ) {
      setError("Please select a ZIP file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError(
        "ZIP files must be under 100MB."
      );
      return;
    }

    setZipFile(file);
    setError("");
    setMessage(
      `ZIP file "${file.name}" attached to this draft.`
    );
  }

  function handleZipInput(event) {
    const file = event.target.files?.[0];

    if (file) {
      void handleZipFile(file);
    }

    event.target.value = "";
  }

  function removeZipFile() {
    setZipFile(null);
  }

  function downloadCSVTemplate() {
    const header = CSV_HEADERS.join(",");

    const sample = [
      "",
      "Example Perfume",
      "Brand Name",
      "50000",
      "100ML",
      "Perfume",
      "Unisex",
      "Eau de Parfum",
      "Example product description",
      "Top: Bergamot; Heart: Rose; Base: Musk",
      "10",
      "true",
      "false",
      "false",
      "",
      "",
    ]
      .map(escapeCSV)
      .join(",");

    const csv = `${header}\n${sample}\n`;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "orentemist-product-import-template.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const csvRows = [
      CSV_HEADERS.join(","),
      ...rows
        .filter(
          (row) =>
            String(row.name || "").trim()
        )
        .map((row) =>
          CSV_HEADERS.map((header) =>
            escapeCSV(
              header === "image"
                ? row.imageName || ""
                : row[header]
            )
          ).join(",")
        ),
    ];

    const blob = new Blob(
      [csvRows.join("\n")],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "orentemist-products.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    setMessage("CSV exported successfully.");
  }

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");

      const data = rows
        .filter((row) =>
          String(row.name || "").trim()
        )
        .map((row) => {
          const output = {};

          CSV_HEADERS.forEach((header) => {
            output[header] =
              header === "image"
                ? row.imageName || ""
                : row[header];
          });

          return output;
        });

      const worksheet =
        XLSX.utils.json_to_sheet(data);

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Products"
      );

      XLSX.writeFile(
        workbook,
        "orentemist-products.xlsx"
      );

      setMessage(
        "Excel file exported successfully."
      );
    } catch (excelError) {
      console.error(
        "Excel export failed:",
        excelError
      );

      setError(
        "Excel export requires the xlsx package. Install it with: npm install xlsx"
      );
    }
  }

  async function exportZIP() {
    try {
      const JSZip = (await import("jszip"))
        .default;

      const XLSX = await import("xlsx");

      const zip = new JSZip();

      const data = rows
        .filter((row) =>
          String(row.name || "").trim()
        )
        .map((row) => {
          const output = {};

          CSV_HEADERS.forEach((header) => {
            output[header] =
              header === "image"
                ? row.imageName || ""
                : row[header];
          });

          return output;
        });

      const worksheet =
        XLSX.utils.json_to_sheet(data);

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Products"
      );

      const workbookArray =
        XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });

      zip.file(
        "products.xlsx",
        workbookArray
      );

      const csv = [
        CSV_HEADERS.join(","),
        ...data.map((row) =>
          CSV_HEADERS.map((header) =>
            escapeCSV(row[header])
          ).join(",")
        ),
      ].join("\n");

      zip.file("products.csv", csv);

      const imagesFolder =
        zip.folder("images");

      rows.forEach((row) => {
        if (
          row.imageFile &&
          row.imageName
        ) {
          imagesFolder.file(
            row.imageName,
            row.imageFile
          );
        }
      });

      const content = await zip.generateAsync({
        type: "blob",
      });

      const url = URL.createObjectURL(content);

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download =
        "orentemist-bulk-import.zip";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);

      setMessage(
        "ZIP package exported successfully."
      );
    } catch (zipError) {
      console.error(
        "ZIP export failed:",
        zipError
      );

      setError(
        "ZIP export requires xlsx and jszip. Install them with: npm install xlsx jszip"
      );
    }
  }

  async function importCSVFile(file) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();

      const imported = parseCSV(text);

      if (!imported.length) {
        setError(
          "The CSV file does not contain any product rows."
        );
        return;
      }

      const newRows = imported.map(
        (item) => ({
          ...createEmptyRow(),
          imageName: item.image || "",
          name: item.name || "",
          brand: item.brand || "",
          price: item.price || "",
          size: item.size || "",
          category: item.category || "",
          gender: item.gender || "",
          concentration:
            item.concentration || "",
          description:
            item.description || "",
          fragrance_notes:
            item.fragrance_notes || "",
          stock_quantity:
            item.stock_quantity || "",
          in_stock:
            item.in_stock === ""
              ? true
              : String(
                  item.in_stock
                ).toLowerCase() === "true",
          featured:
            String(
              item.featured
            ).toLowerCase() === "true",
          is_preorder:
            String(
              item.is_preorder
            ).toLowerCase() === "true",
          preorder_message:
            item.preorder_message || "",
          preorder_release_date:
            item.preorder_release_date ||
            "",
        })
      );

      setRows(newRows);
      setSelectedRows([]);
      setError("");
      setMessage(
        `${newRows.length} product rows imported from CSV.`
      );
    } catch (csvError) {
      console.error(
        "CSV import failed:",
        csvError
      );

      setError(
        "Could not read the CSV file."
      );
    }
  }

  function handleCSVInput(event) {
    const file = event.target.files?.[0];

    if (file) {
      void importCSVFile(file);
    }

    event.target.value = "";
  }

  function handlePaste(event, rowIndex) {
    const text =
      event.clipboardData?.getData(
        "text/plain"
      );

    if (!text || !text.includes("\t")) {
      return;
    }

    event.preventDefault();

    const pastedRows = text
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "")
      .map((line) =>
        line.split("\t")
      );

    if (!pastedRows.length) {
      return;
    }

    const firstRow =
      rows[rowIndex];

    if (!firstRow) {
      return;
    }

    const startColumnIndex =
      Math.max(
        0,
        COLUMNS.findIndex(
          (column) =>
            column.key ===
            activeCell?.columnKey
        )
      );

    setRows((current) => {
      const next = [...current];

      pastedRows.forEach(
        (values, pastedRowIndex) => {
          const targetRowIndex =
            rowIndex + pastedRowIndex;

          while (
            targetRowIndex >=
            next.length
          ) {
            next.push(createEmptyRow());
          }

          const targetRow = {
            ...next[targetRowIndex],
          };

          values.forEach(
            (value, valueIndex) => {
              const column =
                COLUMNS[
                  startColumnIndex +
                    valueIndex
                ];

              if (!column) {
                return;
              }

              if (
                column.type ===
                "boolean"
              ) {
                const normalized =
                  String(
                    value
                  )
                    .trim()
                    .toLowerCase();

                targetRow[column.key] =
                  normalized ===
                  "true";
              } else {
                targetRow[column.key] =
                  value;
              }
            }
          );

          next[targetRowIndex] =
            targetRow;
        }
      );

      return next;
    });

    setMessage(
      `${pastedRows.length} spreadsheet row${
        pastedRows.length === 1
          ? ""
          : "s"
      } pasted successfully.`
    );
  }

  function focusCell(
    rowId,
    columnKey
  ) {
    window.setTimeout(() => {
      const element =
        document.querySelector(
          `[data-cell="${rowId}-${columnKey}"]`
        );

      if (element) {
        element.focus();
      }
    }, 30);
  }

  function handleCellKeyDown(
    event,
    rowIndex,
    column
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        rowIndex ===
        rows.length - 1
      ) {
        addRows(1);

        window.setTimeout(() => {
          setRows((current) => {
            const created =
              current[
                current.length - 1
              ];

            if (created) {
              focusCell(
                created.id,
                column.key
              );
            }

            return current;
          });
        }, 50);

        return;
      }

      const nextRow =
        rows[rowIndex + 1];

      if (nextRow) {
        focusCell(
          nextRow.id,
          column.key
        );
      }

      return;
    }

    if (
      event.key === "Tab" &&
      !event.shiftKey
    ) {
      const currentColumnIndex =
        COLUMNS.findIndex(
          (item) =>
            item.key ===
            column.key
        );

      const nextColumn =
        COLUMNS[
          currentColumnIndex + 1
        ];

      if (nextColumn) {
        event.preventDefault();

        focusCell(
          rows[rowIndex].id,
          nextColumn.key
        );
      }
    }
  }

  function handleCellFocus(
    rowId,
    columnKey
  ) {
    setActiveCell({
      rowId,
      columnKey,
    });
  }

  async function saveDraftButton() {
    if (draftSaveTimerRef.current) {
      window.clearTimeout(
        draftSaveTimerRef.current
      );
      draftSaveTimerRef.current = null;
    }

    await saveDraftNow({
      silent: false,
    });
  }

  async function restoreDraftButton() {
    if (draftSaveTimerRef.current) {
      window.clearTimeout(
        draftSaveTimerRef.current
      );
      draftSaveTimerRef.current = null;
    }

    try {
      setError("");
      setMessage("");

      const draft =
        await loadBulkDraft();

      if (!draft) {
        setMessage(
          "There is no saved bulk-import draft in this browser."
        );
        return;
      }

      rowsRef.current.forEach((row) => {
        revokeRowImage(row);
      });

      imageLibraryRef.current.forEach(
        (item) => {
          revokeLibraryImage(item);
        }
      );

      const restoredRows =
        Array.isArray(draft.rows)
          ? draft.rows.map((row) => ({
              ...row,
              imageUrl:
                row.imageFile
                  ? URL.createObjectURL(
                      row.imageFile
                    )
                  : "",
            }))
          : createRows(10);

      const restoredLibrary =
        Array.isArray(
          draft.imageLibrary
        )
          ? draft.imageLibrary.map(
              (item) => ({
                ...item,
                url: item.file
                  ? URL.createObjectURL(
                      item.file
                    )
                  : "",
              })
            )
          : [];

      setRows(restoredRows);
      setImageLibrary(
        restoredLibrary
      );
      setZipFile(
        draft.zipFile || null
      );
      setSearch(draft.search || "");
      setShowAssets(
        Boolean(draft.showAssets)
      );
      setSelectedRows([]);
      setDraftRestored(true);
      setDraftReady(true);
      setLastSavedAt(
        draft.savedAt || null
      );

      setMessage(
        "Saved draft restored successfully."
      );
    } catch (restoreError) {
      console.error(
        "Manual draft restore failed:",
        restoreError
      );

      setError(
        "Could not restore the saved draft."
      );
    }
  }

  async function clearDraftButton() {
    if (draftSaveTimerRef.current) {
      window.clearTimeout(
        draftSaveTimerRef.current
      );
      draftSaveTimerRef.current = null;
    }

    const confirmed = window.confirm(
      "Clear the saved draft from this browser? This will not delete your current spreadsheet until you choose Clear All."
    );

    if (!confirmed) {
      return;
    }

    try {
      await clearBulkDraft();

      setDraftRestored(false);
      setLastSavedAt(null);
      setMessage(
        "Saved draft cleared successfully."
      );
      setError("");
    } catch (clearError) {
      console.error(
        "Draft clear failed:",
        clearError
      );

      setError(
        "Could not clear the saved draft."
      );
    }
  }

  function clearAll() {
    const confirmed = window.confirm(
      "Clear the entire spreadsheet, uploaded images, ZIP file, and saved draft? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    if (draftSaveTimerRef.current) {
      window.clearTimeout(
        draftSaveTimerRef.current
      );
      draftSaveTimerRef.current = null;
    }

    rowsRef.current.forEach((row) => {
      revokeRowImage(row);
    });

    imageLibraryRef.current.forEach(
      (item) => {
        revokeLibraryImage(item);
      }
    );

    setRows(createRows(10));
    setImageLibrary([]);
    setZipFile(null);
    setSelectedRows([]);
    setSearch("");
    setShowAssets(false);
    setMessage("");
    setError("");
    setDraftRestored(false);
    setLastSavedAt(null);

    void clearBulkDraft()
      .then(() => {
        setMessage(
          "Spreadsheet and saved draft cleared."
        );
      })
      .catch((clearError) => {
        console.error(
          "Could not clear draft:",
          clearError
        );

        setError(
          "Spreadsheet cleared, but the saved draft could not be removed."
        );
      });
  }

  async function handleImport() {
    setError("");
    setMessage("");

    if (!populatedRows.length) {
      setError(
        "Add at least one product before importing."
      );
      return;
    }

    if (validation.length) {
      setError(
        validation
          .slice(0, 5)
          .join(" ")
      );
      return;
    }

    if (draftSaveTimerRef.current) {
      window.clearTimeout(
        draftSaveTimerRef.current
      );
      draftSaveTimerRef.current = null;
    }

    setLoading(true);
    setImportProgress(10);

    try {
      const csrfResponse =
        await fetch(
          `${API_URL}/auth/csrf/`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const csrfData =
        await csrfResponse
          .json()
          .catch(() => ({}));

      if (
        !csrfResponse.ok ||
        !csrfData?.csrfToken
      ) {
        throw new Error(
          "Unable to initialize secure request. Please refresh and try again."
        );
      }

      setImportProgress(25);

      const formData =
        new FormData();

      const products =
        populatedRows.map(
          (row) => ({
            name:
              String(
                row.name || ""
              ).trim(),
            brand:
              String(
                row.brand || ""
              ).trim(),
            price:
              row.price === ""
                ? null
                : Number(row.price),
            size:
              String(
                row.size || ""
              ).trim(),
            category:
              String(
                row.category || ""
              ).trim(),
            gender:
              String(
                row.gender || ""
              ).trim(),
            concentration:
              String(
                row.concentration ||
                  ""
              ).trim(),
            description:
              String(
                row.description ||
                  ""
              ).trim(),
            fragrance_notes:
              String(
                row.fragrance_notes ||
                  ""
              ).trim(),
            stock_quantity:
              row.stock_quantity ===
              ""
                ? 0
                : Number(
                    row.stock_quantity
                  ),
            in_stock:
              Boolean(row.in_stock),
            featured:
              Boolean(row.featured),
            is_preorder:
              Boolean(
                row.is_preorder
              ),
            preorder_message:
              String(
                row.preorder_message ||
                  ""
              ).trim(),
            preorder_release_date:
              row.preorder_release_date ||
              null,
            image:
              row.imageName || "",
          })
        );

      formData.append(
        "products",
        JSON.stringify(products)
      );

      populatedRows.forEach((row) => {
        if (row.imageFile) {
          formData.append(
            "images",
            row.imageFile,
            row.imageName ||
              row.imageFile.name
          );
        }
      });

      if (zipFile) {
        formData.append(
          "zip_file",
          zipFile,
          zipFile.name
        );
      }

      setImportProgress(45);

      const response =
        await fetch(
          `${API_URL}/products/admin/bulk-import/`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "X-CSRFToken":
                csrfData.csrfToken,
            },
            body: formData,
          }
        );

      setImportProgress(75);

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "Bulk product import failed."
        );
      }

      setImportProgress(100);

      await clearBulkDraft();

      setDraftRestored(false);
      setLastSavedAt(null);

      setMessage(
        `Import completed successfully. ${
          data?.created ??
          populatedRows.length
        } product${
          (data?.created ??
            populatedRows.length) ===
          1
            ? ""
            : "s"
        } processed.`
      );

      /*
       * We intentionally keep the spreadsheet
       * visible after import so you can review
       * what was submitted.
       */
    } catch (importError) {
      console.error(
        "Bulk import failed:",
        importError
      );

      setError(
        importError?.message ||
          "Bulk product import failed."
      );
    } finally {
      setLoading(false);

      window.setTimeout(() => {
        setImportProgress(0);
      }, 1000);
    }
  }

  function renderImageCell(row) {
    return (
      <div className="flex h-full min-h-[74px] items-center justify-center">
        {row.imageUrl ? (
          <div className="group relative">
            <img
              src={row.imageUrl}
              alt={
                row.name ||
                row.imageName ||
                "Product"
              }
              className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white"
            />

            <button
              type="button"
              onClick={() =>
                removeRowImage(row.id)
              }
              className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white shadow group-hover:flex"
              title="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-black/20 bg-white text-xl text-black/40 transition hover:border-black/40 hover:text-black"
            title="Add image"
          >
            +
          </button>
        )}
      </div>
    );
  }

  function renderCell(
    row,
    rowIndex,
    column
  ) {
    if (column.type === "image") {
      return renderImageCell(row);
    }

    if (column.type === "boolean") {
      return (
        <div className="flex min-h-[74px] items-center justify-center">
          <input
            type="checkbox"
            checked={Boolean(
              row[column.key]
            )}
            onChange={(event) =>
              updateRow(
                row.id,
                column.key,
                event.target.checked
              )
            }
            className="h-4 w-4 rounded border-black/20 accent-black"
            data-cell={`${row.id}-${column.key}`}
            onFocus={() =>
              handleCellFocus(
                row.id,
                column.key
              )
            }
          />
        </div>
      );
    }

    if (column.multiline) {
      return (
        <textarea
          value={row[column.key] ?? ""}
          onChange={(event) =>
            updateRow(
              row.id,
              column.key,
              event.target.value
            )
          }
          onFocus={() =>
            handleCellFocus(
              row.id,
              column.key
            )
          }
          onKeyDown={(event) =>
            handleCellKeyDown(
              event,
              rowIndex,
              column
            )
          }
          onPaste={(event) =>
            handlePaste(
              event,
              rowIndex
            )
          }
          data-cell={`${row.id}-${column.key}`}
          className="min-h-[68px] w-full resize-none border-0 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-black/25"
          placeholder="—"
        />
      );
    }

    return (
      <input
        type={
          column.type === "number"
            ? "number"
            : column.type === "date"
            ? "date"
            : "text"
        }
        value={row[column.key] ?? ""}
        onChange={(event) =>
          updateRow(
            row.id,
            column.key,
            event.target.value
          )
        }
        onFocus={() =>
          handleCellFocus(
            row.id,
            column.key
          )
        }
        onKeyDown={(event) =>
          handleCellKeyDown(
            event,
            rowIndex,
            column
          )
        }
        onPaste={(event) =>
          handlePaste(
            event,
            rowIndex
          )
        }
        data-cell={`${row.id}-${column.key}`}
        min={
          column.type === "number"
            ? "0"
            : undefined
        }
        className="h-[74px] w-full border-0 bg-transparent px-3 text-sm outline-none placeholder:text-black/25"
        placeholder="—"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#171512]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageInput}
      />

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCSVInput}
      />

      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={handleZipInput}
      />

      <div className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  window.history.back()
                }
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium transition hover:border-black/25 hover:bg-black/[0.03]"
              >
                ← Back
              </button>

              <span className="rounded-full bg-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                Admin
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Bulk Product Importer
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
              Add products like a spreadsheet,
              attach images or a ZIP, save your
              work, and import everything into
              Orentemist in one operation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setShowHelp((current) => !current)
              }
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
            >
              {showHelp ? "Hide Help" : "Help"}
            </button>

            <button
              type="button"
              onClick={downloadCSVTemplate}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
            >
              CSV Template
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="mb-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                  Spreadsheet
                </p>
                <p className="mt-2 text-sm leading-6 text-black/65">
                  Type products directly into the
                  table. You can also paste multiple
                  Excel/Google Sheets rows at once.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                  Images
                </p>
                <p className="mt-2 text-sm leading-6 text-black/65">
                  Drag images into the image library
                  and match them to product names, or
                  attach images directly to rows.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                  Drafts
                </p>
                <p className="mt-2 text-sm leading-6 text-black/65">
                  Your draft is automatically saved in
                  this browser after changes. Use
                  Save Draft for an immediate save.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-black/40">
              Products
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {populatedRows.length}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-black/40">
              Images
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {imageLibrary.length}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-black/40">
              ZIP
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {zipFile
                ? zipFile.name
                : "None attached"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-black/40">
              Validation
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                validation.length
                  ? "text-red-600"
                  : "text-emerald-700"
              }`}
            >
              {validation.length
                ? `${validation.length} issue${
                    validation.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : "Ready"}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  addRows(5)
                }
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/85"
              >
                + Add 5 Rows
              </button>

              <button
                type="button"
                onClick={() =>
                  addRows(20)
                }
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
              >
                + Add 20 Rows
              </button>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
              >
                Add Images
              </button>

              <button
                type="button"
                onClick={() =>
                  csvInputRef.current?.click()
                }
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
              >
                Import CSV
              </button>

              <button
                type="button"
                onClick={() =>
                  zipInputRef.current?.click()
                }
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
              >
                Attach ZIP
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveDraftButton}
                disabled={draftSaving}
                className="rounded-xl border border-black/10 bg-[#f7f3ed] px-4 py-2.5 text-sm font-semibold transition hover:border-black/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {draftSaving
                  ? "Saving..."
                  : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={restoreDraftButton}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
              >
                Restore Draft
              </button>

              <button
                type="button"
                onClick={clearDraftButton}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Clear Draft
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:border-black/25"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/5 px-1 pt-3 text-xs text-black/45">
            <span>
              {draftSaving
                ? "Saving draft..."
                : draftRestored
                ? "Draft restored"
                : "Autosave enabled"}
            </span>

            {lastSavedAt && (
              <span>
                Last saved{" "}
                {new Date(
                  lastSavedAt
                ).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {validation.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Please fix these rows before
                  importing
                </p>

                <ul className="mt-2 space-y-1 text-xs text-amber-800">
                  {validation
                    .slice(0, 8)
                    .map((item) => (
                      <li key={item}>
                        • {item}
                      </li>
                    ))}
                </ul>

                {validation.length >
                  8 && (
                  <p className="mt-2 text-xs text-amber-700">
                    +{" "}
                    {validation.length -
                      8}{" "}
                    more issue
                    {validation.length -
                      8 ===
                    1
                      ? ""
                      : "s"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className={`mb-5 rounded-2xl border bg-white p-4 shadow-sm transition ${
            dragging
              ? "border-black bg-black/[0.03]"
              : "border-black/10"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Image Library
              </p>

              <p className="mt-1 text-xs leading-5 text-black/45">
                Drag and drop images here, or use Add
                Images. Image filenames can be matched
                against product names.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowAssets(
                    (current) =>
                      !current
                  )
                }
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium"
              >
                {showAssets
                  ? "Hide Library"
                  : "Show Library"}
              </button>

              <button
                type="button"
                onClick={matchImagesToRows}
                disabled={
                  !imageLibrary.length
                }
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Match to Products
              </button>
            </div>
          </div>

          {showAssets && (
            <div className="mt-4 border-t border-black/5 pt-4">
              {imageLibrary.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {imageLibrary.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="group relative overflow-hidden rounded-xl border border-black/10 bg-[#f7f3ed]"
                      >
                        {item.url ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="aspect-square" />
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-2 text-[10px] text-white">
                          <p className="truncate">
                            {item.name}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeLibraryImage(
                              item.id
                            )
                          }
                          className="absolute right-2 top-2 h-6 w-6 rounded-full bg-black/80 text-xs text-white"
                          title="Remove"
                        >
                          ×
                        </button>

                        <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold">
                            Drag / assign below
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-black/10 py-10 text-center text-sm text-black/40">
                  Drop product images here.
                </div>
              )}
            </div>
          )}

          {zipFile && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-black/10 bg-[#f7f3ed] px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/40">
                  ZIP attached
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {zipFile.name}
                </p>
              </div>

              <button
                type="button"
                onClick={removeZipFile}
                className="ml-4 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black/25"
            >
              Download CSV
            </button>

            <button
              type="button"
              onClick={exportExcel}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black/25"
            >
              Download Excel
            </button>

            <button
              type="button"
              onClick={exportZIP}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition hover:border-black/25"
            >
              Download ZIP
            </button>

            {selectedRows.length >
              0 && (
              <button
                type="button"
                onClick={
                  deleteSelectedRows
                }
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete{" "}
                {selectedRows.length}{" "}
                Selected
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search products..."
              className="w-full rounded-xl border border-black/10 bg-[#f7f3ed] px-4 py-2.5 text-sm outline-none placeholder:text-black/35 focus:border-black/30 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/10 bg-[#f7f3ed]">
                  <th className="sticky left-0 z-20 w-12 min-w-12 border-r border-black/10 bg-[#f7f3ed] px-2 py-3">
                    <input
                      type="checkbox"
                      checked={
                        rows.length > 0 &&
                        selectedRows.length ===
                          rows.length
                      }
                      onChange={
                        toggleAllRows
                      }
                      className="h-4 w-4 rounded accent-black"
                    />
                  </th>

                  <th className="w-12 min-w-12 border-r border-black/10 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                    #
                  </th>

                  {COLUMNS.map(
                    (column) => (
                      <th
                        key={column.key}
                        style={{
                          width:
                            column.width,
                          minWidth:
                            column.width,
                        }}
                        className="border-r border-black/10 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45 last:border-r-0"
                      >
                        {column.label}
                      </th>
                    )
                  )}

                  <th className="w-28 min-w-28 border-l border-black/10 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map(
                  (row) => {
                    const rowIndex =
                      rows.findIndex(
                        (item) =>
                          item.id ===
                          row.id
                      );

                    const hasError =
                      validation.some(
                        (item) =>
                          item.startsWith(
                            `Row ${
                              rowIndex + 1
                            }:`
                          )
                      );

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-black/5 last:border-b-0 ${
                          hasError
                            ? "bg-red-50/40"
                            : ""
                        }`}
                      >
                        <td className="sticky left-0 z-10 border-r border-black/5 bg-white px-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(
                              row.id
                            )}
                            onChange={() =>
                              toggleRowSelected(
                                row.id
                              )
                            }
                            className="h-4 w-4 rounded accent-black"
                          />
                        </td>

                        <td className="border-r border-black/5 px-2 text-center text-xs text-black/35">
                          {rowIndex + 1}
                        </td>

                        {COLUMNS.map(
                          (column) => (
                            <td
                              key={
                                column.key
                              }
                              style={{
                                width:
                                  column.width,
                                minWidth:
                                  column.width,
                              }}
                              className="border-r border-black/5 align-middle last:border-r-0"
                            >
                              {renderCell(
                                row,
                                rowIndex,
                                column
                              )}
                            </td>
                          )
                        )}

                        <td className="border-l border-black/5 px-2">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                duplicateRow(
                                  row.id
                                )
                              }
                              className="rounded-lg border border-black/10 px-2 py-1.5 text-[10px] font-medium hover:border-black/25"
                              title="Duplicate row"
                            >
                              Copy
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteRow(
                                  row.id
                                )
                              }
                              className="rounded-lg border border-red-100 px-2 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50"
                              title="Delete row"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}

                {!filteredRows.length && (
                  <tr>
                    <td
                      colSpan={
                        COLUMNS.length +
                        3
                      }
                      className="px-6 py-16 text-center text-sm text-black/40"
                    >
                      No rows match your
                      search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-black/10 bg-[#f7f3ed] px-4 py-3 text-xs text-black/45">
            Tip: paste directly from Excel or
            Google Sheets. Press Enter to move
            downward. The table can be horizontally
            scrolled on mobile.
          </div>
        </div>

        <div className="sticky bottom-4 z-30 mt-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Ready to import
              </p>

              <p className="mt-0.5 text-xs text-black/45">
                {populatedRows.length} product
                {populatedRows.length === 1
                  ? ""
                  : "s"}{" "}
                will be sent to the admin
                bulk-import endpoint.
              </p>

              {loading &&
                importProgress > 0 && (
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-black transition-all"
                      style={{
                        width: `${importProgress}%`,
                      }}
                    />
                  </div>
                )}
            </div>

            <button
              type="button"
              onClick={handleImport}
              disabled={
                loading ||
                !populatedRows.length ||
                validation.length > 0
              }
              className="w-full rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {loading
                ? `Importing${
                    importProgress
                      ? ` ${importProgress}%`
                      : "..."
                  }`
                : `Import ${populatedRows.length} Product${
                    populatedRows.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}