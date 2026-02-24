import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';
import { env } from '@/config/env';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

const appUrl = env.appUrl || 'http://localhost:3500';

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    title: 'ICT-HelpDesk',
    description: 'The ultimate collection of design-agnostic, flexible and accessible React UI Components.'
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            {children}
            <AppConfig simple />
        </React.Fragment>
    );
}
