// import {
//   IResource,
//   // LambdaIntegration,
//   MockIntegration,
//   PassthroughBehavior,
//   // RestApi,
// } from 'aws-cdk-lib/aws-apigateway'
// import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb'
import {
  DockerImageCode,
  DockerImageFunction,
  DockerImageFunctionProps,
  // Runtime,
} from 'aws-cdk-lib/aws-lambda'
import { App, Duration, Stack } from 'aws-cdk-lib'
// import {
//   NodejsFunction,
//   NodejsFunctionProps,
// } from 'aws-cdk-lib/aws-lambda-nodejs'
// import { join } from 'path'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import * as fs from 'fs'

export class AppStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id)

    // Load parameters from JSON file
    const cdkParams = JSON.parse(fs.readFileSync('cdk-params.json', 'utf8'))

    // const dynamoTable = new Table(this, 'items', {
    //   partitionKey: {
    //     name: 'itemId',
    //     type: AttributeType.STRING,
    //   },
    //   tableName: 'items',
    //   removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    // })

    // const nodeJsFunctionProps: DockerImageFunctionProps = {
    //   bundling: {
    //     externalModules: [
    //       'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
    //     ],
    //   },
    //   depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
    //   environment: {
    //     PRIMARY_KEY: 'itemId',
    //     TABLE_NAME: 'TEMP',
    //     // TABLE_NAME: dynamoTable.tableName,
    //   },
    //   runtime: Runtime.NODEJS_20_X,
    //   // code: lambda.DockerImageCode.fromImagePull('dockerhub-image-name:tag'),
    // }

    // const lambda = new NodejsFunction(this, 'getOneItemFunction', {
    //   entry: join(__dirname, 'lambdas', 'get-one.ts'),
    //   ...nodeJsFunctionProps,
    // })

    const dockerImageFunctionProps: DockerImageFunctionProps = {
      functionName: `ollama_${cdkParams.MODEL_NAME}_runner`,
      memorySize: 10240,
      timeout: Duration.seconds(300),
      code: DockerImageCode.fromImageAsset(cdkParams.ECR_IMAGE_URI),
      environment: {
        TABLE_NAME: 'TEMP',
        MODEL_NAME: cdkParams.MODEL_NAME,
      },
    }

    const lambda = new DockerImageFunction(
      this,
      'MyDockerImageFunction',
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
    // dynamoTable.grantReadWriteData(getOneLambda)

    // const getOneIntegration = new LambdaIntegration(getOneLambda)
    // const api = new RestApi(this, 'itemsApi', {
    //   restApiName: 'Items Service',
    //   // In case you want to manage binary types, uncomment the following
    //   // binaryMediaTypes: ["*/*"],
    // })

    // const items = api.root.addResource('items')
    // addCorsOptions(items)

    // const singleItem = items.addResource('{id}')
    // singleItem.addMethod('GET', getOneIntegration)
    // addCorsOptions(singleItem)
  }
}

// export function addCorsOptions(apiResource: IResource) {
//   apiResource.addMethod(
//     'OPTIONS',
//     new MockIntegration({
//       // In case you want to use binary media types, uncomment the following line
//       // contentHandling: ContentHandling.CONVERT_TO_TEXT,
//       integrationResponses: [
//         {
//           statusCode: '200',
//           responseParameters: {
//             'method.response.header.Access-Control-Allow-Headers':
//               "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
//             'method.response.header.Access-Control-Allow-Origin': "'*'",
//             'method.response.header.Access-Control-Allow-Credentials':
//               "'false'",
//             'method.response.header.Access-Control-Allow-Methods':
//               "'OPTIONS,GET,PUT,POST,DELETE'",
//           },
//         },
//       ],
//       // In case you want to use binary media types, comment out the following line
//       passthroughBehavior: PassthroughBehavior.NEVER,
//       requestTemplates: {
//         'application/json': '{"statusCode": 200}',
//       },
//     }),
//     {
//       methodResponses: [
//         {
//           statusCode: '200',
//           responseParameters: {
//             'method.response.header.Access-Control-Allow-Headers': true,
//             'method.response.header.Access-Control-Allow-Methods': true,
//             'method.response.header.Access-Control-Allow-Credentials': true,
//             'method.response.header.Access-Control-Allow-Origin': true,
//           },
//         },
//       ],
//     },
//   )
// }

const app = new App()
new AppStack(app, 'ApiLambdaCrudDynamoDBExample')
app.synth()
