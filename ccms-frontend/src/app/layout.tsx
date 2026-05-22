import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'
import { ModalRenderer } from '@/shared/components/modals/ModalRenderer'
import { Providers } from '@/shared/providers/Providers'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | CCMS',
    default: 'CCMS — Criminal Case Management System',
  },
  description: 'CCMS — Criminal Case Management System',
  other: {
    charset: 'utf-8',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          {children}
          <ModalRenderer />
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  )
}
