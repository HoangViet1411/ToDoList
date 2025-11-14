import type { Request, Response, NextFunction } from 'express';

/**
 * Core permission middleware - check if user has any of the allowed roles
 * @param allowedRoles - Array of role names (case-insensitive)
 * @returns Middleware function
 */
export function requirePermission(
    allowedRoles: string[]
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        const userRoles = req.user.roles || [];
        
        // Debug logging
        console.log(`[requirePermission] User roles:`, userRoles);
        console.log(`[requirePermission] User ID:`, req.user.userId);
        console.log(`[requirePermission] DB User ID:`, req.user.dbUserId);
        console.log(`[requirePermission] Allowed roles:`, allowedRoles);
        
        // Check case-insensitive for any of the allowed roles
        const hasPermission = userRoles.some(userRole => 
            allowedRoles.some(allowedRole => 
                userRole.toLowerCase() === allowedRole.toLowerCase()
            )
        );
        
        if (!hasPermission) {
            console.log(`[requirePermission] Access denied - User does not have required role(s)`);
            res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to check if user is admin
 * Convenience wrapper around requirePermission(['admin'])
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const adminMiddleware = requirePermission(['admin']);
    adminMiddleware(req, res, next);
}

/**
 * Middleware to check if user has specific role(s)
 * @param roles - Array of role names (case-insensitive)
 * @returns Middleware function
 * 
 * @example
 * // Require 'manager' role
 * router.post('/', authenticateToken, requireRole(['manager']), ...);
 * 
 * // Require either 'admin' or 'manager' role
 * router.post('/', authenticateToken, requireRole(['admin', 'manager']), ...);
 */
export function requireRole(roles: string[]) {
    return requirePermission(roles);
}

/**
 * Middleware to check if user has ALL of the specified roles
 * @param roles - Array of role names (case-insensitive)
 * @returns Middleware function
 * 
 * @example
 * // Require both 'admin' AND 'supervisor' roles
 * router.post('/', authenticateToken, requireAllRoles(['admin', 'supervisor']), ...);
 */
export function requireAllRoles(roles: string[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        const userRoles = req.user.roles || [];
        const normalizedUserRoles = userRoles.map(r => r.toLowerCase());
        const normalizedRequiredRoles = roles.map(r => r.toLowerCase());
        
        // Debug logging
        console.log(`[requireAllRoles] User roles:`, userRoles);
        console.log(`[requireAllRoles] Required roles:`, roles);
        
        // Check if user has ALL required roles
        const hasAllRoles = normalizedRequiredRoles.every(requiredRole =>
            normalizedUserRoles.includes(requiredRole)
        );
        
        if (!hasAllRoles) {
            console.log(`[requireAllRoles] Access denied - User missing required roles. Has: ${userRoles.join(', ')}, Required: ${roles.join(', ')}`);
            res.status(403).json({
                success: false,
                message: `Access denied. Required all roles: ${roles.join(', ')}`,
            });
            return;
        }

        next();
    };
}

