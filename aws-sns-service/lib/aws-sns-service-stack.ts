import * as cdk from '@aws-cdk/core';
import * as apigw from "@aws-cdk/aws-apigateway";
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from "@aws-cdk/aws-lambda";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import { Effect, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { EVENT_SOURCE, requestTemplate, responseTemplate } from '../utils/appsync-request-response';
export class AwsSnsServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const Api = new appsync.GraphqlApi(this, "Api", {
      name: "appSync-API",
      schema: appsync.Schema.fromAsset("schema/schema.gql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
      logConfig: { fieldLogLevel: appsync.FieldLogLevel.ALL },
      xrayEnabled: true,
    });
  
    // Creating a IAM role for lambda to give access of ses send email
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
    runtime: lambda.Runtime.NODEJS_12_X,
    code: lambda.Code.fromAsset("lambda-func"),
    handler: "lambda.handler",
    role: role
  });

  const lambdaDs = Api.addLambdaDataSource('lambdaDatasource', emailSender);

  const httpDs = Api.addHttpDataSource(
    "ds",
    "https://events." + this.region + ".amazonaws.com/", // This is the ENDPOINT for eventbridge.
    {
      name: "httpDsEventBridge",
      description: "From Appsync to Eventbridge",
      authorizationConfig: {
        signingRegion: this.region,
        signingServiceName: "events",
      },
    }
  );
  events.EventBus.grantPutEvents(httpDs);

  const mutations = ["sendMail"]

    mutations.forEach((mut) => {
      let details = `\\\"id\\\": \\\"$ctx.args.id\\\"`;

      if (mut === 'sendMail') {
        details = `\\\"to\\\":\\\"$ctx.args.message.to\\\", \\\"from\\\":\\\"$ctx.args.message.from\\\", \\\"subject\\\":\\\"$ctx.args.message.subject\\\", \\\"text\\\":\\\"$ctx.args.message.text\\\"`
      }
    
      httpDs.createResolver({
        typeName: "Mutation",
        fieldName: mut,
        requestMappingTemplate: appsync.MappingTemplate.fromString(requestTemplate(details, mut)),
        responseMappingTemplate: appsync.MappingTemplate.fromString(responseTemplate()),
      });
    });

    const rule = new events.Rule(this, "AppsyncEventRule", {
      eventPattern: {
        source: [EVENT_SOURCE],
        detailType: [...mutations,], // every event that has source = "eru-appsync-events" will be sent to our echo lambda
      },
    });
    rule.addTarget(new targets.LambdaFunction(emailSender));
    
    const SesBucket= new s3.Bucket(this, "ses-Bucket", {
      versioned: true,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(SesBucket),
      },
      defaultRootObject: "index.html",
    });
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.domainName,
    });

    // housekeeping for uploading the data in bucket 

    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset("../ses-frontend/public")],
      destinationBucket: SesBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, 'Graphql_Endpoint', {
      value: Api.graphqlUrl
    });

    // Log API Key
    new cdk.CfnOutput(this, 'Graphql_API_Key', {
      value: Api.apiKey || "api key not found"
    });
}
}