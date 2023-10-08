#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BucketStack } from '../lib/bucket-stack';
import { CloudFrontStack } from '../lib/cloudfront-stack';
import { BuildStack } from '../lib/build-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const bucketStack = new BucketStack(app, 'BucketStack');

const cloudfrontStack = new CloudFrontStack(app, 'CloudFrontStack');

const buildStack = new BuildStack(app, 'BuildStack', {
  sourceBucket: bucketStack.sourceBucket,
  assetsBucket: cloudfrontStack.assetsBucket,
  distribution: cloudfrontStack.distribution,
});

const apiStack = new ApiStack(app, 'ApiStack', {
  sourceBucket: bucketStack.sourceBucket,
});

