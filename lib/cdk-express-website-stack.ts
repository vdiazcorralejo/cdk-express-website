import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class CdkExpressWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // bucket for my website configuration
    const siteBucket = new s3.Bucket(this, 'SitioWebBucket', {
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'DeployWeb', {
      sources: [s3deploy.Source.asset('./site')],
      destinationBucket: siteBucket,
    });


const distribution = new cloudfront.Distribution(this, 'CDNDeMiWeb', {
  defaultBehavior: {
    origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
  defaultRootObject: 'index.html',
  priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
});
  }
}
