//un construct para lambda functions + IAM role + variables de entorno
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

interface LambdaWithRoleProps {
  runtime: lambda.Runtime;
  handler: string;
  codePath: string;
  environment?: { [key: string]: string };
  rolePolicies?: iam.PolicyStatement[];
}

export class LambdaProcessor extends Construct {

    public readonly lambdaFunction: lambda.Function;
    constructor(scope: Construct, id: string, props: LambdaWithRoleProps) {
        super(scope, id);

        // Crear el rol IAM para la función Lambda
        const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        // Attach additional policies if provided
        if (props.rolePolicies) {
            for (const policy of props.rolePolicies) {
                lambdaRole.addToPolicy(policy);
            }
        }

        // Crear la función Lambda
        this.lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
            runtime: props.runtime,
            handler: props.handler,
            code: lambda.Code.fromAsset(props.codePath),
            environment: props.environment,
            role: lambdaRole,
        });
    }
}