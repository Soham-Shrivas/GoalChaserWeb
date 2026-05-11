import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GoalChaser - Track Focus. Chase Goals.',
  description: 'A productivity app for tracking study time, competing on leaderboards, and studying together',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}