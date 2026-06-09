import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GharBadlo AI — House Renovation Visualizer',
  description: 'Upload your house photo and see it renovated with AI. Free, instant, photorealistic.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
