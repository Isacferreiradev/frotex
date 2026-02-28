'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ArrowRight, Wrench, BarChart2, Shield, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FrotexLogo } from '@/components/shared/FrotexLogo';
import { ForgotPasswordModal } from '@/components/shared/ForgotPasswordModal';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

const features = [
    { icon: BarChart2, text: 'Dashboard inteligente em tempo real' },
    { icon: Shield, text: 'Contratos digitais automáticos' },
    { icon: Wrench, text: 'Gestão completa de frota' },
    { icon: Users, text: 'CRM integrado de clientes' },
];

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError('');
        try {
            const res = await api.post('/auth/login', data);
            const { accessToken, refreshToken, user } = res.data.data;
            setAuth(user, accessToken, refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 403) {
                router.push('/registration-success');
                return;
            }
            setServerError(err.response?.data?.message || 'Credenciais inválidas');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ─── Left Panel ─── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 flex-col justify-between p-14">
                {/* Abstract gradient blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
                    <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
                </div>

                {/* Grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Floating abstract shapes */}
                <div className="absolute top-1/4 left-16 w-64 h-64 opacity-10">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#8B5CF6" d="M47.5,-57.2C60.3,-47.2,69,-31.5,72.2,-14.5C75.3,2.5,72.9,20.8,64.4,36.2C55.9,51.5,41.2,63.9,24.4,69.5C7.5,75.1,-11.5,73.8,-27.6,66.7C-43.7,59.5,-56.8,46.5,-65.1,30.4C-73.4,14.2,-76.8,-5.1,-71.7,-21.4C-66.7,-37.7,-53.3,-50.9,-38.7,-60.3C-24.2,-69.7,-8.6,-75.3,5.8,-72.4C20.2,-69.5,34.7,-67.2,47.5,-57.2Z" transform="translate(100 100)" />
                    </svg>
                </div>
                <div className="absolute bottom-1/4 right-12 w-48 h-48 opacity-10">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#6D28D9" d="M39.9,-51.6C52.3,-41.5,63.5,-30,68.7,-15.5C74,1.1,73.3,20.7,65.2,36.3C57.1,52,41.7,63.6,24.8,69.8C7.9,76,-10.5,76.7,-26.4,70.4C-42.3,64.1,-55.7,50.7,-63.3,34.8C-70.9,18.9,-72.8,0.4,-67.4,-15.1C-62,-30.7,-49.3,-43.3,-35.7,-53.2C-22,-63.1,-7.3,-70.2,5.4,-76.8C18.2,-83.4,27.5,-61.7,39.9,-51.6Z" transform="translate(100 100)" />
                    </svg>
                </div>

                {/* Logo */}
                <div className="relative z-10 scale-125 origin-left">
                    <FrotexLogo variant="white" />
                </div>

                {/* Hero text */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                        <p className="text-violet-400 text-[11px] font-bold uppercase tracking-[0.25em]">Gestão de Locadoras</p>
                        <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
                            Controle total da<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-200">
                                sua operação.
                            </span>
                        </h2>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                            Da frota às finanças, do cliente ao contrato — tudo em um painel inteligente.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-3">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:border-violet-500/40 transition-all duration-300">
                                    <f.icon className="w-4 h-4 text-violet-400" />
                                </div>
                                <span className="text-zinc-300 text-sm font-medium">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom testimonial */}
                <div className="relative z-10 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className="text-zinc-300 text-sm leading-relaxed italic">
                        "Reduzimos inadimplência em 40% e triplicamos a produtividade da equipe em 3 meses."
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/30 border border-violet-400/30 flex items-center justify-center text-violet-300 font-bold text-xs">
                            RM
                        </div>
                        <div>
                            <p className="text-white text-xs font-bold">Ricardo M.</p>
                            <p className="text-zinc-500 text-[10px]">Locadora de Equipamentos SP</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Right Panel ─── */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-white">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden">
                        <FrotexLogo variant="white" />
                    </div>

                    {/* Heading */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Bom te ver!</h1>
                        <p className="text-zinc-400 text-sm">
                            Não tem conta?{' '}
                            <Link href="/register" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">
                                Cadastre sua locadora grátis
                            </Link>
                        </p>
                    </div>

                    {/* Error */}
                    {serverError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-red-600 text-[10px] font-black">!</span>
                            </div>
                            <p className="text-red-600 text-sm font-medium">{serverError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                Email
                            </label>
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="seu@email.com"
                                className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-200 focus:bg-white transition-all"
                            />
                            {errors.email && (
                                <p className="text-[11px] text-red-500 font-semibold ml-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    Senha
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsForgotModalOpen(true)}
                                    className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors"
                                >
                                    Esqueceu sua senha?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3.5 pr-12 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-200 focus:bg-white transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] text-red-500 font-semibold ml-1">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                            ) : (
                                <>Entrar <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <ForgotPasswordModal
                open={isForgotModalOpen}
                onOpenChange={setIsForgotModalOpen}
            />
        </div>
    );
}
