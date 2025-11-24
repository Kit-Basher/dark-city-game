const request = require('supertest');
const app = require('../server');
const Character = require('../models/Character');

describe('Character API Endpoints', () => {
    describe('GET /api/characters', () => {
        it('should return approved characters', async () => {
            // Create test character
            const testCharacter = await Character.create({
                ...global.testUtils.createTestCharacter(),
                status: 'approved'
            });

            const response = await request(app)
                .get('/api/characters')
                .expect(200);

            expect(response.body).toHaveProperty('characters');
            expect(Array.isArray(response.body.characters)).toBe(true);
            expect(response.body.characters.length).toBeGreaterThan(0);
            
            const character = response.body.characters[0];
            expect(character).toHaveProperty('name');
            expect(character).toHaveProperty('status', 'approved');
            expect(character).not.toHaveProperty('__v');
        });

        it('should paginate results', async () => {
            // Create multiple test characters
            await Character.create([
                global.testUtils.createTestCharacter({ name: 'Character 1' }),
                global.testUtils.createTestCharacter({ name: 'Character 2' }),
                global.testUtils.createTestCharacter({ name: 'Character 3' })
            ]);

            const response = await request(app)
                .get('/api/characters?page=1&limit=2')
                .expect(200);

            expect(response.body.characters).toHaveLength(2);
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 2);
            expect(response.body.pagination).toHaveProperty('total', 3);
            expect(response.body.pagination).toHaveProperty('pages', 2);
        });

        it('should filter by classification', async () => {
            await Character.create([
                global.testUtils.createTestCharacter({ classification: 'Human' }),
                global.testUtils.createTestCharacter({ classification: 'Fey' })
            ]);

            const response = await request(app)
                .get('/api/characters?classification=Human')
                .expect(200);

            expect(response.body.characters.every(char => char.classification === 'Human')).toBe(true);
        });
    });

    describe('POST /api/characters', () => {
        it('should create a new character', async () => {
            const characterData = global.testUtils.createTestCharacter();

            const response = await request(app)
                .post('/api/characters')
                .send(characterData)
                .expect(201);

            expect(response.body).toHaveProperty('name', characterData.name);
            expect(response.body).toHaveProperty('status', 'pending');
            expect(response.body).toHaveProperty('submittedAt');
        });

        it('should validate required fields', async () => {
            const invalidData = {
                name: '',
                playbook: '',
                classification: '',
                bio: ''
            };

            const response = await request(app)
                .post('/api/characters')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should sanitize input to prevent XSS', async () => {
            const maliciousData = global.testUtils.createTestCharacter({
                name: '<script>alert("xss")</script>',
                bio: '<img src="x" onerror="alert(\'xss\')">'
            });

            const response = await request(app)
                .post('/api/characters')
                .send(maliciousData)
                .expect(201);

            expect(response.body.name).not.toContain('<script>');
            expect(response.body.bio).not.toContain('<img');
        });
    });

    describe('GET /api/characters/:id', () => {
        it('should return a specific character', async () => {
            const testCharacter = await Character.create(
                global.testUtils.createTestCharacter()
            );

            const response = await request(app)
                .get(`/api/characters/${testCharacter._id}`)
                .expect(200);

            expect(response.body).toHaveProperty('name', testCharacter.name);
            expect(response.body).toHaveProperty('_id', testCharacter._id.toString());
        });

        it('should return 404 for non-existent character', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .get(`/api/characters/${fakeId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });
});
