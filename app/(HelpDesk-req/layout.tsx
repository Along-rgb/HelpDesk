import { Metadata } from "next";
import Layout from "@/layout/layout";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'HelpDesk-action',
    description: 'HelpDesk Manage Action-Plan',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    metadataBase: new URL('https://edl.com.la'), 
    openGraph: {
        type: 'website',
        title: 'EDL Evaluation',
        url: 'https://edl.com.la',
        description: 'Evaluation EDL Laos',
        images: ['https://res.cloudinary.com/dp3zeejct/image/upload/v1690474394/Payment/EDLHQ_mcifks.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}