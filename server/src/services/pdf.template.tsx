import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    header: {
        marginBottom: 35,
        borderBottom: '1.5pt solid #6D28D9',
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tenantInfo: {
        flexDirection: 'column',
    },
    tenantName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#6D28D9',
        marginBottom: 4,
    },
    tenantSub: {
        fontSize: 9,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    contractBadge: {
        backgroundColor: '#F5F3FF',
        padding: '6 12',
        borderRadius: 8,
        textAlign: 'right',
    },
    contractTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    contractId: {
        fontSize: 10,
        color: '#6D28D9',
        fontWeight: 'bold',
        marginTop: 2,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#6D28D9',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        borderBottom: '1pt solid #F3F4F6',
        paddingBottom: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    field: {
        width: '48%',
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 8,
        color: '#9CA3AF',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    fieldValue: {
        fontSize: 10,
        color: '#111827',
        fontWeight: 'medium',
    },
    termsBox: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 12,
        border: '1pt solid #F3F4F6',
    },
    termsText: {
        fontSize: 8,
        lineHeight: 1.5,
        color: '#4B5563',
    },
    signatureArea: {
        marginTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    signatureBlock: {
        width: '45%',
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderTop: '1pt solid #D1D5DB',
        marginBottom: 6,
    },
    signatureName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    signatureRole: {
        fontSize: 8,
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        textAlign: 'center',
        borderTop: '1pt solid #F3F4F6',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
    }
});

interface RentalPdfData {
    tenant: {
        name: string;
        cnpj?: string;
        address?: string;
        phoneNumber?: string;
    };
    customer: {
        fullName: string;
        documentNumber: string;
        phoneNumber: string;
        address?: string;
    };
    tool: {
        name: string;
        brand?: string;
        model?: string;
        serialNumber?: string;
    };
    rental: {
        rentalCode: string;
        startDate: string;
        endDateExpected: string;
        dailyRate: string;
        totalAmountExpected: string;
    };
    customContent?: string;
}

export const RentalContract = ({ data, customContent }: { data: RentalPdfData, customContent?: string }) => (
    <Document title={`Contrato ${data.rental.rentalCode}`}>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.tenantInfo}>
                    <Text style={styles.tenantName}>{data.tenant.name}</Text>
                    <Text style={styles.tenantSub}>Gestão Profissional de Equipamentos</Text>
                    {data.tenant.cnpj && <Text style={{ fontSize: 9, marginTop: 4 }}>CNPJ: {data.tenant.cnpj}</Text>}
                </View>
                <View style={styles.contractBadge}>
                    <Text style={styles.contractTitle}>Contrato de Locação</Text>
                    <Text style={styles.contractId}>ORDEM #{data.rental.rentalCode}</Text>
                </View>
            </View>

            {/* Locatário */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Identificação do Locatário</Text>
                <View style={styles.grid}>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Nome Completo / Razão Social</Text>
                        <Text style={styles.fieldValue}>{data.customer.fullName}</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>CPF / CNPJ</Text>
                        <Text style={styles.fieldValue}>{data.customer.documentNumber}</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Telefone de Contato</Text>
                        <Text style={styles.fieldValue}>{data.customer.phoneNumber}</Text>
                    </View>
                    <View style={{ width: '100%' }}>
                        <Text style={styles.fieldLabel}>Endereço Completo</Text>
                        <Text style={styles.fieldValue}>{data.customer.address || 'Não informado'}</Text>
                    </View>
                </View>
            </View>

            {/* Equipamento */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Descrição do Equipamento</Text>
                <View style={styles.grid}>
                    <View style={{ width: '100%' }}>
                        <Text style={styles.fieldLabel}>Item Locado</Text>
                        <Text style={styles.fieldValue}>{data.tool.name}</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Marca / Modelo</Text>
                        <Text style={styles.fieldValue}>{data.tool.brand || '—'} / {data.tool.model || '—'}</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Número de Série</Text>
                        <Text style={styles.fieldValue}>{data.tool.serialNumber || 'Identificação Interna'}</Text>
                    </View>
                </View>
            </View>

            {/* Locação */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Período e Valores</Text>
                <View style={styles.grid}>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Data de Início</Text>
                        <Text style={styles.fieldValue}>{new Date(data.rental.startDate).toLocaleDateString('pt-BR')}</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Previsão de Término</Text>
                        <Text style={styles.fieldValue}>{new Date(data.rental.endDateExpected).toLocaleDateString('pt-BR')}</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Valor da Diária</Text>
                        <Text style={{ ...styles.fieldValue, color: '#6D28D9' }}>R$ {parseFloat(data.rental.dailyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Total Estimado</Text>
                        <Text style={{ ...styles.fieldValue, fontWeight: 'bold' }}>R$ {parseFloat(data.rental.totalAmountExpected).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    </View>
                </View>
            </View>

            {/* Terms / Custom Content */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Condições Contratuais</Text>
                <View style={styles.termsBox}>
                    <Text style={styles.termsText}>
                        {customContent ? customContent.trim() : `
                        • O locatário declara receber o equipamento em perfeito estado de conservação, limpeza e funcionamento.
                        • É de responsabilidade exclusiva do locatário o uso técnico adequado e a guarda do equipamento.
                        • Danos decorrentes de mau uso, negligência ou sinistros serão custeados integralmente pelo locatário.
                        • A devolução após a data prevista sem aviso prévio acarretará em multa de 10% e cobrança de diárias excedentes.
                        • O foro para dirimir quaisquer dúvidas deste contrato é o da comarca da sede do locador.
                        `.trim().replace(/^\s+/gm, '')}
                    </Text>
                </View>
            </View>

            {/* Signatures */}
            <View style={styles.signatureArea}>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureName}>{data.tenant.name}</Text>
                    <Text style={styles.signatureRole}>Locador / Cedente</Text>
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', opacity: 0.5 }}>
                        <Text style={{ fontSize: 6, color: '#6D28D9', fontStyle: 'italic' }}>IP: 187.xx.xxx.x · ID: {Math.random().toString(36).substring(7).toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureName}>{data.customer.fullName}</Text>
                    <Text style={styles.signatureRole}>Locatário / Cliente</Text>
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', opacity: 0.5 }}>
                        <Text style={{ fontSize: 6, color: '#6D28D9', fontStyle: 'italic' }}>PENDENTE DE ASSINATURA DIGITAL</Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Documento gerado eletronicamente através do sistema AlugaFácil Pro em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </Text>
                <Text style={{ ...styles.footerText, marginTop: 2, color: '#F3F4F6' }}>
                    {data.tenant.address || 'Endereço não cadastrado'} — {data.tenant.phoneNumber || 'Telefone não cadastrado'}
                </Text>
            </View>
        </Page>
    </Document>
);
