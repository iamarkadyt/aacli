[<img src="https://badge.fury.io/js/@iamarkadyt%2Faws-auth.svg" alt="" />](https://www.npmjs.com/package/@iamarkadyt/aws-auth)

# Table of contents

1. [What is this?](#what-is-this)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Contributing](#contributing)
5. [Advanced](#advanced)
6. [License](#license)

# What is this?

Simple NodeJS CLI for authenticating with AWS using IAM roles and MFA.

It can cache multiple simultaneous sessions, storing all AWS credentials in an encrypted file. Credentials are never exposed to the file system in plain text. This CLI uses variable injection and subprocessing to pass credentials into a specified executable. See `aws-auth run`.

This CLI __requires__ MFA authentication.

When you authenticate into an AWS account with this CLI and prepend any command with `aws-auth run --` that executable automatically receives AWS credentials through it's environment allowing access to resources in that AWS account. This works for libraries like [aws sdk](https://aws.amazon.com/getting-started/tools-sdks/), [aws cdk](https://aws.amazon.com/cdk/), [aws cli](https://aws.amazon.com/cli/), [aws shell](https://github.com/awslabs/aws-shell), [aws sam](https://aws.amazon.com/serverless/sam/), [rclone](https://rclone.org/) __and any script that utilizes them__.

Here's a usage demo for a quick taste:

<img src="https://github.com/iamarkadyt/aws-auth/raw/master/media/login.gif" alt="login example" />

Notice how easy it is to create and use multiple concurrent AWS sessions.

# Installation

To install this CLI, run:
```
npm install -g @iamarkadyt/aws-auth
```

# Usage

### Primary recommended workflow

Create an IAM user for yourself. Remove all permissions and leave a very restricted set allowing to only assume a few other IAM roles. These credentials will be stored on your disk in the encrypted format long term, so having narrow set of associated permissions is important.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": [
                "arn:aws:iam::<your-acc-id>:role/DEVELOPER"
            ]
        }
    ]
}
```

Create an access key pair then add it using the below command:

```
aws-auth config
```

Next create an IAM role named `DEVELOPER`. Specify a broader set of permissions here for all the services that you plan on using. You will be assuming this role using your MFA method and by design these credentials will not last for more than 12 hours. So even if someone were to obtain the encrypted credential file from your disk and crack it in inder 12 hours they will still end up with expired set of keys on their hands.

Make sure to set up the trust policy on this role that looks like below. Note: Removing the MFA condition here will not stop this CLI from asking for MFA code.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::<your-acc-id>:root"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "Bool": {
                    "aws:MultiFactorAuthPresent": "true"
                }
            }
        }
    ]
}
```

Now create a session:

```
aws-auth login
```

And try invoking other commands:

```
aws-auth run -- aws s3 ls
aws-auth run -- ./deploy-my-app.js
aws-auth run -- rclone sync <...>
aws-auth run -- sst deploy
```

Now you can add more roles for other use cases besides `DEVELOPER`. These roles can be located in other AWS accounts.

To change the encryption passphrase use `aws-auth pwd` command.

Full list of variables injected into the subprocess:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
AWS_DEFAULT_REGION
```

#### What are profiles?

Profiles provide a convenient way to have multiple separate global configurations. An example use case is having `work` and `personal` profiles, where `work` holds credentials and environment configuration provided by the organization you may work for and `personal` holds configuration for your personal AWS accounts that you use for your side projects.

### Other commands

Other available commands are:

- `aws-auth logout` -- Purge all session credentials.
- `aws-auth reset` -- Deletes CLI configuration files. Might come useful if you decided to erase all configuration to start from scratch.
- `aws-auth web` -- Opens up a browser tab to authenticate you into the selected AWS environment in AWS web console.
- `aws-auth list` -- Lists all sessions (active and expired) currently located in your encrypted store. Useful to check if you need to re-login soon.

# Contributing

Contributions are welcome. See [CONTRIBUTING.md](https://github.com/iamarkadyt/aws-auth/blob/master/CONTRIBUTING.md).

# Advanced

You can modify certain behaviors by setting below flags in your environment. To enable a feature flag add the following to your `~/.bashrc`:
```
export FEATURE_FLAG=1
```

Or run `aws-auth` like this:
```
$ FEATURE_FLAG=1 aws-auth <command>
```

`FF_AWS-AUTH_INSECURE_USE_AWS_CREDENTIALS_FILE`

If enabled, temporary AWS credentials are also written to `~/.aws/credentials` file upon authentication into an AWS environment. This provides system-wide access to your AWS requirement for all processes that will ask for it, whether you want it or not, because it's stored in plain text in a location where all AWS SDKs always automatically look into. Which can be useful, but is not recommended. If you enable this, you don't need to use `aws-auth run` command because all binaries using AWS SDKs on your system will automatically obtain access to the AWS environment that you authenticate into.

`FF_AWS-AUTH_INSECURE_USE_WEAK_PASSWORDS`

If enabled, reduces the password requirements to just 8 characters. No special characters or digits will be required.

`FF_AWS-AUTH_INSECURE_DISABLE_ENCRYPTION`

All AWS credentials are stored in the CLI configuration files on disk which is encrypted by default. Passphrase can be changed with `aws-auth pwd` command. However this command can also used to disable encryption entirely. If feature flag above is enabled, a few secret options appear in the `aws-auth pwd` command output that allow to decrypt the configuration files.

When a configuration file is encrypted, a user is required to provide a passphrase before performing any manipulations to the CLI config or performing a downstream authentication. When it's decrypted, passphrase is not asked for any operations. But with that your AWS credentials, both temporary and permanent, are stored in plain text on disk in `~/.aws-auth` directory.

# License

```
The MIT License (MIT)

Copyright © 2024, Arkady Titenko

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
