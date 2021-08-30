const fs = require('fs')
const Utils = require('./other')
const CryptoUtils = require('./crypto')
const { globalConfig } = require('../config')

/**
 *
 * A CLI config may be in two states. One is encrypted, when JSON structure looks like this:
 *     {
 *         iv: "<gibberish>",
 *         content: "<more-gibberish>",
 *     }
 * And another state when it's decrypted (subject to change):
 *     {
 *         "profiles": {
 *             "<profile-name>": { ...profile data... }
 *         }
 *     }
 *
 * @param {*} json config file of unknown status
 * @returns true if config is encryped, false otherwise
 */
function isEncrypted(json) {
    if (Object.prototype.hasOwnProperty.call(json, 'iv') && Object.prototype.hasOwnProperty.call(json, 'content')) {
        return true
    }
    return false
}

/**
 * Simple function that asks user for the passphrase
 *
 * @param {*} override any properties to override in the prompts() call
 * @returns passphrase provided by user
 */
async function getEncryptionKey(override) {
    const { secretKey } = await Utils.prompts({
        type: 'password',
        name: 'secretKey',
        message: 'Enter passphrase',
        ...override,
    })
    return secretKey
}

/**
 * Asks user for a passphrase TWICE and verifies that both match. If they do not, keeps asking indefinitely.
 *
 * @returns new passphrase
 */
async function getNewEncryptionKey() {
    let newSecretKey
    let newSecretKeyConfirm
    let isFailing = true

    while (isFailing) {
        newSecretKey = await getEncryptionKey({
            message: 'Enter new passphrase',
            validate: (input) => CryptoUtils.isSafePassword(input),
        })
        newSecretKeyConfirm = await getEncryptionKey({ message: 'Enter new passphrase again' })

        if (newSecretKey === newSecretKeyConfirm) {
            isFailing = false
        } else {
            console.log('Passphrases do not match. Please try again.'.yellow)
        }
    }

    return newSecretKey
}

/**
 * Receives regular config and encrypts it. Returns encrypted config (JSON object containing "iv" and "content" properties).
 *
 * @param {object} json regular, decrypted config
 * @param {string} secretKey passphrase
 * @returns encrypted config (json)
 */
function encryptConfig(json, secretKey) {
    const serialized = JSON.stringify(json, null, 4)
    const { iv, content } = CryptoUtils.encryptString(serialized, secretKey)
    return { iv, content }
}

/**
 * Receives encrypted config (JSON object with "iv" and "content" properties), decrypts it and returns the config.
 *
 * @param {object} json encrypted config
 * @param {string} secretKey passphrase
 * @returns decrypted config (json)
 */
function decryptConfig(json, secretKey) {
    const { iv, content } = json
    const decrypted = CryptoUtils.decryptString({ iv, content }, secretKey)
    return JSON.parse(decrypted)
}

/**
 * Keeps retrying config decryption until user provides the correct password.
 *
 * @returns decrypted config
 */
async function decryptConfigWithRetry(cliConfig) {
    let isFailing = true
    let decrypted
    let passphrase

    while (isFailing) {
        passphrase = await getEncryptionKey()
        try {
            decrypted = decryptConfig(cliConfig, passphrase)
            isFailing = false
        } catch (error) {
            if (error.code === 'ERR_CRYPTO_INVALID_KEYLEN' || error.name === 'SyntaxError') {
                console.log("Couldn't decrypt the config file. Bad passphrase. Please try again.".yellow)
            } else {
                throw error
            }
        }
    }

    return [decrypted, passphrase]
}

/**
 * Saves JSON data to CLI configuration file. This function is dumb and unaware of config file encryption status.
 *
 * @param {*} json config to serialize and save
 */
function saveConfigAsIs(json) {
    if (!fs.existsSync(globalConfig.cliDir)) {
        fs.mkdirSync(globalConfig.cliDir)
    }
    const fileContents = `${JSON.stringify(json, null, 4)}\n`
    fs.writeFileSync(globalConfig.cliConfigPath, fileContents)
}

/**
 * Reads JSON data from CLI configuration file. This function is dumb and unaware of config file encryption status.
 *
 * @returns empty object if config loading failed
 */
function loadConfigAsIs() {
    if (!fs.existsSync(globalConfig.cliDir)) {
        fs.mkdirSync(globalConfig.cliDir)
    }
    let cliConfig = {}
    try {
        cliConfig = JSON.parse(fs.readFileSync(globalConfig.cliConfigPath))
    } catch {}
    return cliConfig
}

/**
 * Saves CLI config with some intelligence. If it is passed in the encrypted form, saves as is.
 * If it's passed in decrypted form AND passphrase is passed too, it encrypts the config before saving.
 * If config is passed in decrypted form WITHOUT passphrase it saves it as is.
 *
 * @param {*} json config to save
 * @param {*} secretKey (optional) passphrase to use to encrypt the config
 */
async function saveConfig(json, secretKey) {
    if (isEncrypted(json)) {
        return saveConfigAsIs(json)
    }

    if (secretKey) {
        const encrypted = encryptConfig(json, secretKey)
        return saveConfigAsIs(encrypted)
    }

    return saveConfigAsIs(json)
}

/**
 * Loads configuration file with some intelligence. If config file is encrypted, it attempts to decrypt.
 * If it's stored decrypted on disk, returns it as is.
 *
 * @returns decrypted config along with passphrase used to decrypt it if applicable
 */
async function loadConfig() {
    const config = loadConfigAsIs()

    if (isEncrypted(config)) {
        const [decryptedConfig, passphrase] = await decryptConfigWithRetry(config)
        return [decryptedConfig, passphrase]
    }

    return [config]
}

module.exports = {
    isEncrypted,
    getEncryptionKey,
    getNewEncryptionKey,
    encryptConfig,
    decryptConfig,
    decryptConfigWithRetry,
    saveConfigAsIs,
    loadConfigAsIs,
    saveConfig,
    loadConfig,
}
