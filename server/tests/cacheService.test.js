const cacheService = require('../services/cacheService');

describe('CacheService', () => {
    beforeEach(() => {
        // Reset cache service state
        jest.clearAllMocks();
    });

    describe('generateQueryHash', () => {
        it('should generate consistent hash for same parameters', () => {
            const params = { page: 1, limit: 10, status: 'approved' };
            const hash1 = cacheService.constructor.generateQueryHash(params);
            const hash2 = cacheService.constructor.generateQueryHash(params);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hash for different parameters', () => {
            const params1 = { page: 1, limit: 10 };
            const params2 = { page: 2, limit: 10 };
            const hash1 = cacheService.constructor.generateQueryHash(params1);
            const hash2 = cacheService.constructor.generateQueryHash(params2);

            expect(hash1).not.toBe(hash2);
        });

        it('should handle parameter order consistently', () => {
            const params1 = { limit: 10, page: 1 };
            const params2 = { page: 1, limit: 10 };
            const hash1 = cacheService.constructor.generateQueryHash(params1);
            const hash2 = cacheService.constructor.generateQueryHash(params2);

            expect(hash1).toBe(hash2);
        });
    });

    describe('generateSearchHash', () => {
        it('should generate hash for search parameters', () => {
            const query = 'test search';
            const filters = { classification: 'Human', playbook: 'Professional' };
            const hash = cacheService.constructor.generateSearchHash(query, filters);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });
    });

    describe('cache operations', () => {
        // Mock Redis client methods
        const mockRedisClient = {
            get: jest.fn(),
            setEx: jest.fn(),
            del: jest.fn(),
            exists: jest.fn(),
            keys: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
            quit: jest.fn(),
            connect: jest.fn(),
            on: jest.fn()
        };

        beforeEach(() => {
            // Mock the cache service's Redis client
            cacheService.client = mockRedisClient;
            cacheService.connected = true;
        });

        it('should get cached value', async () => {
            const testKey = 'test:key';
            const testValue = { data: 'test' };
            
            mockRedisClient.get.mockResolvedValue(JSON.stringify(testValue));

            const result = await cacheService.get(testKey);

            expect(mockRedisClient.get).toHaveBeenCalledWith(testKey);
            expect(result).toEqual(testValue);
        });

        it('should return null for non-existent key', async () => {
            const testKey = 'nonexistent:key';
            
            mockRedisClient.get.mockResolvedValue(null);

            const result = await cacheService.get(testKey);

            expect(mockRedisClient.get).toHaveBeenCalledWith(testKey);
            expect(result).toBeNull();
        });

        it('should set cached value with TTL', async () => {
            const testKey = 'test:key';
            const testValue = { data: 'test' };
            const ttl = 3600;
            
            mockRedisClient.setEx.mockResolvedValue('OK');

            const result = await cacheService.set(testKey, testValue, ttl);

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                testKey, 
                ttl, 
                JSON.stringify(testValue)
            );
            expect(result).toBe(true);
        });

        it('should delete cached value', async () => {
            const testKey = 'test:key';
            
            mockRedisClient.del.mockResolvedValue(1);

            const result = await cacheService.del(testKey);

            expect(mockRedisClient.del).toHaveBeenCalledWith(testKey);
            expect(result).toBe(true);
        });

        it('should check if key exists', async () => {
            const testKey = 'test:key';
            
            mockRedisClient.exists.mockResolvedValue(1);

            const result = await cacheService.exists(testKey);

            expect(mockRedisClient.exists).toHaveBeenCalledWith(testKey);
            expect(result).toBe(true);
        });

        it('should handle connection errors gracefully', async () => {
            cacheService.connected = false;

            const result = await cacheService.get('test:key');

            expect(result).toBeNull();
        });
    });

    describe('character-specific methods', () => {
        const mockRedisClient = {
            get: jest.fn(),
            setEx: jest.fn(),
            del: jest.fn(),
            keys: jest.fn()
        };

        beforeEach(() => {
            cacheService.client = mockRedisClient;
            cacheService.connected = true;
        });

        it('should cache character results', async () => {
            const queryHash = 'test_hash';
            const characters = [{ name: 'Test Character' }];
            
            mockRedisClient.get.mockResolvedValue(null);
            mockRedisClient.setEx.mockResolvedValue('OK');

            await cacheService.setCharacters(queryHash, characters);

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                `characters:${queryHash}`,
                1800,
                JSON.stringify(characters)
            );
        });

        it('should get cached character results', async () => {
            const queryHash = 'test_hash';
            const characters = [{ name: 'Test Character' }];
            
            mockRedisClient.get.mockResolvedValue(JSON.stringify(characters));

            const result = await cacheService.getCharacters(queryHash);

            expect(mockRedisClient.get).toHaveBeenCalledWith(`characters:${queryHash}`);
            expect(result).toEqual(characters);
        });

        it('should invalidate character cache', async () => {
            const characterId = 'test_character_id';
            
            mockRedisClient.del.mockResolvedValue(1);
            mockRedisClient.keys.mockResolvedValue(['characters:hash1', 'characters:hash2']);

            await cacheService.invalidateCharacter(characterId);

            expect(mockRedisClient.del).toHaveBeenCalledWith(`character:${characterId}`);
            expect(mockRedisClient.keys).toHaveBeenCalledWith('characters:*');
        });
    });

    describe('rate limiting', () => {
        const mockRedisClient = {
            incr: jest.fn(),
            expire: jest.fn()
        };

        beforeEach(() => {
            cacheService.client = mockRedisClient;
            cacheService.connected = true;
        });

        it('should check rate limit', async () => {
            const identifier = 'test_user';
            const limit = 10;
            const windowMs = 60000;
            
            mockRedisClient.incr.mockResolvedValue(1);
            mockRedisClient.expire.mockResolvedValue(1);

            const result = await cacheService.checkRateLimit(identifier, limit, windowMs);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(9);
            expect(result.current).toBe(1);
        });

        it('should deny when rate limit exceeded', async () => {
            const identifier = 'test_user';
            const limit = 10;
            const windowMs = 60000;
            
            mockRedisClient.incr.mockResolvedValue(11);

            const result = await cacheService.checkRateLimit(identifier, limit, windowMs);

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.current).toBe(11);
        });
    });
});
