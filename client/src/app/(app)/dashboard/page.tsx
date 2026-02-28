'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Package, HardHat, Clock, Wallet, HandCoins, ShieldAlert,
    BarChart3, UserCheck, AlertTriangle, Zap, TrendingUp,
    Crown, ArrowUpRight, Percent, DollarSign, Activity, Wrench,
    Calendar, History, TrendingDown, LayoutDashboard, Target,
    Ghost, Skull, Info
} from 'lucide-react';

import { memo, useState } from 'react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';

// ─── Metric Card (Premium & Refined) ─────────────────────────────────────────
const MetricCard = memo(({
    title, value, icon: Icon, loading, variant = 'default', subtitle
}: {
    title: string;
    value: number | string;
    icon: any;
    loading?: boolean;
    variant?: 'default' | 'warning' | 'critical';
    subtitle?: string;
}) => {
    const variantStyles = {
        default: "bg-white/70 backdrop-blur-md border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-premium",
        warning: "bg-amber-50/50 backdrop-blur-md border-amber-100/50 shadow-[0_8px_32px_rgba(245,158,11,0.05)]",
        critical: "bg-red-50/50 backdrop-blur-md border-red-100/50 shadow-[0_8px_32px_rgba(239,68,68,0.05)]"
    };

    const iconStyles = {
        default: "bg-violet-600 text-white shadow-lg shadow-violet-200",
        warning: "bg-amber-500 text-white shadow-lg shadow-amber-100",
        critical: "bg-red-500 text-white shadow-lg shadow-red-100"
    };

    return (
        <div className={cn(
            "relative overflow-hidden rounded-[24px] border transition-all duration-500 p-8 flex flex-col gap-4 group cursor-default",
            variantStyles[variant]
        )}>
            {/* Subtle Gradient Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/5 rounded-full blur-[60px] group-hover:bg-violet-500/10 transition-colors duration-500" />

            <div className="flex items-center justify-between relative z-10">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em]">{title}</span>
                <div className={cn(
                    "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                    iconStyles[variant]
                )}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>

            <div className="flex flex-col gap-1 relative z-10">
                {loading
                    ? <Skeleton className="h-10 w-32 rounded-lg" />
                    : <span className={cn(
                        'text-4xl font-bold tracking-tight',
                        variant === 'critical' ? 'text-red-600' : 'text-zinc-900'
                    )}>{value}</span>
                }
                {subtitle && (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {subtitle}
                    </span>
                )}
            </div>

            {/* Visual Indicator Line */}
            <div className={cn(
                "absolute bottom-0 left-8 right-8 h-1 rounded-t-full transition-all duration-500 opacity-0 group-hover:opacity-100",
                variant === 'default' ? "bg-violet-600" : variant === 'warning' ? "bg-amber-500" : "bg-red-600"
            )} />
        </div>
    );
});
MetricCard.displayName = 'MetricCard';

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: string }) {
    return (
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
            </div>
            {badge && (
                <span className="text-[10px] font-semibold text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider">{badge}</span>
            )}
        </div>
    );
}

// ─── ROI Row ─────────────────────────────────────────────────────────────────
function ROIRow({ tool, rank }: { tool: any; rank: number }) {
    return (
        <div className="flex items-center gap-6 py-5 border-b border-border/50 last:border-0 group">
            <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-all border border-transparent',
                rank === 0
                    ? 'bg-primary text-white shadow-premium scale-110'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10'
            )}>
                {rank === 0 ? <Crown className="w-5 h-5" /> : `${rank + 1}`}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate mb-2 group-hover:text-primary transition-colors">{tool.name}</p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(109,40,217,0.3)]"
                        style={{ width: `${Math.min(100, tool.roi)}%` }}
                    />
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-black text-foreground">{formatCurrency(tool.profit)}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{tool.roi.toFixed(1)}% ROI</p>
            </div>
        </div>
    );
}

// ─── Billing Rule Widget (WhatsApp Draft) ───────────────────────────────────
const BillingRuleWidget = () => {
    const { data: expiring, isLoading } = useQuery({
        queryKey: ['expiring-rentals'],
        queryFn: async () => (await api.get('/rentals/expiring')).data.data,
    });

    const sendWhatsApp = (rental: any) => {
        // Clean phone number: remove non-numeric
        const phone = rental.customer.phoneNumber?.replace(/\D/g, '') || '';
        if (!phone) {
            alert('Cliente sem telefone cadastrado.');
            return;
        }

        const message = `Olá *${rental.customer.fullName}*! 🛠️\nNotamos que o aluguel do seu equipamento *${rental.tool.name}* vence em breve (${new Date(rental.endDateExpected).toLocaleDateString('pt-BR')}).\n\nDeseja renovar a locação ou solicitar a retirada?`;

        // Use 55 prefix if not present (assuming BR locale as per context)
        const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="md:col-span-2 xl:col-span-2 bg-white rounded-[12px] border border-violet-100/50 shadow-soft p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-violet-500" />
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">Régua de Cobrança</h4>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 rounded-full border border-violet-100/50">
                    <span className="text-[10px] font-black text-violet-600 uppercase tracking-tighter">Draft WhatsApp</span>
                </div>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : expiring?.length > 0 ? (
                    expiring.map((rental: any) => (
                        <div key={rental.id} className="flex items-center justify-between p-4 bg-muted/5 rounded-xl border border-border/40 group hover:border-violet-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg border border-violet-100">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{rental.customer.fullName}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                                        {rental.tool.name} • Vence {new Date(rental.endDateExpected).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => sendWhatsApp(rental)}
                                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm"
                                title="Enviar lembrete via WhatsApp"
                            >
                                <Zap className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="py-8 flex flex-col items-center justify-center bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                        <UserCheck className="w-8 h-8 text-zinc-200 mb-2" />
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center">Tudo em dia.<br />Sem vencimentos próximos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('30d');

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats', timeRange],
        queryFn: async () => (await api.get(`/rentals/dashboard-stats?period=${timeRange}`)).data.data,
        staleTime: 60_000,
    });

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = user?.fullName?.split(' ')[0] ?? '';
    const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

    const EmptyState = ({ message }: { message: string }) => (
        <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground max-w-[280px] leading-relaxed">
                {message}
            </p>
        </div>
    );

    return (
        <div className="space-y-12 max-w-[1400px] mx-auto py-10 px-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* ── Welcome Header & Quick Filters ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
                <div>
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">{greeting}, {firstName}</h1>
                    <div className="flex items-center gap-4 mt-3">
                        <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em]">{today}</p>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Controle Operacional Total</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-border/40 shadow-soft">
                    {[
                        { id: 'today', label: 'Hoje' },
                        { id: '7d', label: '7 dias' },
                        { id: '30d', label: '30 dias' }
                    ].map((range) => (
                        <button
                            key={range.id}
                            onClick={() => setTimeRange(range.id as any)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                timeRange === range.id
                                    ? "bg-primary text-white shadow-premium"
                                    : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── The Bento Puzzle Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

                {/* ── Row 1 ── */}
                {/* Primary Financial (Big Card) */}
                <div className="md:col-span-2 xl:col-span-2">
                    <MetricCard
                        title="Faturamento do Mês"
                        value={formatCurrency(stats?.revenueThisMonth ?? 0)}
                        icon={DollarSign}
                        loading={isLoading}
                        subtitle="Progresso Financeiro Consolidado"
                    />
                </div>

                {/* Active Rentals (Action) */}
                <div className="xl:col-span-1">
                    <MetricCard
                        title="Locações Ativas"
                        value={stats?.activeRentals ?? 0}
                        icon={Activity}
                        loading={isLoading}
                        subtitle="Volume de Operação Atual"
                    />
                </div>

                {/* Critical Alert (Emergency) */}
                <div className="xl:col-span-1">
                    <MetricCard
                        title="Atrasos Críticos"
                        value={stats?.criticalOverdueCount ?? 0}
                        icon={AlertTriangle}
                        loading={isLoading}
                        variant={stats?.criticalOverdueCount > 0 ? 'critical' : 'default'}
                        subtitle="Recuperação Necessária"
                    />
                </div>

                {/* ── Row 2: Operation Snapshot ── */}
                {/* Today's Returns (Snapshot) */}
                <div className="xl:col-span-1">
                    <MetricCard
                        title="Retornos Hoje"
                        value={stats?.returnsToday ?? 0}
                        icon={Calendar}
                        loading={isLoading}
                        subtitle="Logística Próxima"
                    />
                </div>

                {/* Ociosidade (Refined Attention) */}
                <div className="xl:col-span-1">
                    <MetricCard
                        title="Ociosidade"
                        value={`${stats?.idleRate ?? 0}%`}
                        icon={TrendingDown}
                        loading={isLoading}
                        subtitle="Atenção (30d)"
                    />
                </div>

                {/* Available Inventory (Pulse) */}
                <div className="xl:col-span-1">
                    <MetricCard
                        title="Disponíveis"
                        value={stats?.available ?? 0}
                        icon={Package}
                        loading={isLoading}
                        subtitle="Potencial de Saída"
                    />
                </div>

                {/* Maintenance Alerts (Refined Warning) */}
                <div className="xl:col-span-1">
                    <MetricCard
                        title="Manutenção"
                        value={stats?.maintenanceAlertsCount ?? 0}
                        icon={Wrench}
                        loading={isLoading}
                        variant={stats?.maintenanceAlertsCount > 0 ? 'warning' : 'default'}
                        subtitle="Prevenção Ativa"
                    />
                </div>

                {/* ── Row 3 & 4: Deep Intelligence ── */}

                {/* Billing Rule (NEW) */}
                <BillingRuleWidget />

                {/* Top Profitable Tools (Tall Card) */}
                <div className="md:col-span-2 xl:col-span-2 xl:row-span-2 bg-white rounded-[12px] border border-border/40 shadow-soft p-6 flex flex-col">

                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Top 5 Lucrativos</h4>
                    </div>
                    <div className="flex-1 space-y-2">
                        {isLoading
                            ? <div className="space-y-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
                            : stats?.topToolsByROI?.length > 0
                                ? stats.topToolsByROI.map((tool: any, i: number) => <ROIRow key={i} tool={tool} rank={i} />)
                                : <EmptyState message="Nenhum dado de rentabilidade encontrado ainda." />
                        }
                    </div>
                </div>

                {/* Cash Flow Analysis (Wide Card) */}
                <div className="md:col-span-2 xl:col-span-2 bg-white rounded-[12px] border border-border/40 shadow-soft p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <HandCoins className="w-5 h-5 text-primary" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Fluxo de Recebimentos</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-5 bg-muted/20 rounded-2xl border border-border/30">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Realizado</p>
                                <p className="text-xl font-bold text-foreground">{formatCurrency(stats?.actualRevenue ?? 0)}</p>
                            </div>
                            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-3">A Receber (Ativo)</p>
                                <p className="text-xl font-bold text-primary">{formatCurrency(stats?.toReceive ?? 0)}</p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end pb-2">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conversão de Fluxo</span>
                                <span className="text-[10px] font-bold text-primary">
                                    {((Number(stats?.actualRevenue) / (Number(stats?.actualRevenue) + Number(stats?.toReceive) || 1)) * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/20">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(109,40,217,0.3)]"
                                    style={{ width: `${(Number(stats?.actualRevenue) / (Number(stats?.actualRevenue) + Number(stats?.toReceive) || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* VIPs (Consolidated Puzzle - bottom right) */}
                <div className="xl:col-span-2 bg-white rounded-[12px] border border-border/40 shadow-soft p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Crown className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Clientes VIP (Ranking)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading
                            ? <div className="space-y-3 col-span-full">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}</div>
                            : stats?.mostProfitableCustomers?.slice(0, 3).map((c: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border border-border/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center text-[10px] font-black border border-primary/10">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-foreground truncate max-w-[100px]">{c.name}</p>
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-tight">{formatCurrency(c.totalRevenue)}</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black text-primary opacity-20"># {i + 1}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* ── Row 5: Asset Intelligence ── */}
                {/* Zombie Equipment (Critical Insight) */}
                <div className="md:col-span-2 xl:col-span-2 bg-white rounded-[12px] border border-red-100 shadow-soft p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Skull className="w-5 h-5 text-red-500" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Equipamentos Zumbis</h4>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full border border-red-100/50">
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter">Sugestão: Venda/Descarte</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                        ) : stats?.zombieEquipment?.length > 0 ? (
                            stats.zombieEquipment.map((tool: any) => (
                                <div key={tool.id} className="flex items-center justify-between p-3 bg-red-50/10 rounded-xl border border-red-50/20 group hover:bg-red-50/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black">
                                            {tool.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-foreground truncate max-w-[150px]">{tool.name}</p>
                                            <p className="text-[9px] text-red-500 uppercase font-black tracking-tighter">Baixo ROI / Inativo</p>
                                        </div>
                                    </div>
                                    <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Info className="w-3 h-3 text-red-400" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-6 flex flex-col items-center justify-center bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                                <Zap className="w-8 h-8 text-zinc-200 mb-2" />
                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Frota 100% Saudável</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fleet Health Pulse (Visual Insight) */}
                <div className="xl:col-span-2 bg-white rounded-[12px] border border-border/40 shadow-soft p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-5 h-5 text-primary" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Saúde Preventiva</h4>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats?.totalTools > 0 ? (100 - (stats.maintenanceAlertsCount / stats.totalTools * 100)).toFixed(0) : 100}%
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Disponibilidade Operacional</p>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <Wrench className="w-4 h-4 text-amber-500" />
                                <span className="text-[11px] font-bold text-amber-600">{stats?.maintenanceAlertsCount ?? 0} Pendentes</span>
                            </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/20">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                style={{ width: `${stats?.totalTools > 0 ? (100 - (stats.maintenanceAlertsCount / stats.totalTools * 100)) : 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                            A saúde da sua frota é calculada com base em manutenções preventivas vs. corretivas e tempo de ociosidade.
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
}

// Support Icons
import { Plus } from 'lucide-react';
