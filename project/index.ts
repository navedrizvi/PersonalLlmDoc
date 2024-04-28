import {
  Architecture,
  DockerImageCode,
  DockerImageFunction,
  DockerImageFunctionProps,
} from 'aws-cdk-lib/aws-lambda'
import { App, Duration, Size, Stack } from 'aws-cdk-lib'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import * as fs from 'fs'
import { Repository } from 'aws-cdk-lib/aws-ecr'

const cdkParams = JSON.parse(fs.readFileSync('cdk-params.json', 'utf8'))
export class AppStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id)

    const runOllamaLocally = app.node.tryGetContext('RunOllamaLocally')

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
  }
}

const app = new App()
new AppStack(app, `ollama-${cdkParams.MODEL_NAME}-stack`)
app.synth()
