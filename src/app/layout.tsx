import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthSessionProvider } from "@/components/providers/SessionProviders";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationPoller } from "@/components/NotificationPoller";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Handy Hack - Neighborhood Helper Marketplace",
  description: "Connect with trusted local helpers in your neighborhood",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <NotificationProvider>
            <NotificationPoller />
            <Navbar />
            <main className="min-h-[calc(100vh-5rem)]">{children}</main>
            <Footer />
          </NotificationProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
