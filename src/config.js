const os = require('os')
const path = require('path')

const CLI_NAME = require('../package.json').name.split('/').pop()

const globalConfig = {
    cliDir: path.join(os.homedir(), `.${CLI_NAME}`),
    cliConfigPath: path.join(os.homedir(), `.${CLI_NAME}`, 'config.json'),
    cliInputFiles: {
        json: path.join(os.homedir(), `.${CLI_NAME}`, 'input.json'),
    },
    awsCredPath: path.join(os.homedir(), '.aws/credentials'),
    awsConfigPath: path.join(os.homedir(), '.aws/config'),
}

module.exports = { globalConfig, CLI_NAME }
