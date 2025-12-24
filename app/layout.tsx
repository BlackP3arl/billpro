import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BillPro - ISP Bill Management',
  description: 'Intelligent bill scanning and verification system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
