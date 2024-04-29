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
import { Asset } from 'aws-cdk-lib/aws-s3-assets'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'

const cdkParams = JSON.parse(fs.readFileSync('cdk-params.json', 'utf8'))
export class AppStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id)

    const runOllamaLocally = app.node.tryGetContext('RunOllamaLocally')
    const runOnSchedule = app.node.tryGetContext('RunOnSchedule')

    if (runOllamaLocally === 'true') {
    } else {
      const modelName = app.node.tryGetContext('ModelName')
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

    // Create an S3 bucket
    const bucket = new Bucket(this, 'PhiRawRecordsBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      accessControl: BucketAccessControl.PRIVATE,
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
        TABLE_NAME: 'TEMP',
        // TABLE_NAME: dynamoTable.tableName,
      },
      runtime: Runtime.NODEJS_20_X,
    }

    let lambda = new NodejsFunction(this, 'SyncData', {
      entry: join(__dirname, 'lambdas', 'sync-data.ts'),
      ...nodeJsFunctionProps,
    })
    if (runOnSchedule !== 'false') {
      // schedule starts at 1:00am UTC every day.
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
new AppStack(app, `ollama-${cdkParams.MODEL_NAME}-stack`)
app.synth()
