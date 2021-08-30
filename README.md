# What is this?

This CLI tool allows you to programmatically authenticate with AWS environments through IAM roles in a multi-account AWS Organization setup. It supports and requires MFA authentication which combined with temporary IAM credentials provided by authentication through IAM roles makes it a great way to authenticate with AWS environments in a secure manner.

This means that packages listed below and any software dependent on them will be able to obtain access to AWS resources in the account that you choose to authenticate with. All of these libraries pull credentials from `~/.aws/credentials` file which this CLI tool updates upon every authentication.
```
aws-sdk   : library used for accessing AWS APIs directly
aws-cdk   : library for Infrastructure-as-Code definitions
aws-cli   : CLI provided by AWS that allows you to manage AWS resources
aws-sam   : Toolkit for managing serverless applications and CloudFormation templates
```
So, as an example, you could authenticate into `dev` environment first, make deployments, test changes and once confirmed authenticate into `prod` environment to deploy your changes to production. All without ever leaving your terminal window. It's a convenient and secure way to manage AWS credentials, provide programmatic access to AWS to software running on your computer and an easy way to rapidly switch roles as needed.

List of libraries above is not exhaustive. This authentication flow will very likely apply to any future AWS libraries as well as they seem to follow the same pattern for accessing AWS credentials from disk.

# Installation

To install this CLI, run:
```
npm install -g aacli
```

# Usage

To begin using this CLI you will first need to create a configuration file before you can start authenticating into AWS environments. This configuration file will hold your IAM user credentials from HUB account as well as information about downstream AWS environments like account IDs, environment names, regions they are located in and what roles are available for assumption. 

See [Secure AWS authentication model](#secure-aws-authentication-model) section below for more information on what is a HUB account and this multi-account setup model. Make sure you don't skip it, because this multi-account setup model is what this CLI was built for the first place.

#### Creating and managing the CLI configuration file

To create or edit your CLI configuration file, run `aacli config` command. You can create new profiles, edit existing ones or delete them.

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-config.gif" alt="config usage example" />

You can also manage the encryption of your configuration file with `aacli crypto` command. We recommend keeping your config file encrypted at all times as a good security practice.

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-crypto.gif" alt="crypto usage example" />

#### Authentication

Once configuration file is created you can start authenticating into downstream AWS environments through `aacli auth` command. You can also use `aacli unauth` command to revoke access to an AWS environment (erases temporary AWS credentials from disk).

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-auth-unauth.gif" alt="auth usage example" />

#### Other commands

Other available commands are:

- `aacli reset` -- Deletes CLI configuration file. May be useful if you mess it up and want to start anew.
- `aacli web` -- Opens up a browser tab to authenticate you into the selected AWS environment in AWS web console.

# Project goals

This project was born from an effort to figure out a _simple_ yet _reasonably secure_ way of _programmatic_ authentication into AWS environments _with MFA support_.

The regular approach taken by many software companies is either:

- Using expensive SSO solutions (3rd party single sign-on SaaS platforms) and writing custom CLI toolkits for integrating with said platforms for programmatic AWS access (early and unnecessary complexity,  financial and development time costs).
- Or not using any MFA at all and just using plain permanent AWS IAM user credentials (terribly insecure).

This project aims to provide a secure and efficient middle-ground alternative to both of these options.

# Secure AWS authentication model

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/aws-flow.png" alt="secure aws flow diagram" />

User authenticates into the HUB account, then assumes roles in downstream environment accounts. Role assumption returns temporary AWS credentials that can be used for interacting with a particular AWS account.

Below is a more detailed description of this AWS authentication flow. Actual IAM policies required to implement it will be covered in the following section.

- You set up a HUB-AND-SPOKE AWS account organization with root account as the HUB and dev, stage, prod and other environment accounts as SPOKES. In this setup resources of all environments are fully isolated from each other, which is a great security practice on its own. [This approach is recommended by AWS](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html).
- Permanent authentication credentials from HUB account are stored on employees' machines 24/7. These credentials are attached to employees' personal IAM users in HUB account and only allow one action which is role assumption in downstream accounts (`sts:AssumeRole` action). This combined with MFA requirement described below makes it safe to store these credentials on employees' machines 24/7.
- Granting of access to downstream accounts is done through IAM roles, and it always requires OTP multi-factor authentication step. This is an important security measure that is required for this CLI to work. To enable MFA, every employee creates and attaches an MFA device to their IAM user in AWS web console.
- AWS credentials downloaded onto the machine by this CLI after a successful authentication with a downstream AWS environment are AWS IAM role credentials which are temporary by their nature and expire in 1 hour by default. This effectively forces credential rotation on your employees' machines every hour. And if an employee stops using an AWS environment (e.g. switches to a different activity, end of work day) access gateways from their machine to the AWS account automatically expire, effectively keeping the company-wide attack surface of that account to a reasonable minimum at all times. 
- In this setup access to downstream environments can be regulated on a user-by-user basis since every employee receives a personal IAM user in the HUB account and can be restricted to possess only a certain set of IAM group memberships. For example a user might not be allowed to be a part of `PROD_ACCESS` IAM group.

# Example IAM policies

Below is an example setup that follows the principles outlined above. We look at what IAM groups, IAM users, IAM policies and roles we need to create in HUB and downstream environment accounts to implement this pattern.

Our organization setup is HUB account + dev, stage and prod AWS accounts. And we have 4 developers on the team: Bob, Harry, Alice and Tom.

#### HUB account setup
Create 3 IAM groups: 

- `DEV_ACCESS_FOR_DEVELOPERS`,
- `STAGE_ACCESS_FOR_DEVELOPERS` and
- `PROD_ACCESS_FOR_DEVELOPERS`.

Then create 4 IAM users for our developers: Bob, Harry, Alice, Tom.

IAM group `DEV_ACCESS_FOR_DEVELOPERS` has the following policy attached. It allows assuming `DEVELOPER` IAM role in the dev account (which has ID of `111111111111` in this example).
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MyNewRule",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": [
                "arn:aws:iam::111111111111:role/DEVELOPER"
            ]
        }
    ]
}
```

Similarly, IAM groups `STAGE_ACCESS_FOR_DEVELOPERS` and `PROD_ACCESS_FOR_DEVELOPERS` have a similar policy attached with the only difference being the account number (marked as `XXXXXXXXXXXX`):
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MyNewRule",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": [
                "arn:aws:iam::XXXXXXXXXXXX:role/DEVELOPER"
            ]
        }
    ]
}
```

Users Bob and Tom would only be allowed to access dev environment so the only only IAM group membership they will have is `DEV_ACCESS_FOR_DEVELOPERS`. Users Harry and Alice are senior developers so they will have access to all environments and will have membership in all 3 IAM groups.

#### DEV account setup

`DEVELOPER` role referenced in `DEV_ACCESS_FOR_DEVELOPERS` IAM group permissions must have the following _trust policy_ attached. Here `XXXXXXXXXXXX` refers to the HUB account ID. Trust policy controls which external accounts can assume this role. In our case we want to allow HUB account to do it.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::XXXXXXXXXXXX:root"
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

Condition section here requires MFA code to be present in the `sts:AssumeRole` request. `aacli` handles that by asking the user to provide it during `aacli auth` command execution. Every user in HUB account must attach their own MFA device to their user account (Google Authenticator or similar OTP solution) for this to work.

The actual permissions policy on this role would simply list the IAM permissions you'd want the developers to have when they authenticate into this environment. For example if you wanted to allow access to `SNS`, `API Gateway`, `S3`, `AWS Lambda`, `DynamoDB`, `CloudFormation` and `SQS` your policy would look as follows.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Rule1",
            "Effect": "Allow",
            "Action": [
                "sns:*",
                "apigateway:*",
                "s3:*",
                "lambda:*",
                "dynamodb:*",
                "cloudformation:*",
                "sqs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

Setup for `prod` and `stage` environments in our example would follow the exact same policy setup.

# How this CLI tool helps

This CLI tool allows to conveniently follow the security model described above. It supports and requires multi-factor authentication and provides a way to easily obtain programmatic access to your downstream AWS environments. It helps to securely manage HUB account credentials. Here are some important features:

- HUB account credentials are stored in the CLI config file on the disk that can be easily encrypted. If encrypted, user is required to provide a passphrase before performing any manipulations to the CLI config or performing a downstream authentication.
- CLI config can hold multiple sets of credentials for different HUB accounts.
- CLI interface features an easy to use interactive set of menus. A great usability improvement over more traditional interfaces of flags and options that are notoriously difficult to remember and slow things down.

# Quick reference

```
Usage: aacli <command>

Commands:
  aacli config  Configure this tool with your IAM credentials to enable downstream authentication.
  aacli auth    Authenticate into an AWS environment under a specific role for programmatic access.
  aacli web     Same as 'auth' command but authenticates into AWS environments in your BROWSER.
  aacli unauth  Delete any previously written temporary AWS credentials from disk (security practice).
  aacli crypto  Manage the encryption of the configuration file that stores your permanent AWS credentials.
  aacli reset   Erase the CLI configuration file to start anew. May be useful if you messed something up.

Options:
  --help     Show help                                                                                         [boolean]
  --version  Show version number                                                                               [boolean]

Documentation: https://github.com/iamarkadyt/aacli
```

# Extras

#### Renaming the CLI tool
You can fork this repository for yourself or your company and change the name of the CLI tool to something different by updating the name field in `package.json` file. All scripts, terminal logs and file system operations pull CLI name from this file. Just don't forget to update this README.md.

# License

```
The MIT License (MIT)

Copyright © 2021, Arkady Titenko

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
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```