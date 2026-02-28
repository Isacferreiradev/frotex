import axios from 'axios';
import { AppError } from '../middleware/error.middleware';

const ASAAS_BASE_URL = process.env.ASAAS_ENV === 'production'
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

export class AsaasService {
    private apiKey: string;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new AppError(400, 'Configuração do Gateway de Pagamento (Asaas) pendente.');
        }
        this.apiKey = apiKey;
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'access_token': this.apiKey,
        };
    }

    /**
     * Busca ou cria um cliente no Asaas com base nos dados do sistema
     */
    async findOrCreateCustomer(data: { name: string, document: string, email?: string, phone?: string }) {
        try {
            // Tenta buscar por documento
            const search = await axios.get(`${ASAAS_BASE_URL}/customers?cpfCnpj=${data.document}`, { headers: this.headers });

            if (search.data.data && search.data.data.length > 0) {
                return search.data.data[0].id;
            }

            // Cria novo se não existir
            const response = await axios.post(`${ASAAS_BASE_URL}/customers`, {
                name: data.name,
                cpfCnpj: data.document,
                email: data.email,
                mobilePhone: data.phone,
            }, { headers: this.headers });

            return response.data.id;
        } catch (error: any) {
            console.error('Asaas Customer Error:', error.response?.data || error.message);
            throw new AppError(500, 'Erro ao sincronizar cliente com gateway de pagamento');
        }
    }

    /**
     * Cria uma cobrança (Boleto/PIX)
     */
    async createPayment(data: {
        customer: string,
        billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD',
        value: number,
        dueDate: string,
        description: string,
        externalReference: string,
    }) {
        try {
            const response = await axios.post(`${ASAAS_BASE_URL}/payments`, {
                customer: data.customer,
                billingType: data.billingType,
                value: data.value,
                dueDate: data.dueDate,
                description: data.description,
                externalReference: data.externalReference,
                postalService: false, // Não enviar cobrança física
            }, { headers: this.headers });

            return {
                id: response.data.id,
                invoiceUrl: response.data.invoiceUrl,
                status: response.data.status,
                paymentLink: response.data.bankSlipUrl || response.data.invoiceUrl,
            };
        } catch (error: any) {
            console.error('Asaas Payment Error:', error.response?.data || error.message);
            throw new AppError(500, 'Erro ao gerar cobrança no gateway de pagamento');
        }
    }

    /**
     * Obtém os dados de PIX (QR Code e Copia e Cola) de uma cobrança
     */
    async getPixData(paymentId: string) {
        try {
            const response = await axios.get(`${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, { headers: this.headers });
            return {
                copyPaste: response.data.payload,
                qrCode: response.data.encodedImage,
            };
        } catch (error: any) {
            console.error('Asaas PIX Error:', error.response?.data || error.message);
            return null;
        }
    }
}
