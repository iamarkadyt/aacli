require('colors')

const { Utils } = require('./helpers')
const { auth, run, config, crypto, web, reset, unauth } = require('./actions')
const { CLI_NAME } = require('./config')

const helpMessage = `Usage: ${`${CLI_NAME} <command>`.cyan}

Commands:
  ${`${CLI_NAME} config`.cyan}
    Use this command to configure this CLI with your HUB account credentials to enable authentication
    into downstream AWS accounts.

  ${`${CLI_NAME} auth`.cyan}
    Use this command to authenticate into an AWS environment under a selected role for programmatic
    access. By default this only enables granting access to AWS through the '${CLI_NAME} run' command
    (see below).

    If you want to provide system-wide access to AWS you'll have to use '~/.aws/credentials' file
    which is insecure as credential information is stored in plain text. To enable this behaviour
    regardless, add the '${Utils.getFeatureFlag('INSECURE_USE_AWS_CREDENTIALS_FILE').name}=1' environment variable into
    your shell environment.

  ${`${CLI_NAME} web`.cyan}
    Use this command to authenticate into an AWS environment under a selected role in your browser.
    To use this command make sure you are logged into the HUB account in your browser first.  

  ${`${CLI_NAME} unauth`.cyan}
    Use this command to delete any previously written temporary AWS credentials from disk. This may
    be used as a security practice to leave no credentials behind after you're done with your work.

  ${`${CLI_NAME} crypto`.cyan}
    Use this command to manage the encryption passphrase that protects configuration files that store
    your AWS credential information.

  ${`${CLI_NAME} reset`.cyan}
    Use this command to erase all CLI configuration files from disk. It may be useful if you messed
    something up during configuration and want to start from scratch.

  ${`${CLI_NAME} run -- <cmd>`.cyan}
    Once authenticated, use this command to run other commands with access to AWS. Access is exposed
    through variable injection which is much more secure than using plain text '~/.aws/credentials'
    file.

Options:
  ${`--help`.cyan}     Show help
  ${`--version`.cyan}  Show version number

Documentation: https://github.com/iamarkadyt/${CLI_NAME}`

function main() {
    const [command, ...args] = process.argv.slice(2)

    if (!command) {
        console.log(helpMessage)
        console.log('\nExpected to be invoked with a command but got none'.red)
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
            console.log(helpMessage)
            console.log(`\nUnknown command '${command}'`.red)
            process.exit(1)
    }
}

module.exports = { main }
