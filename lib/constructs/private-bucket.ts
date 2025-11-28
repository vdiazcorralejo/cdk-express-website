import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface PrivateBucketProps {
  versioned: boolean;
  name: string;
  publicReadAccess: boolean;
}

export class PrivateBucket extends Construct {
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: PrivateBucketProps) {
    super(scope, id);

    const bucket = new s3.Bucket(this, 'PrivateBucket', {
      bucketName: props.name,
      versioned: props.versioned,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: props.publicReadAccess,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    this.bucketName = bucket.bucketName;
  }
}