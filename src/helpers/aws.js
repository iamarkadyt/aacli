function constructConsoleLink(account, roleName) {
    return `https://signin.aws.amazon.com/switchrole?roleName=${roleName}&account=${account}`
}

function constructRoleArn(account, roleName) {
    return `arn:aws:iam::${account}:role/${roleName}`
}

module.exports = {
    constructConsoleLink,
    constructRoleArn,
    constructAwsConfig,
}
