const { ConfUtils, Utils } = require('../helpers')

const Action = Object.freeze({
    CREATE_ID: Symbol('CREATE_ID'),
    DELETE_ID: Symbol('DELETE_ID'),
    CREATE_PROFILE: Symbol('CREATE_PROFILE'),
    DELETE_PROFILE: Symbol('DELETE_PROFILE'),
    EXIT_CLI: Symbol('EXIT_CLI'),
})

/**
 * Asks user to provide AWS configuration: region, secret key and key id
 *
 * @param {*} profile (optional) profile to lookup existing configuration from
 * @returns aws configuration
 */
async function getAwsConfig(profile = {}) {
    const { accessKeyId } = await Utils.prompts({
        type: 'text',
        name: 'accessKeyId',
        message: 'Enter your AWS_ACCESS_KEY_ID',
        initial: Utils.lodashGet(profile, `awsCredentials.accessKeyId`),
    })
    const { secretAccessKey } = await Utils.prompts({
        type: 'password',
        name: 'secretAccessKey',
        message: 'Enter your AWS_SECRET_ACCESS_KEY',
        initial: Utils.lodashGet(profile, `awsCredentials.secretAccessKey`),
    })
    const { mfaArn } = await Utils.prompts({
        type: 'text',
        name: 'mfaArn',
        message: 'Enter your MFA device ARN',
        initial: Utils.lodashGet(profile, `awsCredentials.mfaArn`),
    })

    return { accessKeyId, secretAccessKey, mfaArn }
}

/**
 * Asks user to provide configuration details for a new identity
 */
async function getNewIdentity() {
    const { accountName } = await Utils.prompts({
        type: 'text',
        name: 'accountName',
        message: 'AWS account label: (dev, stage, prod, etc)',
        initial: 'dev',
    })
    const { accountId } = await Utils.prompts({
        type: 'text',
        name: 'accountId',
        message: 'AWS account id:',
    })
    const { accountRegion } = await Utils.prompts({
        type: 'text',
        name: 'accountRegion',
        message: 'Primary region used in that account?',
        initial: 'us-east-1',
    })
    const { iamRoleName } = await Utils.prompts({
        type: 'text',
        name: 'iamRoleName',
        message: 'IAM role name:',
        initial: 'DEVELOPER',
    })

    return { accountName, accountId, accountRegion, iamRoleName }
}

/**
 * CLI 'config' command handler.
 */
async function config(actionConfig) {
    const [cliConfig, passphrase] = actionConfig
    let profiles = Utils.lodashGet(cliConfig, 'profiles', [])

    /* build the menu */

    const choices = [{ title: 'Create new profile', value: Action.CREATE_PROFILE }]
    if (profiles.length) {
        choices.push({ title: 'Delete a profile', value: Action.DELETE_PROFILE })
        choices.push(...profiles.map((p, i) => ({ title: `Configure profile: ${p.name}`, value: i })))
        choices.push({ title: 'Add a new identity', value: Action.CREATE_ID })
    }

    if (profiles.some(profile => Array.isArray(profile.identities) && profile.identities.length > 0)) {
        choices.push({ title: 'Delete an identity', value: Action.DELETE_ID })
    }
    choices.push({ title: 'Exit this CLI', value: Action.EXIT_CLI })
    const { selection } = await Utils.prompts({
        type: 'select',
        name: 'selection',
        message: 'Select an action',
        choices,
    })

    /* handle exit action */

    if (selection === Action.EXIT_CLI) {
        process.exit(0)
    }

    /* handle delete actions */

    if (selection === Action.DELETE_PROFILE) {
        const { toDelete } = await Utils.prompts({
            type: 'select',
            name: 'toDelete',
            message: 'Select a profile to delete',
            choices: profiles.map((p, i) => ({ title: p.name, value: i })),
        })
        const { hasConfirmed } = await Utils.prompts({
            type: 'confirm',
            name: 'hasConfirmed',
            message: `Are you sure? This action is irreversible`,
        })
        if (hasConfirmed) {
            profiles = profiles.filter((el, i) => i !== toDelete)
            cliConfig.profiles = profiles
            await ConfUtils.saveCliConfig(cliConfig, passphrase)
            console.log('Profile was successfully deleted'.green)
            console.log()
        }
        return
    }

    if (selection === Action.DELETE_ID) {
        const choices = profiles.reduce((acc, profile) => {
            if (Array.isArray(profile.identities) && profile.identities.length) {
                profile.identities.forEach(identity => acc.push(`${profile.name}/${identity.accountName}/${identity.iamRoleName}`))
            }
            return acc;
        }, [])
        const { toDelete } = await Utils.prompts({
            type: 'select',
            name: 'toDelete',
            message: 'Select an identity to delete',
            choices,
        })
        const { hasConfirmed } = await Utils.prompts({
            type: 'confirm',
            name: 'hasConfirmed',
            message: `Are you sure? This action is irreversible`,
        })
        if (hasConfirmed) {
            const [profileName, idAccName, idRoleName] = choices[toDelete].split('/')
            profiles.forEach(profile => {
                if (profile.name === profileName) {
                    profile.identities = profile.identities.filter(identity => {
                        return identity.accountName !== idAccName && identity.iamRoleName !== idRoleName
                    });
                }
            });

            cliConfig.profiles = profiles
            await ConfUtils.saveCliConfig(cliConfig, passphrase)
            console.log('Identity was successfully deleted'.green)
            console.log()
        }
        return
    }

    /* handle create identity actions */

    if (selection === Action.CREATE_ID) {
        const { profileName } = await Utils.prompts({
            type: 'select',
            name: 'profileName',
            message: 'Select a profile to add new identity to',
            choices: profiles.map((p, i) => ({ title: p.name, value: i })),
        })
        const identity = await getNewIdentity()
        if (Array.isArray(profiles[profileName].identities)) {
            profiles[profileName].identities.push(identity)
        } else {
            profiles[profileName].identities = [identity]
        }

        cliConfig.profiles = profiles
        await ConfUtils.saveCliConfig(cliConfig, passphrase)
        console.log('Identity was successfully created'.green)
        console.log()

        return
    }

    /* handle create or edit profile actions */

    let profile
    if (selection === Action.CREATE_PROFILE) {
        const { profileName } = await Utils.prompts({
            type: 'text',
            name: 'profileName',
            message: 'Enter the name for the new profile',
            initial: 'default',
            validate: (name) =>
                profiles.find((p) => p.name === name) ? `Profile already exists. Choose a different name` : true,
        })

        profile = { name: profileName }
        profiles.push(profile)
    } else {
        profile = profiles[selection]
    }
    const awsCredentials = await getAwsConfig(profile)
    profile.awsCredentials = awsCredentials

    cliConfig.profiles = profiles
    await ConfUtils.saveCliConfig(cliConfig, passphrase)

    if (selection === Action.CREATE_PROFILE) {
        console.log('Profile was successfully created'.green)
        console.log()
    } else {
        console.log('Profile was successfully edited'.green)
        console.log()
    }
}

// TODO this could probably become a helper
async function repeatAction() {
    const actionConfig = await ConfUtils.loadCliConfig()
    /* eslint-disable no-constant-condition */
    while (true) {
        await config(actionConfig)
    }
}

module.exports = { config: repeatAction }
