'use client';
import { useEffect } from 'react';

export default function ThemeLoader() {
    useEffect(() => {
        if (!document.getElementById('theme-css')) {
            const link = document.createElement('link');
            link.id = 'theme-css';
            link.rel = 'stylesheet';
            link.href = '/themes/lara-light-blue/theme.css';
            document.head.appendChild(link);
        }
    }, []);
    return null;
}
