'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';

interface FrotexLogoProps {
    className?: string;
    collapsed?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'normal' | 'white';
}

// Drastic simplification: using standard img to reduce Turbopack overhead
export const FrotexLogo = memo(({ className, size = 'md', variant = 'normal' }: FrotexLogoProps) => {
    const logoSrc = variant === 'white' ? '/logo-frotex-branca.png' : '/frotex-logo.png';

    // Dynamic height based on size prop
    const heightClass = size === 'lg' ? 'h-24' : size === 'md' ? 'h-20' : 'h-14';
    const imgHeightClass = size === 'lg' ? 'h-20' : size === 'md' ? 'h-16' : 'h-10';

    return (
        <div className={cn('flex items-center select-none', className)}>
            <div className={cn("relative flex items-center justify-start overflow-hidden", heightClass)}>
                <img
                    src={logoSrc}
                    alt="FROTEX"
                    className={cn("w-auto object-contain", imgHeightClass)}
                />
            </div>
        </div>
    );
});

FrotexLogo.displayName = 'FrotexLogo';
