const os = require('os')
const path = require('path')

/* eslint-disable import/newline-after-import */
const CLI_NAME = require('../package.json').name.split('/').pop()
const CLI_NAME_UPPER = CLI_NAME.toUpperCase()
const CLI_VERSION = require('../package.json').version

const globalConfig = {
    cliDir: path.join(os.homedir(), `.${CLI_NAME}`),
    cliConfigPath: path.join(os.homedir(), `.${CLI_NAME}`, 'config.json'),
    cliInputFiles: {
        json: path.join(os.homedir(), `.${CLI_NAME}`, 'input.json'),
    },
    sessionConfigPath: path.join(os.homedir(), `.${CLI_NAME}`, 'sessions.json'),
    awsCredPath: path.join(os.homedir(), '.aws/credentials'),
    awsConfigPath: path.join(os.homedir(), '.aws/config'),
}

module.exports = { globalConfig, CLI_NAME, CLI_NAME_UPPER, CLI_VERSION }
