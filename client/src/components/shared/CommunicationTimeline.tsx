import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Phone, StickyNote, History, Send, Loader2, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommunicationTimelineProps {
    customerId: string;
}

export function CommunicationTimeline({ customerId }: CommunicationTimelineProps) {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'call' | 'note' | 'whatsapp'>('note');
    const queryClient = useQueryClient();

    const { data: communications, isLoading } = useQuery({
        queryKey: ['communications', customerId],
        queryFn: async () => {
            const res = await api.get(`/communications/${customerId}`);
            return res.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/communications', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communications', customerId] });
            setMessage('');
            toast.success('Registro adicionado');
        },
        onError: () => toast.error('Erro ao adicionar registro'),
    });

    const handleSend = () => {
        if (!message.trim()) return;
        createMutation.mutate({ customerId, message, type });
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-violet-50/30 p-4 rounded-2xl border border-violet-100 space-y-3">
                <div className="flex gap-2">
                    {[
                        { id: 'note', icon: StickyNote, label: 'Nota' },
                        { id: 'call', icon: Phone, label: 'Ligação' },
                        { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setType(t.id as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                type === t.id ? "bg-violet-600 text-white shadow-sm" : "bg-white text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <t.icon className="w-3 h-3" />
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Descreva a interação..."
                        className="flex-1 bg-white border border-violet-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={createMutation.isPending || !message.trim()}
                        className="bg-violet-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-violet-700 disabled:opacity-50 transition-all"
                    >
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-violet-50">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-violet-200 animate-spin" />
                    </div>
                ) : communications?.length === 0 ? (
                    <div className="text-center py-8">
                        <History className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                        <p className="text-zinc-400 text-xs font-medium">Nenhuma interação registrada ainda.</p>
                    </div>
                ) : (
                    communications?.map((item: any) => (
                        <div key={item.id} className="relative pl-8 animate-in slide-in-from-left duration-300">
                            <div className={cn(
                                "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm",
                                item.type === 'note' ? "bg-zinc-100 text-zinc-500" :
                                    item.type === 'call' ? "bg-blue-100 text-blue-600" :
                                        "bg-emerald-100 text-emerald-600"
                            )}>
                                {item.type === 'note' ? <StickyNote className="w-2.5 h-2.5" /> :
                                    item.type === 'call' ? <Phone className="w-2.5 h-2.5" /> :
                                        <MessageSquare className="w-2.5 h-2.5" />}
                            </div>
                            <div className="bg-white border border-violet-50 rounded-2xl p-4 premium-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-zinc-900 font-bold text-xs">{item.user?.fullName || 'Usuário'}</p>
                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">
                                            {format(new Date(item.createdAt), "dd MMM HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-zinc-600 text-[13px] leading-relaxed">{item.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
