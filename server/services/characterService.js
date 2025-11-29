const Character = require('../models/Character');
const { logger, structuredLogger } = require('../config/logging');
const cacheService = require('./cacheService');

class CharacterService {
    // Optimized character retrieval with pagination
    static async getCharacters(options = {}) {
        const {
            status = 'approved',
            page = 1,
            limit = 12,
            sortBy = 'submittedAt',
            sortOrder = -1,
            classification,
            playbook,
            search,
            submittedBy,
            useCache = true
        } = options;

        try {
            // Generate cache key
            const cacheKey = cacheService.constructor.generateQueryHash({
                status, page, limit, sortBy, sortOrder,
                classification, playbook, search, submittedBy
            });

            // Try cache first
            if (useCache && !search) { // Don't cache search results for too long
                const cached = await cacheService.getCharacters(cacheKey);
                if (cached) {
                    structuredLogger.logDatabase('cache_hit', 'characters', { cacheKey });
                    return cached;
                }
            }

            // Build query
            const query = { status };
            
            if (classification) query.classification = classification;
            if (playbook) query.playbook = playbook;
            if (submittedBy) query.submittedBy = submittedBy;
            
            // Add text search if provided
            if (search) {
                query.$text = { $search: search };
            }

            // Build sort options
            const sort = {};
            if (search) {
                // For text search, sort by relevance first, then by date
                sort.score = { $meta: 'textScore' };
                sort[sortBy] = sortOrder;
            } else {
                sort[sortBy] = sortOrder;
            }

            // Execute query with pagination
            const skip = (page - 1) * limit;
            
            const [characters, total] = await Promise.all([
                Character
                    .find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean() // Use lean for better performance
                    .exec(),
                Character.countDocuments(query)
            ]);

            const result = {
                characters,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };

            // Cache the result (shorter TTL for search results)
            if (useCache) {
                const ttl = search ? 300 : 1800; // 5 min for search, 30 min for regular
                await cacheService.setCharacters(cacheKey, result, ttl);
            }

            // Log database operation
            structuredLogger.logDatabase('find', 'characters', {
                query: JSON.stringify(query),
                results: characters.length,
                total,
                page,
                limit,
                cached: false
            });

            return result;
        } catch (error) {
            structuredLogger.logError(error, { operation: 'getCharacters', options });
            throw error;
        }
    }

    // Optimized character submission
    static async createCharacter(characterData, userId) {
        try {
            const character = new Character({
                ...characterData,
                submittedBy: userId || 'anonymous'
            });

            const savedCharacter = await character.save();

            // Invalidate relevant caches
            await cacheService.invalidateCharacter(savedCharacter._id);
            await cacheService.invalidateStatistics();

            // Log the submission
            structuredLogger.logCharacterSubmission(savedCharacter, userId);

            return savedCharacter;
        } catch (error) {
            structuredLogger.logError(error, { 
                operation: 'createCharacter', 
                userId,
                characterName: characterData.name 
            });
            throw error;
        }
    }

    // Optimized character approval/rejection
    static async moderateCharacter(characterId, action, moderatorId, feedback = '') {
        try {
            console.log('🔧 Moderation: Starting', { characterId, action, moderatorId });
            
            const updateData = {
                status: action,
                reviewedBy: moderatorId,
                reviewedAt: new Date(),
                feedback
            };

            console.log('🔧 Moderation: Updating character with data:', updateData);
            const character = await Character.findByIdAndUpdate(
                characterId,
                updateData,
                { new: true, runValidators: true }
            ).lean().exec();

            if (!character) {
                console.log('🔧 Moderation: Character not found');
                throw new Error('Character not found');
            }

            console.log('🔧 Moderation: Character updated successfully:', character.name);

            // Log the moderation action (with error handling)
            try {
                if (action === 'approved') {
                    structuredLogger.logCharacterApproval(character, moderatorId);
                } else {
                    structuredLogger.logBusiness('character_rejected', {
                        characterId: character._id,
                        characterName: character.name,
                        rejectedBy: moderatorId,
                        feedback
                    });
                }
                console.log('🔧 Moderation: Logging completed');
            } catch (logError) {
                console.warn('🔧 Moderation: Logging failed:', logError.message);
                // Don't fail the moderation if logging fails
            }

            console.log('🔧 Moderation: Operation completed successfully');
            return character;
        } catch (error) {
            console.error('🔧 Moderation: Error occurred:', error);
            
            // Log error (with error handling)
            try {
                structuredLogger.logError(error, { 
                    operation: 'moderateCharacter', 
                    characterId, 
                    action, 
                    moderatorId 
                });
            } catch (logError) {
                console.warn('🔧 Moderation: Error logging failed:', logError.message);
            }
            
            throw error;
        }
    }

    // Get character statistics
    static async getStatistics(useCache = true) {
        try {
            // Try cache first
            if (useCache) {
                const cached = await cacheService.getStatistics();
                if (cached) {
                    structuredLogger.logDatabase('cache_hit', 'statistics', {});
                    return cached;
                }
            }

            const pipeline = [
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ];

            const statusStats = await Character.aggregate(pipeline);

            const classificationStats = await Character.aggregate([
                {
                    $group: {
                        _id: '$classification',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            const playbookStats = await Character.aggregate([
                {
                    $group: {
                        _id: '$playbook',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            const recentActivity = await Character.aggregate([
                {
                    $match: {
                        submittedAt: {
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$submittedAt'
                            }
                        },
                        submitted: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            const stats = {
                byStatus: statusStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                byClassification: classificationStats,
                byPlaybook: playbookStats,
                recentActivity,
                total: await Character.countDocuments()
            };

            // Cache the statistics
            if (useCache) {
                await cacheService.setStatistics(stats);
            }

            structuredLogger.logDatabase('aggregate', 'characters', {
                operation: 'statistics',
                resultCount: stats.total,
                cached: false
            });

            return stats;
        } catch (error) {
            structuredLogger.logError(error, { operation: 'getStatistics' });
            throw error;
        }
    }

    // Search characters with advanced filtering
    static async searchCharacters(searchOptions) {
        const {
            query,
            filters = {},
            page = 1,
            limit = 12,
            sortBy = 'submittedAt',
            sortOrder = -1
        } = searchOptions;

        try {
            // Build search query
            const searchQuery = {
                status: 'approved'
            };

            // Add text search
            if (query) {
                searchQuery.$text = { $search: query };
            }

            // Add filters
            Object.keys(filters).forEach(key => {
                if (filters[key] && filters[key].length > 0) {
                    if (Array.isArray(filters[key])) {
                        searchQuery[key] = { $in: filters[key] };
                    } else {
                        searchQuery[key] = filters[key];
                    }
                }
            });

            // Build sort
            const sort = {};
            if (query) {
                sort.score = { $meta: 'textScore' };
            }
            sort[sortBy] = sortOrder;

            // Execute search
            const skip = (page - 1) * limit;
            
            const [characters, total] = await Promise.all([
                Character
                    .find(searchQuery)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    .exec(),
                Character.countDocuments(searchQuery)
            ]);

            return {
                characters,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                },
                searchQuery,
                filters
            };
        } catch (error) {
            structuredLogger.logError(error, { 
                operation: 'searchCharacters', 
                searchOptions 
            });
            throw error;
        }
    }

    // Get character by ID with error handling
    static async getCharacterById(characterId) {
        try {
            const character = await Character.findById(characterId).lean().exec();
            
            if (!character) {
                throw new Error('Character not found');
            }

            return character;
        } catch (error) {
            structuredLogger.logError(error, { 
                operation: 'getCharacterById', 
                characterId 
            });
            throw error;
        }
    }

    // Bulk operations for moderation
    static async bulkModerate(characterIds, action, moderatorId, feedback = '') {
        try {
            const updateData = {
                status: action,
                reviewedBy: moderatorId,
                reviewedAt: new Date(),
                feedback
            };

            const result = await Character.updateMany(
                { _id: { $in: characterIds } },
                updateData
            );

            // Log bulk operation
            structuredLogger.logBusiness('bulk_moderation', {
                action,
                moderatorId,
                characterCount: result.modifiedCount,
                characterIds
            });

            return result;
        } catch (error) {
            structuredLogger.logError(error, { 
                operation: 'bulkModerate', 
                characterIds, 
                action, 
                moderatorId 
            });
            throw error;
        }
    }

    // Convenience methods for specific status queries
    static async getApprovedCharacters(options = {}) {
        return this.getCharacters({ ...options, status: 'approved' });
    }

    static async getAllSubmissions(options = {}) {
        return this.getCharacters({ ...options, status: null }); // Get all statuses
    }

    static async getPendingSubmissions(options = {}) {
        return this.getCharacters({ ...options, status: 'pending' });
    }

    static async approveCharacter(characterId, options = {}) {
        return this.moderateCharacter(characterId, 'approve', options.reviewedBy, options.feedback);
    }

    static async rejectCharacter(characterId, options = {}) {
        return this.moderateCharacter(characterId, 'reject', options.reviewedBy, options.feedback);
    }

    static async deleteCharacter(characterId) {
        try {
            console.log('🗑️ Character Deletion: Starting for ID:', characterId);
            
            const character = await Character.findByIdAndDelete(characterId);
            console.log('🗑️ Character Deletion: Found and deleted character:', character?.name || 'Not found');
            
            if (!character) {
                console.log('🗑️ Character Deletion: Character not found');
                return null;
            }

            // Clear cache (with error handling)
            try {
                await cacheService.clearPattern('characters:*');
                console.log('🗑️ Character Deletion: Cache cleared');
            } catch (cacheError) {
                console.warn('🗑️ Character Deletion: Cache clear failed:', cacheError.message);
                // Don't fail the deletion if cache clear fails
            }
            
            // Log success (with error handling)
            try {
                structuredLogger.logInfo('Character deleted successfully', {
                    characterId,
                    characterName: character.name
                });
            } catch (logError) {
                console.warn('🗑️ Character Deletion: Structured logging failed:', logError.message);
            }

            console.log('🗑️ Character Deletion: Operation completed successfully');
            return character;
        } catch (error) {
            logger.error('Error deleting character:', error);
            structuredLogger.logError(error, { 
                operation: 'deleteCharacter', 
                characterId 
            });
            throw error;
        }
    }
}

module.exports = CharacterService;
