// src/documents/infrastructure/http/middleware/auth.middleware.ts
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// Interface para el payload del JWT
interface JwtPayload {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Extender el tipo Request para incluir user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 1. Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Header Authorization requerido');
      }

      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token debe comenzar con Bearer');
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      if (!token) {
        throw new UnauthorizedException('Token no proporcionado');
      }

      // 2. Verificar y decodificar el JWT con tipado seguro
      const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload; // ✅ Tipado seguro

      // 3. Extraer información del usuario del payload JWT
      const userId = decoded.sub || decoded.userId || decoded.id;
      if (!userId) {
        throw new UnauthorizedException(
          'Token no contiene información de usuario válida',
        );
      }

      req.user = {
        id: userId, // ✅ Ya no hay error de ESLint
        email: decoded.email,
        role: decoded.role,
      };

      console.log('Usuario autenticado:', req.user.id);
      next();
    } catch (error) {
      // Manejo específico de errores JWT
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Token JWT inválido');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token JWT expirado');
      }

      if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedException('Token JWT aún no es válido');
      }

      // Otros errores de autenticación
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Error inesperado
      console.error('Error inesperado en AuthMiddleware:', error);
      throw new UnauthorizedException('Error de autenticación');
    }
  }
}
