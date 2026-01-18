import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ApiStatusIndicator } from '@/components/status/ApiStatusIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '10X Accountability Coach',
  description: 'Your Personal AI-Powered Accountability System by Team 10X',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ApiStatusIndicator />
      </body>
    </html>
  )
}
