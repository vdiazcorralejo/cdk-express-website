#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CdkExpressWebsiteStack } from '../lib/cdk-express-website-stack';

const app = new cdk.App();
new CdkExpressWebsiteStack(app, 'CdkExpressWebsiteStack', {
 
  //env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

}); 
