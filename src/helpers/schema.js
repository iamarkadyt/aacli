const { Validator } = require('jsonschema')

const environments = {
    type: 'object',
    required: ['environments'],
    properties: {
        environments: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                required: ['name', 'accountId', 'region', 'roles'],
                properties: {
                    name: { type: 'string' },
                    accountId: { type: 'string' },
                    region: { type: 'string' },
                    roles: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'string',
                        },
                    },
                },
            },
        },
    },
}

function validate(input, schema, ...rest) {
    const result = new Validator().validate(input, schema, ...rest)
    if (!result.valid) {
        const error = new Error('Object has a bad structure')
        error.name = 'ValidationError'
        throw error
    }
}

module.exports = {
    validate,
    schemas: {
        environments,
    },
}
