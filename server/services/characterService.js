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
}

module.exports = CharacterService;
