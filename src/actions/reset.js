const fs = require('fs')
const { globalConfig } = require('../config')
const { Utils } = require('../helpers')

async function reset() {
    if (!fs.existsSync(globalConfig.cliConfigPath)) {
        console.log('There is no config to delete. Maybe create one first via "config" command?'.yellow)
        return
    }

    const { hasConfirmed } = await Utils.prompts({
        type: 'toggle',
        message: 'Are you sure? This is irreversible. All configuration data will be lost!',
        name: 'hasConfirmed',
        active: 'yes',
        inactive: 'no',
        initial: false,
    })

    if (hasConfirmed) {
        fs.unlinkSync(globalConfig.cliDir)
        console.log('CLI configuration was reset.'.green)
    }
}

module.exports = { reset }
