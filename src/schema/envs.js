const obey = require('obey')

const model = obey.model({
    environments: {
        type: 'array',
        required: true,
        values: {
            type: 'object',
            required: true,
            keys: {
                name: { type: 'string', required: true },
                accountId: { type: 'string', required: true },
                region: { type: 'string', required: true },
                roles: {
                    type: 'array',
                    required: true,
                    values: {
                        type: 'string',
                        required: true,
                    },
                },
            },
        },
    },
})

module.exports = model
