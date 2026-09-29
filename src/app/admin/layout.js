export const metadata = {
  title: "ORENTEMIST Admin",
  description: "ORENTEMIST Administration Dashboard",
  applicationName: "ORENTEMIST Admin",
  manifest: "/admin/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = {
  themeColor: "#111111",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
