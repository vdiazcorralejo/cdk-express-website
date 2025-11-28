import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { FrontendStack } from './frontend-stack';   

export class BackendStack extends cdk.Stack {
  public readonly backendLambda: lambda.Function;
  public readonly frontendStack: FrontendStack;
  public readonly bucket: cdk.aws_s3.Bucket;
  public readonly frontendLambda: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.backendLambda = new lambda.Function(this, 'BackendLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'backend.handler',   
        code: lambda.Code.fromAsset('src/lambda'),  
    });
    // Output the backend lambda name
    new cdk.CfnOutput(this, 'BackendLambdaName', {
        value: this.backendLambda.functionName,
        description: 'The name of the backend Lambda function',
        exportName: 'BackendLambdaName2',
    });

    this.frontendStack = new FrontendStack(this, 'FrontendStack', {
      env: props?.env,
    });

    this.bucket = this.frontendStack.bucket;
    this.frontendLambda = this.frontendStack.backendLambda;

    // Output the bucket name
    new cdk.CfnOutput(this, 'FrontendBucketName', {
        value: this.bucket.bucketName,
        description: 'The name of the frontend S3 bucket',
        exportName: 'FrontendBucketName2',
    });
     
  }
}