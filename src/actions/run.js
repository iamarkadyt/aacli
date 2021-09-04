const _ = require('lodash')
const { ConfUtils } = require('../helpers')
const child_process = require('child_process')

async function run(command) {
    const config = await ConfUtils.loadSessionConfig()

    if (!Object.keys(config).length) {
        console.log(`You have no logged in sessions, please authenticate first through "auth" command.`.red)
        process.exit(1)
    }

    const session = _.get(config, 'default', {})
    const { key, keyId, sessionToken, region } = session
    const env = {
        AWS_ACCESS_KEY_ID: keyId,
        AWS_SECRET_ACCESS_KEY: key,
        AWS_SESSION_TOKEN: sessionToken,
        AWS_DEFAULT_REGION: region,
    }

    child_process.spawn(command, { detached: true, stdio: 'ignore', env })
}

module.exports = { run }
