'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ArrowRight, Wrench, Check, Clock, Star } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FrotexLogo } from '@/components/shared/FrotexLogo';

const registerSchema = z.object({
    tenantName: z.string().min(2, 'Nome da locadora obrigatório'),
    documentType: z.enum(['CPF', 'CNPJ']),
    documentNumber: z.string().min(11, 'Documento inválido'),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    fullName: z.string().min(2, 'Nome completo obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const stats = [
    { value: '2 min', label: 'para começar', icon: Clock },
    { value: '100%', label: 'gratuito no plano essencial', icon: Star },
    { value: '+500', label: 'locadoras ativas', icon: Check },
];

const benefits = [
    'Contratos digitais automáticos',
    'Gestão de inadimplência integrada',
    'Dashboard de métricas em tempo real',
    'Suporte via WhatsApp no plano Pro',
];

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [docType, setDocType] = useState<'CPF' | 'CNPJ'>('CPF');

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { documentType: 'CPF' }
    });

    const onSubmit = async (data: RegisterForm) => {
        setServerError('');
        try {
            await api.post('/auth/register', data);
            router.push('/registration-success');
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Erro ao cadastrar');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ─── Left Panel ─── */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-zinc-950 flex-col justify-between p-14">
                {/* Background blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
                </div>

                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="relative z-10 scale-125 origin-left">
                    <FrotexLogo variant="white" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                        <p className="text-violet-400 text-[11px] font-bold uppercase tracking-[0.25em]">Comece hoje mesmo</p>
                        <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
                            Sua locadora na<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-200">
                                era digital.
                            </span>
                        </h2>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
                            Configure em minutos. Escale sem limites. Sem cartão de crédito no início.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {stats.map((s, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <p className="text-xl font-bold text-white tracking-tight">{s.value}</p>
                                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mt-1 leading-tight">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2.5">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Check className="w-4 h-4 text-violet-400" />
                                <span className="text-zinc-300 text-sm">{b}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <p className="text-zinc-400 text-xs">
                        Mais de <span className="text-white font-semibold">500 locadoras</span> já usam o Frotex
                    </p>
                </div>
            </div>

            {/* ─── Right Panel ─── */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-white overflow-y-auto">
                <div className="w-full max-w-xl space-y-8 py-10">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Criar sua conta</h1>
                        <p className="text-zinc-400 text-sm">
                            Já tem conta?{' '}
                            <Link href="/login" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">
                                Entrar agora
                            </Link>
                        </p>
                    </div>

                    {serverError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                            <p className="text-red-600 text-sm font-medium">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* ── Choice-Based Identity UI ── */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Tipo de Locadora (Identidade)
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setDocType('CPF'); setValue('documentType', 'CPF'); }}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2",
                                        docType === 'CPF'
                                            ? "border-violet-600 bg-violet-50/30"
                                            : "border-zinc-100 bg-zinc-50/50 grayscale hover:grayscale-0 hover:border-violet-200"
                                    )}
                                >
                                    <span className={cn("text-xs font-bold uppercase tracking-widest", docType === 'CPF' ? "text-violet-600" : "text-zinc-400")}>Pessoa Física</span>
                                    <span className="text-[10px] text-zinc-400 leading-tight">Ideal para profissionais autônomos e pequenas frotas.</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setDocType('CNPJ'); setValue('documentType', 'CNPJ'); }}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2",
                                        docType === 'CNPJ'
                                            ? "border-violet-600 bg-violet-50/30"
                                            : "border-zinc-100 bg-zinc-50/50 grayscale hover:grayscale-0 hover:border-violet-200"
                                    )}
                                >
                                    <span className={cn("text-xs font-bold uppercase tracking-widest", docType === 'CNPJ' ? "text-violet-600" : "text-zinc-400")}>Pessoa Jurídica</span>
                                    <span className="text-[10px] text-zinc-400 leading-tight">Para empresas registradas com gestão avançada de impostos.</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Locadora / Fantasia</label>
                                <input type="text" {...register('tenantName')} placeholder="Ex: LocaFacil Pro" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-100 transition-all shadow-sm" />
                                {errors.tenantName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.tenantName.message}</p>}
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{docType}</label>
                                <input type="text" {...register('documentNumber')} placeholder={docType === 'CPF' ? "000.000.000-00" : "00.000.000/0001-00"} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-100 transition-all shadow-sm" />
                                {errors.documentNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.documentNumber.message}</p>}
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                <input type="text" {...register('phoneNumber')} placeholder="(11) 99999-9999" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-100 transition-all shadow-sm" />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Seu Nome Completo (Responsável)</label>
                                <input type="text" {...register('fullName')} placeholder="João da Silva" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-100 transition-all shadow-sm" />
                                {errors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Profissional</label>
                                <input type="email" {...register('email')} placeholder="email@exemplo.com" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-100 transition-all shadow-sm" />
                                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sua Senha Mestra</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-100 transition-all shadow-sm" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-500 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-black rounded-2xl transition-all shadow-premium hover:-translate-y-0.5 uppercase tracking-widest mt-4 text-xs"
                        >
                            {isSubmitting ? "Processando..." : "Criar Minha Locadora Pro"}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-zinc-400 leading-relaxed uppercase tracking-tighter">
                        Ao criar uma conta, você concorda com nossos <span className="text-violet-600 font-black cursor-pointer underline">Termos</span> e <span className="text-violet-600 font-black cursor-pointer underline">Privacidade</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}
