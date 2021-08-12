/* eslint-disable no-underscore-dangle */
const _prompts = require('prompts')

/**
 * Very thin wrapper around the prompts library. Adds:
 *   - Handling of Ctrl + C event to abort program execution entirely.
 *   - Message property can be provided as an array of strings for multiline text.
 *
 * @param {*} args agrs object is passed directly into prompts library
 * @returns Promise returned by prompts
 */
function prompts(args) {
    // dad su
    let finalMessage = args.message
    if (Array.isArray(args.message)) {
        finalMessage = args.message.reduce((acc, item, i) => {
            if (i > 0) return `${acc}\n  ${item}`
            return item
        })
    }

    return _prompts(
        { ...args, message: finalMessage },
        {
            onCancel: () => {
                process.stdout.write(
                    "Caught interrupt sequence, aborting execution. I'll be here if you need me.\n".yellow,
                )
                process.exit(0)
            },
        },
    )
}

/**
 * Returns a promise that resolves in <S> seconds. Can be handy to pause script execution.
 *
 * @param {*} s seconds to sleep
 * @returns Promise that resolves in <S> seconds
 */
function sleepSeconds(s) {
    return new Promise((resolve) => setTimeout(resolve, s * 1000))
}

/**
 * Generates random alphanumeric string.
 *
 * @param {*} len length of the generated alphanumeric string
 */
function genHash(len = 50) {
    return Array(len)
        .fill(null)
        .map(() => Math.random().toString(36).substring(2))
        .join('')
        .substring(0, len)
}

/**
 * Checks whether a value is a plain object.
 */
function isObject(val) {
    return (
        val !== null &&
        typeof val === 'object' &&
        val.constructor.name === 'Object' &&
        Object.prototype.isPrototypeOf.call(Object.getPrototypeOf(val), Object)
    )
}

/**
 * Fetch var from system environment.
 *
 * @param {*} varName name of the var to get from environment
 * @returns var
 */
function getEnvVar(varName) {
    return process.env[varName]
}

module.exports = { prompts, sleepSeconds, genHash, isObject, getEnvVar }
