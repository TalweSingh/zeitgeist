import type { Metadata } from 'next';
import { SessionProvider } from '@/lib/store/session';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zeitgeist',
  description:
    'Interview a founder, scrape their world, synthesize a brand brain, and ship on-brand content.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="h-screen overflow-hidden bg-background font-sans text-foreground antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
