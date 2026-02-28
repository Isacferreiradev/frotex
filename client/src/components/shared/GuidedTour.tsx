'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function GuidedTour() {
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour');

        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                nextBtnText: 'Próximo',
                prevBtnText: 'Anterior',
                doneBtnText: 'Finalizar',
                steps: [
                    {
                        element: '.sidebar-logo',
                        popover: {
                            title: 'Bem-vindo ao AlugaFácil Pro!',
                            description: 'Este é o seu novo centro de comando para locações.',
                            side: "right",
                            align: 'start'
                        }
                    },
                    {
                        element: 'header .flex.items-center.gap-2.px-3',
                        popover: {
                            title: 'Busca Ninja (⌘K)',
                            description: 'Encontre qualquer ferramenta ou cliente instantaneamente de qualquer lugar.',
                            side: "bottom",
                            align: 'center'
                        }
                    },
                    {
                        element: '.grid-cols-4',
                        popover: {
                            title: 'Insights em Tempo Real',
                            description: 'Acompanhe sua taxa de ocupação e receita em risco automaticamente.',
                            side: "bottom",
                            align: 'center'
                        }
                    },
                    {
                        element: 'nav a[href="/ferramentas"]',
                        popover: {
                            title: 'Gerencie seu Patrimônio',
                            description: 'Cadastre suas ferramentas e acompanhe manutenções aqui.',
                            side: "right",
                            align: 'start'
                        }
                    },
                ]
            });

            setTimeout(() => {
                driverObj.drive();
                localStorage.setItem('hasSeenTour', 'true');
            }, 1000);
        }
    }, []);

    return null;
}
