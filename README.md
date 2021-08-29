# Table of contents



# What is this?

This CLI tool allows you to programmatically authenticate with AWS environments through IAM roles. It supports MFA authentication, which combined with temporary IAM credentials provided by authentication through IAM roles makes it a great way to authenticate with AWS environments in a secure manner.

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

Next up create a profile:
```
aacli config
```

Once a profile is created it can be used to authenticate into AWS environments:
```
aacli auth
```

For more information see help reference:
```
aacli help
```

# Usage

#### Authentication

Commands: `auth`, `unauth`, `web`


<img src="https://github.com/iamarkadyt/aacli/raw/master/media/usage-0.gif" alt="usage example" />

#### Configuration

Commands: `config`, `reset`, `crypto`


# Project goals

This project was born from an effort to figure out a _simple_ yet _reasonably secure_ way of _programmatic_ AND _web-based_ authentication into AWS environments.

The regular approach taken by many software companies is either:

- Using expensive SSO solutions (3rd party single sign-on SaaS platforms) and writing custom CLI toolkits for integrating with said platforms for programmatic AWS access (complexity, unnecessary development time and financial costs).
- Or just using plain permanent AWS IAM user credentials (terribly insecure).

This project aims to provide a secure and efficient middle-ground alternative to both options.

# Secure AWS authentication model

<img src="https://github.com/iamarkadyt/aacli/raw/master/media/aws-flow.png" alt="secure aws flow diagram" />

Here is a schema of a secure and practical AWS authentication flow:

- You set up a HUB-AND-SPOKE AWS account organization with root account as the HUB and dev, stage, prod and other environment accounts as SPOKES. In this setup resources of all environments are fully isolated from each other, which is a great security practice on its own. [This approach is recommended by AWS](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html).
- Permanent authentication credentials for HUB account are stored on employees' machines. These credentials are attached to employees' personal IAM users in HUB account whose IAM permissions only allow them to assume roles in downstream accounts.
- Granting of access to downstream accounts is done through IAM roles, and it always requires OTP multi-factor authentication step.
- AWS credentials downloaded onto the machine after a successful authentication with a downstream AWS environment are AWS IAM role credentials which are temporary by their nature and expire in 1 hour by default. This effectively forces credential rotation on your employees' machines every hour. And if an employee stops using an AWS environment (e.g. switched to a different activity, end of work day) access gateways from their machine to the AWS account automatically expire, effectively keeping the company-wide attack surface of that account to a reasonable minimum at all times. 
- In this setup access to downstream environments can be regulated on a user-by-user basis since every employee receives a personal IAM user in the HUB account and can be restricted to possess only a certain set of IAM group memberships. For example a user might not be allowed to be a part of PROD_USERS IAM group.

# How this CLI tool helps

This CLI tool allows to conveniently follow the security model described above. It helps to securely manage HUB account credentials and easily perform downstream AWS account authentication. Here are some important features:

- HUB account credentials are stored in the encrypted config file on the disk. Employee is required to provide a passphrase before performing any manipulations to the CLI config or performing downstream authentication.
- CLI config can hold multiple sets of credentials for different HUB accounts.
- CLI interface features an easy to use interactive set of menus. A great usability improvement over more traditional interfaces of flags and options that are notoriously difficult to remember and slow things down.

# CLI quick reference

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

#### Disabling config encryption
To enable hidden decryption option in `aacli crypto` command that allows you to decrypt the configuration file (not recommended for security reasons) enable the following feature flag:
```
FF_AACLI_DISABLE_ENFORCE_ENCRYPTION=1 aacli crypto
```
You can also export this variable in your shell config file to persist it. E.g. in `~/.bashrc`:
```
export FF_AACLI_DISABLE_ENFORCE_ENCRYPTION=1
```

Then refresh your current shell to reload the rc file:
```
$ source ~/.bashrc
```

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