'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const quoteSchema = z.object({
    toolId: z.string().uuid('Selecione um equipamento'),
    customerId: z.string().uuid('Selecione um cliente'),
    startDate: z.string().min(1, 'Data de início obrigatória'),
    endDateExpected: z.string().min(1, 'Data de retorno obrigatória'),
    totalAmount: z.string().min(1, 'Valor total obrigatório'),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
    initialData?: any;
    onSubmit: (data: QuoteFormValues) => void;
    isLoading?: boolean;
}

export function QuoteForm({ initialData, onSubmit, isLoading }: QuoteFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            ...initialData,
            totalAmount: initialData?.totalAmount?.toString() || '',
        },
    });

    const { data: tools } = useQuery({
        queryKey: ['tools-available'],
        queryFn: async () => (await api.get('/tools?status=available')).data.data,
    });

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => (await api.get('/customers')).data.data,
    });

    const selectedToolId = watch('toolId');
    const selectedTool = tools?.find((t: any) => t.id === selectedToolId);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label>Equipamento</Label>
                    <Select
                        onValueChange={(v) => setValue('toolId', v)}
                        defaultValue={initialData?.toolId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                            {tools?.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.name} ({t.assetTag})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.toolId && <p className="text-xs text-red-500">{errors.toolId.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select
                        onValueChange={(v) => setValue('customerId', v)}
                        defaultValue={initialData?.customerId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Data Início</Label>
                        <Input id="startDate" type="date" {...register('startDate')} />
                        {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDateExpected">Retorno Previsto</Label>
                        <Input id="endDateExpected" type="date" {...register('endDateExpected')} />
                        {errors.endDateExpected && <p className="text-xs text-red-500">{errors.endDateExpected.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="totalAmount">Valor Estimado (R$)</Label>
                    <div className="relative">
                        <Input
                            id="totalAmount"
                            {...register('totalAmount')}
                            placeholder="0.00"
                            className="pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">R$</span>
                    </div>
                    {selectedTool && (
                        <p className="text-[10px] text-violet-500 font-bold uppercase">Taxa Diária: R$ {selectedTool.dailyRate}</p>
                    )}
                    {errors.totalAmount && <p className="text-xs text-red-500">{errors.totalAmount.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-violet-50 mt-4">
                <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-[10px] py-6 rounded-xl shadow-lg shadow-violet-100 w-full">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Salvar Alterações' : 'Gerar Orçamento / Reserva'}
                </Button>
            </div>
        </form>
    );
}
