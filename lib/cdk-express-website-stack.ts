import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PrivateBucket } from './constructs/private-bucket';
import { LambdaProcessor } from './constructs/lambda';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkExpressWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const bucket = new PrivateBucket(this, 'MyPrivateBucket', {
      versioned: true,
      name: 'my-private-bucket-vdiaz',
      publicReadAccess: false,
    });

    // First version of Lambda function creation
    /*
    const lambdaFn = new lambda.Function(this, 'MiLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    */

    const bucketimported = s3.Bucket.fromBucketName(this, 'ImportedBucket', bucket.bucketName);

    // Alternativamente, si usas el constructo LambdaProcessor
    const lambdaProcessor = new LambdaProcessor(this, 'MyLambdaProcessor', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      codePath: 'src/lambda',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      rolePolicies: [
        new iam.PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [bucketimported.arnForObjects('*')],
        }),
      ],
    });
     
    bucketimported.grantRead(lambdaProcessor.lambdaFunction);
  }
}
