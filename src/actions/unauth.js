const fs = require('fs')
const { globalConfig } = require('../config')
const { Utils } = require('../helpers')

async function unauth() {
    if (!fs.existsSync(globalConfig.awsCredPath)) {
        console.log('There are no AWS credentials on disk to delete.'.yellow)
        return
    }

    const { hasConfirmed } = await Utils.prompts({
        type: 'toggle',
        message: "Are you sure? You'll have to re-authenticate to continue using AWS.",
        name: 'hasConfirmed',
        active: 'yes',
        inactive: 'no',
        initial: false,
    })

    if (hasConfirmed) {
        fs.unlinkSync(globalConfig.awsCredPath)
        fs.unlinkSync(globalConfig.sessionConfigPath)
        console.log('AWS credentials were erased from disk.'.green)
    }
}

module.exports = { unauth }
