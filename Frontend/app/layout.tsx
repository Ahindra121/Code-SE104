import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LearnHub - Nền tảng học trực tuyến',
  description: 'Học mọi lúc, mọi nơi với LearnHub. Truy cập hàng nghìn khóa học về CNTT, Kinh doanh, Ngoại ngữ và Kỹ năng mềm.',
  icons: {
    icon: '/Avatar_Web.png',
    apple: '/Avatar_Web.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="bg-background">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
