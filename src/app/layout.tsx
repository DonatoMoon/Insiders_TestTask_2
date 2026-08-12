import type { Metadata } from "next";
import { Toaster } from "sonner";
import { unbounded, golosText, caveat } from "@/lib/fonts";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together",
  description: "Shared to-do lists, together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${golosText.variable} ${caveat.variable}`}>
      <body className="font-body">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#2A2118",
                color: "#FAF8F4",
                border: "none",
                borderRadius: "11px",
                fontFamily: "var(--font-golos)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
