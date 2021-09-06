const { ConfUtils, Utils } = require('../helpers')
const { globalConfig } = require('../config')

const Action = Object.freeze({
    ENCRYPT_CONFIGS: Symbol('ENCRYPT_CONFIGS'),
    DECRYPT_CONFIGS: Symbol('DECRYPT_CONFIGS'),
    CHANGE_PASSCODE: Symbol('CHANGE_PASSCODE'),
})

/**
 * CLI 'crypto' command handler.
 */
async function crypto() {
    const cliConfig = ConfUtils.loadConfigAsIs(globalConfig.cliConfigPath)
    const isEncrypted = ConfUtils.isEncrypted(cliConfig)

    /* build the menu */

    const choices = []
    if (isEncrypted) {
        if (Utils.getFeatureFlag(`INSECURE_DISABLE_ENCRYPTION`).value) {
            choices.push({ title: 'Decrypt configuration files', value: Action.DECRYPT_CONFIGS })
        }
        choices.push({ title: 'Change encryption passphrase', value: Action.CHANGE_PASSCODE })
    } else {
        choices.push({ title: 'Encrypt configuration files', value: Action.ENCRYPT_CONFIGS })
    }
    const { selection } = await Utils.prompts({
        type: 'select',
        name: 'selection',
        message: 'What do you want to do?',
        choices,
    })

    /* handle encrypt action */

    if (selection === Action.ENCRYPT_CONFIGS) {
        const secretKey = await ConfUtils.getNewEncryptionKey()
        const encrypted = ConfUtils.encryptConfig(cliConfig, secretKey)
        ConfUtils.saveConfigAsIs(globalConfig.cliConfigPath, encrypted)
    }

    /* handle decrypt action */

    if (selection === Action.DECRYPT_CONFIGS) {
        const [decrypted] = await ConfUtils.decryptConfigWithRetry(cliConfig)
        ConfUtils.saveConfigAsIs(globalConfig.cliConfigPath, decrypted)
    }

    /* handle create or edit actions */

    if (selection === Action.CHANGE_PASSCODE) {
        const [decrypted] = await ConfUtils.decryptConfigWithRetry(cliConfig)
        const newSecretKey = await ConfUtils.getNewEncryptionKey()
        const encrypted = ConfUtils.encryptConfig(decrypted, newSecretKey)
        ConfUtils.saveConfigAsIs(globalConfig.cliConfigPath, encrypted)
    }

    console.log('Operation successful'.green)
}

module.exports = { crypto }
