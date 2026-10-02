"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.orentemist.online/api";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGES_PER_ROW = 4;

// ============================================================
// BULK IMPORT DRAFT PERSISTENCE
// ============================================================

const BULK_DRAFT_DB_NAME = "orentemist-bulk-import";
const BULK_DRAFT_STORE_NAME = "drafts";
const BULK_DRAFT_KEY = "current";

function openBulkDraftDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = window.indexedDB.open(BULK_DRAFT_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(BULK_DRAFT_STORE_NAME)) {
        db.createObjectStore(BULK_DRAFT_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error("Unable to open draft storage.")
      );
    };
  });
}

async function saveBulkDraft(draft) {
  const db = await openBulkDraftDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      BULK_DRAFT_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(
      BULK_DRAFT_STORE_NAME
    );

    store.put(draft, BULK_DRAFT_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("Unable to save bulk import draft.")
      );
    };
  });
}

async function loadBulkDraft() {
  const db = await openBulkDraftDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      BULK_DRAFT_STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(
      BULK_DRAFT_STORE_NAME
    );

    const request = store.get(BULK_DRAFT_KEY);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      db.close();
      reject(
        request.error ||
          new Error("Unable to load bulk import draft.")
      );
    };
  });
}

async function clearBulkDraft() {
  const db = await openBulkDraftDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      BULK_DRAFT_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(
      BULK_DRAFT_STORE_NAME
    );

    store.delete(BULK_DRAFT_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("Unable to clear bulk import draft.")
      );
    };
  });
}

const COLUMNS = [
  { key: "image", label: "Image", width: 120, type: "image" },
  { key: "name", label: "Name", width: 220, type: "text", required: true },
  { key: "brand", label: "Brand", width: 160, type: "text" },
  { key: "price", label: "Price", width: 120, type: "number", required: true },
  { key: "size", label: "Size", width: 110, type: "text" },
  { key: "category", label: "Category", width: 150, type: "select" },
  {
    key: "description",
    label: "Description",
    width: 280,
    type: "textarea",
  },
  {
    key: "fragrance_notes",
    label: "Fragrance Notes",
    width: 250,
    type: "textarea",
  },
  {
    key: "stock_quantity",
    label: "Stock",
    width: 100,
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
    label: "Pre-order",
    width: 110,
    type: "boolean",
  },
  {
    key: "preorder_message",
    label: "Pre-order Message",
    width: 230,
    type: "text",
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
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createBlankRow() {
  return {
    id: makeId(),

    imageFiles: [],
    imageUrls: [],
    imageNames: [],

    name: "",
    brand: "",
    price: "",
    size: "",
    category: "",
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
  return Array.from({ length: count }, () => createBlankRow());
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^\w]/g, "");
}

function parseCSVLine(line) {
  const values = [];
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
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);

  return values;
}

function parseCSV(text) {
  const lines = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '""';
      i += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      current += char;
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }

      lines.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines
    .filter((line) => line.trim() !== "")
    .map(parseCSVLine);
}

function csvEscape(value) {
  const stringValue = String(value ?? "");

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function booleanFromValue(value, fallback = false) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) return fallback;

  return [
    "true",
    "1",
    "yes",
    "y",
    "on",
    "checked",
    "x",
  ].includes(normalized);
}

function safeFileName(name) {
  return String(name || "file")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim();
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export default function BulkImportPage() {
  const [rows, setRows] = useState(() => createRows(10));
  const [selectedRows, setSelectedRows] = useState([]);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [zipFile, setZipFile] = useState(null);
  const [categories, setCategories] = useState([]);

  const [draftReady, setDraftReady] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const draftSaveTimerRef = useRef(null);

  const skipNextDraftSaveRef = useRef(false);
  const draftSaveVersionRef = useRef(0);

  const [search, setSearch] = useState("");
  const [showAssets, setShowAssets] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [draggingImages, setDraggingImages] = useState(false);
  const [draggingZip, setDraggingZip] = useState(false);

  const [activeCell, setActiveCell] = useState(null);

  const imageInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const singleImageInputRef = useRef(null);

  const cellRefs = useRef({});
  const pendingImageRow = useRef(null);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.name,
        row.brand,
        row.category,
        row.description,
        row.fragrance_notes,
        (row.imageNames || []).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [rows, search]);

  const populatedRows = useMemo(
    () => rows.filter((row) => row.name.trim()),
    [rows]
  );

  const validationErrors = useMemo(() => {
    const errors = {};

    rows.forEach((row) => {
      if (!row.name.trim()) {
        return;
      }

      const rowErrors = [];

      if (!row.price || Number.isNaN(Number(row.price))) {
        rowErrors.push("Price is required");
      }

      if (
        row.stock_quantity !== "" &&
        Number.isNaN(Number(row.stock_quantity))
      ) {
        rowErrors.push("Stock must be a number");
      }

      errors[row.id] = rowErrors;
    });

    return errors;
  }, [rows]);

  const invalidRows = useMemo(
    () =>
      populatedRows.filter(
        (row) => validationErrors[row.id]?.length > 0
      ).length,
    [populatedRows, validationErrors]
  );

  const allVisibleSelected =
    visibleRows.length > 0 &&
    visibleRows.every((row) => selectedRows.includes(row.id));

  // ============================================================
  // CLEAN UP PREVIEW URLS WHEN PAGE UNMOUNTS
  // ============================================================
useEffect(() => {
  async function loadCategories() {
    try {
      const response = await fetch(
        `${API_URL}/products/categories/`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load categories.");
      }

      const data = await response.json();

      const categoryList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.categories)
        ? data.categories
        : [];

      setCategories(categoryList);
    } catch (error) {
      console.error(
        "Unable to load product categories:",
        error
      );
    }
  }

  loadCategories();
}, []);
  const rowsRef = useRef(rows);
  const imageLibraryRef = useRef(imageLibrary);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    imageLibraryRef.current = imageLibrary;
  }, [imageLibrary]);

  useEffect(() => {
    return () => {
      imageLibraryRef.current.forEach((item) => {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });

      rowsRef.current.forEach((row) => {
        const urls = Array.isArray(row.imageUrls)
          ? row.imageUrls
          : row.imageUrl
          ? [row.imageUrl]
          : [];

        urls.forEach((url) => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        });
      });
    };
  }, []);

  function updateCell(rowId, key, value) {
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
    setRows((current) => [...current, ...createRows(count)]);
  }

  function deleteRow(rowId) {
    setRows((current) => {
      const row = current.find((item) => item.id === rowId);

      const urls = Array.isArray(row?.imageUrls)
        ? row.imageUrls
        : row?.imageUrl
        ? [row.imageUrl]
        : [];

      urls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });

      return current.filter((item) => item.id !== rowId);
    });

    setSelectedRows((current) =>
      current.filter((id) => id !== rowId)
    );
  }

  function duplicateRow(rowId) {
    setRows((current) => {
      const index = current.findIndex((row) => row.id === rowId);

      if (index === -1) {
        return current;
      }

      const original = current[index];
      const imageFiles = [...(original.imageFiles || [])];
      const imageUrls = imageFiles.map((file) =>
        URL.createObjectURL(file)
      );

      const copy = {
        ...original,
        id: makeId(),
        imageFiles,
        imageUrls,
        imageNames: [...(original.imageNames || [])],
        imageFile: imageFiles[0] || null,
        imageUrl: imageUrls[0] || "",
        imageName: original.imageNames?.[0] || "",
      };

      const next = [...current];
      next.splice(index + 1, 0, copy);

      return next;
    });
  }

  // ============================================================
  // RESTORE BULK IMPORT DRAFT ON PAGE LOAD
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function restoreDraft() {
      try {
        const draft = await loadBulkDraft();

        if (cancelled) return;

        if (!draft) {
          setDraftReady(true);
          return;
        }

        const restoredRows = Array.isArray(draft.rows)
          ? draft.rows.map((row) => {
              const restoredRow = {
                ...row,
                imageFiles: Array.isArray(row.imageFiles)
                  ? row.imageFiles
                  : row.imageFile
                  ? [row.imageFile]
                  : [],
                imageUrls: [],
                imageNames: Array.isArray(row.imageNames)
                  ? row.imageNames
                  : row.imageName
                  ? [row.imageName]
                  : [],
              };

              restoredRow.imageUrls = restoredRow.imageFiles.map(
                (file) => URL.createObjectURL(file)
              );

              restoredRow.imageFile =
                restoredRow.imageFiles[0] || null;

              restoredRow.imageUrl =
                restoredRow.imageUrls[0] || "";

              restoredRow.imageName =
                restoredRow.imageNames[0] || "";

              return restoredRow;
            })
          : createRows(10);

        const restoredImageLibrary = Array.isArray(
          draft.imageLibrary
        )
          ? draft.imageLibrary.map((item) => ({
              ...item,
              url: item.file
                ? URL.createObjectURL(item.file)
                : "",
            }))
          : [];

        setRows(restoredRows);
        setImageLibrary(restoredImageLibrary);
        setZipFile(draft.zipFile || null);

        if (typeof draft.search === "string") {
          setSearch(draft.search);
        }

        if (typeof draft.showAssets === "boolean") {
          setShowAssets(draft.showAssets);
        }

        setDraftRestored(true);
        setDraftReady(true);
      } catch (error) {
        console.error(
          "Unable to restore bulk import draft:",
          error
        );

        setDraftReady(true);
      }
    }

    restoreDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // AUTO-SAVE BULK IMPORT DRAFT
  // ============================================================

  useEffect(() => {
    if (!draftReady) return;

    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;

      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }

      return;
    }

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    const saveVersion = draftSaveVersionRef.current;

    draftSaveTimerRef.current = setTimeout(async () => {
      try {
        setDraftSaving(true);

        const rowsToSave = rows.map((row) => ({
          ...row,
          imageUrl: "",
          imageUrls: [],
        }));

        const imageLibraryToSave = imageLibrary.map(
          (item) => ({
            ...item,
            url: "",
          })
        );

        if (saveVersion !== draftSaveVersionRef.current) {
          setDraftSaving(false);
          return;
        }

        await saveBulkDraft({
          rows: rowsToSave,
          imageLibrary: imageLibraryToSave,
          zipFile: zipFile || null,
          search,
          showAssets,
          savedAt: Date.now(),
        });

        if (saveVersion !== draftSaveVersionRef.current) {
          await clearBulkDraft();
        }

        setDraftSaving(false);
      } catch (error) {
        console.error(
          "Unable to save bulk import draft:",
          error
        );

        setDraftSaving(false);
      }
    }, 700);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }
    };
  }, [
    rows,
    imageLibrary,
    zipFile,
    search,
    showAssets,
    draftReady,
  ]);

  function clearEmptyRows() {
    setRows((current) =>
      current.filter((row) => row.name.trim())
    );
    setSelectedRows([]);
  }

  async function clearSavedDraft({
    clearCurrent = false,
    message = "Saved bulk import draft cleared.",
  } = {}) {
    try {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }

      draftSaveVersionRef.current += 1;
      skipNextDraftSaveRef.current = true;

      await clearBulkDraft();

      setDraftRestored(false);
      setDraftSaving(false);

      if (clearCurrent) {
        setRows(createRows(10));
        setImageLibrary([]);
        setZipFile(null);
        setSelectedRows([]);
        setSearch("");
        setActiveCell(null);
      }

      setMessage(message);
      setError("");
    } catch (error) {
      skipNextDraftSaveRef.current = false;

      console.error(
        "Unable to clear saved bulk import draft:",
        error
      );

      setError(
        "Unable to clear the saved draft. Please try again."
      );
    }
  }

  async function clearAll() {
    const confirmed = window.confirm(
      "Clear the entire spreadsheet? This cannot be undone."
    );

    if (!confirmed) return;

    await clearSavedDraft({
      clearCurrent: true,
      message: "Spreadsheet and saved draft cleared.",
    });

    setMessage("Spreadsheet and saved draft cleared.");
    setError("");
  }

  function toggleRowSelection(rowId) {
    setSelectedRows((current) =>
      current.includes(rowId)
        ? current.filter((id) => id !== rowId)
        : [...current, rowId]
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedRows((current) =>
        current.filter(
          (id) => !visibleRows.some((row) => row.id === id)
        )
      );
      return;
    }

    setSelectedRows((current) => [
      ...new Set([
        ...current,
        ...visibleRows.map((row) => row.id),
      ]),
    ]);
  }

  function deleteSelectedRows() {
    if (!selectedRows.length) return;

    const confirmed = window.confirm(
      `Delete ${selectedRows.length} selected row${
        selectedRows.length === 1 ? "" : "s"
      }?`
    );

    if (!confirmed) return;

    setRows((current) =>
      current.filter((row) => !selectedRows.includes(row.id))
    );

    setSelectedRows([]);
  }

  function focusCell(rowId, columnKey) {
    const element = cellRefs.current[`${rowId}:${columnKey}`];

    if (element) {
      element.focus();

      if (
        typeof element.select === "function" &&
        element.tagName !== "TEXTAREA"
      ) {
        element.select();
      }
    }
  }

  function handleCellKeyDown(
    event,
    rowIndex,
    columnIndex,
    row,
    column
  ) {
    if (event.key === "Enter") {
      event.preventDefault();

      const nextRow = rows[rowIndex + 1];

      if (nextRow) {
        focusCell(nextRow.id, column.key);
      } else {
        addRows(1);

        setTimeout(() => {
          setRows((current) => {
            const created = current[current.length - 1];

            if (created) {
              setTimeout(() => {
                focusCell(created.id, column.key);
              }, 20);
            }

            return current;
          });
        }, 20);
      }

      return;
    }

    if (event.key === "ArrowDown" && !event.shiftKey) {
      const nextRow = rows[rowIndex + 1];

      if (nextRow) {
        event.preventDefault();
        focusCell(nextRow.id, column.key);
      }

      return;
    }

    if (event.key === "ArrowUp" && !event.shiftKey) {
      const previousRow = rows[rowIndex - 1];

      if (previousRow) {
        event.preventDefault();
        focusCell(previousRow.id, column.key);
      }

      return;
    }

    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      columnIndex === COLUMNS.length - 1 &&
      rowIndex === rows.length - 1
    ) {
      event.preventDefault();

      addRows(1);

      setTimeout(() => {
        setRows((current) => {
          const newRow = current[current.length - 1];

          if (newRow) {
            setTimeout(() => {
              focusCell(newRow.id, COLUMNS[0].key);
            }, 20);
          }

          return current;
        });
      }, 20);
    }
  }

  function parsePastedTable(text) {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => line.split("\t"));
  }

  function convertPastedValue(column, value) {
    if (column.type === "boolean") {
      return booleanFromValue(value);
    }

    return value;
  }

  function handleCellPaste(event, rowIndex, columnIndex) {
    const text = event.clipboardData.getData("text/plain");

    if (!text) return;

    const hasTableStructure =
      text.includes("\t") || text.includes("\n");

    if (!hasTableStructure) {
      return;
    }

    event.preventDefault();

    const matrix = parsePastedTable(text);

    if (!matrix.length) return;

    setRows((current) => {
      const updated = [...current];

      while (
        updated.length <
        rowIndex + matrix.length
      ) {
        updated.push(createBlankRow());
      }

      matrix.forEach((pasteRow, pastedRowIndex) => {
        const targetIndex = rowIndex + pastedRowIndex;

        pasteRow.forEach((value, pastedColumnIndex) => {
          const targetColumnIndex =
            columnIndex + pastedColumnIndex;

          if (targetColumnIndex >= COLUMNS.length) {
            return;
          }

          const column = COLUMNS[targetColumnIndex];

          if (column.type === "image") {
            const imageNames = String(value || "")
              .split(/[|;]/)
              .map((item) => item.trim())
              .filter(Boolean)
              .slice(0, MAX_IMAGES_PER_ROW);

            updated[targetIndex].imageNames = imageNames;

            return;
          }

          updated[targetIndex][column.key] =
            convertPastedValue(column, value);
        });
      });

      return updated;
    });

    setMessage(
      `Pasted ${matrix.length} row${
        matrix.length === 1 ? "" : "s"
      } into the spreadsheet.`
    );
  }

  function validateImageFile(file) {
    if (!file) {
      return false;
    }

    if (!file.type.startsWith("image/")) {
      setError(`${file.name} is not an image file.`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name} is larger than 20MB.`);
      return false;
    }

    return true;
  }

  function assignImageToRow(rowId, file) {
    if (!validateImageFile(file)) return;

    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const existingFiles = Array.isArray(row.imageFiles)
          ? row.imageFiles
          : row.imageFile
          ? [row.imageFile]
          : [];

        if (existingFiles.length >= MAX_IMAGES_PER_ROW) {
          setError(
            `Each product can have up to ${MAX_IMAGES_PER_ROW} images.`
          );
          return row;
        }

        const existingUrls = Array.isArray(row.imageUrls)
          ? row.imageUrls
          : row.imageUrl
          ? [row.imageUrl]
          : [];

        const existingNames = Array.isArray(row.imageNames)
          ? row.imageNames
          : row.imageName
          ? [row.imageName]
          : [];

        const newUrl = URL.createObjectURL(file);

        return {
          ...row,
          imageFiles: [...existingFiles, file],
          imageUrls: [...existingUrls, newUrl],
          imageNames: [...existingNames, file.name],

          // Legacy compatibility.
          imageFile: existingFiles[0] || file,
          imageUrl: existingUrls[0] || newUrl,
          imageName: existingNames[0] || file.name,
        };
      })
    );

    setError("");
  }

  function handleSingleImageSelect(event) {
    const files = Array.from(event.target.files || []);
    const rowId = pendingImageRow.current;

    if (files.length && rowId) {
      setRows((current) => {
        return current.map((row) => {
          if (row.id !== rowId) {
            return row;
          }

          const existingFiles = Array.isArray(row.imageFiles)
            ? row.imageFiles
            : row.imageFile
            ? [row.imageFile]
            : [];

          const existingUrls = Array.isArray(row.imageUrls)
            ? row.imageUrls
            : row.imageUrl
            ? [row.imageUrl]
            : [];

          const existingNames = Array.isArray(row.imageNames)
            ? row.imageNames
            : row.imageName
            ? [row.imageName]
            : [];

          const availableSlots =
            MAX_IMAGES_PER_ROW - existingFiles.length;

          if (availableSlots <= 0) {
            return row;
          }

          const validFiles = files
            .filter((file) => validateImageFile(file))
            .slice(0, availableSlots);

          if (!validFiles.length) {
            return row;
          }

          const newUrls = validFiles.map((file) =>
            URL.createObjectURL(file)
          );

          const nextFiles = [
            ...existingFiles,
            ...validFiles,
          ];

          const nextUrls = [
            ...existingUrls,
            ...newUrls,
          ];

          const nextNames = [
            ...existingNames,
            ...validFiles.map((file) => file.name),
          ];

          return {
            ...row,
            imageFiles: nextFiles,
            imageUrls: nextUrls,
            imageNames: nextNames,
            imageFile: nextFiles[0] || null,
            imageUrl: nextUrls[0] || "",
            imageName: nextNames[0] || "",
          };
        });
      });

      const existingRow = rows.find(
        (row) => row.id === rowId
      );

      const existingCount = existingRow
        ? Array.isArray(existingRow.imageFiles)
          ? existingRow.imageFiles.length
          : existingRow.imageFile
          ? 1
          : 0
        : 0;

      if (
        existingCount + files.length >
        MAX_IMAGES_PER_ROW
      ) {
        setMessage(
          `A product can have up to ${MAX_IMAGES_PER_ROW} images. Extra images were not added.`
        );
      } else {
        setError("");
      }
    }

    event.target.value = "";
    pendingImageRow.current = null;
  }

  function openImagePicker(rowId) {
    pendingImageRow.current = rowId;
    singleImageInputRef.current?.click();
  }

  function handleImageFiles(files) {
    const validFiles = Array.from(files || []).filter(
      validateImageFile
    );

    if (!validFiles.length) {
      return;
    }

    const newImages = validFiles.map((file) => ({
      id: makeId(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImageLibrary((current) => [
      ...current,
      ...newImages,
    ]);

    setError("");
    setMessage(
      `${validFiles.length} image${
        validFiles.length === 1 ? "" : "s"
      } added to the image library.`
    );
  }

  function handleImageInput(event) {
    handleImageFiles(event.target.files);
    event.target.value = "";
  }

  function handleImageDrop(event) {
    event.preventDefault();
    setDraggingImages(false);

    handleImageFiles(event.dataTransfer.files);
  }

  function handleImageCellDrop(event, rowId) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(
      event.dataTransfer.files || []
    ).filter((file) =>
      file.type.startsWith("image/")
    );

    if (!files.length) return;

    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const existingFiles = Array.isArray(row.imageFiles)
          ? row.imageFiles
          : row.imageFile
          ? [row.imageFile]
          : [];

        const existingUrls = Array.isArray(row.imageUrls)
          ? row.imageUrls
          : row.imageUrl
          ? [row.imageUrl]
          : [];

        const existingNames = Array.isArray(row.imageNames)
          ? row.imageNames
          : row.imageName
          ? [row.imageName]
          : [];

        const availableSlots =
          MAX_IMAGES_PER_ROW - existingFiles.length;

        if (availableSlots <= 0) {
          setError(
            `Each product can have up to ${MAX_IMAGES_PER_ROW} images.`
          );
          return row;
        }

        const validFiles = files
          .filter((file) => validateImageFile(file))
          .slice(0, availableSlots);

        if (!validFiles.length) {
          return row;
        }

        const newUrls = validFiles.map((file) =>
          URL.createObjectURL(file)
        );

        const nextFiles = [
          ...existingFiles,
          ...validFiles,
        ];

        const nextUrls = [
          ...existingUrls,
          ...newUrls,
        ];

        const nextNames = [
          ...existingNames,
          ...validFiles.map((file) => file.name),
        ];

        return {
          ...row,
          imageFiles: nextFiles,
          imageUrls: nextUrls,
          imageNames: nextNames,
          imageFile: nextFiles[0] || null,
          imageUrl: nextUrls[0] || "",
          imageName: nextNames[0] || "",
        };
      })
    );

    setError("");
  }

  function removeLibraryImage(imageId) {
    setImageLibrary((current) => {
      const item = current.find(
        (image) => image.id === imageId
      );

      if (item?.url) {
        URL.revokeObjectURL(item.url);
      }

      return current.filter(
        (image) => image.id !== imageId
      );
    });
  }

  function matchImagesToRows() {
    if (!imageLibrary.length) {
      setError("Upload images first.");
      return;
    }

    let matched = 0;

    setRows((current) =>
      current.map((row) => {
        const targets = Array.isArray(row.imageNames)
          ? row.imageNames.filter(Boolean)
          : row.imageName
          ? [row.imageName]
          : [];

        if (!targets.length) {
          return row;
        }

        const foundImages = targets
          .map((target) => {
            const normalizedTarget = String(target)
              .trim()
              .toLowerCase();

            return imageLibrary.find((image) => {
              const imageName = image.name
                .trim()
                .toLowerCase();

              return (
                imageName === normalizedTarget ||
                imageName.split(".")[0] ===
                  normalizedTarget.split(".")[0]
              );
            });
          })
          .filter(Boolean)
          .slice(0, MAX_IMAGES_PER_ROW);

        if (!foundImages.length) {
          return row;
        }

        matched += foundImages.length;

        return {
          ...row,
          imageFiles: foundImages.map(
            (image) => image.file
          ),
          imageUrls: foundImages.map(
            (image) => image.url
          ),
          imageNames: foundImages.map(
            (image) => image.name
          ),
          imageFile: foundImages[0].file,
          imageUrl: foundImages[0].url,
          imageName: foundImages[0].name,
        };
      })
    );

    setMessage(
      matched
        ? `Matched ${matched} image${
            matched === 1 ? "" : "s"
          } to products.`
        : "No image filenames matched your Image column."
    );
  }

  function removeRowImage(rowId, imageIndex = 0) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const files = Array.isArray(row.imageFiles)
          ? row.imageFiles
          : row.imageFile
          ? [row.imageFile]
          : [];

        const urls = Array.isArray(row.imageUrls)
          ? row.imageUrls
          : row.imageUrl
          ? [row.imageUrl]
          : [];

        const names = Array.isArray(row.imageNames)
          ? row.imageNames
          : row.imageName
          ? [row.imageName]
          : [];

        if (
          imageIndex < 0 ||
          imageIndex >= files.length
        ) {
          return row;
        }

        if (urls[imageIndex]) {
          URL.revokeObjectURL(urls[imageIndex]);
        }

        const nextFiles = files.filter(
          (_, index) => index !== imageIndex
        );

        const nextUrls = urls.filter(
          (_, index) => index !== imageIndex
        );

        const nextNames = names.filter(
          (_, index) => index !== imageIndex
        );

        return {
          ...row,
          imageFiles: nextFiles,
          imageUrls: nextUrls,
          imageNames: nextNames,
          imageFile: nextFiles[0] || null,
          imageUrl: nextUrls[0] || "",
          imageName: nextNames[0] || "",
        };
      })
    );
  }

  function validateZip(file) {
    if (!file) return false;

    const isZip =
      file.type === "application/zip" ||
      file.name.toLowerCase().endsWith(".zip");

    if (!isZip) {
      setError("Please select a ZIP file.");
      return false;
    }

    if (file.size > 200 * 1024 * 1024) {
      setError("ZIP file cannot be larger than 200MB.");
      return false;
    }

    return true;
  }

  function handleZip(file) {
    if (!validateZip(file)) {
      return;
    }

    setZipFile(file);
    setError("");
    setMessage(`ZIP selected: ${file.name}`);
  }

  function handleZipInput(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleZip(file);
    }

    event.target.value = "";
  }

  function handleZipDrop(event) {
    event.preventDefault();
    setDraggingZip(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleZip(file);
    }
  }

  async function handleCSVFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const text = await file.text();
      const matrix = parseCSV(text);

      if (!matrix.length) {
        throw new Error("The CSV file is empty.");
      }

      const headers = matrix[0].map(normalizeHeader);

      const headerMap = {};

      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      const importedRows = matrix
        .slice(1)
        .map((values) => {
          const row = createBlankRow();

          COLUMNS.forEach((column) => {
            if (column.key === "image") {
              const index =
                headerMap.image ??
                headerMap.image_name ??
                headerMap.image_filename;

              if (index !== undefined) {
                row.imageNames = String(
                  values[index] || ""
                )
                  .split(/[|;]/)
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .slice(0, MAX_IMAGES_PER_ROW);
              }

              return;
            }

            const index = headerMap[column.key];

            if (index === undefined) {
              return;
            }

            const value = values[index] ?? "";

            if (column.type === "boolean") {
              row[column.key] = booleanFromValue(
                value,
                column.key === "in_stock"
              );
            } else {
              row[column.key] = value;
            }
          });

          return row;
        })
        .filter((row) => {
          return (
            row.name.trim() ||
            row.brand.trim() ||
            row.price !== ""
          );
        });

      if (!importedRows.length) {
        throw new Error(
          "No product rows were found in this CSV."
        );
      }

      setRows(importedRows);
      setSelectedRows([]);

      setMessage(
        `Loaded ${importedRows.length} product${
          importedRows.length === 1 ? "" : "s"
        } from ${file.name}.`
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not read the CSV file."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCSVInput(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleCSVFile(file);
    }

    event.target.value = "";
  }

  function handleCSVDrop(event) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleCSVFile(file);
    }
  }

  function buildExportRows() {
    return populatedRows.map((row) => ({
      image: (row.imageNames || []).join("|"),
      name: row.name,
      brand: row.brand,
      price: row.price,
      size: row.size,
      category: row.category,
      description: row.description,
      fragrance_notes: row.fragrance_notes,
      stock_quantity: row.stock_quantity,
      in_stock: row.in_stock,
      featured: row.featured,
      is_preorder: row.is_preorder,
      preorder_message: row.preorder_message,
      preorder_release_date:
        row.preorder_release_date,
    }));
  }

  function buildCSVContent() {
    const exportRows = buildExportRows();

    const lines = [
      CSV_HEADERS.map(csvEscape).join(","),
    ];

    exportRows.forEach((row) => {
      lines.push(
        CSV_HEADERS.map((header) =>
          csvEscape(row[header])
        ).join(",")
      );
    });

    return lines.join("\n");
  }

  function downloadCSV() {
    if (!populatedRows.length) {
      setError(
        "Add at least one product before exporting."
      );
      return;
    }

    const blob = new Blob([buildCSVContent()], {
      type: "text/csv;charset=utf-8;",
    });

    downloadBlob(blob, "products-import.csv");

    setMessage("CSV downloaded.");
  }

  async function downloadExcel() {
    if (!populatedRows.length) {
      setError(
        "Add at least one product before exporting."
      );
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const worksheet = XLSX.utils.json_to_sheet(
        buildExportRows(),
        {
          header: CSV_HEADERS,
        }
      );

      worksheet["!cols"] = CSV_HEADERS.map(
        (header) => ({
          wch:
            header === "description" ||
            header === "fragrance_notes"
              ? 35
              : 18,
        })
      );

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Products"
      );

      XLSX.writeFile(
        workbook,
        "products-import.xlsx"
      );

      setMessage("Excel file downloaded.");
    } catch (err) {
      setError(
        "Excel export needs the xlsx package. Run: npm install xlsx"
      );
    }
  }

  async function downloadZIP() {
    if (!populatedRows.length) {
      setError(
        "Add at least one product before exporting."
      );
      return;
    }

    try {
      const JSZip = (await import("jszip")).default;

      const zip = new JSZip();

      zip.file(
        "products.csv",
        buildCSVContent()
      );

      const exportData = buildExportRows();

      try {
        const XLSX = await import("xlsx");

        const worksheet =
          XLSX.utils.json_to_sheet(exportData, {
            header: CSV_HEADERS,
          });

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "Products"
        );

        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });

        zip.file(
          "products.xlsx",
          excelBuffer
        );
      } catch {
        // CSV will still be included.
      }

      const imagesFolder = zip.folder("images");

      rows.forEach((row) => {
        const files = Array.isArray(row.imageFiles)
          ? row.imageFiles
          : row.imageFile
          ? [row.imageFile]
          : [];

        files
          .slice(0, MAX_IMAGES_PER_ROW)
          .forEach((file) => {
            imagesFolder.file(
              safeFileName(file.name),
              file
            );
          });
      });

      if (zipFile) {
        zip.file(
          `source-${safeFileName(zipFile.name)}`,
          zipFile
        );
      }

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6,
        },
      });

      downloadBlob(
        blob,
        "bulk-product-import.zip"
      );

      setMessage(
        "ZIP downloaded with CSV, Excel and product images."
      );
    } catch (err) {
      setError(
        "ZIP export needs the jszip package. Run: npm install jszip xlsx"
      );
    }
  }

  function downloadTemplate() {
    const headers = CSV_HEADERS.join(",");

    const example = [
      "vintage-radio.jpg|vintage-radio-2.jpg",
      "VINTAGE RADIO",
      "LATTAFA",
      "30000",
      "100ML",
      "Perfume",
      "A beautiful fragrance",
      "Top: Bergamot; Heart: Rose; Base: Musk",
      "10",
      "true",
      "false",
      "false",
      "",
      "",
    ]
      .map(csvEscape)
      .join(",");

    const blob = new Blob(
      [`${headers}\n${example}\n`],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    downloadBlob(
      blob,
      "bulk-product-template.csv"
    );
  }

 async function importProducts() {
  setError("");
  setMessage("");

  if (!populatedRows.length) {
    setError("Add at least one product first.");
    return;
  }

  if (invalidRows > 0) {
    setError(
      `Fix the ${invalidRows} invalid row${
        invalidRows === 1 ? "" : "s"
      } before importing.`
    );
    return;
  }

  const confirmed = window.confirm(
    `Import ${populatedRows.length} product${
      populatedRows.length === 1 ? "" : "s"
    } into your store?`
  );

  if (!confirmed) {
    return;
  }

  setImporting(true);
  setProgress(10);

  try {
    const formData = new FormData();

    // ------------------------------------------------------------
    // BUILD CSV
    // ------------------------------------------------------------

    const csvBlob = new Blob(
      [buildCSVContent()],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    formData.append(
      "csv_file",
      csvBlob,
      "products.csv"
    );

    // ------------------------------------------------------------
    // OPTIONAL ZIP
    // ------------------------------------------------------------

    if (zipFile) {
      formData.append(
        "images_zip",
        zipFile,
        zipFile.name
      );
    }

    // ------------------------------------------------------------
    // ATTACHED PRODUCT IMAGES
    // ------------------------------------------------------------

    const imageRows = populatedRows.filter(
      (row) =>
        (Array.isArray(row.imageFiles) &&
          row.imageFiles.length > 0) ||
        row.imageFile
    );

    imageRows.forEach((row) => {
      const files = Array.isArray(row.imageFiles)
        ? row.imageFiles
        : row.imageFile
        ? [row.imageFile]
        : [];

      files
        .slice(0, MAX_IMAGES_PER_ROW)
        .forEach((file) => {
          formData.append(
            "images",
            file,
            file.name
          );
        });
    });

    setProgress(30);

    // ------------------------------------------------------------
    // CSRF
    // ------------------------------------------------------------

    const csrfResponse = await fetch(
      `${API_URL}/auth/csrf/`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    const csrfData = await csrfResponse
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

    // ------------------------------------------------------------
    // SEND IMPORT
    // ------------------------------------------------------------

    const response = await fetch(
      `${API_URL}/products/admin/bulk-import/`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfData.csrfToken,
        },
        body: formData,
      }
    );

    setProgress(80);

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          data?.error ||
          data?.message ||
          "Bulk import failed."
      );
    }

    // ------------------------------------------------------------
    // READ THE REAL BACKEND RESULT
    // ------------------------------------------------------------

    const successCount = Number(
      data?.success_count ?? 0
    );

    const failureCount = Number(
      data?.failure_count ?? 0
    );

    const backendErrors = Array.isArray(
      data?.errors
    )
      ? data.errors
      : [];

    setProgress(100);

    // ------------------------------------------------------------
    // SHOW ACTUAL RESULT
    // ------------------------------------------------------------

    if (failureCount > 0) {
      let resultMessage =
        `Import finished: ${successCount} product${
          successCount === 1 ? "" : "s"
        } imported successfully, ` +
        `${failureCount} failed.`;

      if (backendErrors.length) {
        const errorDetails = backendErrors
          .map((item, index) => {
            if (typeof item === "string") {
              return `${index + 1}. ${item}`;
            }

            const rowNumber =
              item?.row ??
              item?.row_number ??
              item?.index;

            const productName =
              item?.name ??
              item?.product ??
              item?.product_name;

            const reason =
              item?.error ??
              item?.message ??
              item?.detail ??
              JSON.stringify(item);

            const prefix = rowNumber
              ? `Row ${rowNumber}`
              : productName
              ? productName
              : `Item ${index + 1}`;

            return `${prefix}: ${reason}`;
          })
          .join("\n");

        resultMessage += `\n\nFailed products:\n${errorDetails}`;
      }

      setError(resultMessage);

      // Do NOT clear the draft when some products failed.
      return;
    }

    // ------------------------------------------------------------
    // FULL SUCCESS
    // ------------------------------------------------------------

    setMessage(
      `Successfully imported ${successCount} product${
        successCount === 1 ? "" : "s"
      }.`
    );

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = null;
    }

    draftSaveVersionRef.current += 1;
    skipNextDraftSaveRef.current = true;

    await clearBulkDraft();

    setDraftRestored(false);
    setDraftSaving(false);
  } catch (err) {
    setError(
      err.message ||
        "Something went wrong while importing."
    );

    setProgress(0);
  } finally {
    setImporting(false);
  }
}
  function renderImageCell(row) {
    const imageUrls = Array.isArray(row.imageUrls)
      ? row.imageUrls
      : row.imageUrl
      ? [row.imageUrl]
      : [];

    return (
      <div
        className="relative flex min-h-[68px] w-full items-center justify-center gap-1 px-1"
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={(event) =>
          handleImageCellDrop(event, row.id)
        }
      >
        {imageUrls.length ? (
          <div className="flex items-center justify-center gap-1">
            {imageUrls
              .slice(0, MAX_IMAGES_PER_ROW)
              .map((url, index) => (
                <div
                  key={`${row.id}-image-${index}`}
                  className="group relative"
                >
                  <img
                    src={url}
                    alt={`${row.name || "Product"} image ${
                      index + 1
                    }`}
                    className="h-12 w-12 rounded-lg border border-black/10 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeRowImage(
                        row.id,
                        index
                      )
                    }
                    className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black text-[11px] text-white group-hover:flex"
                    title={`Remove image ${
                      index + 1
                    }`}
                  >
                    ×
                  </button>
                </div>
              ))}

            {imageUrls.length <
              MAX_IMAGES_PER_ROW && (
              <button
                type="button"
                onClick={() =>
                  openImagePicker(row.id)
                }
                className="flex h-12 w-8 items-center justify-center rounded-lg border border-dashed border-black/20 bg-[#faf8f4] text-lg text-black/45 transition hover:border-black/50 hover:text-black"
                title="Add another image"
              >
                +
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              openImagePicker(row.id)
            }
            className="flex h-12 w-full max-w-[96px] flex-col items-center justify-center rounded-lg border border-dashed border-black/20 bg-[#faf8f4] text-[10px] text-black/45 transition hover:border-black/50 hover:text-black"
          >
            <span className="text-lg">＋</span>
            <span>Drop / Add</span>
          </button>
        )}
      </div>
    );
  }

  function renderCell(
    row,
    rowIndex,
    columnIndex,
    column
  ) {
    if (column.type === "image") {
      return renderImageCell(row);
    }
    if (column.type === "select") {
  return (
    <div className="flex h-[68px] items-center px-2">
      <select
        value={row[column.key] ?? ""}
        onChange={(event) =>
          updateCell(
            row.id,
            column.key,
            event.target.value
          )
        }
        onFocus={() =>
          setActiveCell(
            `${row.id}:${column.key}`
          )
        }
        onKeyDown={(event) =>
          handleCellKeyDown(
            event,
            rowIndex,
            columnIndex,
            row,
            column
          )
        }
        className="h-10 w-full rounded-lg border border-black/10 bg-transparent px-2 text-[13px] text-black outline-none focus:border-black/30 focus:bg-white"
      >
        <option value="">
          Select category
        </option>

        {categories.map((category) => {
          const value =
            category.name ??
            category.title ??
            category.slug ??
            category.id;

          const label =
            category.name ??
            category.title ??
            category.slug ??
            String(category.id);

          return (
            <option
              key={category.id ?? value}
              value={value}
            >
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

    if (column.type === "boolean") {
      return (
        <div className="flex h-[68px] items-center justify-center">
          <button
            type="button"
            onClick={() =>
              updateCell(
                row.id,
                column.key,
                !row[column.key]
              )
            }
            className={`relative h-6 w-11 rounded-full transition ${
              row[column.key]
                ? "bg-black"
                : "bg-black/15"
            }`}
            title={
              row[column.key]
                ? "Enabled"
                : "Disabled"
            }
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                row[column.key]
                  ? "left-6"
                  : "left-1"
              }`}
            />
          </button>
        </div>
      );
    }

    const commonProps = {
      ref: (element) => {
        if (element) {
          cellRefs.current[
            `${row.id}:${column.key}`
          ] = element;
        }
      },

      value: row[column.key] ?? "",

      onChange: (event) =>
        updateCell(
          row.id,
          column.key,
          event.target.value
        ),

      onFocus: () =>
        setActiveCell(
          `${row.id}:${column.key}`
        ),

      onPaste: (event) =>
        handleCellPaste(
          event,
          rowIndex,
          columnIndex
        ),

      onKeyDown: (event) =>
        handleCellKeyDown(
          event,
          rowIndex,
          columnIndex,
          row,
          column
        ),

      className:
        "h-[66px] w-full resize-none border-0 bg-transparent px-3 py-2 text-[13px] text-black outline-none placeholder:text-black/25 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-black/10",

      placeholder: column.required
        ? "Required"
        : "",
    };

    if (column.type === "textarea") {
      return <textarea {...commonProps} />;
    }

    return (
      <input
        {...commonProps}
        type={
          column.type === "number"
            ? "number"
            : column.type === "date"
            ? "date"
            : "text"
        }
        min={
          column.type === "number"
            ? "0"
            : undefined
        }
        step={
          column.key === "price"
            ? "0.01"
            : undefined
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-black">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageInput}
      />

      <input
        ref={singleImageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSingleImageSelect}
      />

      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={handleZipInput}
      />

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCSVInput}
      />

      <div className="mx-auto max-w-[1900px] px-4 py-6 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                window.history.back()
              }
              className="mb-3 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-medium transition hover:border-black/30 hover:bg-black/[0.02]"
            >
              <span className="text-base leading-none">
                ←
              </span>
              Back
            </button>

            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                Admin
              </span>

              <span className="text-xs text-black/40">
                Products / Bulk Import
              </span>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    draftSaving
                      ? "bg-amber-400 animate-pulse"
                      : draftRestored
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />

                <span>
                  {draftSaving
                    ? "Saving draft..."
                    : draftRestored
                    ? "Draft restored"
                    : draftReady
                    ? "Draft saved"
                    : "Loading draft..."}
                </span>
              </div>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Bulk Product Importer
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-black/50">
              Add products row by row like Excel,
              paste directly from spreadsheets,
              attach images, and import everything
              in one go.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setShowHelp((value) => !value)
              }
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-medium transition hover:border-black/30"
            >
              {showHelp
                ? "Hide Help"
                : "How it works"}
            </button>

            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-medium transition hover:border-black/30"
            >
              CSV Template
            </button>

            <button
              type="button"
              onClick={downloadCSV}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-medium transition hover:border-black/30"
            >
              ↓ CSV
            </button>

            <button
              type="button"
              onClick={downloadExcel}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-medium transition hover:border-black/30"
            >
              ↓ Excel
            </button>

            <button
              type="button"
              onClick={downloadZIP}
              className="rounded-xl bg-black px-4 py-2.5 text-xs font-medium text-white transition hover:bg-black/80"
            >
              ↓ Download ZIP
            </button>
          </div>
        </div>

        {/* Help */}
        {showHelp && (
          <div className="mb-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider">
                  01 — Spreadsheet
                </div>
                <p className="text-xs leading-5 text-black/55">
                  Click any cell and type. Press Enter
                  to move down. Tab moves across like
                  Excel.
                </p>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider">
                  02 — Paste
                </div>
                <p className="text-xs leading-5 text-black/55">
                  Copy rows from Excel or Google Sheets
                  and paste them directly into any cell.
                </p>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider">
                  03 — Images
                </div>
                <p className="text-xs leading-5 text-black/55">
                  Each product can have up to 4 images.
                  Drag images into the Image column or
                  upload many images into the image
                  library.
                </p>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider">
                  04 — Export
                </div>
                <p className="text-xs leading-5 text-black/55">
                  Download CSV, Excel, or a ZIP containing
                  your spreadsheet and product images.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
              Products
            </div>

            <div className="mt-1 text-2xl font-semibold">
              {populatedRows.length}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
              Spreadsheet Rows
            </div>

            <div className="mt-1 text-2xl font-semibold">
              {rows.length}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
              Images
            </div>

            <div className="mt-1 text-2xl font-semibold">
              {imageLibrary.length}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
              Selected
            </div>

            <div className="mt-1 text-2xl font-semibold">
              {selectedRows.length}
            </div>
          </div>
        </div>

        {/* Import tools */}
        <div className="mb-4 grid gap-4 xl:grid-cols-3">
          {/* CSV */}
          <div
            className="rounded-2xl border border-black/10 bg-white p-4"
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={handleCSVDrop}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">
                  Import CSV
                </div>

                <div className="mt-0.5 text-xs text-black/45">
                  Load an existing spreadsheet
                </div>
              </div>

              <span className="rounded-full bg-black/5 px-2 py-1 text-[10px]">
                CSV
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                csvInputRef.current?.click()
              }
              className="w-full rounded-xl border border-dashed border-black/20 bg-[#faf8f4] px-4 py-4 text-xs font-medium transition hover:border-black/50"
            >
              {loading
                ? "Reading CSV..."
                : "Choose CSV or drag it here"}
            </button>
          </div>

          {/* ZIP */}
          <div
            className={`rounded-2xl border bg-white p-4 transition ${
              draggingZip
                ? "border-black bg-black/[0.02]"
                : "border-black/10"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDraggingZip(true);
            }}
            onDragLeave={() =>
              setDraggingZip(false)
            }
            onDrop={handleZipDrop}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">
                  Product ZIP
                </div>

                <div className="mt-0.5 text-xs text-black/45">
                  Keep your image archive attached
                </div>
              </div>

              <span className="rounded-full bg-black/5 px-2 py-1 text-[10px]">
                ZIP
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                zipInputRef.current?.click()
              }
              className="w-full rounded-xl border border-dashed border-black/20 bg-[#faf8f4] px-4 py-4 text-left text-xs transition hover:border-black/50"
            >
              {zipFile ? (
                <span className="font-medium">
                  {zipFile.name}
                </span>
              ) : (
                "Drag ZIP here or choose ZIP"
              )}
            </button>
          </div>

          {/* Images */}
          <div
            className={`rounded-2xl border bg-white p-4 transition ${
              draggingImages
                ? "border-black bg-black/[0.02]"
                : "border-black/10"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDraggingImages(true);
            }}
            onDragLeave={() =>
              setDraggingImages(false)
            }
            onDrop={handleImageDrop}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">
                  Image Library
                </div>

                <div className="mt-0.5 text-xs text-black/45">
                  Upload many product images
                </div>
              </div>

              <span className="rounded-full bg-black/5 px-2 py-1 text-[10px]">
                {imageLibrary.length} files
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                imageInputRef.current?.click()
              }
              className="w-full rounded-xl border border-dashed border-black/20 bg-[#faf8f4] px-4 py-4 text-xs font-medium transition hover:border-black/50"
            >
              Drag images here or choose images
            </button>
          </div>
        </div>

        {/* Assets */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <button
            type="button"
            onClick={() =>
              setShowAssets((value) => !value)
            }
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <div className="text-sm font-semibold">
                Image Assets
              </div>

              <div className="text-xs text-black/40">
                Dragged/uploaded images available for
                matching
              </div>
            </div>

            <span className="text-lg text-black/40">
              {showAssets ? "−" : "+"}
            </span>
          </button>

          {showAssets && (
            <div className="border-t border-black/10 p-4">
              {imageLibrary.length ? (
                <div className="flex flex-wrap gap-3">
                  {imageLibrary.map((image) => (
                    <div
                      key={image.id}
                      className="group relative flex w-[90px] flex-col items-center"
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="h-16 w-16 rounded-lg border border-black/10 object-cover"
                      />

                      <div className="mt-1 w-full truncate text-center text-[9px] text-black/50">
                        {image.name}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeLibraryImage(
                            image.id
                          )
                        }
                        className="absolute right-1 top-[-4px] hidden h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white group-hover:flex"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={matchImagesToRows}
                    className="flex h-[88px] min-w-[150px] items-center justify-center rounded-xl border border-dashed border-black/20 px-4 text-xs font-medium transition hover:border-black/50"
                  >
                    Match filenames
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-[#faf8f4] px-4 py-5 text-center text-xs text-black/40">
                  No images uploaded yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addRows(1)}
              className="rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-black/80"
            >
              + Add Row
            </button>

            <button
              type="button"
              onClick={() => addRows(5)}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-medium hover:border-black/30"
            >
              + 5 Rows
            </button>

            <button
              type="button"
              onClick={() => addRows(10)}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-medium hover:border-black/30"
            >
              + 10 Rows
            </button>

            <button
              type="button"
              onClick={clearEmptyRows}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-medium hover:border-black/30"
            >
              Remove Empty
            </button>

            {selectedRows.length > 0 && (
              <button
                type="button"
                onClick={deleteSelectedRows}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                Delete {selectedRows.length}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="w-full rounded-xl border border-black/10 bg-[#faf8f4] px-4 py-2.5 text-xs outline-none transition focus:border-black/30 md:w-[220px]"
              />
            </div>

            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm(
                  "Clear the saved bulk import draft? This cannot be undone."
                );

                if (!confirmed) return;

                await clearSavedDraft({
                  message:
                    "Saved bulk import draft cleared.",
                });
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Clear Saved Draft
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-medium text-black/60 hover:border-black/30 hover:text-black"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Spreadsheet */}
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 bg-[#faf8f4] px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">
                  Product Spreadsheet
                </div>

                <div className="text-[11px] text-black/40">
                  {search
                    ? `${visibleRows.length} matching rows`
                    : "Each row represents one product"}
                  {" · "}
                  {COLUMNS.length} columns
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-black/45">
                <span>
                  Active cell:{" "}
                  <span className="font-medium text-black">
                    {activeCell
                      ? "selected"
                      : "none"}
                  </span>
                </span>

                <span className="hidden md:inline">
                  Enter ↓
                </span>

                <span className="hidden md:inline">
                  Tab →
                </span>

                <span className="hidden md:inline">
                  Paste from Excel
                </span>
              </div>
            </div>
          </div>

          <div className="max-h-[680px] overflow-auto">
            <table
              className="border-collapse"
              style={{
                minWidth: `${
                  70 +
                  44 +
                  COLUMNS.reduce(
                    (total, column) =>
                      total + column.width,
                    0
                  )
                }px`,
              }}
            >
              <thead className="sticky top-0 z-30">
                <tr>
                  <th className="sticky left-0 z-40 w-[44px] min-w-[44px] border-b border-r border-black/10 bg-[#eee9e1] px-2 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 accent-black"
                    />
                  </th>

                  <th className="sticky left-[44px] z-40 w-[70px] min-w-[70px] border-b border-r border-black/10 bg-[#eee9e1] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-black/50">
                    #
                  </th>

                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="border-b border-r border-black/10 bg-[#eee9e1] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-black/55"
                      style={{
                        width: column.width,
                        minWidth: column.width,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}

                        {column.required && (
                          <span className="text-red-500">
                            *
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                  <th className="sticky right-0 z-40 w-[100px] min-w-[100px] border-b border-l border-black/10 bg-[#eee9e1] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-black/50">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row) => {
                  const realIndex = rows.findIndex(
                    (item) => item.id === row.id
                  );

                  const rowHasError =
                    validationErrors[row.id]?.length > 0;

                  return (
                    <tr
                      key={row.id}
                      className={`group ${
                        rowHasError
                          ? "bg-red-50/40"
                          : "bg-white"
                      } hover:bg-black/[0.015]`}
                    >
                      <td className="sticky left-0 z-20 border-b border-r border-black/10 bg-inherit px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(
                            row.id
                          )}
                          onChange={() =>
                            toggleRowSelection(
                              row.id
                            )
                          }
                          className="h-3.5 w-3.5 accent-black"
                        />
                      </td>

                      <td className="sticky left-[44px] z-20 border-b border-r border-black/10 bg-inherit px-2 text-center">
                        <span className="text-[11px] font-medium text-black/40">
                          {realIndex + 1}
                        </span>
                      </td>

                      {COLUMNS.map(
                        (column, columnIndex) => (
                          <td
                            key={column.key}
                            className={`border-b border-r border-black/10 p-0 align-middle ${
                              activeCell ===
                              `${row.id}:${column.key}`
                                ? "bg-white"
                                : ""
                            }`}
                            style={{
                              width: column.width,
                              minWidth: column.width,
                            }}
                          >
                            {renderCell(
                              row,
                              realIndex,
                              columnIndex,
                              column
                            )}
                          </td>
                        )
                      )}

                      <td className="sticky right-0 z-20 border-b border-l border-black/10 bg-inherit px-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              duplicateRow(row.id)
                            }
                            title="Duplicate row"
                            className="rounded-lg px-2 py-2 text-xs text-black/45 hover:bg-black/5 hover:text-black"
                          >
                            ⧉
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteRow(row.id)
                            }
                            title="Delete row"
                            className="rounded-lg px-2 py-2 text-xs text-red-500 hover:bg-red-50"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!visibleRows.length && (
                  <tr>
                    <td
                      colSpan={
                        COLUMNS.length + 3
                      }
                      className="px-6 py-16 text-center"
                    >
                      <div className="text-sm font-medium">
                        No products found
                      </div>

                      <div className="mt-1 text-xs text-black/40">
                        Add a row or change your search.
                      </div>
                    </td>
                  </tr>
                )}

                <tr>
                  <td
                    colSpan={
                      COLUMNS.length + 3
                    }
                    className="border-b border-black/10 bg-[#faf8f4] p-2"
                  >
                    <button
                      type="button"
                      onClick={() => addRows(1)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 py-3 text-xs font-medium text-black/50 transition hover:border-black/40 hover:bg-white hover:text-black"
                    >
                      <span className="text-base">
                        +
                      </span>
                      Add another product row
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Validation */}
        {invalidRows > 0 && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="text-sm font-semibold text-red-800">
              {invalidRows} row
              {invalidRows === 1 ? "" : "s"} need
              attention
            </div>

            <div className="mt-1 text-xs text-red-700/70">
              Product Name and Price are required.
              Stock must be a number when provided.
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Import footer */}
        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold">
                Ready to import
              </div>

              <div className="mt-1 text-xs text-black/45">
                {populatedRows.length} product
                {populatedRows.length === 1
                  ? ""
                  : "s"} ready
                {imageLibrary.length
                  ? ` · ${imageLibrary.length} image assets`
                  : ""}
                {zipFile
                  ? ` · ${zipFile.name}`
                  : ""}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCSV}
                disabled={!populatedRows.length}
                className="rounded-xl border border-black/10 px-4 py-3 text-xs font-medium transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={downloadExcel}
                disabled={!populatedRows.length}
                className="rounded-xl border border-black/10 px-4 py-3 text-xs font-medium transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export Excel
              </button>

              <button
                type="button"
                onClick={downloadZIP}
                disabled={!populatedRows.length}
                className="rounded-xl border border-black/10 px-4 py-3 text-xs font-medium transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export ZIP
              </button>

              <button
                type="button"
                onClick={importProducts}
                disabled={
                  importing ||
                  !populatedRows.length ||
                  invalidRows > 0
                }
                className="min-w-[180px] rounded-xl bg-black px-5 py-3 text-xs font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing
                  ? `Importing ${progress}%`
                  : `Import ${populatedRows.length} Product${
                      populatedRows.length === 1
                        ? ""
                        : "s"
                    }`}
              </button>
            </div>
          </div>

          {importing && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-black transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom information */}
        <div className="mt-4 grid gap-3 text-[11px] text-black/40 md:grid-cols-3">
          <div>
            <span className="font-semibold text-black/60">
              Image matching:
            </span>{" "}
            use image filenames separated by{" "}
            <strong>|</strong> in the Image column, then
            upload those images.
          </div>

          <div>
            <span className="font-semibold text-black/60">
              Paste:
            </span>{" "}
            copy multiple cells from Excel/Google Sheets
            and paste into any spreadsheet cell.
          </div>

          <div>
            <span className="font-semibold text-black/60">
              Import:
            </span>{" "}
            only rows with a Product Name are sent to the
            backend. Each product can have up to 4 images.
          </div>
        </div>
      </div>
    </div>
  );
}

