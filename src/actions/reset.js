const fs = require('fs')
const { globalConfig } = require('../config')
const { Utils } = require('../helpers')

async function reset() {
    const { hasConfirmed } = await Utils.prompts({
        type: 'toggle',
        message: 'Are you sure? All configuration data will be lost',
        name: 'hasConfirmed',
        active: 'yes',
        inactive: 'no',
        initial: false,
    })

    if (hasConfirmed) {
        if (fs.existsSync(globalConfig.cliConfigPath)) {
            fs.unlinkSync(globalConfig.cliConfigPath)
        }
        if (fs.existsSync(globalConfig.cliInputFiles.json)) {
            fs.unlinkSync(globalConfig.cliInputFiles.json)
        }
        console.log('CLI configuration files were deleted'.green)
    }
}

module.exports = { reset }
