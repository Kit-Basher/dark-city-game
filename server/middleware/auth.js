const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT token generation and verification
class AuthManager {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
        this.jwtExpiration = process.env.JWT_EXPIRATION || '24h';
        this.refreshTokenExpiration = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
    }

    // Generate JWT tokens
    generateTokens(payload) {
        const tokenPayload = {
            id: payload.id,
            role: payload.role || 'user',
            permissions: payload.permissions || []
        };

        const accessToken = jwt.sign(tokenPayload, this.jwtSecret, {
            expiresIn: this.jwtExpiration,
            issuer: 'dark-city-rpg',
            audience: 'dark-city-users'
        });

        const refreshToken = jwt.sign(
            { id: payload.id, type: 'refresh' },
            this.jwtSecret,
            { expiresIn: this.refreshTokenExpiration }
        );

        return { accessToken, refreshToken };
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'dark-city-rpg',
                audience: 'dark-city-users'
            });
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Verify refresh token
    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }
            return decoded;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    // Hash password
    async hashPassword(password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verify password
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Middleware to authenticate requests
    authenticate() {
        return (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        message: 'No token provided or invalid format'
                    });
                }

                const token = authHeader.substring(7); // Remove 'Bearer ' prefix
                const decoded = this.verifyToken(token);
                
                req.user = decoded;
                next();
            } catch (error) {
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: error.message
                });
            }
        };
    }

    // Middleware to authorize based on role
    authorize(requiredRoles = []) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'User not authenticated'
                });
            }

            const userRole = req.user.role;
            const hasPermission = requiredRoles.includes(userRole) || 
                                (userRole === 'admin' && requiredRoles.includes('moderator'));

            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: `Required role: ${requiredRoles.join(' or ')}`
                });
            }

            next();
        };
    }

    // Middleware to authorize based on permissions
    requirePermission(permission) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'User not authenticated'
                });
            }

            const hasPermission = req.user.permissions && 
                                req.user.permissions.includes(permission);

            if (!hasPermission && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'Access denied',
                    message: `Required permission: ${permission}`
                });
            }

            next();
        };
    }
}

// Simple API key authentication (for backward compatibility)
class ApiKeyAuth {
    constructor() {
        this.apiKey = process.env.API_KEY || 'dark-city-dev-key';
    }

    // Middleware for API key authentication
    authenticate() {
        return (req, res, next) => {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'API key required',
                    message: 'No API key provided or invalid format'
                });
            }

            const providedKey = authHeader.substring(7);
            
            if (providedKey !== this.apiKey) {
                return res.status(401).json({
                    error: 'Invalid API key',
                    message: 'The provided API key is incorrect'
                });
            }

            // Add user context for API key authentication
            req.user = {
                id: 'api-key-user',
                role: 'moderator',
                permissions: ['read', 'write', 'moderate'],
                authMethod: 'api-key'
            };

            next();
        };
    }
}

module.exports = {
    AuthManager,
    ApiKeyAuth
};
