import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import NewsletterPopup from "@/components/NewsletterPopup";
import CookieConsent from "@/components/CookieConsent";
import WhatsAppButton from "@/components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://orentemist.online"),

  title: {
    default: "ORENTEMIST | Premium Fragrances",
    template: "%s | ORENTEMIST",
  },

  description:
    "Discover ORENTEMIST premium fragrances crafted to leave a lasting impression. Shop refined perfumes and signature scents in Nigeria.",

  applicationName: "ORENTEMIST",

  keywords: [
    "ORENTEMIST",
    "ORENTEMIST perfume",
    "perfume Nigeria",
    "buy perfume Nigeria",
    "premium perfume Nigeria",
    "luxury perfume Nigeria",
    "fragrances Nigeria",
    "menapos;s perfume",
    "womenapos;s perfume",
    "unisex perfume",
  ],

  authors: [
    {
      name: "ORENTEMIST",
    },
  ],

  creator: "ORENTEMIST",
  publisher: "ORENTEMIST",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],

    shortcut: "/icons/icon-192.png",
  },

  manifest: "/manifest.json",

  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://orentemist.online/",
    siteName: "ORENTEMIST",
    title: "ORENTEMIST | Premium Fragrances",
    description:
      "Discover ORENTEMIST premium fragrances crafted to leave a lasting impression. Shop refined perfumes and signature scents in Nigeria.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ORENTEMIST Premium Fragrances",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ORENTEMIST | Premium Fragrances",
    description:
      "Discover ORENTEMIST premium fragrances crafted to leave a lasting impression. Shop refined perfumes and signature scents in Nigeria.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegister />
        {children}
         <NewsletterPopup />
           <CookieConsent />
             <WhatsAppButton />
      </body>
    </html>
  );
}