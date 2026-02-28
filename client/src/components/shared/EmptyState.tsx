'use client';

import { LucideIcon, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon = Ghost,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-700",
            className
        )}>
            <div className="w-20 h-20 bg-zinc-50 rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
                <Icon className="w-10 h-10 text-zinc-300" />
            </div>

            <div className="space-y-2 max-w-[320px] mx-auto mb-8">
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h3>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed">
                    {description}
                </p>
            </div>

            {action && (
                <div className="animate-in slide-in-from-bottom-2 duration-1000">
                    {action}
                </div>
            )}
        </div>
    );
}
