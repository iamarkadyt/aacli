const crypto = require('crypto')
const Utils = require('./other')

const ALGORITHM = 'aes-256-ctr'

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

module.exports = { hashPassword, encryptString, decryptString }
