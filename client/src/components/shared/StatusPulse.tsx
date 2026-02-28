'use client';

import { cn } from '@/lib/utils';

export type PulseStatus =
    | 'available' | 'rented' | 'maintenance' | 'unavailable' | 'lost' | 'sold' // Ferramentas
    | 'active' | 'blocked' | 'inactive' | 'overdue' // Clientes / Locações
    | 'pending' | 'completed' | 'cancelled'; // Geral

interface StatusPulseProps {
    status: PulseStatus | string;
    className?: string;
}

const statusConfig: Record<string, { color: string, pulse: boolean }> = {
    // Ferramentas
    available: { color: 'bg-emerald-500', pulse: true },
    rented: { color: 'bg-blue-500', pulse: true },
    maintenance: { color: 'bg-amber-500', pulse: false },
    unavailable: { color: 'bg-zinc-400', pulse: false },
    lost: { color: 'bg-red-500', pulse: false },
    sold: { color: 'bg-indigo-500', pulse: false },
    // Clientes / Locações
    active: { color: 'bg-emerald-500', pulse: true },
    blocked: { color: 'bg-red-500', pulse: false },
    inactive: { color: 'bg-zinc-400', pulse: false },
    overdue: { color: 'bg-red-500', pulse: true },
    // Geral
    pending: { color: 'bg-amber-500', pulse: true },
    completed: { color: 'bg-emerald-500', pulse: false },
    cancelled: { color: 'bg-zinc-400', pulse: false },
};

export function StatusPulse({ status, className }: StatusPulseProps) {
    const config = statusConfig[status] || { color: 'bg-zinc-300', pulse: false };

    return (
        <div className={cn("relative flex h-2 w-2", className)}>
            {config.pulse && (
                <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    config.color
                )}></span>
            )}
            <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                config.color
            )}></span>
        </div>
    );
}
