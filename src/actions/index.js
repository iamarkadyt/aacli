const { auth } = require('./auth')
const { web } = require('./web')
const { config } = require('./config')
const { crypto } = require('./crypto')
const { reset } = require('./reset')
const { unauth } = require('./unauth')

module.exports = { auth, web, config, crypto, reset, unauth }
