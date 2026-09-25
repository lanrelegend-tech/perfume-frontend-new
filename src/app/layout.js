import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

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
  title: "ORENTEMIST",
  description:
    "Discover ORENTEMIST — a refined fragrance experience crafted for those who leave an impression.",
  themeColor: "#111111",
  applicationName: "ORENTEMIST",

  keywords: [
    "ORENTEMIST",
    "perfume",
    "fragrance",
    "luxury perfume",
    "perfume Nigeria",
    "premium fragrance",
  ],

  authors: [
    {
      name: "ORENTEMIST",
    },
  ],

  creator: "ORENTEMIST",
  publisher: "ORENTEMIST",

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    siteName: "ORENTEMIST",
    title: "ORENTEMIST — The Art of Fragrance",
    description:
      "Discover ORENTEMIST — a refined fragrance experience crafted for those who leave an impression.",
  },

  twitter: {
    card: "summary_large_image",
    title: "ORENTEMIST — The Art of Fragrance",
    description:
      "Discover ORENTEMIST — a refined fragrance experience crafted for those who leave an impression.",
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
      </body>
    </html>
  );
}