'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToolSearch } from '@/components/shared/ToolSearch';

const maintenanceSchema = z.object({
    toolId: z.string().uuid('Selecione um equipamento'),
    maintenanceDate: z.string(),
    description: z.string().min(5, 'Descreva o serviço realizado'),
    cost: z.number().min(0, 'Custo inválido'),
    notes: z.string().optional(),
});

type MaintenanceValues = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
    onSubmit: (data: MaintenanceValues) => void;
    isLoading?: boolean;
    initialToolId?: string;
    initialToolName?: string;
}

export function MaintenanceForm({ onSubmit, isLoading, initialToolId, initialToolName }: MaintenanceFormProps) {
    const [selectedTool, setSelectedTool] = useState<{ id: string; name: string } | null>(
        initialToolId ? { id: initialToolId, name: initialToolName || '' } : null
    );

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<MaintenanceValues>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: {
            toolId: initialToolId || '',
            maintenanceDate: new Date().toISOString().split('T')[0],
            description: '',
            cost: 0,
            notes: '',
        },
    });

    const handleToolSelect = (tool: any) => {
        setSelectedTool(tool);
        setValue('toolId', tool.id);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Equipamento</Label>
                    {!initialToolId ? (
                        <ToolSearch onSelect={handleToolSelect} selectedId={selectedTool?.id} />
                    ) : (
                        <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-50">
                            <p className="text-sm font-bold text-zinc-900">{selectedTool?.name}</p>
                        </div>
                    )}
                    {errors.toolId && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors.toolId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="maintenanceDate" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Data</Label>
                        <Input id="maintenanceDate" type="date" {...register('maintenanceDate')} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cost" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Custo (R$)</Label>
                        <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            {...register('cost', { valueAsNumber: true })}
                            className="rounded-xl"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Serviço Realizado</Label>
                    <Input id="description" {...register('description')} placeholder="Ex: Troca de escovas de carvão" className="rounded-xl" />
                    {errors.description && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Observações (Opcional)</Label>
                    <Textarea id="notes" {...register('notes')} placeholder="Detalhes adicionais..." className="rounded-2xl min-h-[100px] bg-zinc-50 border-transparent focus:bg-white transition-all" />
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-violet-50">
                <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-[10px] py-6 px-10 rounded-xl shadow-lg shadow-violet-100 w-full sm:w-auto">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Registro
                </Button>
            </div>
        </form>
    );
}
