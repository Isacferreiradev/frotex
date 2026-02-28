export type PlanTier = 'free' | 'pro' | 'scale';

export interface PlanLimits {
    maxTools: number;
    advancedIntelligence: boolean; // ROI, Risk Scoring, etc.
    maxUsers: number;
    asaasIntegration: boolean;
}

export const PLAN_CONFIG: Record<PlanTier, PlanLimits> = {
    free: {
        maxTools: 10,
        advancedIntelligence: false,
        maxUsers: 1, // Individual
        asaasIntegration: false,
    },
    pro: {
        maxTools: Number.MAX_SAFE_INTEGER,
        advancedIntelligence: true,
        maxUsers: 3,
        asaasIntegration: true,
    },
    scale: {
        maxTools: Number.MAX_SAFE_INTEGER,
        advancedIntelligence: true,
        maxUsers: Number.MAX_SAFE_INTEGER,
        asaasIntegration: true,
    },
};

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
    const tier = (plan || 'free') as PlanTier;
    return PLAN_CONFIG[tier] || PLAN_CONFIG.free;
}
