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

It can cache multiple simultaneous sessions, storing all AWS credentials in an encrypted file. Credentials are never exposed to the file system in plain text. This CLI uses variable injection and subprocessing to pass credentials into a specified executable. See `aws-auth run` for more.

This CLI __requires__ TOTP MFA authentication.

When you authenticate into an AWS account with this CLI and prepend any command with `aws-auth run --` that executable automatically receives AWS credentials through it's environment allowing access to resources in that AWS account. This works for libraries like [aws sdk](https://aws.amazon.com/getting-started/tools-sdks/), [aws cdk](https://aws.amazon.com/cdk/), [aws cli](https://aws.amazon.com/cli/), [aws shell](https://github.com/awslabs/aws-shell), [aws sam](https://aws.amazon.com/serverless/sam/), [rclone](https://rclone.org/) __and any script that utilizes them__.

Here's a usage demo for a quick taste:

<img src="https://github.com/iamarkadyt/aws-auth/raw/master/media/login.gif" alt="login example" />

Notice how easy it is to create, store and use multiple concurrent AWS sessions. Example use case is to have active sessions for development, staging or production AWS accounts, switching between them as code roll out process progresses forward.

# Installation

To install this CLI, run:
```
npm install -g @iamarkadyt/aws-auth
```

# Usage

### Primary recommended workflow

Create an IAM user for yourself. Remove all permissions and leave a very restricted set allowing to only assume a select number of other IAM roles. IAM credentials from this user will be stored on your disk in the encrypted format __long term__, so having narrow set of associated permissions is important.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": [
                "arn:aws:iam::<aws-acc-id-where-this-role-lives>:role/DEVELOPER"
            ]
        }
    ]
}
```

After that register the TOTP MFA device for your IAM user using an app like Google Authenticator and note the MFA device ARN, it's displayed in your IAM user settings in AWS console. We will need this ARN during the `aws-auth config` stage.

Next create an IAM role named `DEVELOPER`. Specify a broader set of permissions here for all the services that you plan on using under this role. You will be assuming this role using your MFA method and by AWS STS design these credentials will not last for more than 12 hours. So even if someone were to obtain the encrypted credential file from your disk and crack it in inder 12 hours they will still end up with an expired set of keys on their hands.

Adjust the temporary credential expiration limits in the IAM Role settings in AWS console. Also make sure to set up the trust policy on this role that looks like below, this is to allow IAM users from your account to assume it. Note: Removing the MFA condition here will not stop this CLI from asking for MFA code.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::<aws-acc-id-where-your-iam-user-lives>:root"
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

Now that the `DEVELOPER` role is set up, feel free to create additional roles like `READONLY`, `OPERATOR`, `FULLADMIN`, etc. Adjust your (or others') IAM user permissions accordingly.

Next create an Access Key + Secret Access Key pair on your IAM user and run `aws-auth config`. Select `Create new profile`, provide the profile name, provide the IAM user credentials that you just generated then provide the MFA device ARN that you noted earlier.

After that create an identity linking to your `DEVELOPER` role or any other role that you have created. Select `Add new identity`, pick a profile to link that identity to, provide account label, id, primary region (this is where AWS STS API authentication calls will be sent internally), and provide the IAM Role name. Note that it's not the ARN just the name and that the role name must match exactly.

Once your identities are set up go ahead and login to create a session. Once logged in you can list your active sessions using `list` command.

```
aws-auth login
aws-auth list
```


Now try invoking other commands in your shell that require AWS credentials:

```
aws-auth run -- aws s3 ls
aws-auth run -- ./deploy-my-app.js
aws-auth run -- rclone sync <...>
aws-auth run -- sst deploy
```

To change the encryption passphrase on the key store use `aws-auth pwd` command.

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
