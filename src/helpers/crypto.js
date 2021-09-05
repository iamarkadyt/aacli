const crypto = require('crypto')
const Utils = require('./other')

const ALGORITHM = 'aes-256-ctr'

/**
 * Checks strength of the password
 *
 * @param {*} passphrase password to test
 * @returns true if password is strong, error message otherwise
 */
function isSafePassword(passphrase) {
    // https://www.thepolyglotdeveloper.com/2015/05/use-regex-to-test-password-strength-in-javascript/
    // below is a series of positive lookaheads (?=.*...) checking for different rules; modify as needed
    const strongRegex = new RegExp('^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{12,})')
    const weakRegex = new RegExp('^(?=.{8,})')

    if (Utils.getFeatureFlag('INSECURE_USE_WEAK_PASSWORDS').value) {
        return weakRegex.test(passphrase) || 'At least 8 characters are required'
    }
    return (
        strongRegex.test(passphrase) ||
        'At least 12 characters, one uppercase, one lowercase, one numeric and one special character !@#$%^&*'
    )
}

/**
 * Depending on algorithm, encryption key must be of certain length. Which means we can't directly pass user passcodes
 * into the encryption engine. We need to hash those passwords, meaning turn them into a reproducibly built hash string.
 *
 * @param {string} secretKey passphrase to hash
 * @returns hashed passphrase
 */
function hashPassword(secretKey) {
    return crypto.createHash('sha256').update(String(secretKey)).digest('base64').substr(0, 32)
}

/**
 * Encrypts text data
 *
 * @param {string} text text to encrypt
 * @param {string} secretKey passphrase
 * @returns object containing two properties: "iv" -- initialization vector (to be stored along with encrypted content)
 *  and "content" -- encrypted data
 */
function encryptString(text, secretKey) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, hashPassword(secretKey), iv)
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
    }
}

/**
 * Decrypts text data
 *
 * @param {*} hash object containing "iv" and "content", ones created by encryptString() method
 * @param {*} secretKey passphrase
 * @returns decrypted data
 */
function decryptString(hash, secretKey) {
    const decipher = crypto.createDecipheriv(ALGORITHM, hashPassword(secretKey), Buffer.from(hash.iv, 'hex'))
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])
    return decrpyted.toString()
}

module.exports = { isSafePassword, hashPassword, encryptString, decryptString }
