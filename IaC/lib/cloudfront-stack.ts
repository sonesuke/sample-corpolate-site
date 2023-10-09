import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigw from "aws-cdk-lib/aws-apigateway";

interface CloudFrontStackProps extends cdk.StackProps {
  apiId: string;
}

export class CloudFrontStack extends cdk.Stack {
  distribution: cloudfront.IDistribution;
  assetsBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    const assetsBucketName = this.node.tryGetContext("assetsBucket") as string;

    this.assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      bucketName: assetsBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    const hostName = `${props.apiId}.execute-api.ap-northeast-1.amazonaws.com`;

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(this.assetsBucket, {
          originAccessIdentity: websiteIdentity,
        }),
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new cloudfrontOrigins.HttpOrigin(hostName, {
            originPath: "/prod",
          }),
          cachePolicy: new cloudfront.CachePolicy(this, "ApiCachePolicy", {
            maxTtl: cdk.Duration.seconds(1),
            minTtl: cdk.Duration.seconds(0),
            defaultTtl: cdk.Duration.seconds(0),
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
            headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
              "Accept",
              "X-Line-Signature"
            ),
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        },
      },
    });
  }
}
