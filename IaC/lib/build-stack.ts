import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as codePipeline from "aws-cdk-lib/aws-codepipeline";
import * as codePipelineActions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codeBuild from "aws-cdk-lib/aws-codebuild";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

interface BuildStackProps extends cdk.StackProps {
  sourceBucket: s3.IBucket;
  assetsBucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
}

export class BuildStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BuildStackProps) {
    super(scope, id, props);

    const sourceOutput = new codePipeline.Artifact();
    const contextOutput = new codePipeline.Artifact("context");
    const buildOutput = new codePipeline.Artifact();

    const sourceAction = new codePipelineActions.S3SourceAction({
      actionName: "Source",
      bucket: props.sourceBucket,
      bucketKey: "source.zip",
      output: sourceOutput,
      trigger: codePipelineActions.S3Trigger.POLL,
    });

    const contextAction = new codePipelineActions.S3SourceAction({
      actionName: "Context",
      bucket: props.sourceBucket,
      bucketKey: "context.zip",
      output: contextOutput,
      trigger: codePipelineActions.S3Trigger.POLL,
    });

    const project = new codeBuild.PipelineProject(this, "BuildProject", {
      environment: {
        buildImage: codeBuild.LinuxBuildImage.STANDARD_7_0,
      },
    });

    const buildAction = new codePipelineActions.CodeBuildAction({
      actionName: "Build",
      project: project,
      input: sourceOutput,
      extraInputs: [contextOutput],
      outputs: [buildOutput],
    });

    const deployAction = new codePipelineActions.S3DeployAction({
      actionName: "Deploy",
      bucket: props.assetsBucket,
      input: buildOutput,
      runOrder: 1,
    });

    const InvalidateProject = new codeBuild.PipelineProject(
      this,
      "InvalidateProject",
      {
        buildSpec: codeBuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            build: {
              commands: [
                `aws cloudfront create-invalidation --distribution-id ${props.distribution.distributionId} --paths '/*'`,
              ],
            },
          },
        }),
      }
    );
    props.distribution.grantCreateInvalidation(InvalidateProject);

    const invalidateAction = new codePipelineActions.CodeBuildAction({
      actionName: "Invalidate",
      input: buildOutput,
      project: InvalidateProject,
      runOrder: 2,
    });

    new codePipeline.Pipeline(this, "Pipeline", {
      pipelineName: "Pipeline",
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction, contextAction],
        },
        {
          stageName: "Build",
          actions: [buildAction],
        },
        {
          stageName: "Deploy",
          actions: [deployAction, invalidateAction],
        },
      ],
    });
  }
}
