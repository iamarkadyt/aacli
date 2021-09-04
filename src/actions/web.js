const _ = require('lodash')
const open = require('open')
const { AWSUtils, ConfUtils, Utils } = require('../helpers')

/**
 * CLI 'auth' command handler.
 */
async function web() {
    const [cliConfig] = await ConfUtils.loadCliConfig()
    const profiles = _.get(cliConfig, 'profiles', [])

    /* load profile */

    if (!profiles.length) {
        console.log(`CLI configuration has no saved profiles, use "config" command to add one`.red)
        process.exit(1)
    }

    const { selection } = await Utils.prompts({
        type: 'select',
        name: 'selection',
        message: 'Select a profile to authenticate with',
        choices: profiles.map((p, i) => ({ title: p.name, value: i })),
    })

    const profile = cliConfig.profiles[selection]
    const { environments } = profile

    if (!environments.length) {
        console.log(`This profile has no saved environments, use "config" command to add one`.red)
        process.exit(1)
    }

    /* gather auth parameters */

    const { environment } = await Utils.prompts({
        type: 'select',
        name: 'environment',
        message: 'Choose an environment',
        choices: environments.map((env) => ({ title: env.name, value: env })),
    })
    const { role } = await Utils.prompts({
        type: 'select',
        name: 'role',
        message: 'Choose your role',
        choices: environment.roles.map((name) => ({ title: name, value: name })),
    })
    const { accountId } = environment

    /* open sign-in page in browser */

    const webLink = AWSUtils.constructConsoleLink(accountId, role)
    console.log('Logging in...'.yellow)
    console.log('Make sure you are already logged into the HUB account in your browser.'.yellow)
    open(webLink)
    console.log('Operation complete.'.green)
}

module.exports = { web }
