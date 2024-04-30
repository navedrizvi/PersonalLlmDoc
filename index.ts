// Infrastructure as Code

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
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb'
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch'

export class AppStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id)

    const runOllamaLocally = app.node.tryGetContext('RunOllamaLocally')
    const runOnSchedule = app.node.tryGetContext('RunOnSchedule')
    const modelName = app.node.tryGetContext('ModelName')

    if (runOllamaLocally === 'true') {
      if (!modelName) {
        throw new Error('ModelName')
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
        // TODO fix, might need more memory than max, switch to ECS Fargate?
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

      lambda.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
      )
    }

    const bucket = new Bucket(this, 'PhiRawRecordsBucket', {
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
      accessControl: BucketAccessControl.PRIVATE,
      bucketName: `${this.stackName}-phi-raw-records`,
    })

    new BucketDeployment(this, 'DeployFiles', {
      sources: [Source.asset('phi-raw-records')],
      destinationBucket: bucket,
    })

    const ehrTable = new Table(this, 'EhrTable', {
      partitionKey: {
        name: 'fileName',
        type: AttributeType.STRING,
      },
      // Sort documents under a partition key by insertionTime to preserve page order of EHR
      sortKey: {
        name: 'insertionTime',
        type: AttributeType.NUMBER,
      },
      tableName: 'EhrTable',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const wearableTable1 = new Table(this, 'ActiveEnergyBurnedTable', {
      partitionKey: {
        name: 'startDateDate',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'endTime',
        type: AttributeType.STRING,
      },
      tableName: 'ActiveEnergyBurned_Cal',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const wearableTable2 = new Table(this, 'Distance_Mile', {
      partitionKey: {
        name: 'startDateDate',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'endTime',
        type: AttributeType.STRING,
      },
      tableName: 'Distance_Mile',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const wearableTable3 = new Table(this, 'HeartRate_CountPerMin', {
      partitionKey: {
        name: 'startDateDate',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'endTime',
        type: AttributeType.STRING,
      },
      tableName: 'HeartRate_CountPerMin',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const wearableTable4 = new Table(this, 'Steps_Count', {
      partitionKey: {
        name: 'startDateDate',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'endTime',
        type: AttributeType.STRING,
      },
      tableName: 'Steps_Count',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const wearableTable5 = new Table(this, 'BodyTemprature_Farenheit', {
      partitionKey: {
        name: 'startDateDate',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'endTime',
        type: AttributeType.STRING,
      },
      tableName: 'BodyTemprature_Farenheit',
      removalPolicy: RemovalPolicy.DESTROY,
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
        S3_BUCKET_NAME: bucket.bucketName,
        EHR_TABLE_NAME: ehrTable.tableName,
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
      // TODO if this is enabled, we should just be writing data from a timeframe of the schedule,
      // but currently the lambda is reading the entire source data.
      eventRule.addTarget(new LambdaFunction(lambda))

      // Alarm to get alerted on scheduled run failures, add actions as needed
      new Alarm(this, 'LambdaFailureAlarm', {
        metric: lambda.metricErrors(),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Lambda function failure alarm',
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
    }

    bucket.grantRead(lambda)

    ehrTable.grantReadData(lambda)
    ehrTable.grantWriteData(lambda)

    wearableTable1.grantWriteData(lambda)
    wearableTable2.grantWriteData(lambda)
    wearableTable3.grantWriteData(lambda)
    wearableTable4.grantWriteData(lambda)
    wearableTable5.grantWriteData(lambda)
  }
}

const app = new App()
const MODEL_NAME = app.node.tryGetContext('ModelName')
new AppStack(app, `ollama-${MODEL_NAME}-stack`)
app.synth()
