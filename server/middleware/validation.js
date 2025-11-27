const Joi = require('joi');

// Character validation schema
const characterSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .pattern(/^[a-zA-Z0-9\s\-'\.]+$/)
        .messages({
            'string.empty': 'Character name is required',
            'string.min': 'Character name must be at least 2 characters long',
            'string.max': 'Character name cannot exceed 100 characters',
            'string.pattern.base': 'Character name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods'
        }),
    
    apparentAge: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Apparent age is required',
            'string.max': 'Apparent age cannot exceed 50 characters'
        }),
    
    actualAge: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .allow('')
        .messages({
            'string.max': 'Actual age cannot exceed 50 characters'
        }),
    
    classification: Joi.string()
        .valid('Vampire', 'Werewolf', 'Human', 'Ghost', 'Wizard', 'Fairy', 'Other')
        .required()
        .messages({
            'any.only': 'Classification must be one of: Vampire, Werewolf, Human, Ghost, Wizard, Fairy, Other'
        }),
    
    playbook: Joi.string()
        .valid('Mortal', 'Ageless', 'Unsated', 'Wild', 'Mage')
        .required()
        .messages({
            'any.only': 'Playbook must be one of: Mortal, Ageless, Unsated, Wild, Mage'
        }),
    
    subtype: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Subtype is required',
            'string.max': 'Subtype cannot exceed 50 characters'
        }),
    
    bio: Joi.string()
        .trim()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.empty': 'Character bio is required',
            'string.min': 'Character bio must be at least 10 characters long',
            'string.max': 'Character bio cannot exceed 2000 characters'
        }),
    
    humanHeight: Joi.string()
        .trim()
        .max(20)
        .allow('')
        .messages({
            'string.max': 'Height cannot exceed 20 characters'
        }),
    
    humanWeight: Joi.string()
        .trim()
        .max(20)
        .allow('')
        .messages({
            'string.max': 'Weight cannot exceed 20 characters'
        }),
    
    monsterHeight: Joi.string()
        .trim()
        .max(20)
        .allow('')
        .messages({
            'string.max': 'Monster height cannot exceed 20 characters'
        }),
    
    monsterWeight: Joi.string()
        .trim()
        .max(20)
        .allow('')
        .messages({
            'string.max': 'Monster weight cannot exceed 20 characters'
        }),
    
    humanPhoto: Joi.string()
        .allow('')
        .messages({
            'string.base': 'Human photo must be a valid base64 string'
        }),
    
    monsterPhoto: Joi.string()
        .allow('')
        .messages({
            'string.base': 'Monster photo must be a valid base64 string'
        }),
    
    darkestSelf: Joi.string()
        .trim()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.empty': 'Darkest self description is required',
            'string.min': 'Darkest self must be at least 10 characters long',
            'string.max': 'Darkest self cannot exceed 1000 characters'
        }),
    
    fatePoints: Joi.string()
        .pattern(/^[1-5]$/)
        .default('1')
        .messages({
            'string.pattern.base': 'Fate points must be a number between 1 and 5'
        }),
    
    physicalStress: Joi.string()
        .pattern(/^[0-4]$/)
        .default('2')
        .messages({
            'string.pattern.base': 'Physical stress must be a number between 0 and 4'
        }),
    
    mentalStress: Joi.string()
        .pattern(/^[0-4]$/)
        .default('2')
        .messages({
            'string.pattern.base': 'Mental stress must be a number between 0 and 4'
        }),
    
    skills: Joi.array()
        .items(
            Joi.object({
                name: Joi.string()
                    .trim()
                    .min(1)
                    .max(50)
                    .required()
                    .messages({
                        'string.empty': 'Skill name is required',
                        'string.max': 'Skill name cannot exceed 50 characters'
                    }),
                level: Joi.number()
                    .integer()
                    .min(1)
                    .max(4)
                    .required()
                    .messages({
                        'number.base': 'Skill level must be a number',
                        'number.integer': 'Skill level must be an integer',
                        'number.min': 'Skill level must be at least 1',
                        'number.max': 'Skill level cannot exceed 4'
                    })
            })
        )
        .min(0)
        .max(20)
        .messages({
            'array.max': 'Cannot have more than 20 skills'
        }),
    
    moves: Joi.array()
        .items(
            Joi.object({
                name: Joi.string()
                    .trim()
                    .min(1)
                    .max(100)
                    .required()
                    .messages({
                        'string.empty': 'Move name is required',
                        'string.max': 'Move name cannot exceed 100 characters'
                    }),
                source: Joi.string()
                    .trim()
                    .min(1)
                    .max(100)
                    .required()
                    .messages({
                        'string.empty': 'Move source is required',
                        'string.max': 'Move source cannot exceed 100 characters'
                    }),
                description: Joi.string()
                    .trim()
                    .min(1)
                    .max(500)
                    .required()
                    .messages({
                        'string.empty': 'Move description is required',
                        'string.max': 'Move description cannot exceed 500 characters'
                    })
            })
        )
        .min(0)
        .max(30)
        .messages({
            'array.max': 'Cannot have more than 30 moves'
        }),
    
    submittedBy: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .default('anonymous')
        .messages({
            'string.max': 'Submitted by name cannot exceed 100 characters'
        }),
    
    editPassword: Joi.string()
        .allow('')
        .max(100)
        .messages({
            'string.max': 'Edit password cannot exceed 100 characters'
        })
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join('; ');
            return res.status(400).json({
                error: 'Validation failed',
                details: errorMessage,
                fields: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }
        
        req[property] = value;
        next();
    };
};

module.exports = {
    characterSchema,
    validate
};
