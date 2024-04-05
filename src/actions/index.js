const { login } = require('./login')
const { run } = require('./run')
const { web } = require('./web')
const { config } = require('./config')
const { pwd } = require('./pwd')
const { reset } = require('./reset')
const { logout } = require('./logout')
const { list } = require('./list')

module.exports = { login, run, web, config, pwd, reset, logout, list }
