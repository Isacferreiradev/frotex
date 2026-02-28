import type { Metadata } from 'next';
import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { GuidedTour } from '@/components/shared/GuidedTour';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AlugaFácil Pro — Gestão de Locadoras',
  description: 'Sistema de gestão para locadoras de ferramentas e equipamentos. Controle de inventário, locações, clientes e manutenção.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="antialiased font-jakarta bg-[#FAFBFC] text-[#1F2937]">
        <Providers>
          {children}
          <Toaster position="top-right" expand={true} richColors />
        </Providers>
      </body>
    </html>
  );
}
