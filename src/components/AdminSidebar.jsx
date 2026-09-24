"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Tag,
  Boxes,
  ShoppingBag,
  Users,
  Mail,
  Settings,
  X,
  MessageCircle,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/admin/analytics",
  },
  {
    label: "Products",
    icon: Package,
    path: "/admin/products",
  },
  {
    label: "Coupons",
    icon: Tag,
    path: "/admin/coupons",
  },
  {
    label: "Inventory",
    icon: Boxes,
    path: "/admin/inventory",
  },
  {
    label: "Orders",
    icon: ShoppingBag,
    path: "/admin/orders",
  },
  {
    label: "Customers",
    icon: Users,
    path: "/admin/customers",
  },
  {
    label: "Reviews",
    icon: MessageCircle,
    path: "/admin/reviews",
  },
  {
    label: "Newsletter",
    icon: Mail,
    path: "/admin/newsletter",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/admin/settings",
  },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close mobile sidebar whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/admin/login");
  };

  const navigate = (path) => {
    setOpen(false);
    router.push(path);
  };

  const isActive = (path) => {
    if (path === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-black/5 lg:hidden"
      >
        <Menu size={21} />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-[70] h-[100dvh] w-[270px] bg-black text-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <div className="shrink-0 border-b border-white/10 px-6 py-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/admin/dashboard")}
                className="text-left"
              >
                <h1 className="text-xl font-semibold tracking-[0.22em]">
                  ORENTEMIST
                </h1>

                <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-white/40">
                  Admin Panel
                </p>
              </button>

              {/* Mobile Close */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white lg:hidden"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Scrollable Navigation */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
            <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Main Menu
            </p>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition ${
                      active
                        ? "bg-white text-black shadow-sm"
                        : "text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.8}
                      className="shrink-0"
                    />

                    <span className="flex-1 truncate">{item.label}</span>

                    {active && (
                      <ChevronRight
                        size={16}
                        className="shrink-0 opacity-60"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="shrink-0 border-t border-white/10 p-4">
            <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                Store
              </p>

              <p className="mt-1 truncate text-sm font-medium text-white/90">
                ORENTEMIST
              </p>

              <p className="mt-0.5 text-[11px] text-white/35">
                Store Management
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-white/50 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}