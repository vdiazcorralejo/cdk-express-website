import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { CdkExpressWebsiteStage } from './cdk-express-website-stage';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const codeConnectionArn =
      'arn:aws:codeconnections:eu-west-1:869176216661:connection/30c4885c-0d6b-4b97-be61-2e456f59ca1d';

    // Create SNS Topic for pipeline notifications
    const pipelineTopic = new sns.Topic(this, 'PipelineNotificationTopic', {
      displayName: 'CDK Pipeline Notifications',
      topicName: 'cdk-pipeline-notifications',
    });

    // Subscribe your email to the topic
    pipelineTopic.addSubscription(
      new subscriptions.EmailSubscription('vdiazcorralejo@gmail.com')
    );

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

    // Add notification for pipeline failures
    pipeline.buildPipeline(); // Build the pipeline first to access the underlying CodePipeline
    
    const underlyingPipeline = pipeline.pipeline;
    underlyingPipeline.onStateChange('PipelineStateChange', {
      target: new targets.SnsTopic(pipelineTopic, {
        message: cdk.aws_events.RuleTargetInput.fromText(
          `Pipeline ${cdk.aws_events.EventField.fromPath('$.detail.pipeline')} failed!\n` +
          `State: ${cdk.aws_events.EventField.fromPath('$.detail.state')}\n` +
          `Execution ID: ${cdk.aws_events.EventField.fromPath('$.detail.execution-id')}\n` +
          `Time: ${cdk.aws_events.EventField.fromPath('$.time')}`
        ),
      }),
      eventPattern: {
        detail: {
          state: ['FAILED'],
        },
      },
    });
  }
}