import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "24 Inch Gauge · Your lodge, in good order",
  description:
    "A considered workspace for lodge administration, membership, meetings and records.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
