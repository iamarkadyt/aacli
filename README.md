<img src="https://github.com/iamarkadyt/aacli/raw/master/media/cli-cmd-auth-unauth.gif" alt="auth usage example" />

# What is this?

This CLI tool allows you to programmatically authenticate into AWS accounts through IAM roles in a multi-account [AWS Organizations](https://aws.amazon.com/organizations/) setup. It supports and __requires__ MFA authentication which, combined with using AWS access credentials produced by authentication through IAM roles (temporary by design), makes it a secure and convenient way to authenticate into AWS.

This means that when you authenticate into an AWS environment (AWS account) with this CLI, libraries like [aws sdk](https://aws.amazon.com/getting-started/tools-sdks/), [aws cdk](https://aws.amazon.com/cdk/), [aws cli](https://aws.amazon.com/cli/), [aws shell](https://github.com/awslabs/aws-shell), [aws sam](https://aws.amazon.com/serverless/sam/), [rclone](https://rclone.org/) __and any software dependent on them__, like custom deployment scripts or tools or any other scripts that access AWS, __obtain access to AWS resources__ located in that AWS account. All because these libraries pull credentials from `~/.aws/credentials` file on disk which this CLI tool updates upon every authentication.

So, as an example, you could use this CLI to authenticate into a `dev` environment, run deployment scripts right on your local machine to upload code into your `dev` AWS account, test your changes, and once ready, authenticate into `prod` environment to deploy your changes to production. All without ever leaving your terminal window or having to manipulate AWS credentials on your computer to switch between AWS accounts. It's a convenient and secure way to access AWS resources, manage AWS credentials, provide programmatic access to AWS for software running on your machine, and an easy way to rapidly switch roles and environments as needed.

# Installation

To install this CLI, run:
```
npm install -g @iamarkadyt/aacli
```

# Usage

To begin using this CLI you will first need to create a configuration file before you can start authenticating into AWS environments. This configuration file will hold your IAM user credentials from the HUB account as well as information about downstream AWS environments that you have: their account IDs, names, regions they are located in, and what roles are available in those accounts for assumption. Make sure to check out [secure AWS authentication model](https://github.com/iamarkadyt/aacli/blob/master/DEVOPS.md) section below to learn how to implement this multi-account setup. Please don't skip it, this model is what this CLI tool was built for in the first place.

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

# Contributing

All contributions are welcome! And if you have any questions please don't hesitate to reach out and start a thread in the `Discussions` tab up on this page.

Below are main design practices to abide by. They help keep this software easy and convenient to use. And user experience is the number 1 priority!
- _The less user has to configure, the better!_ As much as possible any information required to do something must be deduced from available user input rather than asked from a user. As much as we can, we should store any information we work with in the configuration files to avoid asking for information twice. Additionally, if some information can be retrieved by making a call to AWS API then that should be always tried first.
- _The less user has to remember, things like CLI flags or parameters or arguments, the better._ This is the reason behind choosing interactive menus over more traditional switch interfaces.

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
