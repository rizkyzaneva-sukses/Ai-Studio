import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
<<<<<<< HEAD
import { ThemeProvider } from "@/components/theme-provider";
=======
>>>>>>> feat/token-status

export const metadata: Metadata = {
  title: "Zaneva AI Content Studio",
  description: "AI-powered content generation for Zaneva Muslimah sportswear brand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="p-4 pt-16 md:p-8 md:pt-8">{children}</div>
            </main>
          </div>
        </ThemeProvider>
=======
    <html lang="en">
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">{children}</div>
          </main>
        </div>
>>>>>>> feat/token-status
      </body>
    </html>
  );
}
