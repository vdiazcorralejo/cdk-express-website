import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkExpressWebsiteStack } from './cdk-express-website-stack';

export class CdkExpressWebsiteStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new CdkExpressWebsiteStack(this, 'CdkExpressWebsiteStack', {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
  }
}