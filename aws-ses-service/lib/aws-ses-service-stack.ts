import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from "@aws-cdk/aws-apigateway";
import { Effect, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
export class AwsSesServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new Role(this, 'LambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    ///Attaching ses access to policy
    const policy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ses:SendEmail", "ses:SendRawEmail", "logs:*"],
      resources: ['*']
    });
    //granting IAM permissions to role
    role.addToPolicy(policy);

    //  Creating send email lambda handler
    const emailSender = new lambda.Function(this, "HandleSendEmail", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("lambda-func"),
      handler: "lambda.handler",
      role: role
    });

    // create the API Gateway with one method and path For lambda
    const api = new apigw.RestApi(this, "SendEmailEndPoint")
    api
      .root
      .resourceForPath("sendmail")
      .addMethod("POST", new apigw.LambdaIntegration(emailSender))


    // logging api endpoint
    new cdk.CfnOutput(this, 'Send email endpoint', {
      value: `${api.url}sendmail`
    });
  }
}