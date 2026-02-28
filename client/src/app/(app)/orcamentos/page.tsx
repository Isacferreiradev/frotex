'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Calculator, Trash2, Loader2, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_MAP: any = {
    draft: { label: 'Rascunho', color: 'bg-zinc-100 text-zinc-600' },
    sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-600' },
    accepted: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-600' },
    rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-600' },
};

export default function OrcamentosPage() {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<any>(null);

    const queryClient = useQueryClient();

    const { data: quotes, isLoading } = useQuery({
        queryKey: ['quotes'],
        queryFn: async () => (await api.get('/quotes')).data.data,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/quotes', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            setIsCreateOpen(false);
            toast.success('Orçamento/Reserva criado!');
        },
        onError: () => toast.error('Erro ao criar orçamento'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) =>
            api.put(`/quotes/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Status atualizado');
        },
    });

    const convertMutation = useMutation({
        mutationFn: (id: string) => api.post(`/quotes/${id}/convert`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            toast.success('Conversão realizada! Locação ativa.');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro na conversão'),
    });


    return (
        <div className="space-y-12 max-w-[1400px] mx-auto py-10 px-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">Orçamentos & Reservas</h1>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] flex items-center gap-2 mt-3">
                        <Calculator className="w-3.5 h-3.5" /> Funil de Conversão
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-[11px] uppercase tracking-widest transition-all shadow-premium">
                            <Plus className="w-4.5 h-4.5" />
                            Novo Orçamento
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-violet-50 p-0 overflow-hidden bg-white">
                        <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                            <DialogTitle className="font-bold text-xl tracking-tight text-zinc-900">Gerar Novo Orçamento</DialogTitle>
                        </div>
                        <div className="p-8">
                            <QuoteForm
                                onSubmit={(data) => createMutation.mutate(data)}
                                isLoading={createMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-border/40 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/10">
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Equipamento / Cliente</th>
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Período</th>
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Valor</th>
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="px-8 py-4"><Skeleton className="h-12 w-full" /></td></tr>
                                ))
                            ) : quotes?.length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center"><EmptyState icon={Calculator} title="Nenhum orçamento" description="Comece gerando um novo orçamento para seus clientes." /></td></tr>
                            ) : (
                                quotes.map((q: any) => (
                                    <tr key={q.id} className="group hover:bg-muted/30 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-zinc-900">{q.tool?.name}</span>
                                                <span className="text-[11px] text-zinc-500 font-medium">{q.customer?.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-700">
                                                    {format(new Date(q.startDate), 'dd/MM/yy')} → {format(new Date(q.endDateExpected), 'dd/MM/yy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-violet-600">
                                            {formatCurrency(q.totalAmount)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                                STATUS_MAP[q.status].color
                                            )}>
                                                {STATUS_MAP[q.status].label}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {q.status === 'draft' && (
                                                    <button
                                                        onClick={() => statusMutation.mutate({ id: q.id, status: 'sent' })}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                        title="Marcar como Enviado"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {q.status === 'sent' && (
                                                    <button
                                                        onClick={() => statusMutation.mutate({ id: q.id, status: 'accepted' })}
                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                        title="Aprovar"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {q.status === 'accepted' && (
                                                    <button
                                                        onClick={() => convertMutation.mutate(q.id)}
                                                        disabled={convertMutation.isPending}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-widest shadow-md"
                                                        title="Converter em Locação"
                                                    >
                                                        {convertMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
                                                        Converter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
