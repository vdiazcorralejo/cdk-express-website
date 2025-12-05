import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { CdkExpressWebsiteStage } from './cdk-express-website-stage';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const codeConnectionArn =
      'arn:aws:codeconnections:eu-west-1:869176216661:connection/30c4885c-0d6b-4b97-be61-2e456f59ca1d';

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.connection('vdiazcorralejo/cdk-express-website', 'main', {
          connectionArn: codeConnectionArn,
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
          
    });

    pipeline.addStage(
      new CdkExpressWebsiteStage(this, 'CdkExpressWebsiteStage')
    );
  }
}