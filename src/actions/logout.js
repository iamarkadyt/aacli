const { Utils, ConfUtils } = require('../helpers')

async function logout() {
    const { hasConfirmed } = await Utils.prompts({
        type: 'toggle',
        message: "Are you sure? You'll have to re-authenticate to continue using AWS",
        name: 'hasConfirmed',
        active: 'yes',
        inactive: 'no',
        initial: false,
    })

    if (hasConfirmed) {
        const [config, passphrase] = await ConfUtils.loadCliConfig()
        if (Object.keys(config).length) {
            config.sessions = []
            await ConfUtils.saveCliConfig(config, passphrase)
        }
        console.log('All temporary AWS credentials were erased from disk'.green)
    }
}

module.exports = { logout }
