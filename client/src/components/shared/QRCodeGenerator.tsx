'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
    value: string;
    label?: string;
}

export function QRCodeGenerator({ value, label }: QRCodeGeneratorProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success('Link copiado para a área de transferência');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `qrcode-${label || 'asset'}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-premium border border-border shadow-soft">
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                <QRCodeSVG
                    id="qr-code-svg"
                    value={value}
                    size={200}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                        src: "/logo-icon.png", // This should be a small icon if available
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                    }}
                />
            </div>

            <div className="text-center">
                <h4 className="font-bold text-foreground text-sm uppercase tracking-tight">{label || 'Equipamento'}</h4>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Escaneie para ver o histórico e status</p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
                <button
                    onClick={handleCopy}
                    className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-button hover:bg-primary/10 hover:text-primary transition-all group"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary" />}
                    <span className="text-[9px] font-bold uppercase tracking-widest">Copiar</span>
                </button>
                <button
                    onClick={handleDownload}
                    className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-button hover:bg-primary/10 hover:text-primary transition-all group"
                >
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Baixar</span>
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-button hover:bg-primary/10 hover:text-primary transition-all group"
                >
                    <Printer className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Imprimir</span>
                </button>
            </div>
        </div>
    );
}
