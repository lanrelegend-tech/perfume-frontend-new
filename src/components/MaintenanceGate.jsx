"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

function MaintenanceScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f2ea] px-5 text-black">
      <section className="w-full max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
          ORENTEMIST
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          We will be right back
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-black/60">
          The store is temporarily unavailable while we make a few updates.
          Please check back soon.
        </p>
      </section>
    </main>
  );
}

export default function MaintenanceGate({ children }) {
  const pathname = usePathname();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checked, setChecked] = useState(false);

  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      setMaintenanceMode(false);
      setChecked(true);
      return;
    }

    let active = true;

    async function loadMaintenanceState() {
      try {
        const response = await fetch(`${API_URL}/settings/`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (active) {
          setMaintenanceMode(Boolean(data?.maintenance_mode));
        }
      } catch (error) {
        console.error("Maintenance check failed:", error);
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    }

    setChecked(false);
    loadMaintenanceState();

    return () => {
      active = false;
    };
  }, [isAdminRoute, pathname]);

  if (!checked) {
    return children;
  }

  if (!isAdminRoute && maintenanceMode) {
    return <MaintenanceScreen />;
  }

  return children;
}
