import type { Metadata } from "next";
import { unbounded, golosText, caveat } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together",
  description: "Shared to-do lists, together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${golosText.variable} ${caveat.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
