const fs = require('fs')
const { globalConfig } = require('../config')
const { Utils } = require('../helpers')

async function reset() {
    if (!fs.existsSync(globalConfig.cliDir)) {
        console.log('There are no configuration files to delete'.yellow)
        return
    }

    const { hasConfirmed } = await Utils.prompts({
        type: 'toggle',
        message: 'Are you sure? All configuration data will be lost',
        name: 'hasConfirmed',
        active: 'yes',
        inactive: 'no',
        initial: false,
    })

    if (hasConfirmed) {
        fs.unlinkSync(globalConfig.cliDir)
        console.log('CLI configuration files were deleted'.green)
    }
}

module.exports = { reset }
