import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretManager from "aws-cdk-lib/aws-secretsmanager";

interface ApiStackProps extends cdk.StackProps {
  sourceBucket: s3.IBucket;
}

export class ApiStack extends cdk.Stack {
  apiId: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new apigw.RestApi(this, "Api");

    const syncFunction = new lambda.Function(this, "SyncFunction", {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset("./functions/"),
      handler: "sync.handler",
      environment: {
        BUCKET_NAME: props.sourceBucket.bucketName,
      },
    });
    props.sourceBucket.grantWrite(syncFunction);

    const sync = api.root.addResource("sync");
    const syncMethod = sync.addMethod(
      "POST",
      new apigw.LambdaIntegration(syncFunction),
      {
        authorizationType: apigw.AuthorizationType.IAM,
      }
    );

    const invokeUser = new iam.User(this, "InvokeUser", {
      userName: "InvokeUser",
    });

    invokeUser.attachInlinePolicy(
      new iam.Policy(this, "InvokePolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["execute-api:Invoke"],
            effect: iam.Effect.ALLOW,
            resources: [syncMethod.methodArn],
          }),
        ],
      })
    );

    const registerFunction = new lambda.Function(this, "RegisterFunction", {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset("./functions/"),
      handler: "register.handler",
      timeout: cdk.Duration.seconds(30),
    });

    const secretArn = this.node.tryGetContext("secretArn") as string;
    const secret = secretManager.Secret.fromSecretCompleteArn(
      this,
      "Secret",
      secretArn
    );
    secret.grantRead(registerFunction);

    const apiRoot = api.root.addResource("api");

    const register = apiRoot.addResource("register");
    const registerMethod = register.addMethod(
      "POST",
      new apigw.LambdaIntegration(registerFunction)
    );

    this.apiId = api.restApiId;
  }
}
