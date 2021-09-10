const { spawn } = require('child_process')
const { ConfUtils, Utils } = require('../helpers')
const { CLI_NAME } = require('../config')

async function run(argv) {
    const [config, passphrase] = await ConfUtils.loadCliConfig()
    const sessions = Utils.lodashGet(config, 'sessions', [])
    const [command, ...args] = argv

    // make sure command is provided
    if (!command) {
        console.log(`Received no command to run. Nothing to do`.yellow)
        process.exit(0)
    }

    // ditch inactive sessions from CLI config to keep it clean and small
    const activeSessions = sessions.filter((s) => new Date(s.expiry) > Date.now())
    config.sessions = activeSessions
    await ConfUtils.saveCliConfig(config, passphrase)

    if (!activeSessions.length) {
        console.log(`You have no active sessions, please authenticate first through "${CLI_NAME} login" command`.red)
        process.exit(1)
    }

    const { session } = await Utils.prompts({
        type: 'select',
        name: 'session',
        message: 'Choose an active session to use',
        choices: activeSessions.map((sesh) => ({
            title: `${sesh.name} (${Utils.timeToExpiry(sesh.expiry)})`,
            value: sesh,
        })),
    })
    const { key, keyId, sessionToken, region } = session
    const env = {
        ...process.env,
        AWS_ACCESS_KEY_ID: keyId,
        AWS_SECRET_ACCESS_KEY: key,
        AWS_SESSION_TOKEN: sessionToken,
        AWS_DEFAULT_REGION: region,
    }

    spawn(command, args, { stdio: 'inherit', detached: true, shell: true, env })
}

module.exports = { run }
