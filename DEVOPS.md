# Secure AWS authentication model

<img src="https://github.com/iamarkadyt/aws-auth/raw/master/media/aws-flow.png" alt="secure aws flow diagram" />

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

In addition, this CLI requires encryption of all credential-holding files on disk with a custom passphrase chosen by the user.

# Example IAM policies

Below is an example setup that follows the principles outlined above. We look at what IAM groups, IAM users, IAM policies, and roles we need to create in HUB and downstream environment accounts to implement this pattern.

Our organization setup is HUB account + `dev`, `stage` and, `prod` AWS accounts. And we have 4 developers on the team: Bob, Harry, Alice, and Tom.

#### HUB account setup

Create 3 IAM groups: 

- `DEV_ACCESS_FOR_DEVELOPERS`,
- `STAGE_ACCESS_FOR_DEVELOPERS` and
- `PROD_ACCESS_FOR_DEVELOPERS`.

Then create 4 IAM users for our developers: Bob, Harry, Alice, Tom. After IAM users are created, everyone creates and assigns an MFA device (like Google Authenticator) to their IAM user.

IAM group `DEV_ACCESS_FOR_DEVELOPERS` has the following policy attached. It allows assuming `DEVELOPER` IAM role in the `dev` account (which has an ID of `111111111111` in this example).
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

Similarly, IAM groups `STAGE_ACCESS_FOR_DEVELOPERS` and `PROD_ACCESS_FOR_DEVELOPERS` have a similar policy attached with the only difference being the account number.

Users Bob and Tom would only be allowed to access the `dev` environment so the only IAM group membership they will have is `DEV_ACCESS_FOR_DEVELOPERS`. Users Harry and Alice are senior developers so they will have access to all environments and will have membership in all 3 IAM groups.

#### DEV account setup

`DEVELOPER` role referenced in `DEV_ACCESS_FOR_DEVELOPERS` IAM group permissions is what we're going to use to grant access to AWS resources in `dev` environment to members of `DEV_ACCESS_FOR_DEVELOPERS`. It must have the following _trust policy_ attached. Here `XXXXXXXXXXXX` refers to the HUB account ID. Trust policy controls which external accounts can assume this role. In our case, we want to allow the HUB account to do it.

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

Condition section here requires MFA code to be present in the `sts:AssumeRole` request. `aws-auth` handles that by asking the user to provide it during `aws-auth login` command execution. Every user in the HUB account must attach their own MFA device to their user account (Google Authenticator or similar OTP solution) for this to work.

The actual _permissions_ policy on this role would control the resources that you'd want the developers to have access to when they authenticate into this environment. For example, if you wanted to allow access to `SNS`, `API Gateway`, `S3`, `AWS Lambda`, `DynamoDB`, `CloudFormation`, and `SQS` your policy would look as follows.

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

# Other

#### Feature flags

If security is not a top priority for you, there are some feature flags you can disable to reduce usage friction. This is not recommended, however.

To enable a feature flag add the following to your `~/.bashrc`:
```
export FEATURE_FLAG=1
```

Or run `aws-auth` like this:
```
$ FEATURE_FLAG=1 aws-auth <command>
```

`FF_AWS-AUTH_INSECURE_USE_AWS_CREDENTIALS_FILE`

If enabled, temporary AWS credentials are also written to `~/.aws/credentials` file upon authentication into an AWS environment. This provides system-wide access to your AWS requirement for all processes that will ask for it, whether you want it or not, because it's stored in plain text in a location where all AWS SDKs always automatically look into. Which can be useful, but is not recommended. If you enable this, you don't need to use `aws-auth run` command because all binaries using AWS SDKs on your system will automatically obtain access to the AWS environment that you authenticated into.

`FF_AWS-AUTH_INSECURE_USE_WEAK_PASSWORDS`

If enabled, reduces the password requirements to just 8 characters. No special characters or digits will be required.

`FF_AWS-AUTH_INSECURE_DISABLE_ENCRYPTION`

All AWS credentials are stored in the CLI configuration files on disk which is encrypted by default. Passphrase can be changed with `aws-auth crypto` command. However this command can also used to disable encryption entirely. If feature flag above is enabled, a few secret options appear in the `aws-auth crypto` command output that allow to decrypt the configuration files.

When a configuration file is encrypted, a user is required to provide a passphrase before performing any manipulations to the CLI config or performing a downstream authentication. When it's decrypted, passphrase is not asked for any operations. But with that your AWS credentials, both temporary and permanent, are stored in plain text on disk in `~/.aws-auth` directory.

#### Renaming the CLI tool

You can fork this repository for yourself or your company and change the name of the CLI tool to something different by updating the name field in `package.json` file. All scripts, terminal logs, and file system operations pull the CLI name from this file. Just don't forget to refactor this README.md. Namespaces are accounted for as well. For example, if the name field in `package.json` was to be `@orgname/cliname` CLI name would be read as `cliname`, and therefore CLI configuration files directory on disk would be named `~/.cliname`.

#### Metadata servers

This CLI does not support simulating AWS metadata servers because they are inherently insecure. Access to your AWS credentials is provided in plain text to anyone who asks for it. This is even more inferior to storing credentials in plaintext on disk because you can't control even file permissions.

Instead, we suggest that you set up IAM roles that allow longer sessions, AWS supports ranges of up to 12 hours for non role-chaining role assumption operations. This will keep your credentials secure in the encrypted CLI configuration files, while providing an uninterrupted access to AWS for up to 12 hours, which is the problem that metadata servers were created to solve. During `aws-auth login` you can specify preferred session duration (IAM Role being assumed must allow it in it's settings). Just avoid role-chaining. That is when you assume a role from a role, something that this CLI was not built to support, really. AWS imposes certain limits on role-chaining like restricting certain IAM actions and limiting the session duration to 1 hour maximum. To avoid role-chaining always assume roles from IAM user credentials. This is the default behaviour, you add your HUB account credentials into your CLI configuration, then start to assume IAM roles.