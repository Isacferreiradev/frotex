import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { AppError } from './error.middleware';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError(401, 'Token de autenticação não fornecido'));
    }

    const token = authHeader.slice(7);
    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch {
        next(new AppError(401, 'Token inválido ou expirado'));
    }
}

export function requireOwner(req: Request, _res: Response, next: NextFunction) {
    if (req.user?.role !== 'owner') {
        return next(new AppError(403, 'Acesso restrito a proprietários'));
    }
    next();
}
