import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";

export class CloudFrontStack extends cdk.Stack {
  distribution: cloudfront.IDistribution;
  assetsBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const assetsBucketName = this.node.tryGetContext("assetsBucket") as string;

    this.assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      bucketName: assetsBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteErrorDocument: "error.html",
      websiteIndexDocument: "index.html",
    });

    const websiteIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "WebsiteIdentity"
    );

    const bucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [`${this.assetsBucket.bucketArn}/*`],
      principals: [
        new iam.CanonicalUserPrincipal(
          websiteIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
    });

    this.assetsBucket.addToResourcePolicy(bucketPolicy);

    this.distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        defaultRootObject: "index.html",
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.assetsBucket,
              originAccessIdentity: websiteIdentity,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );
  }
}
