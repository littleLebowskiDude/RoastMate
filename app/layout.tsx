import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roast Mate',
  description: 'Roast planning for Beechworth Coffee Roasters'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
