/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
    const router = useRouter();

    useEffect(() => {
       
        router.push('/auth/login');
    }, [router]);

   
    return (
        <div className="flex align-items-center justify-content-center" style={{ height: '100vh' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
        </div>
    );
};

export default Dashboard;