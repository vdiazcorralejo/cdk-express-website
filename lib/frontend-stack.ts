import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BackendStack } from './backend-stack';
import { PrivateBucket } from './constructs/private-bucket';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class FrontendStack extends cdk.Stack {
    public readonly bucket: s3.Bucket;
    public readonly backendLambda: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.backendLambda = new BackendStack(this, 'BackendStack').backendLambda;
        // output the backend lambda name
        new cdk.CfnOutput(this, 'BackendLambdaName', {
            value: this.backendLambda.functionName,
            description: 'The name of the backend Lambda function',
            exportName: 'BackendLambdaName1',
        });

        this.bucket = new PrivateBucket(this, 'FrontendPrivateBucket', {
            versioned: true,
            name: 'frontend-private-bucket-vdiaz',
            publicReadAccess: false,
        }) as unknown as s3.Bucket;
        // Output the bucket name
        new cdk.CfnOutput(this, 'FrontendBucketName', {
            value: this.bucket.bucketName,
            description: 'The name of the frontend S3 bucket',
            exportName: 'FrontendBucketName1',
        });
    }   
}