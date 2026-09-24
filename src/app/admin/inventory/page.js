"use client";

import AdminSidebar from "@/components/AdminSidebar";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Bell,
  MessageCircle,
  AlertTriangle,
  PackageCheck,
  PackageX,
  Plus,
  Minus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
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

export default function InventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  /*
   * STOCK MODAL
   */
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAction, setStockAction] = useState(null);
  const [stockAmount, setStockAmount] = useState("");
  const [updatingStock, setUpdatingStock] = useState(false);
  const [stockMessage, setStockMessage] = useState("");

  /*
   * LOAD PRODUCTS + CATEGORIES
   */
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token");

        if (!token) {
          router.push("/admin/login");
          return;
        }

        const productsResponse =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/products/admin/`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

        if (
          productsResponse.status === 401 ||
          productsResponse.status === 403
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

        if (!productsResponse.ok) {
          throw new Error(
            "Failed to load inventory"
          );
        }

        const productsData =
          await productsResponse.json();

        const productList =
          Array.isArray(productsData)
            ? productsData
            : Array.isArray(
                  productsData.results
                )
              ? productsData.results
              : [];

        /*
         * LOAD CATEGORIES
         */
        let categoryList = [];

        try {
          const categoriesResponse =
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/products/categories/`
            );

          if (categoriesResponse.ok) {
            const categoriesData =
              await categoriesResponse.json();

            categoryList =
              Array.isArray(categoriesData)
                ? categoriesData
                : Array.isArray(
                      categoriesData.results
                    )
                  ? categoriesData.results
                  : [];
          }
        } catch (categoryError) {
          console.error(
            "Categories fetch error:",
            categoryError
          );
        }

        setCategories(categoryList);

        /*
         * CATEGORY NAME
         */
        const getCategoryName = (
          categoryId
        ) => {
          if (
            categoryId === null ||
            categoryId === undefined ||
            categoryId === ""
          ) {
            return "Uncategorized";
          }

          const category =
            categoryList.find(
              (item) =>
                String(item.id) ===
                String(categoryId)
            );

          return (
            category?.name ||
            "Uncategorized"
          );
        };

        /*
         * FORMAT PRODUCTS
         */
        const formattedProducts =
          productList.map((product) => {
            const stock =
              Number(
                product.stock_quantity
              ) || 0;

            let status = "In Stock";

            if (stock === 0) {
              status = "Out of Stock";
            } else if (stock <= 10) {
              status = "Low Stock";
            }

            return {
              ...product,

              category: getCategoryName(
                product.category_id
              ),

              stock,

              stock_quantity: stock,

              status,

              price:
                Number(product.price) ||
                0,

              image: getImageUrl(
                product.image
              ),

              sku:
                product.sku ||
                `VLR-${String(
                  product.id
                ).padStart(4, "0")}`,
            };
          });

        setProducts(
          formattedProducts
        );
      } catch (err) {
        console.error(
          "Inventory fetch error:",
          err
        );

        setError(
          err.message ||
            "Unable to load inventory."
        );
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [router]);

  /*
   * FORMAT CURRENCY
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  /*
   * OPEN ADD STOCK
   */
  const openAddStock = (product) => {
    setStockProduct(product);
    setStockAction("add");
    setStockAmount("");
    setStockMessage("");
  };

  /*
   * OPEN REMOVE STOCK
   */
  const openRemoveStock = (product) => {
    setStockProduct(product);
    setStockAction("remove");
    setStockAmount("");
    setStockMessage("");
  };

  /*
   * CLOSE STOCK MODAL
   */
  const closeStockModal = () => {
    if (updatingStock) return;

    setStockProduct(null);
    setStockAction(null);
    setStockAmount("");
    setStockMessage("");
  };

  /*
   * UPDATE STOCK
   */
  const handleStockUpdate = async () => {
    if (!stockProduct || !stockAction) {
      return;
    }

    const amount = Number(stockAmount);

    /*
     * VALIDATE QUANTITY
     */
    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setStockMessage(
        "Enter a valid quantity greater than 0."
      );
      return;
    }

    const currentStock =
      Number(stockProduct.stock) || 0;

    /*
     * CALCULATE NEW STOCK
     */
    let newStock;

    if (stockAction === "add") {
      newStock =
        currentStock + amount;
    } else {
      if (amount > currentStock) {
        setStockMessage(
          `You cannot remove ${amount} units. This product only has ${currentStock} units in stock.`
        );
        return;
      }

      newStock =
        currentStock - amount;
    }

    try {
      setUpdatingStock(true);
      setStockMessage("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        router.push("/admin/login");
        return;
      }

      /*
       * SEND UPDATED STOCK TO BACKEND
       */
      const response =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/admin/${stockProduct.id}/`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              stock_quantity: newStock,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      /*
       * AUTH ERROR
       */
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

      /*
       * SERVER ERROR
       */
      if (!response.ok) {
        let message =
          stockAction === "add"
            ? "Unable to add stock."
            : "Unable to remove stock.";

        if (
          data?.stock_quantity
        ) {
          message = Array.isArray(
            data.stock_quantity
          )
            ? data.stock_quantity[0]
            : data.stock_quantity;
        } else if (data?.detail) {
          message = data.detail;
        } else if (data?.message) {
          message = data.message;
        }

        throw new Error(message);
      }

      /*
       * GET UPDATED STOCK
       */
      const updatedStock =
        Number(
          data?.stock_quantity
        ) || newStock;

      /*
       * DETERMINE STATUS
       */
      let updatedStatus =
        "In Stock";

      if (updatedStock === 0) {
        updatedStatus =
          "Out of Stock";
      } else if (
        updatedStock <= 10
      ) {
        updatedStatus =
          "Low Stock";
      }

      /*
       * UPDATE UI
       */
      setProducts(
        (currentProducts) =>
          currentProducts.map(
            (product) => {
              if (
                product.id !==
                stockProduct.id
              ) {
                return product;
              }

              return {
                ...product,

                ...data,

                stock:
                  updatedStock,

                stock_quantity:
                  updatedStock,

                status:
                  updatedStatus,

                in_stock:
                  updatedStock > 0,
              };
            }
          )
      );

      /*
       * CLOSE MODAL
       */
      setStockProduct(null);
      setStockAction(null);
      setStockAmount("");
      setStockMessage("");
    } catch (err) {
      console.error(
        "Stock update error:",
        err
      );

      setStockMessage(
        err.message ||
          "Unable to update stock."
      );
    } finally {
      setUpdatingStock(false);
    }
  };

  /*
   * FILTER PRODUCTS
   */
  const filteredProducts =
    products.filter(
      (product) => {
        const searchValue =
          search.toLowerCase();

        const matchesSearch =
          product.name
            .toLowerCase()
            .includes(searchValue) ||
          product.sku
            .toLowerCase()
            .includes(searchValue);

        const matchesStatus =
          statusFilter === "All" ||
          product.status ===
            statusFilter;

        const matchesCategory =
          categoryFilter === "All" ||
          product.category ===
            categoryFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory
        );
      }
    );

  /*
   * INVENTORY STATS
   */
  const totalStock =
    products.reduce(
      (total, product) =>
        total + product.stock,
      0
    );

  const inventoryValue =
    products.reduce(
      (total, product) =>
        total +
        product.stock *
          product.price,
      0
    );

  const lowStock =
    products.filter(
      (product) =>
        product.status ===
        "Low Stock"
    ).length;

  const outOfStock =
    products.filter(
      (product) =>
        product.status ===
        "Out of Stock"
    ).length;

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] text-black">
        <p className="text-sm text-black/40">
          Loading inventory...
        </p>
      </div>
    );
  }

  /*
   * ERROR
   */
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5 text-black">
        <div className="text-center">
          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-4 rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">
      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN */}
      <main className="lg:ml-[250px]">
        <div className="pt-16 lg:pt-0">
          {/* HEADER */}
          <header className="flex h-[82px] items-center justify-between border-b border-black/10 bg-white px-5 sm:px-8">
            <div>
              <p className="text-xs text-black/40">
                ORENTEMIST ADMIN
              </p>

              <h2 className="text-xl font-semibold">
                Inventory
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-xl border border-black/10 p-3 sm:block">
                <Search size={18} />
              </button>

              <button className="rounded-xl border border-black/10 p-3">
                <Bell size={18} />
              </button>

              <button className="rounded-xl border border-black/10 p-3">
                <MessageCircle
                  size={18}
                />
              </button>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {/* PAGE HEADER */}
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Inventory
                </h1>

                <p className="mt-1 text-sm text-black/45">
                  Monitor and manage
                  product stock
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  
                  className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/80"
                >
                  <Plus size={17} />
                  Add Stock
                </button>

                <button
                  
                  className="flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black/5"
                >
                  <Minus size={17} />
                  Remove Stock
                </button>
              </div>
            </div>

            {/* STATS */}
            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Stock"
                value={totalStock.toLocaleString()}
                subtitle="Units available"
                icon={
                  <Boxes size={20} />
                }
              />

              <StatCard
                title="Inventory Value"
                value={formatCurrency(
                  inventoryValue
                )}
                subtitle="Current stock value"
                icon={
                  <PackageCheck
                    size={20}
                  />
                }
              />

              <StatCard
                title="Low Stock"
                value={lowStock}
                subtitle="Products need attention"
                icon={
                  <AlertTriangle
                    size={20}
                  />
                }
                warning
              />

              <StatCard
                title="Out of Stock"
                value={outOfStock}
                subtitle="Products unavailable"
                icon={
                  <PackageX size={20} />
                }
                danger
              />
            </div>

            {/* ALERT */}
            {lowStock > 0 && (
              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-yellow-600">
                    <AlertTriangle
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-yellow-900">
                      Low stock alert
                    </p>

                    <p className="mt-1 text-xs leading-5 text-yellow-800/70">
                      {lowStock}{" "}
                      products currently
                      have low stock
                      levels.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setStatusFilter(
                      "Low Stock"
                    )
                  }
                  className="rounded-lg bg-yellow-900 px-4 py-2 text-xs font-medium text-white"
                >
                  View Products
                </button>
              </div>
            )}

            {/* FILTERS */}
            <div className="mb-5 rounded-2xl border border-black/10 bg-white p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                  />

                  <input
                    type="text"
                    placeholder="Search product or SKU..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-black/10 bg-[#fafafa] py-3 pl-11 pr-4 text-sm outline-none focus:border-black/30"
                  />
                </div>

                <select
                  value={
                    categoryFilter
                  }
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none"
                >
                  <option value="All">
                    All Categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.name
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none"
                >
                  <option value="All">
                    All Stock Status
                  </option>

                  <option value="In Stock">
                    In Stock
                  </option>

                  <option value="Low Stock">
                    Low Stock
                  </option>

                  <option value="Out of Stock">
                    Out of Stock
                  </option>
                </select>
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-black/40">
                      <th className="px-6 py-4 font-medium">
                        Product
                      </th>

                      <th className="px-6 py-4 font-medium">
                        SKU
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Category
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Price
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Stock
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  product.image
                                }
                                alt={
                                  product.name
                                }
                                className="h-12 w-12 rounded-xl object-cover"
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.src =
                                    "/placeholder-product.jpg";
                                }}
                              />

                              <div>
                                <p className="font-medium">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-black/40">
                                  {
                                    product.category
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm text-black/50">
                            {product.sku}
                          </td>

                          <td className="px-6 py-5 text-sm text-black/60">
                            {
                              product.category
                            }
                          </td>

                          <td className="px-6 py-5 text-sm font-medium">
                            {formatCurrency(
                              product.price
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <StockNumber
                              stock={
                                product.stock
                              }
                            />
                          </td>

                          <td className="px-6 py-5">
                            <StockStatus
                              status={
                                product.status
                              }
                            />
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  openAddStock(
                                    product
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-black/80"
                              >
                                <Plus
                                  size={15}
                                />
                                Add
                              </button>

                              <button
                                onClick={() =>
                                  openRemoveStock(
                                    product
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-black/5"
                              >
                                <Minus
                                  size={15}
                                />
                                Remove
                              </button>

                              <button className="rounded-lg p-2 hover:bg-black/5">
                                <MoreHorizontal
                                  size={17}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE */}
            <div className="space-y-3 lg:hidden">
              {filteredProducts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-black/10 bg-white p-5"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name
                        }
                        className="h-16 w-16 rounded-xl object-cover"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            "/placeholder-product.jpg";
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium">
                              {
                                product.name
                              }
                            </h3>

                            <p className="mt-1 text-xs text-black/40">
                              {
                                product.sku
                              }
                            </p>
                          </div>

                          <StockStatus
                            status={
                              product.status
                            }
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-black/35">
                              Price
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatCurrency(
                                product.price
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-black/35">
                              Stock
                            </p>

                            <div className="mt-1">
                              <StockNumber
                                stock={
                                  product.stock
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-black/5 pt-4">
                      <button
                        onClick={() =>
                          openAddStock(
                            product
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm text-white transition hover:bg-black/80"
                      >
                        <Plus size={16} />
                        Add
                      </button>

                      <button
                        onClick={() =>
                          openRemoveStock(
                            product
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm font-medium transition hover:bg-black/5"
                      >
                        <Minus size={16} />
                        Remove
                      </button>

                      <button className="rounded-xl border border-black/10 p-3">
                        <MoreHorizontal
                          size={18}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* EMPTY */}
            {filteredProducts.length ===
              0 && (
              <div className="rounded-2xl border border-black/10 bg-white py-16 text-center">
                <Boxes
                  size={30}
                  className="mx-auto text-black/25"
                />

                <h3 className="mt-4 font-medium">
                  No products found
                </h3>

                <p className="mt-1 text-sm text-black/40">
                  Try changing your
                  search or filters.
                </p>
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-black/40">
                Showing{" "}
                {filteredProducts.length}{" "}
                of {products.length}{" "}
                products
              </p>

              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-black/10 bg-white p-2 text-black/40">
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                  1
                </button>

                <button className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm">
                  2
                </button>

                <button className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm">
                  3
                </button>

                <button className="rounded-lg border border-black/10 bg-white p-2">
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* STOCK MODAL */}
      {stockProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeStockModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-black/35">
                  Inventory
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {stockAction ===
                  "remove"
                    ? "Remove Stock"
                    : "Add Stock"}
                </h2>

                <p className="mt-1 text-sm text-black/45">
                  {stockAction ===
                  "remove"
                    ? "Remove units from this product."
                    : "Add new units to this product."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeStockModal}
                disabled={
                  updatingStock
                }
                className="rounded-xl p-2 text-black/40 transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            {/* PRODUCT */}
            <div className="mt-6 rounded-2xl border border-black/10 bg-[#fafafa] p-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    stockProduct.image
                  }
                  alt={
                    stockProduct.name
                  }
                  className="h-14 w-14 rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/placeholder-product.jpg";
                  }}
                />

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {
                      stockProduct.name
                    }
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Current stock:{" "}
                    {
                      stockProduct.stock
                    }{" "}
                    units
                  </p>
                </div>
              </div>
            </div>

            {/* QUANTITY */}
            <div className="mt-5">
              <label className="text-sm font-medium">
                {stockAction ===
                "remove"
                  ? "Quantity to remove"
                  : "Quantity to add"}
              </label>

              <input
                type="number"
                min="1"
                max={
                  stockAction ===
                  "remove"
                    ? stockProduct.stock
                    : undefined
                }
                step="1"
                value={stockAmount}
                onChange={(event) =>
                  setStockAmount(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleStockUpdate();
                  }
                }}
                placeholder={
                  stockAction ===
                  "remove"
                    ? "e.g. 5"
                    : "e.g. 20"
                }
                autoFocus
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/40"
              />

              {stockAmount &&
                Number(stockAmount) >
                  0 && (
                  <p className="mt-2 text-xs text-black/40">
                    New stock:{" "}
                    {stockAction ===
                    "remove"
                      ? Math.max(
                          0,
                          Number(
                            stockProduct.stock
                          ) -
                            Number(
                              stockAmount
                            )
                        )
                      : Number(
                          stockProduct.stock
                        ) +
                        Number(
                          stockAmount
                        )}{" "}
                    units
                  </p>
                )}
            </div>

            {/* ERROR */}
            {stockMessage && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                {stockMessage}
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeStockModal}
                disabled={
                  updatingStock
                }
                className="flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleStockUpdate
                }
                disabled={
                  updatingStock
                }
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  stockAction ===
                  "remove"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-black hover:bg-black/80"
                }`}
              >
                {updatingStock
                  ? "Updating..."
                  : stockAction ===
                      "remove"
                    ? "Remove Stock"
                    : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  warning,
  danger,
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger
              ? "bg-red-50 text-red-600"
              : warning
                ? "bg-yellow-50 text-yellow-600"
                : "bg-black text-white"
          }`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-5 text-xs text-black/40">
        {title}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-black/35">
        {subtitle}
      </p>
    </div>
  );
}

function StockNumber({ stock }) {
  return (
    <span
      className={`text-sm font-semibold ${
        stock === 0
          ? "text-red-600"
          : stock <= 10
            ? "text-yellow-600"
            : "text-black"
      }`}
    >
      {stock} units
    </span>
  );
}

function StockStatus({ status }) {
  const styles = {
    "In Stock":
      "bg-green-50 text-green-700",

    "Low Stock":
      "bg-yellow-50 text-yellow-700",

    "Out of Stock":
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-black/5 text-black"
      }`}
    >
      {status}
    </span>
  );
}