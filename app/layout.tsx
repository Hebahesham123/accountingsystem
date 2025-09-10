import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { DomainErrorHandler } from "@/components/domain-error-handler"
import Navigation from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Comprehensive Accounting System",
  description: "Complete double-entry bookkeeping system with financial reporting",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <DomainErrorHandler>
            <AuthProvider>
              <Navigation />
              <main>{children}</main>
              <Toaster />
            </AuthProvider>
          </DomainErrorHandler>
        </ThemeProvider>
      </body>
    </html>
  )
}
