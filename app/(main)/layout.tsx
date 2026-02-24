import { Metadata } from 'next';
import Layout from '../../layout/layout';
import { env } from '@/config/env';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

const appUrl = env.appUrl || 'http://localhost:3500';

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    title: 'ICT-HelpDesk',
    description: 'The ultimate collection of design-agnostic, flexible and accessible React UI Components.',
    robots: { index: false, follow: false },
    openGraph: {
        type: 'website',
        title: 'HelpDesk',
        url: 'layout/images/faifarlao.png',
        description: 'The ultimate collection of design-agnostic, flexible and accessible React UI Components.',
        images: ['layout/images/faifarlao.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
