require('colors')
const { auth, run, config, crypto, web, reset, unauth } = require('./actions')
const { CLI_NAME } = require('./config')

const helpMessage = `
Usage: ${CLI_NAME} <command>

Commands:
  ${CLI_NAME} config        Configure this tool with your IAM credentials to enable downstream authentication.
  ${CLI_NAME} auth          Authenticate into an AWS environment under a specific role for programmatic access.
  ${CLI_NAME} web           Same as 'auth' command but authenticates into AWS environments in your BROWSER.
  ${CLI_NAME} unauth        Delete any previously written temporary AWS credentials from disk (security practice).
  ${CLI_NAME} crypto        Manage the encryption of the configuration file that stores your permanent AWS credentials.
  ${CLI_NAME} reset         Erase the CLI configuration file to start anew. May be useful if you messed something up.
  ${CLI_NAME} run -- <cmd>  Once authenticated, use this command to run other commands with access to AWS.

Options:
  --help     Show help
  --version  Show version number

Documentation: https://github.com/iamarkadyt/${CLI_NAME}`

function main() {
    const [command, ...args] = process.argv.slice(2)

    if (!command) {
        console.log('Please provide a command.'.red)
        process.exit(1)
    }

    switch (command) {
        case 'help':
            console.log(helpMessage)
            process.exit(0)
        case 'config':
            return config()
        case 'auth':
            return auth()
        case 'web':
            return web()
        case 'unauth':
            return unauth()
        case 'crypto':
            return crypto()
        case 'reset':
            return reset()
        case 'run':
            return run(args.slice(args.indexOf('--') + 1, args.length))
        default:
            console.log('Unknown command provided.'.red)
            process.exit(1)
    }
}

module.exports = { main }
