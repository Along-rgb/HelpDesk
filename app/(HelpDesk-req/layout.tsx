import { Metadata } from "next";
import Layout from "@/layout/layout";
import { env } from "@/config/env";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

const baseUrl = env.appUrl || 'http://localhost:3500';
const ogImage = env.ogImageUrl || '/layout/images/faifarlao.png';

export const metadata: Metadata = {
    title: 'HelpDesk-action',
    description: 'HelpDesk Manage Action-Plan',
    robots: { index: false, follow: false },
    metadataBase: new URL(baseUrl),
    openGraph: {
        type: 'website',
        title: 'EDL Evaluation',
        url: baseUrl,
        description: 'Evaluation EDL Laos',
        images: [ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}