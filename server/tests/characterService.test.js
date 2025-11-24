const CharacterService = require('../services/characterService');
const Character = require('../models/Character');

describe('CharacterService', () => {
    describe('getCharacters', () => {
        it('should return paginated characters', async () => {
            // Create test data
            await Character.create([
                global.testUtils.createTestCharacter({ name: 'Character 1', status: 'approved' }),
                global.testUtils.createTestCharacter({ name: 'Character 2', status: 'approved' }),
                global.testUtils.createTestCharacter({ name: 'Character 3', status: 'approved' })
            ]);

            const result = await CharacterService.getCharacters({
                page: 1,
                limit: 2
            });

            expect(result.characters).toHaveLength(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(2);
            expect(result.pagination.total).toBe(3);
            expect(result.pagination.pages).toBe(2);
        });

        it('should filter characters by status', async () => {
            await Character.create([
                global.testUtils.createTestCharacter({ status: 'approved' }),
                global.testUtils.createTestCharacter({ status: 'pending' }),
                global.testUtils.createTestCharacter({ status: 'rejected' })
            ]);

            const result = await CharacterService.getCharacters({
                status: 'approved'
            });

            expect(result.characters.every(char => char.status === 'approved')).toBe(true);
        });

        it('should sort results', async () => {
            const now = new Date();
            await Character.create([
                global.testUtils.createTestCharacter({ 
                    name: 'Old Character',
                    status: 'approved',
                    submittedAt: new Date(now.getTime() - 10000)
                }),
                global.testUtils.createTestCharacter({ 
                    name: 'New Character',
                    status: 'approved',
                    submittedAt: now
                })
            ]);

            const result = await CharacterService.getCharacters({
                sortBy: 'submittedAt',
                sortOrder: -1
            });

            expect(result.characters[0].name).toBe('New Character');
            expect(result.characters[1].name).toBe('Old Character');
        });
    });

    describe('createCharacter', () => {
        it('should create a new character', async () => {
            const characterData = global.testUtils.createTestCharacter();
            const userId = 'test-user-123';

            const result = await CharacterService.createCharacter(characterData, userId);

            expect(result).toHaveProperty('name', characterData.name);
            expect(result).toHaveProperty('status', 'pending');
            expect(result).toHaveProperty('submittedBy', userId);
            expect(result).toHaveProperty('submittedAt');
        });

        it('should handle validation errors', async () => {
            const invalidData = {
                name: '',
                playbook: '',
                classification: ''
            };

            await expect(CharacterService.createCharacter(invalidData))
                .rejects.toThrow();
        });
    });

    describe('getStatistics', () => {
        it('should return character statistics', async () => {
            await Character.create([
                global.testUtils.createTestCharacter({ status: 'approved' }),
                global.testUtils.createTestCharacter({ status: 'approved' }),
                global.testUtils.createTestCharacter({ status: 'pending' }),
                global.testUtils.createTestCharacter({ status: 'rejected' })
            ]);

            const stats = await CharacterService.getStatistics();

            expect(stats.byStatus).toHaveProperty('approved', 2);
            expect(stats.byStatus).toHaveProperty('pending', 1);
            expect(stats.byStatus).toHaveProperty('rejected', 1);
            expect(stats.total).toBe(4);
            expect(Array.isArray(stats.byClassification)).toBe(true);
            expect(Array.isArray(stats.byPlaybook)).toBe(true);
        });

        it('should return empty stats for no characters', async () => {
            const stats = await CharacterService.getStatistics();

            expect(stats.total).toBe(0);
            expect(stats.byStatus).toEqual({});
            expect(stats.byClassification).toEqual([]);
            expect(stats.byPlaybook).toEqual([]);
        });
    });

    describe('searchCharacters', () => {
        it('should search characters by text', async () => {
            await Character.create([
                global.testUtils.createTestCharacter({ 
                    name: 'John Doe',
                    bio: 'A detective in the city',
                    status: 'approved'
                }),
                global.testUtils.createTestCharacter({ 
                    name: 'Jane Smith',
                    bio: 'A journalist investigating crimes',
                    classification: 'Fairy',
                    status: 'approved'
                })
            ]);

            const result = await CharacterService.searchCharacters({
                query: 'detective'
            });

            expect(result.characters).toHaveLength(1);
            expect(result.characters[0].name).toBe('John Doe');
        });

        it('should filter search results', async () => {
            await Character.create([
                global.testUtils.createTestCharacter({ 
                    name: 'John Doe',
                    classification: 'Human',
                    status: 'approved'
                }),
                global.testUtils.createTestCharacter({ 
                    name: 'Jane Smith',
                    classification: 'Fairy',
                    status: 'approved'
                })
            ]);

            const result = await CharacterService.searchCharacters({
                filters: { classification: 'Human' }
            });

            expect(result.characters).toHaveLength(1);
            expect(result.characters[0].classification).toBe('Human');
        });
    });
});
