<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-auth-unauth.gif" alt="auth usage example" />

# What is this?

This CLI tool allows you to programmatically authenticate into AWS accounts through IAM roles in a multi-account [AWS Organizations](https://aws.amazon.com/organizations/) setup. It supports and __requires__ MFA authentication which, combined with using AWS access credentials produced by authentication through IAM roles (temporary by design), makes it a secure and convenient way to authenticate into AWS.

This means that when you authenticate into an AWS environment (AWS account) with this CLI, packages listed below __and any software dependent on them__, like custom deployment scripts or tools or any other scripts that access AWS, __obtain access to AWS resources__ located in that AWS account. All because libraries below pull credentials from `~/.aws/credentials` file on disk which this CLI tool updates upon every authentication.

Libraries that read AWS credentials from `~/.aws/credentials`. List is not exhaustive at all. This authentication flow will continue to work with any other existing and future AWS libraries as well because they all seem to follow the same pattern for accessing AWS credentials from disk.
- [AWS SDK](https://aws.amazon.com/getting-started/tools-sdks/). Library used for accessing AWS APIs and managing AWS resources directly from your code.
- [AWS CDK](https://aws.amazon.com/cdk/). Library that helps define cloud infrastructure using familiar programming languages. Provides CLI for IaC code deployments.
- [AWS CLI](https://aws.amazon.com/cli/). CLI provided by AWS that allows you to manage AWS resources right from your terminal window.
- [AWS Shell](https://github.com/awslabs/aws-shell). "The interactive productivity booster for the AWS CLI".
- [AWS SAM](https://aws.amazon.com/serverless/sam/). Toolkit and CLI for building and managing serverless applications and CloudFormation templates.
- [RCLONE](https://rclone.org/). Data management utility that helps with synchronizing and moving large amounts of data between cloud and local storage.

So, as an example, you could use this CLI to authenticate into a `dev` environment, run deployment scripts right on your local machine to upload code into your `dev` AWS account, test your changes, and once ready, authenticate into `prod` environment to deploy your changes to production. All without ever leaving your terminal window or having to manipulate AWS credentials on your computer to switch between AWS accounts. It's a convenient and secure way to access AWS resources, manage AWS credentials, provide programmatic access to AWS for software running on your machine, and an easy way to rapidly switch roles and environments as needed.

# Installation

To install this CLI, run:
```
npm install -g @iamarkadyt/aacli
```

# Usage

To begin using this CLI you will first need to create a configuration file before you can start authenticating into AWS environments. This configuration file will hold your IAM user credentials from HUB account as well as information about downstream AWS environments like account IDs, environment names, regions they are located in, and what roles are available for assumption. Make sure to check out [secure AWS authentication model](#secure-aws-authentication-model) section below for more information on what is a HUB account and a multi-account setup model. Please don't skip it! This model is what this CLI tool was built for in the first place.

#### Creating and managing the CLI configuration file

To create or edit your CLI configuration file, run `aacli config` command. You can create new profiles, edit existing ones or delete them.

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-config.gif" alt="config usage example" />

You can also manage the encryption of your configuration file with `aacli crypto` command. We recommend keeping your config file encrypted at all times as a good security practice.

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-crypto.gif" alt="crypto usage example" />

#### Authentication

Once the configuration file is created you can start authenticating into downstream AWS environments through `aacli auth` command. You can also use `aacli unauth` command to revoke access to an AWS environment (erases temporary AWS credentials from disk).

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-auth-unauth.gif" alt="auth usage example" />

#### Other commands

Other available commands are:

- `aacli reset` -- Deletes CLI configuration file. May be useful if you mess it up and want to start anew.
- `aacli web` -- Opens up a browser tab to authenticate you into the selected AWS environment in AWS web console.

# Project goals

This project was born from an effort to figure out a _simple_ yet _reasonably secure_ way of _programmatic_ authentication into AWS environments _with support for MFA authentication_.

The regular approach taken by many software companies is either:

- Using expensive SSO solutions (3rd party single sign-on SaaS platforms) and writing custom CLI toolkits for integrating with said platforms for programmatic AWS access (early and unnecessary complexity,  financial and development time costs).
- Or not using any MFA at all and just using plain permanent AWS IAM user credentials (terribly insecure).

This project aims to provide a secure and efficient alternative solution to both of these options. It's a great tool for bootstrappers or any early-stage software startup built on AWS, that is not yet ready to invest into solutions like Okta which cost thousands of dollars in upfront costs (annual contract minimums) but want to have a great day-to-day cloud operations security to keep the attack surface of their digital business to a minimum.

# Secure AWS authentication model

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/aws-flow.png" alt="secure aws flow diagram" />

#### What is a HUB account? And what is a multi-account setup?

A multi-account setup is exactly what you have on the image above. It's a HUB account in the center and a bunch of downstream accounts around it. The HUB-and-SPOKE model. And here's how it works:

- You set up an [AWS organization](https://aws.amazon.com/organizations/) with root account as the `HUB` and `dev`, `stage`, `prod`, and other environment accounts as SPOKES. In this setup resources of all environments are fully isolated from each other, which is a great security practice on its own. [This approach is recommended by AWS](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html).
- A user always first authenticates into the HUB account through their IAM user credentials. These credentials are always stored on the user's machine and only allow one action which is role assumption in downstream accounts (`sts:AssumeRole` action).
- Once authenticated they then assume a role in one of the downstream environment accounts using MFA codes (crucial step). These pre-created roles could be named `DEVELOPER`, `READONLY`, `ADMIN`, etc. Depending on what role they assume they receive a certain set of permissions that restricts what they can interact with inside the environment account that they authenticate into.

#### Benefits of this authentication model

- Access to downstream environments can be regulated on a per-user basis since every user receives a personal IAM user in the HUB account and can be restricted to possess only a certain set of IAM group memberships. For example a user Tom might not be allowed to be a part of the `PROD_ACCESS` IAM group.
- Role assumption operation always returns _temporary_ AWS credentials that expire in 1 hour by default, effectively forcing users to rotate their credentials every hour (great security practice). In a scenario where some malware steals credentials from a user's machine, by the time a real person (attacker) gets to them they are already _worthless_.
- Since role assumption requires MFA confirmation, a one-time passcode (OTP) provided by the user to confirm their identity, there is no risk in HUB account credentials being stolen either, because unless the attacker possesses access to the OTP codes generator these credentials are _worthless_ too because they only allow one action which is `sts:AssumeRole` and the role assumption operation is gated by MFA.

To enable MFA, every user creates and attaches an MFA device to their IAM user in HUB account in AWS web console.

In addition, this CLI offers an option to encrypt HUB account credentials on disk with a custom passphrase chosen by the user.

# Example IAM policies

Below is an example setup that follows the principles outlined above. We look at what IAM groups, IAM users, IAM policies, and roles we need to create in HUB and downstream environment accounts to implement this pattern.

Our organization setup is HUB account + `dev`, `stage` and, `prod` AWS accounts. And we have 4 developers on the team: Bob, Harry, Alice, and Tom.

#### HUB account setup

Create 3 IAM groups: 

- `DEV_ACCESS_FOR_DEVELOPERS`,
- `STAGE_ACCESS_FOR_DEVELOPERS` and
- `PROD_ACCESS_FOR_DEVELOPERS`.

Then create 4 IAM users for our developers: Bob, Harry, Alice, Tom.

IAM group `DEV_ACCESS_FOR_DEVELOPERS` has the following policy attached. It allows assuming `DEVELOPER` IAM role in the dev account (which has an ID of `111111111111` in this example).
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

Users Bob and Tom would only be allowed to access the `dev` environment so the only IAM group membership they will have is `DEV_ACCESS_FOR_DEVELOPERS`. Users Harry and Alice are senior developers so they will have access to all environments and will have membership in all 3 IAM groups.

#### DEV account setup

`DEVELOPER` role referenced in `DEV_ACCESS_FOR_DEVELOPERS` IAM group permissions must have the following _trust policy_ attached. Here `XXXXXXXXXXXX` refers to the HUB account ID. Trust policy controls which external accounts can assume this role. In our case, we want to allow the HUB account to do it.

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

Condition section here requires MFA code to be present in the `sts:AssumeRole` request. `aacli` handles that by asking the user to provide it during `aacli auth` command execution. Every user in the HUB account must attach their own MFA device to their user account (Google Authenticator or similar OTP solution) for this to work.

The _permissions_ policy on this role would simply list the IAM permissions you'd want the developers to have when they authenticate into this environment. For example, if you wanted to allow access to `SNS`, `API Gateway`, `S3`, `AWS Lambda`, `DynamoDB`, `CloudFormation`, and `SQS` your policy would look as follows.

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

This CLI tool allows to conveniently follow the security model described above. It was built around it! It supports and __requires__ multi-factor authentication and provides a way to easily authenticate into downstream AWS environments, securely manage HUB account credentials, and rapidly change roles and environments when you need it.

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

# Contributing

All contributions are welcome! And if you have any questions please don't hesitate to reach out and start a thread in the `Discussions` tab up on this page.

# Other

#### CLI config file

- HUB account credentials are stored in the CLI config file on the disk that can be easily encrypted with `aacli crypto` command. If encrypted, a user is required to provide a passphrase before performing any manipulations to the CLI config or performing a downstream authentication.
- CLI config can hold multiple sets of credentials for different HUB accounts.

#### Renaming the CLI tool

You can fork this repository for yourself or your company and change the name of the CLI tool to something different by updating the name field in `package.json` file. All scripts, terminal logs, and file system operations pull the CLI name from this file. Just don't forget to refactor this README.md. Namespaces are accounted for as well. For example, if the name field in `package.json` was to be `@orgname/cliname` CLI name would be read as `cliname`, and therefore CLI configuration files directory on disk would be named `~/.cliname`.

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
FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
