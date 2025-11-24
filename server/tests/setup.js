// Jest test setup file
const mongoose = require('mongoose');

// Mock Redis for testing
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn(),
        on: jest.fn(),
        quit: jest.fn(),
        get: jest.fn(),
        setEx: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
        keys: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn()
    }))
}));

// Mock Redis rate limiting for testing
jest.mock('rate-limit-redis', () => ({
    RedisStore: jest.fn()
}));

// Mock ioredis for testing
jest.mock('ioredis', () => ({
    Redis: jest.fn(() => ({
        connect: jest.fn(),
        on: jest.fn(),
        quit: jest.fn(),
        get: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
        keys: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn()
    }))
}));

// Test database setup
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0'; // Let OS choose random port
    process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/darkcity_test';
    
    // Connect to test database
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to test database');
    } catch (error) {
        console.error('Failed to connect to test database:', error);
    }
});

afterAll(async () => {
    // Clean up database connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('Test database connection closed');
    }
});

// Clear database before each test
beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
});

// Global test utilities
global.testUtils = {
    // Create test character data
    createTestCharacter: (overrides = {}) => ({
        name: 'Test Character',
        apparentAge: '25',
        actualAge: '25',
        classification: 'Human',
        playbook: 'Mortal',
        subtype: 'Professional',
        bio: 'A test character for unit testing',
        darkestSelf: 'Test darkest self description',
        submittedBy: 'test-user-123',
        status: 'pending',
        skills: [
            { name: 'Investigation', level: 2 },
            { name: 'Combat', level: 1 }
        ],
        moves: [
            {
                name: 'Professional Move',
                source: 'Mortal',
                description: 'A test move description'
            }
        ],
        equipment: ['Test Equipment'],
        ...overrides
    }),
    
    // Create test user data
    createTestUser: (overrides = {}) => ({
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        ...overrides
    }),
    
    // Wait for async operations
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Generate random strings
    randomString: (length = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};

// Mock console methods in tests to reduce noise
const originalConsole = global.console;

beforeEach(() => {
    global.console = {
        ...originalConsole,
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn()
    };
});

afterEach(() => {
    global.console = originalConsole;
});

// Set default timeout for async operations
jest.setTimeout(10000);
