const { ConfUtils, Utils } = require('../helpers')

async function list() {
    const [config] = await ConfUtils.loadCliConfig()
    const sessions = Utils.lodashGet(config, 'sessions', [])
    console.log('Sessions in your encrypted store:'.yellow)
    sessions.forEach((s) => console.log(`${s.name}`.cyan, `(${Utils.timeToExpiry(s.expiry)})`))
}

module.exports = { list }
