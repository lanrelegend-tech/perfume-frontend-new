"use client";

import { usePathname } from "next/navigation";
import NewsletterPopup from "@/components/NewsletterPopup";
import CookieConsent from "@/components/CookieConsent";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function PublicSiteWidgets() {
  const pathname = usePathname();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return (
    <>
      <NewsletterPopup />
      <CookieConsent />
      <WhatsAppButton />
    </>
  );
}