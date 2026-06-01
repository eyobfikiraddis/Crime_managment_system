import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Noto_Sans_Ethiopic } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { serverEnv } from '@/config/env.server'
// The import alone will run the check when the module loads on the server.

import './globals.css'
import '@shared/styles/print.css'
import { ModalRenderer } from '@/shared/components/modals/ModalRenderer'
import { Providers } from '@/shared/providers/Providers'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: '--font-ethiopic',
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoSansEthiopic.variable} ${jetBrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <ModalRenderer />
            <Toaster richColors />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
