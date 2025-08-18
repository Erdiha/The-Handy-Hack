import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { AuthSessionProvider } from '@/components/providers/SessionProviders'
import './globals.css'
import { NotificationProvider } from "@/contexts/NotificationContext";
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FixMyHood - Neighborhood Helper Marketplace',
  description: 'Connect with trusted local helpers in your neighborhood',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <NotificationProvider>
            <Navbar />
            {children}
          </NotificationProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}