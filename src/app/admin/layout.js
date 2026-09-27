export const metadata = {
  title: "ORENTEMIST Admin",
  description: "ORENTEMIST Administration Dashboard",
  applicationName: "ORENTEMIST Admin",
  themeColor: "#111111",
  manifest: "/admin/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}