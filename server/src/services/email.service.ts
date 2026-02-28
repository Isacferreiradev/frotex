import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

// Email transporter configuration using values from env
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export async function sendVerificationEmail(email: string, fullName: string, token: string) {
    const verificationUrl = `${env.CORS_ORIGIN}/verify?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"Frotex" <${env.SMTP_USER}>`,
            to: email,
            subject: 'Confirme seu e-mail - Frotex',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">Bem-vindo ao Frotex, ${fullName}!</h2>
                    <p>Ficamos felizes em ter você conosco. Para começar a gerenciar sua locadora, precisamos apenas que você confirme seu e-mail.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${verificationUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Confirmar E-mail
                        </a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
                    <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">Você recebeu este e-mail porque se cadastrou no Frotex. Se não foi você, pode ignorar esta mensagem.</p>
                </div>
            `,
        });
    } catch (error) {
        logger.error('Error sending verification email:', error);
    }
}

export async function sendPasswordResetEmail(email: string, fullName: string, token: string) {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"Frotex" <${env.SMTP_USER}>`,
            to: email,
            subject: 'Recupere sua senha - Frotex',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">Recuperação de Senha</h2>
                    <p>Olá ${fullName}, recebemos uma solicitação para redefinir a sua senha no Frotex.</p>
                    <p>Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Redefinir Senha
                        </a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
                    <p style="color: #64748b; font-size: 12px; word-break: break-all;">${resetUrl}</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">Se você não solicitou a alteração da senha, pode ignorar este e-mail com segurança. Sua senha não será alterada até que você acesse o link acima.</p>
                </div>
            `,
        });
    } catch (error) {
        logger.error('Error sending password reset email:', error);
    }
}
