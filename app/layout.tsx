import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Live Transcription App',
  description: 'Real-time speech-to-text transcription using Deepgram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

