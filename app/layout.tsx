'use client';

import ClientHydration from './components/ClientHydration';
import AuthSessionHandler from './components/AuthSessionHandler';
import ForbiddenToastHandler from './components/ForbiddenToastHandler';
import { LayoutProvider } from '@/layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link id="theme-css" href="/themes/lara-light-blue/theme.css" rel="stylesheet" />
      </head>
      <body>
        <ClientHydration>
          <PrimeReactProvider>
            <LayoutProvider>
              <AuthSessionHandler />
              <ForbiddenToastHandler />
              {children}
            </LayoutProvider>
          </PrimeReactProvider>
        </ClientHydration>
      </body>
    </html>
  );
}
