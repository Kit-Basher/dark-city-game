const Character = require('../models/Character');
const { structuredLogger } = require('../config/logging');

class CharacterService {
    static async getCharacters(options = {}) {
        const {
            status = 'approved',
            page = 1,
            limit = 12,
            sortBy = 'submittedAt',
            sortOrder = -1,
            classification,
            playbook,
            submittedBy
        } = options;

        const query = {};
        if (status) query.status = status;
        if (classification) query.classification = classification;
        if (playbook) query.playbook = playbook;
        if (submittedBy) query.submittedBy = submittedBy;

        const sort = { [sortBy]: sortOrder };
        const skip = (page - 1) * limit;

        const findStart = Date.now();
        const characters = await Character.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
        const findTime = Date.now() - findStart;

        const countStart = Date.now();
        const total = await Character.countDocuments(query);
        const countTime = Date.now() - countStart;

        structuredLogger.logPerformance('characters_find', findTime, 'ms', { query, sort, skip, limit });
        structuredLogger.logPerformance('characters_count', countTime, 'ms', { query });
        structuredLogger.logPerformance('characters_total', findTime + countTime, 'ms', { total, page, limit });

        return {
            characters,
            pagination: {
                page,
                limit,
                total,
                pages: Math.max(1, Math.ceil(total / limit)),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        };
    }

    static async getApprovedCharacters(options = {}) {
        return this.getCharacters({ ...options, status: 'approved' });
    }

    static async getPendingSubmissions(options = {}) {
        return this.getCharacters({ ...options, status: 'pending' });
    }

    static async getAllSubmissions(options = {}) {
        return this.getCharacters({ ...options, status: null });
    }

    static async createCharacter(characterData) {
        const character = new Character(characterData);
        return character.save();
    }

    static async deleteCharacter(characterId) {
        return Character.findByIdAndDelete(characterId).lean().exec();
    }

    static async getCharacterById(characterId) {
        return Character.findById(characterId).lean().exec();
    }

    static async approveCharacter(characterId, reviewData = {}) {
        const { feedback, reviewedBy, reviewedAt } = reviewData;
        
        const character = await Character.findByIdAndUpdate(
            characterId,
            {
                status: 'approved',
                feedback: feedback || '',
                reviewedBy: reviewedBy || 'moderator',
                reviewedAt: reviewedAt || new Date()
            },
            { new: true }
        ).lean().exec();
        
        return character;
    }

    static async rejectCharacter(characterId, reviewData = {}) {
        const { feedback, reviewedBy, reviewedAt } = reviewData;
        
        if (!feedback) {
            throw new Error('Feedback is required for rejection');
        }
        
        const character = await Character.findByIdAndUpdate(
            characterId,
            {
                status: 'rejected',
                feedback,
                reviewedBy: reviewedBy || 'moderator',
                reviewedAt: reviewedAt || new Date()
            },
            { new: true }
        ).lean().exec();
        
        return character;
    }

    static async updateCharacter(characterId, updateData, editPassword = null) {
        const character = await Character.findById(characterId);
        
        if (!character) {
            throw new Error('Character not found');
        }
        
        // Check edit password if character has one
        if (character.editPassword && character.editPassword !== editPassword) {
            throw new Error('Invalid edit password');
        }
        
        // Don't allow status changes through editing
        const { status, reviewedBy, reviewedAt, feedback, ...allowedUpdates } = updateData;
        
        Object.assign(character, allowedUpdates);
        return character.save();
    }
}

module.exports = CharacterService;
