'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Wrench,
    Users,
    FileText,
    Search,
} from 'lucide-react';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState('');
    const [results, setResults] = React.useState<{
        tools: any[];
        customers: any[];
        rentals: any[];
    }>({ tools: [], customers: [], rentals: [] });
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }

            // Outros atalhos rápidos (sem estar no menu)
            if (!open && !['INPUT', 'TEXTAREA'].includes((e.target as any)?.tagName)) {
                if (e.key.toLowerCase() === 'n') {
                    // router.push('/locacoes/nova'); // Depende da rota real
                }
                if (e.key.toLowerCase() === 'd') {
                    router.push('/dashboard');
                }
                if (e.key.toLowerCase() === 'c') {
                    router.push('/clientes');
                }
                if (e.key.toLowerCase() === 'f') {
                    router.push('/ferramentas');
                }
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open]); // Removed router to prevent unnecessary listener resets

    React.useEffect(() => {
        if (!searchValue.trim()) {
            setResults({ tools: [], customers: [], rentals: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get(`/search?q=${searchValue}`);
                setResults(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue]);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-lg hover:border-violet-300 transition-all group"
            >
                <Search className="w-3.5 h-3.5 group-hover:text-violet-600 transition-colors" />
                <span className="hidden md:inline group-hover:text-zinc-600 transition-colors">Buscar ferramentas, clientes...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-zinc-400 opacity-100 ml-2 group-hover:border-violet-200">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Digite para pesquisar..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                />
                <CommandList>
                    <CommandEmpty>{loading ? 'Pesquisando...' : 'Nenhum resultado encontrado.'}</CommandEmpty>

                    {results.tools.length > 0 && (
                        <CommandGroup heading="Ferramentas">
                            {results.tools.map((tool) => (
                                <CommandItem
                                    key={tool.id}
                                    onSelect={() => runCommand(() => router.push(`/ferramentas/${tool.id}`))}
                                >
                                    <Wrench className="mr-2 h-4 w-4" />
                                    <span>{tool.name}</span>
                                    <CommandShortcut className="uppercase text-[10px]">{tool.status}</CommandShortcut>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.customers.length > 0 && (
                        <CommandGroup heading="Clientes">
                            {results.customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    onSelect={() => runCommand(() => router.push(`/clientes/${customer.id}`))}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{customer.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.rentals.length > 0 && (
                        <CommandGroup heading="Locações">
                            {results.rentals.map((rental) => (
                                <CommandItem
                                    key={rental.id}
                                    onSelect={() => runCommand(() => router.push(`/locacoes/${rental.id}`))}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Locação {rental.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    <CommandSeparator />

                    <CommandGroup heading="Ações Rápidas">
                        <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Ir para Dashboard</span>
                            <CommandShortcut>D</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/ferramentas'))}>
                            <Wrench className="mr-2 h-4 w-4" />
                            <span>Gerenciar Ferramentas</span>
                            <CommandShortcut>F</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/clientes'))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Listar Clientes</span>
                            <CommandShortcut>C</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/configuracoes'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
