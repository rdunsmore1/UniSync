import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniSync",
  description: "University-scoped organizations, events, and tutoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
