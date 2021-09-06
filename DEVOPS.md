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

Condition section here requires MFA code to be present in the `sts:AssumeRole` request. `aws-auth` handles that by asking the user to provide it during `aws-auth auth` command execution. Every user in the HUB account must attach their own MFA device to their user account (Google Authenticator or similar OTP solution) for this to work.

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

# Other

#### CLI config file

- HUB account credentials are stored in the CLI config file on the disk that can be easily encrypted with `aws-auth crypto` command. If encrypted, a user is required to provide a passphrase before performing any manipulations to the CLI config or performing a downstream authentication.
- CLI config can hold multiple sets of credentials for different HUB accounts.

#### Renaming the CLI tool

You can fork this repository for yourself or your company and change the name of the CLI tool to something different by updating the name field in `package.json` file. All scripts, terminal logs, and file system operations pull the CLI name from this file. Just don't forget to refactor this README.md. Namespaces are accounted for as well. For example, if the name field in `package.json` was to be `@orgname/cliname` CLI name would be read as `cliname`, and therefore CLI configuration files directory on disk would be named `~/.cliname`.
