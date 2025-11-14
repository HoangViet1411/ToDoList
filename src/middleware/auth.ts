import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Extend request type to include user information
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string; // Cognito userId
                email: string;
                dbUserId?: number; // Database user id
                roles?: string[]; // Array of role names
            };
        }
    }
}

export async function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required',
            });
            return;
        }

        // Verify token and get Cognito user info (lấy sub từ token)
        const cognitoUser = await authService.verifyToken(token);
        
        // Find user in database by cognitoUserId and load roles
        // Nếu user chưa có profile trong DB, vẫn cho phép nhưng roles = []
        const userWithRoles = await authService.getUserWithRoles(cognitoUser.userId);
        
        // User có thể chưa có profile trong DB (chưa tạo profile)
        // Vẫn cho phép authenticate, nhưng roles sẽ là empty array
        req.user = {
            userId: cognitoUser.userId, // Cognito sub (user id)
            email: cognitoUser.email,
            ...(userWithRoles?.id && { dbUserId: userWithRoles.id }), // Chỉ set nếu có
            ...(userWithRoles?.roles && { roles: userWithRoles.roles }), // Chỉ set nếu có
        };
        next();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        console.error('Error authenticating token:', error);
        res.status(401).json({
            success: false,
            message,
        });
    }
}