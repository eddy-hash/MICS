import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { HotToaster } from '@/lib/toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NaedCredit — Loan Management',
  description: 'Secure loan management for microfinance',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          {children}
          <HotToaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
                margin: 0,
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
