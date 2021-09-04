const { Validator } = require('jsonschema')

const environments = {
    type: 'object',
    required: ['environments'],
    properties: {
        environments: {
            type: 'array',
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
    const { errors, valid } = new Validator().validate(input, schema, ...rest)
    if (!valid) {
        const error = new Error(`Property ${errors[0].property.split('.').slice(1).join('.')} ${errors[0].message}`)
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
