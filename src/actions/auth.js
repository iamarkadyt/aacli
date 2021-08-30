const AWS = require('aws-sdk')
const os = require('os')
const fs = require('fs')
const _ = require('lodash')
const { globalConfig } = require('../config')
const { AWSUtils, ConfUtils, Utils } = require('../helpers')

/**
 * CLI 'auth' command handler.
 */
async function auth() {
    const [cliConfig] = await ConfUtils.loadConfig()
    const profiles = _.get(cliConfig, 'profiles', [])

    /* load profile */

    if (!profiles.length) {
        console.log(`CLI configuration has no saved profiles, use "config" command to add one`.red)
        process.exit()
    }

    const { selection } = await Utils.prompts({
        type: 'select',
        name: 'selection',
        message: 'Select a profile to authenticate with',
        choices: profiles.map((p, i) => ({ title: p.name, value: i })),
    })

    const profile = cliConfig.profiles[selection]
    const { environments } = profile

    AWS.config.update(profile.awsCredentials)
    const STS = new AWS.STS()

    /* gather auth parameters (env, role, mfa code, etc.) */

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
    const { name: envName, accountId, region } = environment
    const roleToAssumeArn = AWSUtils.constructRoleArn(accountId, role)

    const { Account: HubAccountId, Arn: UserArn } = await STS.getCallerIdentity().promise()
    const username = UserArn.split('/').pop()
    const { mfaCode } = await Utils.prompts({
        type: 'password',
        name: 'mfaCode',
        message: 'Enter your MFA code',
    })

    /* authenticate with aws */

    console.log(`Authenticating into "${envName}" environment as "${role}"...`.yellow)
    const stsParams = {
        RoleArn: roleToAssumeArn,
        RoleSessionName: `${os.userInfo().username}-${username}-${envName}-${role}-${Date.now()}`,
        SerialNumber: AWSUtils.constructMfaArn(HubAccountId, username),
        TokenCode: mfaCode,
    }

    let Credentials = null
    try {
        ;({ Credentials } = await STS.assumeRole(stsParams).promise())
    } catch (error) {
        if (error.message.includes('MultiFactorAuthentication') || error.message.includes('MFA')) {
            console.log('Wrong MFA code. Please try again.'.red)
            process.exit(1)
        }
    }
    const { AccessKeyId, SecretAccessKey, SessionToken } = Credentials

    /* save aws keys to disk */

    const { credConfig, config } = AWSUtils.constructAwsConfig({
        region,
        keyId: AccessKeyId,
        key: SecretAccessKey,
        sessionToken: SessionToken,
    })
    fs.writeFileSync(globalConfig.awsCredPath, credConfig)
    fs.writeFileSync(globalConfig.awsConfigPath, config)

    console.log('Authentication successful!'.green)
}

module.exports = { auth }
