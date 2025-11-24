const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Dark City RPG API',
            version: '1.0.0',
            description: 'API for managing Dark City RPG characters, scenes, and game data',
            contact: {
                name: 'Dark City RPG Support',
                email: 'support@darkcityrpg.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:3000/api',
                description: 'Development server'
            },
            {
                url: 'https://your-production-server.com/api',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                    description: 'API key authentication. Use "Bearer YOUR_API_KEY"'
                },
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token authentication'
                }
            },
            schemas: {
                Character: {
                    type: 'object',
                    required: ['name', 'apparentAge', 'actualAge', 'classification', 'playbook', 'subtype', 'bio', 'darkestSelf'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'MongoDB ObjectId',
                            readOnly: true
                        },
                        name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 100,
                            description: 'Character name',
                            example: 'John Doe'
                        },
                        apparentAge: {
                            type: 'string',
                            maxLength: 50,
                            description: 'How old the character appears',
                            example: '25'
                        },
                        actualAge: {
                            type: 'string',
                            maxLength: 50,
                            description: 'Character\'s actual age',
                            example: '150'
                        },
                        classification: {
                            type: 'string',
                            enum: ['Vampire', 'Werewolf', 'Human', 'Ghost', 'Wizard', 'Fairy', 'Other'],
                            description: 'Character type/classification'
                        },
                        playbook: {
                            type: 'string',
                            enum: ['Mortal', 'Ageless', 'Unsated', 'Wild', 'Mage'],
                            description: 'Character playbook/archetype'
                        },
                        subtype: {
                            type: 'string',
                            maxLength: 50,
                            description: 'Specific subtype within the classification',
                            example: 'Vampire'
                        },
                        bio: {
                            type: 'string',
                            minLength: 10,
                            maxLength: 2000,
                            description: 'Character backstory and description'
                        },
                        humanHeight: {
                            type: 'string',
                            maxLength: 20,
                            description: 'Height in human form'
                        },
                        humanWeight: {
                            type: 'string',
                            maxLength: 20,
                            description: 'Weight in human form'
                        },
                        monsterHeight: {
                            type: 'string',
                            maxLength: 20,
                            description: 'Height in monster form'
                        },
                        monsterWeight: {
                            type: 'string',
                            maxLength: 20,
                            description: 'Weight in monster form'
                        },
                        darkestSelf: {
                            type: 'string',
                            minLength: 10,
                            maxLength: 1000,
                            description: 'Description of character\'s darkest self'
                        },
                        fatePoints: {
                            type: 'string',
                            pattern: '^[1-5]$',
                            default: '1',
                            description: 'Current fate points (1-5)'
                        },
                        physicalStress: {
                            type: 'string',
                            pattern: '^[0-4]$',
                            default: '2',
                            description: 'Physical stress level (0-4)'
                        },
                        mentalStress: {
                            type: 'string',
                            pattern: '^[0-4]$',
                            default: '2',
                            description: 'Mental stress level (0-4)'
                        },
                        skills: {
                            type: 'array',
                            maxItems: 20,
                            items: {
                                $ref: '#/components/schemas/Skill'
                            },
                            description: 'Character skills'
                        },
                        moves: {
                            type: 'array',
                            maxItems: 30,
                            items: {
                                $ref: '#/components/schemas/Move'
                            },
                            description: 'Character moves and abilities'
                        },
                        submittedBy: {
                            type: 'string',
                            maxLength: 100,
                            default: 'anonymous',
                            description: 'Who submitted this character'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'approved', 'rejected'],
                            default: 'pending',
                            readOnly: true,
                            description: 'Approval status'
                        },
                        reviewedBy: {
                            type: 'string',
                            readOnly: true,
                            description: 'Moderator who reviewed this character'
                        },
                        reviewedAt: {
                            type: 'string',
                            format: 'date-time',
                            readOnly: true,
                            description: 'When the character was reviewed'
                        },
                        feedback: {
                            type: 'string',
                            readOnly: true,
                            description: 'Feedback from the moderator'
                        },
                        submittedAt: {
                            type: 'string',
                            format: 'date-time',
                            readOnly: true,
                            description: 'When the character was submitted'
                        }
                    }
                },
                Skill: {
                    type: 'object',
                    required: ['name', 'level'],
                    properties: {
                        name: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 50,
                            description: 'Skill name',
                            example: 'Investigation'
                        },
                        level: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 4,
                            description: 'Skill level (1-4)',
                            example: 2
                        }
                    }
                },
                Move: {
                    type: 'object',
                    required: ['name', 'source', 'description'],
                    properties: {
                        name: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            description: 'Move name',
                            example: 'Unleash the Beast'
                        },
                        source: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            description: 'Where this move comes from',
                            example: 'Wild Playbook'
                        },
                        description: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 500,
                            description: 'Move description and effects'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            description: 'Error message',
                            example: 'Validation failed'
                        },
                        details: {
                            type: 'string',
                            description: 'Detailed error information'
                        },
                        fields: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        description: 'Field name with error'
                                    },
                                    message: {
                                        type: 'string',
                                        description: 'Error message for this field'
                                    }
                                }
                            },
                            description: 'Validation errors by field'
                        }
                    }
                },
                HealthResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'OK'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Current server time'
                        },
                        uptime: {
                            type: 'number',
                            description: 'Server uptime in seconds'
                        },
                        database: {
                            type: 'string',
                            description: 'Database connection status'
                        },
                        memory: {
                            type: 'object',
                            properties: {
                                used: {
                                    type: 'string',
                                    description: 'Memory usage'
                                },
                                total: {
                                    type: 'string',
                                    description: 'Total available memory'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);

module.exports = {
    specs,
    swaggerUi,
    swaggerOptions
};
