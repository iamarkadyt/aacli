[<img src="https://badge.fury.io/js/@iamarkadyt%2Faws-auth.svg" alt="" />](https://www.npmjs.com/package/@iamarkadyt/aws-auth)

# What is this?

This CLI tool allows you to programmatically authenticate into AWS accounts through IAM roles in a multi-account [AWS organization](https://github.com/iamarkadyt/aws-auth/blob/master/DEVOPS.md) setup. It supports session management, stores all AWS credentials in an encrypted file and by default only grants AWS access through environment variable injection and subprocessing to avoid storing credentials on disk in plain text.

It supports and __requires__ MFA authentication which, combined with using AWS access credentials produced by authentication through IAM roles (temporary by design), makes it a secure and convenient way to authenticate into AWS. This means that when you authenticate into an AWS environment (AWS account) with this CLI, libraries like [aws sdk](https://aws.amazon.com/getting-started/tools-sdks/), [aws cdk](https://aws.amazon.com/cdk/), [aws cli](https://aws.amazon.com/cli/), [aws shell](https://github.com/awslabs/aws-shell), [aws sam](https://aws.amazon.com/serverless/sam/), [rclone](https://rclone.org/) __and any software dependent on them__, like custom deployment scripts or tools or any other scripts that access AWS, __obtain programmatic access to AWS resources__ located in that AWS account.

Here's a usage demo for a quick taste:

<img src="https://github.com/iamarkadyt/aws-auth/raw/master/media/login.gif" alt="login example" />

Notice how we never have to leave the terminal window or manually manipulate AWS credentials on the computer to switch between AWS accounts. This CLI provides a toolset for convenient and secure way of accessing AWS resources, managing AWS credentials and temporary sessions, and an easy way for rapid switching of roles and environments as needed.

For information on how this tool compares to similar open source projects out there, visit the [FAQ](#faq) section.

# Installation

To install this CLI, run:
```
npm install -g @iamarkadyt/aws-auth
```

# Usage

### Workflow

First, let's cover the basic workflow.
1. If you're using this CLI for the first time, you'll have to first configure it. Use `aws-auth config` command to do that. You will be asked to provide HUB account credentials in this step, as well as environment configuration JSON. We cover HUB accounts and enviornment configuration in more detail in the next section.
2. Once configured, use `aws-auth login` to create temporary AWS access sessions. This is the part that adds most security to this authentication flow as it requires MFA to create these temporary sessions, and AWS credentials obtained through this process expire in 1 hour by default (automatic rotation).
3. Once logged in, use `aws-auth run` command to invoke other commands in your terminal with AWS access. A few quick examples: `aws-auth run -- aws s3 ls` or `aws-auth run -- ./deploy-my-app.js`.

### More on configuration

During the first initialization of the config you will be asked to provide a passphrase. It will be used to encrypt the store that will hold all your AWS credentials. To change the encryption passphrase use `aws-auth crypto` command.

#### What is an "environment configuration"?

An environment configuration is a JSON array holding information about any downstream AWS environments (AWS accounts) that are available for authentication into. For example you may have a `dev` environment with following configuration:

```
{
    "environments": [
        {
            "name": "dev",
            "accountId": "12312312312",
            "region": "us-east-1",
            "roles": [ "DEVELOPER", "ADMIN", "READONLY" ]
        }
    ]
}
```

This configuration lets `aws-auth` know that there is an environment named `dev` with an account ID of `12312312312` located in `us-east-1` region that has 3 roles available for assumption.

Usually, at work, this configuration should be created, maintained and provided to you by the DevOps team. You would only need to paste it into this CLI to complete the configuration.

#### What is a HUB account?

A HUB account is the root account in the HUB-and-SPOKE multi-account setup that holds IAM users with permissions restricted to only one action -- `sts:AssumeRole`. Users obtain permanent credentials from this account and use them to assume roles in downstream accounts which may be named `dev`, `stage`, `prod`, etc. More information on this multi-account setup and how to implement it can be found in [DEVOPS.md](https://github.com/iamarkadyt/aws-auth/blob/master/DEVOPS.md).

Briefly, benefits of this setup are:
- All business resources are stored in downstream AWS accounts. HUB account only controls governance and access management.
- There is isolation between downstream environments which enhances network and access security, reduces blast radius in case of a breach, and allows for nice organization and separation of AWS resources.
- Access to AWS resources is granted through IAM role assumption which requires MFA and returns auto-expiring temporary AWS credentials.

It's important to note that this CLI was built around this multi-account model in the first place. You don't have to follow it, but it's HIGHLY recommended to do so. You can still use this CLI even if you have just 1 AWS account. The only required things are accessing AWS resources through role assumption and using MFA. Again, more details on how to implement this setup can be found in [DEVOPS.md](https://github.com/iamarkadyt/aws-auth/blob/master/DEVOPS.md).

#### What are profiles?

Profiles provide a convenient way to have multiple separate global configurations. An example use case is having `work` and `personal` profiles, where `work` holds credentials and environment configuration provided by the organization you may work for and `personal` holds configuration for your personal AWS accounts that you use for your side projects.

### More on authentication

Once the configuration file is created you can start authenticating into downstream AWS environments through `aws-auth login` command. Successful authentication creates an active session that is securely stored in CLI configuration files. You can have multiple active sessions at the same time, and you can also use `aws-auth unauth` command to revoke them all (erases all temporary AWS credentials from disk).

An existing active session can be used with `aws-auth run` command to execute a subcommand under a specified IAM role. Sessions have names that follow pattern of `profile/environment/role`. When you run `aws-auth run` command it presents a list of all existing active sessions that you can choose from to use for the provided subcommand. Run command signature is `aws-auth run -- <subcommand>`, an example invocation is `aws-auth run -- aws s3 ls`. Run command injects credentials into the subcommand passed after `--` sign through environment variables. Here's a full list of variables injected:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
AWS_DEFAULT_REGION
```

Here's a demo:

<img src="https://github.com/iamarkadyt/aws-auth/raw/master/media/login.gif" alt="login example" />

### Other commands

Other available commands are:

- `aws-auth reset` -- Deletes CLI configuration files. Might come useful if you decided to erase all configuration to start from scratch.
- `aws-auth web` -- Opens up a browser tab to authenticate you into the selected AWS environment in AWS web console.
- `aws-auth sesh` -- Lists all sessions (active and expired) currently located in your encrypted store. Useful to check if you need to re-login soon.

# Project goals

This project was born from an effort to figure out a _simple_ yet _reasonably secure_ way of _programmatic_ authentication into AWS environments _with support for MFA authentication_.

The regular approach taken by many software companies is either:

- Using expensive SSO solutions (3rd party single sign-on SaaS platforms) and writing custom CLI toolkits for integrating with said platforms for programmatic AWS access (early and unnecessary complexity,  financial and development time costs).
- Or not using any MFA at all and just using plain permanent AWS IAM user credentials (terribly insecure).

This project aims to provide a secure and efficient alternative solution to both of these options. It's a great tool for bootstrappers or any early-stage software startup built on AWS, that is not yet ready to invest into solutions like Okta which cost thousands of dollars in upfront costs (annual contract minimums) but want to have a great day-to-day cloud operations security to keep the attack surface of their digital business to a minimum.

# Contributing

All contributions are welcome! And if you have any questions please don't hesitate to reach out and start a thread in the `Discussions` tab up on this page.

For guidelines see [CONTRIBUTING.md](https://github.com/iamarkadyt/aws-auth/blob/master/CONTRIBUTING.md).

# FAQ

### How does it compare with `aws-vault`?

This tool is quite similar in functionality when compared with `aws-vault`. However, here are some important differences:

* Easier interactive interface. This tool does not require you to remember anything except your password. No flags or switches. Just run it and you'll be presented with a set of interactive menus controllable by your keyboard arrow keys. This project puts simplicity of use and user experience at the top of the priority list.

* Easier to contribute. It's written in `javascript`, and is also very lightweight - there are only about a dozen of `.js` files in the project, making it ideal for forking and modifying for your specific needs. With `aws-vault` on the other hand you have to be familiar with `golang` and be willing to spend more time on learning the codebase since it is significantly larger.

* Since this tool is written in just `javascript` it allows you to inspect it's code at any point of time - before or after the installation. The only requirement is knowing `javascript`. This may be a big benefit to you if you're a security conscious person, or you are not familiar with `golang` which is the language that `aws-vault` was written in.

* The `aws-vault` on the other hand is distributed as a binary, and it's not possible to inspect the the distribution for malicious code after it was installed. Your only option is source code, but how do you know that what ended up on your machine is what was built from the sources that you reviewed?

* Since this tool it fairly fresh, it doesn't support common OS keyring integrations like `aws-vault`. But in our opinion keyrings are a terribly insecure way of storing the secrets since they are often kept open throughtout the entire user session on a machine **for convenience**. Having data stored in a simple encrypted file that needs to be decrypted with every operation, like `aws-auth` does it, is far more secure.

### How does it compare with `saml2aws`?

We currently do not integrate with any `Active Directory` products or support `SAML` federations, so if that's what you need you would be better off using `saml2aws`. The `aws-auth` tool is focused on providing an authentication solution for the early stage startups that often cannot afford purchasing any third-party software licenses. And it does so by using the cheapest possible option - built in AWS user and identity management solution - IAM.

We also think that `SAML` is inherently [insecure](https://joonas.fi/2021/08/saml-is-insecure-by-design/).

### Does it integrate with `AWS SSO`?

We currently do not integrate with AWS SSO. We have a neutral opinion on this AWS offering, however, you might be interested in seeing [this post](https://news.ycombinator.com/item?id=29092797):

_AWS SSO has one huge gotcha that makes it nigh impossible to use well (from a security perspective). Instead of using bog-standard IAM roles, AWS SSO reinvents the wheel and asks you to create a "Permission Set". What's the difference between a Permission Set and an IAM role? Whereas with an IAM role, you can attach multiple IAM policies to a single role, with a Permission Set you can only use a single inline policy or AWS managed policies. A single inline policy is nearly impossible to maintain, you reach maximum policy size extremely quickly, and AWS managed policies are a security nightmare with wildcards everywhere._

_And behind the scenes, AWS SSO sets up the exact same SAML infrastructure that is available to you already in IAM, just with roles with unpredictable names (so that it's difficult to programmatically attach policies) with "DONOTDELETE" as part of the name but no actual SCP in place to prevent the role from being deleted. Because it's the same exact SAML infrastructure, but with additional redirects to allow you to login through the AWS SSO start page instead, it's slower compared to setting up SAML access per AWS account directly._

_AWS SSO is a horrible product that actually encourages poor security practice (i.e. AWS managed policies, because a single inline policy is not large enough) and really the only reason why anybody bothers using it is because SAML login from the AWS CLI tooling is not well-supported by AWS._

# License

```
The MIT License (MIT)

Copyright © 2022, Arkady Titenko

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
