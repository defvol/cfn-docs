# cfn-docs

Find documentation for AWS CloudFormation.

From the CLI:

```bash
% cfn-docs AWS::EC2::SecurityGroup
{
  "name": "AWS::EC2::SecurityGroup",
  "excerpt": "Creates an Amazon EC2 security group. To create a VPC security group, use the VpcId property.",
  "link": "http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ec2-security-group.html",
  "syntax": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "String",
      "SecurityGroupEgress": [ "Security Group Rule", "..." ],
      "SecurityGroupIngress": [ "Security Group Rule", "..." ],
      "Tags":  [ "Resource Tag", "..." ],
      "VpcId": "String"
    }
  }
}
```

From Javascript land:

```js
const CFNDocs = require('./index');
CFNDocs.find('AWS::EC2::SecurityGroup');
```
