import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-NEXUS | From Subjective to Objective',
  description: 'AI-powered interview platform transforming subjective interviews into objective assessments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}

