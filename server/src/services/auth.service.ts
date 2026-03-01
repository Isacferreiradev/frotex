import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, tenants } from '../db/schema';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';

export const registerSchema = z.object({
    tenantName: z.string().min(2, 'Nome da locadora obrigatório'),
    documentType: z.enum(['CPF', 'CNPJ']).default('CPF'),
    documentNumber: z.string().min(11, 'Documento inválido'),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
    fullName: z.string().min(2, 'Nome completo obrigatório'),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const requestResetSchema = z.object({
    email: z.string().email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token obrigatório'),
    password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});

export async function register(data: z.infer<typeof registerSchema>) {
    console.log(`[AUTH] Iniciando registro para: ${data.email}`);
    try {
        // Check for duplicate email
        const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email));
        if (existingUser) {
            console.warn(`[AUTH] Email já cadastrado: ${data.email}`);
            throw new AppError(409, 'Este e-mail já está cadastrado');
        }

        // Create tenant
        console.log(`[AUTH] Criando tenant: ${data.tenantName}`);
        const [tenant] = await db.insert(tenants).values({
            name: data.tenantName,
            cnpj: data.documentNumber,
            phoneNumber: data.phoneNumber,
            address: data.address,
        }).returning();

        // Generate verification token
        const verificationToken = uuidv4();

        // Hash password and create owner user
        console.log(`[AUTH] Criando usuário owner: ${data.email}`);
        const passwordHash = await bcrypt.hash(data.password, 12);
        const [user] = await db.insert(users).values({
            tenantId: tenant.id,
            email: data.email,
            passwordHash,
            fullName: data.fullName,
            role: 'owner',
            isVerified: false,
            verificationToken,
        }).returning();

        // Send verification email (optional failure)
        try {
            console.log(`[AUTH] Enviando e-mail de verificação para: ${user.email}`);
            await sendVerificationEmail(user.email, user.fullName, verificationToken);
        } catch (e) {
            console.error('[AUTH-EMAIL-ERROR] Falha ao enviar e-mail, mas registro continuou:', e);
        }

        console.log(`[AUTH] Registro concluído com sucesso: ${user.id}`);
        return { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, tenantId: tenant.id, isVerified: user.isVerified } };
    } catch (error: any) {
        console.error(`[AUTH-CRITICAL] Falha no registro para ${data.email}:`, error);
        throw error;
    }
}

export async function verifyEmail(token: string) {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));

    if (!user) {
        throw new AppError(400, 'Token de verificação inválido ou expirado');
    }

    if (user.isVerified) {
        return { success: true, message: 'E-mail já verificado' };
    }

    await db.update(users)
        .set({ isVerified: true, verificationToken: null })
        .where(eq(users.id, user.id));

    return { success: true, message: 'E-mail verificado com sucesso' };
}

export async function login(data: z.infer<typeof loginSchema>) {
    console.log(`[AUTH] Tentativa de login para: ${data.email}`);
    try {
        const [user] = await db.select().from(users).where(eq(users.email, data.email));

        if (!user) {
            console.warn(`[AUTH] Usuário não encontrado: ${data.email}`);
            throw new AppError(401, 'Credenciais inválidas');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            console.warn(`[AUTH] Senha inválida para: ${data.email}`);
            throw new AppError(401, 'Credenciais inválidas');
        }

        if (!user.isVerified) {
            console.warn(`[AUTH] Usuário não verificado: ${data.email}`);
            throw new AppError(403, 'Por favor, verifique seu e-mail antes de fazer login');
        }

        console.log(`[AUTH] Assinando tokens para: ${user.id}`);
        const accessToken = signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        });

        const refreshToken = signRefreshToken({ userId: user.id, tenantId: user.tenantId });

        console.log(`[AUTH] Atualizando último login...`);
        await db.update(users)
            .set({ lastLoginAt: new Date(), lastActiveAt: new Date() })
            .where(eq(users.id, user.id));

        console.log(`[AUTH] Login bem-sucedido: ${user.id}`);
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                tenantId: user.tenantId,
            },
            accessToken,
            refreshToken,
        };
    } catch (error: any) {
        console.error(`[AUTH-CRITICAL] Falha no login para ${data.email}:`, error);
        throw error;
    }
}

export async function refreshTokens(token: string) {
    try {
        const payload = verifyRefreshToken(token);
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId));

        if (!user) {
            throw new AppError(401, 'Usuário não encontrado');
        }

        const accessToken = signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        });

        const refreshToken = signRefreshToken({ userId: user.id, tenantId: user.tenantId });

        // Update last active
        await db.update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, user.id));

        return { accessToken, refreshToken };
    } catch (err) {
        throw new AppError(401, 'Refresh token inválido');
    }
}

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
});

export async function updatePassword(userId: string, data: z.infer<typeof updatePasswordSchema>) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw new AppError(400, 'Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return { success: true };
}

export async function requestPasswordReset(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // For security, don't reveal if user exists
    if (!user) return { success: true };

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await db.update(users)
        .set({ resetToken, resetTokenExpires })
        .where(eq(users.id, user.id));

    try {
        await sendPasswordResetEmail(user.email, user.fullName, resetToken);
    } catch (e) {
        console.error('Failed to send reset email', e);
    }

    return { success: true };
}

export async function resetPassword(data: z.infer<typeof resetPasswordSchema>) {
    const [user] = await db.select()
        .from(users)
        .where(eq(users.resetToken, data.token));

    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
        throw new AppError(400, 'Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.update(users)
        .set({
            passwordHash,
            resetToken: null,
            resetTokenExpires: null,
            updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

    return { success: true };
}

export async function updateProfile(userId: string, data: any) {
    const [updated] = await db.update(users)
        .set({
            fullName: data.fullName,
            email: data.email,
            avatarUrl: data.avatarUrl,
            hasOnboarded: data.hasOnboarded,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
    return updated;
}
