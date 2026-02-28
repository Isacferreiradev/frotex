'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import api from '@/lib/api';
import { FrotexLogo } from '@/components/shared/FrotexLogo';

const schema = z.object({
    password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        if (!token) {
            setServerError('Token de recuperação não encontrado.');
            return;
        }

        setServerError('');
        try {
            await api.post('/auth/reset-password', {
                token,
                password: data.password
            });
            setIsSuccess(true);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.');
        }
    };

    if (!token && !isSuccess) {
        return (
            <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-zinc-900">Link Inválido</h2>
                    <p className="text-zinc-500 text-sm">Este link de recuperação é inválido ou já expirou.</p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-widest hover:underline"
                >
                    Voltar para o Login
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-zinc-900">Senha Alterada!</h2>
                    <p className="text-zinc-500 text-sm">Sua nova senha foi configurada com sucesso.</p>
                </div>
                <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-violet-100 hover:bg-violet-700 active:scale-[0.98]"
                >
                    Fazer Login Agora <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Nova Senha</h1>
                <p className="text-zinc-400 text-sm">
                    Crie uma senha forte e segura para sua conta.
                </p>
            </div>

            {serverError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-600 uppercase tracking-widest">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                        Nova Senha
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 transition-all font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                        Confirmar Nova Senha
                    </label>
                    <input
                        type="password"
                        {...register('confirmPassword')}
                        placeholder="Repita a senha"
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 transition-all font-medium"
                    />
                    {errors.confirmPassword && (
                        <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em]"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>Redefinir Senha <KeyRound className="w-4 h-4" /></>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-[440px] space-y-12">
                <div className="flex justify-center">
                    <FrotexLogo variant="normal" size="lg" />
                </div>

                <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                    <div className="relative z-10">
                        <Suspense fallback={
                            <div className="flex flex-col items-center gap-4 py-20">
                                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Carregando...</p>
                            </div>
                        }>
                            <ResetPasswordForm />
                        </Suspense>
                    </div>
                </div>

                <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    © {new Date().getFullYear()} Frotex — Sistema de Elite
                </p>
            </div>
        </div>
    );
}
