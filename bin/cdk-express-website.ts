#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkExpressWebsiteStack } from '../lib/cdk-express-website-stack';
import { CertificateStack } from '../lib/certificate-stack';

const app = new cdk.App();
const certificateStack = new CertificateStack(app, 'CertificateStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1', // Hay que poner esta región
  },
  crossRegionReferences: true,
});

new CdkExpressWebsiteStack(app, 'CdkExpressWebsiteStack', certificateStack.certificate, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  crossRegionReferences: true,
});