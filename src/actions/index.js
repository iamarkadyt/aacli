const { login } = require('./login')
const { run } = require('./run')
const { web } = require('./web')
const { config } = require('./config')
const { crypto } = require('./crypto')
const { reset } = require('./reset')
const { unauth } = require('./unauth')

module.exports = { login, run, web, config, crypto, reset, unauth }
