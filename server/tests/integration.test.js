const request = require('supertest');
const app = require('../server');

describe('Health Check Endpoints', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('checks');
        });

        it('should include all required health checks', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            const checks = response.body.checks;
            expect(checks).toHaveProperty('database');
            expect(checks).toHaveProperty('memory');
            expect(checks).toHaveProperty('disk');
            expect(checks).toHaveProperty('dependencies');
        });
    });

    describe('GET /ready', () => {
        it('should return readiness status', async () => {
            const response = await request(app)
                .get('/ready')
                .expect(200);

            expect(response.body).toHaveProperty('ready');
            expect(response.body).toHaveProperty('checks');
        });
    });

    describe('GET /live', () => {
        it('should return liveness status', async () => {
            const response = await request(app)
                .get('/live')
                .expect(200);

            expect(response.body).toHaveProperty('alive');
            expect(response.body).toHaveProperty('timestamp');
        });
    });
});

describe('Security Headers', () => {
    describe('GET /api/characters', () => {
        it('should include security headers', async () => {
            const response = await request(app)
                .get('/api/characters')
                .expect(200);

            expect(response.headers).toHaveProperty('x-frame-options');
            expect(response.headers).toHaveProperty('x-content-type-options');
            expect(response.headers).toHaveProperty('x-xss-protection');
        });
    });
});

describe('Rate Limiting', () => {
    describe('Character submission endpoint', () => {
        it('should allow requests within rate limit', async () => {
            const characterData = global.testUtils.createTestCharacter();

            // Make multiple requests within rate limit
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/api/characters')
                    .send(characterData)
                    .expect(201);
            }
        });
    });
});

describe('Error Handling', () => {
    describe('Invalid endpoints', () => {
        it('should return 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Invalid methods', () => {
        it('should return 405 for unsupported methods', async () => {
            await request(app)
                .patch('/api/characters')
                .expect(405);
        });
    });
});

describe('API Documentation', () => {
    describe('GET /api-docs', () => {
        it('should serve Swagger UI', async () => {
            const response = await request(app)
                .get('/api-docs')
                .expect(200);

            expect(response.text).toContain('swagger-ui');
        });
    });

    describe('GET /api-docs.json', () => {
        it('should serve OpenAPI specification', async () => {
            const response = await request(app)
                .get('/api-docs.json')
                .expect(200);

            expect(response.body).toHaveProperty('openapi');
            expect(response.body).toHaveProperty('info');
            expect(response.body).toHaveProperty('paths');
        });
    });
});
