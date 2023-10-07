import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export class BucketStack extends cdk.Stack {
  sourceBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucketName = this.node.tryGetContext("sourceBucket") as string;

    this.sourceBucket = new s3.Bucket(this, "SourceBucket", {
      bucketName: sourceBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: false,
      versioned: true,
    });
  }
}
