const fs = require('fs')
const { globalConfig } = require('../config')
const { Utils, ConfUtils } = require('../helpers')

async function unauth() {
    const { hasConfirmed } = await Utils.prompts({
        type: 'toggle',
        message: "Are you sure? You'll have to re-authenticate to continue using AWS",
        name: 'hasConfirmed',
        active: 'yes',
        inactive: 'no',
        initial: false,
    })

    if (hasConfirmed) {
        if (Utils.getFeatureFlag('INSECURE_USE_AWS_CREDENTIALS_FILE').value) {
            if (fs.existsSync(globalConfig.awsCredPath)) {
                fs.unlinkSync(globalConfig.awsCredPath)
            }
        }
        const [config, passphrase] = await ConfUtils.loadCliConfig()
        config.sessions = []
        await ConfUtils.saveCliConfig(config, passphrase)
        console.log('All temporary AWS credentials were erased from disk'.green)
    }
}

module.exports = { unauth }
