import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CdkExpressWebsiteStack } from '../lib/cdk-express-website-stack';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { StorageStack } from '../lib/storage-stack';
import { PrivateBucket } from '../lib/constructs/private-bucket';
import { LambdaProcessor } from '../lib/constructs/lambda';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

describe('CdkExpressWebsiteStack', () => {
  let app: cdk.App;
  let stack: CdkExpressWebsiteStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CdkExpressWebsiteStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('creates a private S3 bucket with versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'my-private-bucket-vdiaz',
      VersioningConfiguration: {
        Status: 'Enabled'
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('creates a Lambda function with correct runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'index.handler'
    });
  });

  test('Lambda function has environment variable with bucket name', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          BUCKET_NAME: Match.stringLikeRegexp('my-private-bucket-vdiaz')
        }
      }
    });
  });

  test('Lambda execution role has S3 read permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:GetObject',
            Effect: 'Allow',
            Resource: Match.anyValue()
          })
        ])
      }
    });
  });

  test('creates exactly one S3 bucket', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('creates exactly one Lambda function', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
  });
});

describe('BackendStack', () => {
  let app: cdk.App;
  let stack: BackendStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new BackendStack(app, 'TestBackendStack');
    template = Template.fromStack(stack);
  });

  test('creates a backend Lambda function', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'backend.handler'
    });
  });

  test('exports backend Lambda name', () => {
    template.hasOutput('BackendLambdaName', {
      Export: {
        Name: 'BackendLambdaName2'
      }
    });
  });

  test('exports frontend bucket name', () => {
    template.hasOutput('FrontendBucketName', {
      Export: {
        Name: 'FrontendBucketName2'
      }
    });
  });

  test('backendLambda property is defined', () => {
    expect(stack.backendLambda).toBeDefined();
    expect(stack.backendLambda).toBeInstanceOf(lambda.Function);
  });

  test('bucket property is defined from FrontendStack', () => {
    expect(stack.bucket).toBeDefined();
  });

  test('frontendLambda property is defined', () => {
    expect(stack.frontendLambda).toBeDefined();
  });
});

describe('FrontendStack', () => {
  let app: cdk.App;
  let stack: FrontendStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new FrontendStack(app, 'TestFrontendStack');
    template = Template.fromStack(stack);
  });

  test('creates a private bucket for frontend', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'frontend-private-bucket-vdiaz',
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
  });

  test('exports backend Lambda name with correct export name', () => {
    template.hasOutput('BackendLambdaName', {
      Export: {
        Name: 'BackendLambdaName1'
      }
    });
  });

  test('exports frontend bucket name with correct export name', () => {
    template.hasOutput('FrontendBucketName', {
      Export: {
        Name: 'FrontendBucketName1'
      }
    });
  });

  test('bucket property is accessible', () => {
    expect(stack.bucket).toBeDefined();
    expect(stack.bucket.bucketName).toContain('frontend-private-bucket-vdiaz');
  });

  test('backendLambda property is accessible', () => {
    expect(stack.backendLambda).toBeDefined();
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let stack: StorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new StorageStack(app, 'TestStorageStack');
    template = Template.fromStack(stack);
  });

  test('creates an S3 bucket', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('bucket has versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
  });

  test('bucket has destroy removal policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete'
    });
  });

  test('bucket property is accessible', () => {
    expect(stack.bucket).toBeDefined();
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
      publicReadAccess: false
    });
    template = Template.fromStack(stack);
  });

  test('creates bucket with provided name', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-bucket-name'
    });
  });

  test('enables versioning when specified', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
  });

  test('blocks all public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('has destroy removal policy', () => {
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete'
    });
  });

  test('bucketName property is accessible', () => {
    expect(privateBucket.bucketName).toBe('test-bucket-name');
  });

  test('disables public read access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true
      })
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
        TEST_VAR: 'test-value'
      }
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'index.handler',
      Environment: {
        Variables: {
          TEST_VAR: 'test-value'
        }
      }
    });
  });

  test('creates IAM role for Lambda execution', () => {
    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda'
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            }
          }
        ]
      }
    });
  });

  test('attaches custom policies when provided', () => {
    const customPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::test-bucket/*']
    });

    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
      rolePolicies: [customPolicy]
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Resource: 'arn:aws:s3:::test-bucket/*'
          }
        ])
      }
    });
  });

  test('lambdaFunction property is accessible', () => {
    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda'
    });

    expect(lambdaProcessor.lambdaFunction).toBeDefined();
    expect(lambdaProcessor.lambdaFunction).toBeInstanceOf(lambda.Function);
  });

  test('handles empty environment variables', () => {
    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda'
    });
    template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 1);
  });

  test('handles multiple role policies', () => {
    const policy1 = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['*']
    });
    const policy2 = new iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      resources: ['*']
    });

    lambdaProcessor = new LambdaProcessor(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
      rolePolicies: [policy1, policy2]
    });
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:GetObject'
          }),
          Match.objectLike({
            Action: 'dynamodb:Query'
          })
        ])
      }
    });
  });
});

describe('Stack Integration Tests', () => {
  test('BackendStack and FrontendStack integrate correctly', () => {
    const app = new cdk.App();
    const backendStack = new BackendStack(app, 'TestBackendStack');

    expect(backendStack.frontendStack).toBeDefined();
    expect(backendStack.bucket).toBeDefined();
    expect(backendStack.backendLambda).toBeDefined();
    expect(backendStack.frontendLambda).toBeDefined();
  });

  test('all stacks can be instantiated together', () => {
    const app = new cdk.App();
    
    const cdkStack = new CdkExpressWebsiteStack(app, 'CdkStack');
    const backendStack = new BackendStack(app, 'BackendStack');
    const storageStack = new StorageStack(app, 'StorageStack');

    expect(cdkStack).toBeDefined();
    expect(backendStack).toBeDefined();
    expect(storageStack).toBeDefined();
  });
});
