const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const os = require('os')
const { AWSUtils, ConfUtils, Utils } = require('../helpers')

/**
 * CLI 'login' command handler.
 */
async function login() {
    const [cliConfig, passphrase] = await ConfUtils.loadCliConfig()
    const profiles = Utils.lodashGet(cliConfig, 'profiles', [])

    /* load profile */

    if (!profiles.length) {
        console.log(`CLI configuration has no saved profiles, use "config" command to add one`.red)
        process.exit(1)
    }

    const { selection } = await Utils.prompts({
        type: 'select',
        name: 'selection',
        message: 'Select a profile to use',
        choices: profiles.map((p, i) => ({ title: p.name, value: i })),
    })

    const profile = cliConfig.profiles[selection]
    const { identities } = profile

    if (!identities.length || !Array.isArray(identities)) {
        console.log(`This profile has no saved identities, use "config" command to add one`.red)
        process.exit(1)
    }

    /* gather auth parameters (env, role, mfa code, etc.) */

    const { identity } = await Utils.prompts({
        type: 'select',
        name: 'identity',
        message: 'Choose an identity to log in under',
        choices: identities.map((id) => ({ title: `${id.accountName}/${id.iamRoleName}`, value: id })),
    })
    const { duration } = await Utils.prompts({
        type: 'number',
        name: 'duration',
        message: 'Specify session duration (in hours, 1-12)',
        initial: 1,
        min: 1,
        max: 12,
    })
    const { accountName: envName, accountId, accountRegion: region, iamRoleName: role } = identity
    const roleToAssumeArn = AWSUtils.constructRoleArn(accountId, role)
    const { mfaCode } = await Utils.prompts({
        type: 'text',
        name: 'mfaCode',
        message: 'Enter your MFA code',
        validate: value => value < 6 ? `Token must be at least 6 characters long` : true,
    })

    /* authenticate with aws */

    console.log(`Authenticating into "${envName}" environment as "${role}"...`.yellow)

    const timestamp = Date.now().toString();
    const userInfo = `${os.userInfo().username}-${envName}-${role}`;

    const stsClient = new STSClient({
        region: identity.accountRegion,
        credentials: {
            accessKeyId: profile.awsCredentials.accessKeyId,
            secretAccessKey: profile.awsCredentials.secretAccessKey,
        },
    });
    const stsParams = {
        RoleArn: roleToAssumeArn,
        RoleSessionName: `${userInfo.slice(0, 64 - timestamp.length - 1)}-${timestamp}`,
        SerialNumber: profile.awsCredentials.mfaArn,
        TokenCode: mfaCode,
        DurationSeconds: duration * 3600,
    }

    let Credentials = null
    try {
        const command = new AssumeRoleCommand(stsParams)
        ;({ Credentials } = await stsClient.send(command))
    } catch (error) {
        if (error.message.includes('Duration')) {
            console.log(`Specified session duration exceeds the maximum allowed limit set on the '${role}' role`.red)
            process.exit(1)
        }
        if (error.message.includes('MultiFactorAuthentication') || error.message.includes('MFA')) {
            console.log('Wrong MFA code. Please try again'.red)
            process.exit(1)
        }
        if (error.code === 'AccessDenied') {
            console.log(
                "Could not assume the selected role. Make sure it's name is correct in the CLI config and that your IAM user (HUB account entity) is allowed to assume it"
                    .red,
            )
            console.log(`${error.message}`.red)
            process.exit(1)
        }
        throw error
    }
    const { AccessKeyId, SecretAccessKey, SessionToken, Expiration } = Credentials

    /* save aws keys to disk */

    const sessions = Utils.lodashGet(cliConfig, 'sessions', [])
    const newSession = {
        name: `${profile.name}/${envName}/${role}`,
        region,
        keyId: AccessKeyId,
        key: SecretAccessKey,
        sessionToken: SessionToken,
        expiry: Expiration,
    }
    const existingEntryIdx = sessions.findIndex((item) => item.name === newSession.name)
    if (existingEntryIdx > -1) {
        sessions.splice(existingEntryIdx, 1, newSession)
    } else {
        sessions.push(newSession)
    }
    cliConfig.sessions = sessions
    await ConfUtils.saveCliConfig(cliConfig, passphrase)

    console.log('Authentication successful'.green)
}

module.exports = { login }
