"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import {
  Package,
  Tag,
  Boxes,
  Search,
  Bell,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  X,
} from "lucide-react";

function getProductStatus(stock, inStock) {
  const quantity = Number(stock) || 0;

  if (!inStock || quantity === 0) {
    return "Out of Stock";
  }

  if (quantity <= 10) {
    return "Low Stock";
  }

  return "In Stock";
}

function getImageUrl(image) {
  if (!image) return "/placeholder-product.jpg";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const imagePath = image.startsWith("/") ? image : `/${image}`;

  return `${baseUrl}${imagePath}`;
}

function getCategoryName(category, categories = []) {
  if (!category) return "Uncategorized";

  if (typeof category === "string") {
    const categoryById = categories.find(
      (item) => String(item.id) === category
    );

    return categoryById?.name || category;
  }

  if (typeof category === "number") {
    const categoryById = categories.find(
      (item) => Number(item.id) === category
    );

    return categoryById?.name || "Uncategorized";
  }

  if (typeof category === "object") {
    return category.name || "Uncategorized";
  }

  return "Uncategorized";
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [preorderFilter, setPreorderFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          router.push("/admin/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/admin/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          router.push("/admin/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();

        setProducts(
          Array.isArray(data)
            ? data
            : Array.isArray(data.results)
              ? data.results
              : []
        );
      } catch (err) {
        console.error("Products fetch error:", err);
        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoryError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/categories/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json();

        const categoryList = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [];

        setCategories(categoryList);
      } catch (err) {
        console.error("Categories fetch error:", err);
        setCategoryError("Unable to load categories.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const productCategoryName = getCategoryName(
      product.category_id,
      categories
    );

    const matchesCategory =
      category === "All" || productCategoryName === category;

    const matchesStatus =
  status === "All" ||
  getProductStatus(
    product.stock_quantity,
    product.in_stock
  ) === status;

const matchesPreorder =
  preorderFilter === "All" ||
  (preorderFilter === "Pre-orders" && product.is_preorder === true) ||
  (preorderFilter === "Regular" && product.is_preorder !== true);

return (
  matchesSearch &&
  matchesCategory &&
  matchesStatus &&
  matchesPreorder
);


  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const categoryOptions = [
    "All",
    ...categories
      .map((item) => item.name)
      .filter(Boolean),
  ];

  const inStockCount = products.filter(
    (product) =>
      getProductStatus(
        product.stock_quantity,
        product.in_stock
      ) === "In Stock"
  ).length;

  const lowStockCount = products.filter(
    (product) =>
      getProductStatus(
        product.stock_quantity,
        product.in_stock
      ) === "Low Stock"
  ).length;

  const outOfStockCount = products.filter(
    (product) =>
      getProductStatus(
        product.stock_quantity,
        product.in_stock
      ) === "Out of Stock"
  ).length;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">
      <AdminSidebar />

      <main className="lg:ml-[250px]">
        <div className="pt-16 lg:pt-0">

          <header className="flex h-[82px] items-center justify-between border-b border-black/10 bg-white px-5 sm:px-8">
            <div>
              <p className="text-xs text-black/40">
                ORENTEMIST ADMIN
              </p>

              <h2 className="text-xl font-semibold">
                Products
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
                <MessageCircle size={18} />
              </button>

            </div>
          </header>

          <div className="p-5 sm:p-8">

            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <div className="mb-2 flex items-center gap-2 text-xs text-black/40">
                  <span>Dashboard</span>
                  <ChevronRight size={13} />
                  <span>Products</span>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight">
                  Products
                </h1>

                <p className="mt-1 text-sm text-black/45">
                  Manage your ORENTEMIST product catalogue.
                </p>

              </div>

              <button
                onClick={() => router.push("/admin/products/new")}
                className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/80"
              >
                <Plus size={18} />
                Add Product
              </button>

            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

              <MiniCard
                label="Total Products"
                value={products.length}
              />

              <MiniCard
                label="In Stock"
                value={inStockCount}
              />

              <MiniCard
                label="Low Stock"
                value={lowStockCount}
              />

              <MiniCard
                label="Out of Stock"
                value={outOfStockCount}
              />

            </div>

            <div className="rounded-2xl border border-black/10 bg-white">

              <div className="border-b border-black/10 p-4 sm:p-5">

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                  <div className="relative w-full xl:max-w-[360px]">

                    <Search
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
                    />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products..."
                      className="h-11 w-full rounded-xl border border-black/10 bg-[#fafafa] pl-11 pr-10 text-base sm:text-sm outline-none transition focus:border-black/30"
                    />

                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
                      >
                        <X size={16} />
                      </button>
                    )}

                  </div>

                  <div className="flex flex-wrap gap-3">

                    <FilterButton
  icon={<Boxes size={15} />}
  label={status}
  options={[
    "All",
    "In Stock",
    "Low Stock",
    "Out of Stock",
  ]}
  value={status}
  onChange={setStatus}
/>

<FilterButton
  icon={<Tag size={15} />}
  label={preorderFilter}
  options={[
    "All",
    "Pre-orders",
    "Regular",
  ]}
  value={preorderFilter}
  onChange={setPreorderFilter}
/>

<button className="flex h-11 items-center gap-2 rounded-xl border border-black/10 px-4 text-sm">
                      <SlidersHorizontal size={15} />
                      Filter
                    </button>

                  </div>

                </div>

                {categoryError && (
                  <p className="mt-3 text-xs text-red-500">
                    {categoryError}
                  </p>
                )}

                {!categoriesLoading &&
                  categories.length === 0 &&
                  !categoryError && (
                    <p className="mt-3 text-xs text-black/40">
                      No categories have been added yet.
                    </p>
                  )}

              </div>

              <div className="hidden overflow-x-auto md:block">

                {loading && (
                  <div className="px-6 py-16 text-center text-sm text-black/40">
                    Loading products...
                  </div>
                )}

                {error && !loading && (
                  <div className="px-6 py-16 text-center">

                    <p className="text-sm text-red-600">
                      {error}
                    </p>

                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                      Try Again
                    </button>

                  </div>
                )}

                {!loading && !error && (
                  <table className="w-full min-w-[850px]">

                    <thead>
                      <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-black/40">

                        <th className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-2">
                            Product
                            <ArrowUpDown size={13} />
                          </div>
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

                        <th className="px-6 py-4 font-medium text-right">
                          Action
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {filteredProducts.map((product) => (

                        <tr
                          key={product.id}
                          className="border-b border-black/5 transition hover:bg-black/[0.02]"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-4">

                              <img
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                className="h-14 w-14 rounded-xl object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "/placeholder-product.jpg";
                                }}
                              />

                              <div>

                                <p className="font-medium">
                                  {product.name}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-4 text-sm text-black/60">
                            {getCategoryName(
                              product.category_id,
                              categories
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm font-medium">
                            {formatCurrency(product.price)}
                          </td>

                          <td className="px-6 py-4 text-sm">
                            {Number(product.stock_quantity) || 0}
                          </td>

                          <td className="px-6 py-4">

                            <StatusBadge
                              status={getProductStatus(
                                product.stock_quantity,
                                product.in_stock
                              )}
                            />

                          </td>

                          <td className="relative px-6 py-4 text-right">

                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === product.id
                                    ? null
                                    : product.id
                                )
                              }
                              className="rounded-lg p-2 transition hover:bg-black/5"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {openMenu === product.id && (
                              <div className="absolute right-6 top-14 z-20 w-40 rounded-xl border border-black/10 bg-white p-1 text-left shadow-xl">

                                <button
                                  onClick={() =>
                                    router.push(
                                      `/admin/products/${product.id}`
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                                >
                                  <Eye size={15} />
                                  View
                                </button>

                                <button
                                  onClick={() =>
                                    router.push(
                                      `/admin/products/${product.id}/edit`
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                                >
                                  <Pencil size={15} />
                                  Edit
                                </button>

                                <button
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
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
                )}

              </div>

              <div className="divide-y divide-black/5 md:hidden">

                {filteredProducts.map((product) => (

                  <div
                    key={product.id}
                    className="relative p-4"
                  >

                    <div className="flex gap-4">

                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="h-20 w-20 rounded-xl object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/placeholder-product.jpg";
                        }}
                      />

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <h3 className="font-medium">
                              {product.name}
                            </h3>

                            <p className="mt-1 text-xs text-black/40">
                              {getCategoryName(
                                product.category_id,
                                categories
                              )}
                            </p>

                          </div>

                          <button
                            onClick={() =>
                              setOpenMenu(
                                openMenu === product.id
                                  ? null
                                  : product.id
                              )
                            }
                            className="rounded-lg p-1"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openMenu === product.id && (
                            <div className="absolute right-4 top-12 z-20 w-36 rounded-xl border border-black/10 bg-white p-1 text-left shadow-xl">

                              <button
                                onClick={() =>
                                  router.push(
                                    `/admin/products/${product.id}`
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                              >
                                <Eye size={15} />
                                View
                              </button>

                              <button
                                onClick={() =>
                                  router.push(
                                    `/admin/products/${product.id}/edit`
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                              >
                                <Pencil size={15} />
                                Edit
                              </button>

                              <button
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={15} />
                                Delete
                              </button>

                            </div>
                          )}

                        </div>

                        <div className="mt-4 flex items-center justify-between">

                          <div>

                            <p className="font-medium">
                              {formatCurrency(product.price)}
                            </p>

                            <p className="mt-1 text-xs text-black/40">
                              {Number(product.stock_quantity) || 0} in stock
                            </p>

                          </div>

                          <StatusBadge
                            status={getProductStatus(
                              product.stock_quantity,
                              product.in_stock
                            )}
                          />

                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

              {!loading &&
                !error &&
                filteredProducts.length === 0 && (
                  <div className="px-6 py-16 text-center">

                    <Package
                      size={35}
                      className="mx-auto mb-4 text-black/20"
                    />

                    <h3 className="font-medium">
                      No products found
                    </h3>

                    <p className="mt-1 text-sm text-black/40">
                      Try changing your search or filters.
                    </p>

                  </div>
                )}

              <div className="flex flex-col justify-between gap-4 border-t border-black/10 px-5 py-4 text-sm text-black/45 sm:flex-row sm:items-center">

                <p>
                  Showing{" "}
                  <span className="font-medium text-black">
                    {filteredProducts.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-black">
                    {products.length}
                  </span>{" "}
                  products
                </p>

                <div className="flex items-center gap-2">

                  <button className="rounded-lg border border-black/10 p-2 disabled:opacity-30">
                    <ChevronRight
                      className="rotate-180"
                      size={16}
                    />
                  </button>

                  <span className="rounded-lg bg-black px-3 py-2 text-xs text-white">
                    1
                  </span>

                  <button className="rounded-lg border border-black/10 p-2">
                    <ChevronRight size={16} />
                  </button>

                </div>

              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function MiniCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">

      <p className="text-xs text-black/40">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>

    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    "In Stock": "bg-green-50 text-green-700",
    "Low Stock": "bg-yellow-50 text-yellow-700",
    "Out of Stock": "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-black/5 text-black"
      }`}
    >
      {status}
    </span>
  );
}

function FilterButton({
  icon,
  options,
  value,
  onChange,
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 appearance-none rounded-xl border border-black/10 bg-white pl-10 pr-9 text-base sm:text-sm outline-none"
      >

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}

      </select>

      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50">
        {icon}
      </span>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
      />

    </div>
  );
}