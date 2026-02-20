import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { LayoutWrapper } from '../components/LayoutWrapper';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});
const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '700', '900'],
});

export const metadata: Metadata = {
  title: 'Shop - Professional E-commerce',
  description: 'Modern e-commerce platform',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} ${inter.className} bg-white text-gray-900 antialiased`}>
        <Suspense fallback={null}>
          <ClientProviders>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ClientProviders>
        </Suspense>
      </body>
    </html>
  );
}

