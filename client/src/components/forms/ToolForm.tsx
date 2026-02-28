'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CategoryForm } from './CategoryForm';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


interface ToolFormValues {
    name: string;
    categoryId: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    assetTag?: string;
    dailyRate: number;
    status: 'available' | 'rented' | 'maintenance' | 'unavailable' | 'lost' | 'sold';
    nextMaintenanceDueHours?: number;
    notes?: string;
}

const toolSchema: z.ZodType<ToolFormValues> = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    categoryId: z.string().min(1, 'Selecione uma categoria'),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    assetTag: z.string().optional(),
    dailyRate: z.coerce.number().min(0, 'Valor inválido'),
    status: z.enum(['available', 'rented', 'maintenance', 'unavailable', 'lost', 'sold']).default('available'),
    nextMaintenanceDueHours: z.coerce.number().optional(),
    notes: z.string().optional(),
});

interface ToolFormProps {
    initialData?: any;
    onSubmit: (data: ToolFormValues) => void;
    isLoading?: boolean;
}

export function ToolForm({ initialData, onSubmit, isLoading }: ToolFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ToolFormValues>({
        resolver: zodResolver(toolSchema as any),
        defaultValues: initialData || {
            status: 'available',
            dailyRate: 0,
        },
    });

    const queryClient = useQueryClient();
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/tool-categories');
            return res.data.data;
        },
    });

    const createCategoryMutation = useMutation({
        mutationFn: (data: any) => api.post('/tool-categories', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });

            // Defensive check for ID in response structure
            const newId = res.data?.data?.id || res.data?.id;

            if (newId) {
                setValue('categoryId', newId, { shouldValidate: true });
            }

            setIsCategoryDialogOpen(false);
            toast.success('Categoria criada!');
        },
        onError: () => toast.error('Erro ao criar categoria'),
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nome da Ferramenta</Label>
                    <Input id="name" {...register('name')} placeholder="Ex: Betoneira 400L" autoFocus={true} />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                        onValueChange={(v) => {
                            if (v === 'ADD_NEW') {
                                // Delay opening to let the dropdown close properly
                                setTimeout(() => setIsCategoryDialogOpen(true), 50);
                            } else {
                                setValue('categoryId', v);
                            }
                        }}
                        defaultValue={initialData?.categoryId}
                        value={watch('categoryId')}
                    >
                        <SelectTrigger className="w-full bg-white border-violet-100 focus:ring-violet-200">
                            <SelectValue placeholder="Selecione uma categoria..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] bg-white border-violet-50 shadow-float z-[100]">
                            <SelectItem
                                value="ADD_NEW"
                                className="flex items-center gap-2 p-3 text-[10px] font-black text-violet-600 uppercase tracking-widest hover:bg-violet-50 focus:bg-violet-50 border-b border-violet-50/50 mb-1 cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5" />
                                    Criar Nova Categoria
                                </div>
                            </SelectItem>

                            {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                        <DialogContent className="sm:max-w-[400px] border-violet-50 p-0 overflow-hidden shadow-float">
                            <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                                <DialogTitle className="font-bold text-xl text-zinc-900">Nova Categoria</DialogTitle>
                            </div>
                            <div className="p-8">
                                <CategoryForm
                                    onSubmit={(data) => createCategoryMutation.mutate(data)}
                                    isLoading={createCategoryMutation.isPending}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                    {errors.categoryId && <p className="text-xs text-red-500 font-medium px-1 mt-1">{errors.categoryId.message}</p>}
                </div>



                <div className="space-y-2">
                    <Label htmlFor="dailyRate">Valor Diária (R$)</Label>
                    <Input id="dailyRate" type="number" step="0.01" {...register('dailyRate')} />
                    {errors.dailyRate && <p className="text-xs text-red-500">{errors.dailyRate.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input id="brand" {...register('brand')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" {...register('model')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="serialNumber">Nº de Série</Label>
                    <Input id="serialNumber" {...register('serialNumber')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="assetTag">Patrimônio (Tag)</Label>
                    <Input id="assetTag" {...register('assetTag')} />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-violet-50">
                <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-[10px] py-6 rounded-xl shadow-lg shadow-violet-100">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
                </Button>
            </div>
        </form>
    );
}
