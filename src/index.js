require('colors')
const yargs = require('yargs')
const { auth, run, config, crypto, web, reset, unauth } = require('./actions')
const { CLI_NAME } = require('./config')

function main() {
    const { argv } = yargs(process.argv.slice(2))
        .scriptName(CLI_NAME)
        .usage('Usage: $0 <command>')
        .command(
            'config',
            'Configure this tool with your IAM credentials to enable downstream authentication.',
            () => {},
            () => config(),
        )
        .command(
            'auth',
            'Authenticate into an AWS environment under a specific role for programmatic access.',
            () => {},
            () => auth(),
        )
        .command(
            'web',
            "Same as 'auth' command but authenticates into AWS environments in your BROWSER.",
            () => {},
            () => web(),
        )
        .command(
            'unauth',
            'Delete any previously written temporary AWS credentials from disk (security practice).',
            () => {},
            () => unauth(),
        )
        .command(
            'crypto',
            'Manage the encryption of the configuration file that stores your permanent AWS credentials.',
            () => {},
            () => crypto(),
        )
        .command(
            'reset',
            'Erase the CLI configuration file to start anew. May be useful if you messed something up.',
            () => {},
            () => reset(),
        )
        .command(
            'run -- <cmd>',
            'Once authenticated, use this command to run other commands with access to AWS.',
            () => {},
            () => web(),
        )
        .demandCommand(1)
        .strictCommands(true)
        .wrap(120)
        .epilog(`Documentation: https://github.com/iamarkadyt/${CLI_NAME}`)

    return argv
}

module.exports = { main }
