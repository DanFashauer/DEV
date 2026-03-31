import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EnterpriseShell Admin",
  description: "Enterprise kiosk management dashboard with authentication flows and MDM persona builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
