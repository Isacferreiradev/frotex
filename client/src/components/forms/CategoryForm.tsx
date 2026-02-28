'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const categorySchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    initialData?: any;
    onSubmit: (data: CategoryFormValues) => void;
    isLoading?: boolean;
}

export function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: initialData || {},
    });

    return (
        <form
            onSubmit={(e) => {
                e.stopPropagation();
                handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="categoryName">Nome da Categoria</Label>
                <Input id="categoryName" {...register('name')} placeholder="Ex: Betoneiras, Andaimes..." autoFocus />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="categoryDesc">Descrição (Opcional)</Label>
                <Input id="categoryDesc" {...register('description')} />
            </div>

            <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-[10px] py-6 rounded-xl shadow-lg shadow-violet-100 w-full">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Salvar Categoria' : 'Criar Categoria'}
                </Button>
            </div>
        </form>
    );
}
