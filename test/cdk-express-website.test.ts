import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CdkExpressWebsiteStack } from '../lib/cdk-express-website-stack';
import { CertificateStack } from '../lib/certificate-stack';
import { PrivateBucket } from '../lib/constructs/private-bucket';
import { LambdaProcessor } from '../lib/constructs/lambda';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

describe('CertificateStack', () => {
  let app: cdk.App;
  let stack: CertificateStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CertificateStack(app, 'TestCertificateStack', {
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('creates an ACM certificate', () => {
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
  });

  test('certificate has correct domain name', () => {
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'vdiaz-aws.cloud',
    });
  });

  test('certificate has subject alternative names', () => {
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      SubjectAlternativeNames: ['www.vdiaz-aws.cloud'],
    });
  });

  test('certificate uses DNS validation', () => {
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainValidationOptions: Match.arrayWith([
        Match.objectLike({
          DomainName: 'vdiaz-aws.cloud',
        }),
      ]),
    });
  });

  test('certificate property is accessible', () => {
    expect(stack.certificate).toBeDefined();
  });
});

describe('CdkExpressWebsiteStack', () => {
  let app: cdk.App;
  let certificateStack: CertificateStack;
  let stack: CdkExpressWebsiteStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    certificateStack = new CertificateStack(app, 'TestCertStack', {
      env: { region: 'us-east-1' },
      crossRegionReferences: true,
    });
    stack = new CdkExpressWebsiteStack(
      app,
      'TestWebStack',
      {
        crossRegionReferences: true,
      }
    );
    template = Template.fromStack(stack);
  });

  test('creates an S3 bucket for website', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('S3 bucket has destroy removal policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  test('S3 bucket blocks public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('creates a CloudFront distribution', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('CloudFront distribution has correct domain names', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        Aliases: ['vdiaz-aws.cloud', 'www.vdiaz-aws.cloud'],
      }),
    });
  });

  test('CloudFront distribution uses HTTPS redirect', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
        }),
      }),
    });
  });

  test('CloudFront distribution has default root object', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
      }),
    });
  });

  test('CloudFront distribution uses PRICE_CLASS_100', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        PriceClass: 'PriceClass_100',
      }),
    });
  });

  test('CloudFront has custom error responses', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
          Match.objectLike({
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
        ]),
      }),
    });
  });

  test('creates bucket deployment', () => {
    template.resourceCountIs('Custom::CDKBucketDeployment', 1);
  });

  test('CloudFront uses Origin Access Control', () => {
    template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
  });
});

describe('PrivateBucket Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let privateBucket: PrivateBucket;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    privateBucket = new PrivateBucket(stack, 'TestPrivateBucket', {
      versioned: true,
      name: 'test-bucket-name',
      publicReadAccess: false,
    });
    template = Template.fromStack(stack);
  });

  test('creates bucket with provided name', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-bucket-name',
    });
  });

  test('enables versioning when specified', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('blocks all public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('has destroy removal policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
    });
  });

  test('bucketName property is accessible', () => {
    expect(privateBucket.bucketName).toBe('test-bucket-name');
  });

  test('disables public read access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true,
      }),
    });
  });
});

describe('LambdaProcessor Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let lambdaProcessor: LambdaProcessor;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  test('creates Lambda function with correct properties', () => {
    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
      environment: {
        TEST_VAR: 'test-value',
      },
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'index.handler',
      Environment: {
        Variables: {
          TEST_VAR: 'test-value',
        },
      },
    });
  });

  test('creates IAM role for Lambda execution', () => {
    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('attaches custom policies when provided', () => {
    const customPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::test-bucket/*'],
    });

    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
      rolePolicies: [customPolicy],
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Resource: 'arn:aws:s3:::test-bucket/*',
          },
        ]),
      },
    });
  });

  test('lambdaFunction property is accessible', () => {
    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
    });

    expect(lambdaProcessor.lambdaFunction).toBeDefined();
    expect(lambdaProcessor.lambdaFunction).toBeInstanceOf(lambda.Function);
  });

  test('handles empty environment variables', () => {
    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 1);
  });

  test('handles multiple role policies', () => {
    const policy1 = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['*'],
    });
    const policy2 = new iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      resources: ['*'],
    });

    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
      rolePolicies: [policy1, policy2],
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:GetObject',
          }),
          Match.objectLike({
            Action: 'dynamodb:Query',
          }),
        ]),
      },
    });
  });
});

describe('Stack Integration Tests', () => {
  test('CertificateStack and CdkExpressWebsiteStack integrate correctly', () => {
    const app = new cdk.App();
    const certStack = new CertificateStack(app, 'CertStack', {
      env: { region: 'us-east-1' },
      crossRegionReferences: true,
    });
    const webStack = new CdkExpressWebsiteStack(
      app,
      'WebStack',
      {
        crossRegionReferences: true,
      }
    );

    expect(certStack.certificate).toBeDefined();
    expect(webStack).toBeDefined();
  });

  test('both stacks can be instantiated with cross-region references', () => {
    const app = new cdk.App();

    const certStack = new CertificateStack(app, 'CertStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      crossRegionReferences: true,
    });

    const webStack = new CdkExpressWebsiteStack(
      app,
      'WebStack',
      {
        env: { account: '123456789012', region: 'us-west-2' },
        crossRegionReferences: true,
      }
    );

    expect(certStack).toBeDefined();
    expect(webStack).toBeDefined();
  });
});
