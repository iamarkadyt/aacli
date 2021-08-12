function constructConsoleLink(account, roleName) {
    return `https://signin.aws.amazon.com/switchrole?roleName=${roleName}&account=${account}`
}

function constructRoleArn(account, roleName) {
    return `arn:aws:iam::${account}:role/${roleName}`
}

function constructMfaArn(account, username) {
    return `arn:aws:iam::${account}:mfa/${username}`
}

/**
 * @param {*} sessionToken (optional) when assuming roles, AWS provides you with one more key -- session token
 * @returns object containing `~/.aws/credentials` config and `~/.aws/config` strings ready for fs write
 */
function constructAwsConfig({ region, keyId, key, sessionToken }) {
    const credConfig = [`[default]`, `aws_access_key_id = ${keyId}`, `aws_secret_access_key = ${key}`]
    if (typeof sessionToken === 'string' && sessionToken.length) {
        credConfig.push(`aws_session_token = ${sessionToken}`)
    }
    const config = [`[default]`, `output = json`, `region = ${region}`]

    // adding of additional \n to each string is to make sure files end with a new line (purely decorative purpose)
    return { credConfig: `${credConfig.join('\n')}\n`, config: `${config.join('\n')}\n` }
}

module.exports = {
    constructConsoleLink,
    constructRoleArn,
    constructMfaArn,
    constructAwsConfig,
}
