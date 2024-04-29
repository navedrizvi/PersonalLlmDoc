// Infrastructure as code

import {
  Architecture,
  DockerImageCode,
  DockerImageFunction,
  DockerImageFunctionProps,
  Runtime,
} from 'aws-cdk-lib/aws-lambda'
import { App, Duration, RemovalPolicy, Size, Stack } from 'aws-cdk-lib'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import * as fs from 'fs'
import { Repository } from 'aws-cdk-lib/aws-ecr'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import { join } from 'path'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'

export class AppStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id)

    const runOllamaLocally = app.node.tryGetContext('RunOllamaLocally')
    const runOnSchedule = app.node.tryGetContext('RunOnSchedule')
    const modelName = app.node.tryGetContext('ModelName')

    if (runOllamaLocally === 'true') {
      if (!modelName) {
        throw new Error(
          'ModelName and DockerImageUri must be provided in context',
        )
      }
    } else {
      const cdkParams = JSON.parse(fs.readFileSync('cdk-params.json', 'utf8'))
      const dockerImageUri = app.node.tryGetContext('DockerImageUri')
      if (!modelName || !dockerImageUri) {
        throw new Error(
          'ModelName and DockerImageUri must be provided in context',
        )
      }

      const dockerImageFunctionProps: DockerImageFunctionProps = {
        functionName: `ollama_${cdkParams.MODEL_NAME}_runner`,
        memorySize: 3008,
        ephemeralStorageSize: Size.gibibytes(10),
        timeout: Duration.seconds(300),
        architecture: Architecture.ARM_64,
        code: DockerImageCode.fromEcr(
          Repository.fromRepositoryName(
            this,
            'EcrRepo',
            `ollama-${cdkParams.MODEL_NAME}-repo`,
          ),
        ),
      }

      const lambda = new DockerImageFunction(
        this,
        'OllamaRunnerLambda',
        dockerImageFunctionProps,
      )

      const loggingPolicy = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })

      lambda.addToRolePolicy(loggingPolicy)
    }

    const bucket = new Bucket(this, 'PhiRawRecordsBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      accessControl: BucketAccessControl.PRIVATE,
      bucketName: `${this.stackName}-phi-raw-records`,
    })

    new BucketDeployment(this, 'DeployFiles', {
      sources: [Source.asset('phi-raw-records')],
      destinationBucket: bucket,
    })

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          // Use the 'aws-sdk' available in the Lambda runtime (sdk v3 is available by default in Node v20)
          'aws-sdk',
        ],
      },
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      environment: {
        PRIMARY_KEY: 'itemId',
        DYNAMO_TABLE_NAME: 'TEMP',
        S3_BUCKET_NAME: bucket.bucketName,
        // TABLE_NAME: dynamoTable.tableName,
      },
      timeout: Duration.minutes(10),
      runtime: Runtime.NODEJS_20_X,
    }

    let lambda = new NodejsFunction(this, 'SyncData', {
      entry: join(__dirname, 'lambdas', 'sync-data.ts'),
      ...nodeJsFunctionProps,
    })

    lambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['textract:AnalyzeDocument'],
        resources: ['*'],
      }),
    )

    lambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [bucket.bucketArn + '/*'],
      }),
    )

    if (runOnSchedule !== 'false') {
      // schedule starts at 1:00am UTC every day by default
      const eventRule = new Rule(this, 'scheduleRule', {
        // TODO user should be able to adjust this cron as preferred; can just update here for now as needed
        schedule: Schedule.cron({ minute: '0', hour: '1' }),
      })
      eventRule.addTarget(new LambdaFunction(lambda))
    } else {
    }
    bucket.grantRead(lambda)
  }
}

const app = new App()
const MODEL_NAME = app.node.tryGetContext('ModelName')
new AppStack(app, `ollama-${MODEL_NAME}-stack`)
app.synth()
