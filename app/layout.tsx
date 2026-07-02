import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer Management",
  description: "Manage customers and sync last call details from Notion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
