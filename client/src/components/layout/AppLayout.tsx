'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { OnboardingTour } from '../shared/OnboardingTour';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {children}
                </main>
            </div>
            <OnboardingTour />
        </div>
    );
}
