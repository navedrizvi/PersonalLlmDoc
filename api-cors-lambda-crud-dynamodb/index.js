"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCorsOptions = exports.AppStack = void 0;
const aws_apigateway_1 = require("aws-cdk-lib/aws-apigateway");
// import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb'
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const path_1 = require("path");
class AppStack extends aws_cdk_lib_1.Stack {
    constructor(app, id) {
        super(app, id);
        // const dynamoTable = new Table(this, 'items', {
        //   partitionKey: {
        //     name: 'itemId',
        //     type: AttributeType.STRING,
        //   },
        //   tableName: 'items',
        //   removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
        // })
        const nodeJsFunctionProps = {
            bundling: {
                externalModules: [
                    'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
                ],
            },
            depsLockFilePath: (0, path_1.join)(__dirname, 'lambdas', 'package-lock.json'),
            environment: {
                PRIMARY_KEY: 'itemId',
                TABLE_NAME: 'TEMP',
                // TABLE_NAME: dynamoTable.tableName,
            },
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
        };
        new aws_lambda_nodejs_1.NodejsFunction(this, 'getOneItemFunction', {
            entry: (0, path_1.join)(__dirname, 'lambdas', 'get-one.ts'),
            ...nodeJsFunctionProps,
        });
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
exports.AppStack = AppStack;
function addCorsOptions(apiResource) {
    apiResource.addMethod('OPTIONS', new aws_apigateway_1.MockIntegration({
        // In case you want to use binary media types, uncomment the following line
        // contentHandling: ContentHandling.CONVERT_TO_TEXT,
        integrationResponses: [
            {
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                    'method.response.header.Access-Control-Allow-Credentials': "'false'",
                    'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
                },
            },
        ],
        // In case you want to use binary media types, comment out the following line
        passthroughBehavior: aws_apigateway_1.PassthroughBehavior.NEVER,
        requestTemplates: {
            'application/json': '{"statusCode": 200}',
        },
    }), {
        methodResponses: [
            {
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            },
        ],
    });
}
exports.addCorsOptions = addCorsOptions;
const app = new aws_cdk_lib_1.App();
new AppStack(app, 'ApiLambdaCrudDynamoDBExample');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrREFNbUM7QUFDbkMsa0VBQWtFO0FBQ2xFLHVEQUFnRDtBQUNoRCw2Q0FBd0M7QUFDeEMscUVBR3NDO0FBQ3RDLCtCQUEyQjtBQUUzQixNQUFhLFFBQVMsU0FBUSxtQkFBSztJQUNqQyxZQUFZLEdBQVEsRUFBRSxFQUFVO1FBQzlCLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFZCxpREFBaUQ7UUFDakQsb0JBQW9CO1FBQ3BCLHNCQUFzQjtRQUN0QixrQ0FBa0M7UUFDbEMsT0FBTztRQUNQLHdCQUF3QjtRQUN4QixpRkFBaUY7UUFDakYsS0FBSztRQUVMLE1BQU0sbUJBQW1CLEdBQXdCO1lBQy9DLFFBQVEsRUFBRTtnQkFDUixlQUFlLEVBQUU7b0JBQ2YsU0FBUyxFQUFFLG9EQUFvRDtpQkFDaEU7YUFDRjtZQUNELGdCQUFnQixFQUFFLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsbUJBQW1CLENBQUM7WUFDakUsV0FBVyxFQUFFO2dCQUNYLFdBQVcsRUFBRSxRQUFRO2dCQUNyQixVQUFVLEVBQUUsTUFBTTtnQkFDbEIscUNBQXFDO2FBQ3RDO1lBQ0QsT0FBTyxFQUFFLG9CQUFPLENBQUMsV0FBVztTQUM3QixDQUFBO1FBRUQsSUFBSSxrQ0FBYyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM3QyxLQUFLLEVBQUUsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUM7WUFDL0MsR0FBRyxtQkFBbUI7U0FDdkIsQ0FBQyxDQUFBO1FBQ0YsK0NBQStDO1FBRS9DLGdFQUFnRTtRQUNoRSw4Q0FBOEM7UUFDOUMsa0NBQWtDO1FBQ2xDLHdFQUF3RTtRQUN4RSxrQ0FBa0M7UUFDbEMsS0FBSztRQUVMLDhDQUE4QztRQUM5Qyx3QkFBd0I7UUFFeEIsK0NBQStDO1FBQy9DLGlEQUFpRDtRQUNqRCw2QkFBNkI7SUFDL0IsQ0FBQztDQUNGO0FBaERELDRCQWdEQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxXQUFzQjtJQUNuRCxXQUFXLENBQUMsU0FBUyxDQUNuQixTQUFTLEVBQ1QsSUFBSSxnQ0FBZSxDQUFDO1FBQ2xCLDJFQUEyRTtRQUMzRSxvREFBb0Q7UUFDcEQsb0JBQW9CLEVBQUU7WUFDcEI7Z0JBQ0UsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLGtCQUFrQixFQUFFO29CQUNsQixxREFBcUQsRUFDbkQseUZBQXlGO29CQUMzRixvREFBb0QsRUFBRSxLQUFLO29CQUMzRCx5REFBeUQsRUFDdkQsU0FBUztvQkFDWCxxREFBcUQsRUFDbkQsK0JBQStCO2lCQUNsQzthQUNGO1NBQ0Y7UUFDRCw2RUFBNkU7UUFDN0UsbUJBQW1CLEVBQUUsb0NBQW1CLENBQUMsS0FBSztRQUM5QyxnQkFBZ0IsRUFBRTtZQUNoQixrQkFBa0IsRUFBRSxxQkFBcUI7U0FDMUM7S0FDRixDQUFDLEVBQ0Y7UUFDRSxlQUFlLEVBQUU7WUFDZjtnQkFDRSxVQUFVLEVBQUUsS0FBSztnQkFDakIsa0JBQWtCLEVBQUU7b0JBQ2xCLHFEQUFxRCxFQUFFLElBQUk7b0JBQzNELHFEQUFxRCxFQUFFLElBQUk7b0JBQzNELHlEQUF5RCxFQUFFLElBQUk7b0JBQy9ELG9EQUFvRCxFQUFFLElBQUk7aUJBQzNEO2FBQ0Y7U0FDRjtLQUNGLENBQ0YsQ0FBQTtBQUNILENBQUM7QUF4Q0Qsd0NBd0NDO0FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxFQUFFLENBQUE7QUFDckIsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLDhCQUE4QixDQUFDLENBQUE7QUFDakQsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSVJlc291cmNlLFxuICAvLyBMYW1iZGFJbnRlZ3JhdGlvbixcbiAgTW9ja0ludGVncmF0aW9uLFxuICBQYXNzdGhyb3VnaEJlaGF2aW9yLFxuICAvLyBSZXN0QXBpLFxufSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSdcbi8vIGltcG9ydCB7IEF0dHJpYnV0ZVR5cGUsIFRhYmxlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJ1xuaW1wb3J0IHsgUnVudGltZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnXG5pbXBvcnQgeyBBcHAsIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInXG5pbXBvcnQge1xuICBOb2RlanNGdW5jdGlvbixcbiAgTm9kZWpzRnVuY3Rpb25Qcm9wcyxcbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCdcblxuZXhwb3J0IGNsYXNzIEFwcFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaWQ6IHN0cmluZykge1xuICAgIHN1cGVyKGFwcCwgaWQpXG5cbiAgICAvLyBjb25zdCBkeW5hbW9UYWJsZSA9IG5ldyBUYWJsZSh0aGlzLCAnaXRlbXMnLCB7XG4gICAgLy8gICBwYXJ0aXRpb25LZXk6IHtcbiAgICAvLyAgICAgbmFtZTogJ2l0ZW1JZCcsXG4gICAgLy8gICAgIHR5cGU6IEF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgIC8vICAgfSxcbiAgICAvLyAgIHRhYmxlTmFtZTogJ2l0ZW1zJyxcbiAgICAvLyAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gTk9UIHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIGNvZGVcbiAgICAvLyB9KVxuXG4gICAgY29uc3Qgbm9kZUpzRnVuY3Rpb25Qcm9wczogTm9kZWpzRnVuY3Rpb25Qcm9wcyA9IHtcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogW1xuICAgICAgICAgICdhd3Mtc2RrJywgLy8gVXNlIHRoZSAnYXdzLXNkaycgYXZhaWxhYmxlIGluIHRoZSBMYW1iZGEgcnVudGltZVxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGRlcHNMb2NrRmlsZVBhdGg6IGpvaW4oX19kaXJuYW1lLCAnbGFtYmRhcycsICdwYWNrYWdlLWxvY2suanNvbicpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUFJJTUFSWV9LRVk6ICdpdGVtSWQnLFxuICAgICAgICBUQUJMRV9OQU1FOiAnVEVNUCcsXG4gICAgICAgIC8vIFRBQkxFX05BTUU6IGR5bmFtb1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU18yMF9YLFxuICAgIH1cblxuICAgIG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnZ2V0T25lSXRlbUZ1bmN0aW9uJywge1xuICAgICAgZW50cnk6IGpvaW4oX19kaXJuYW1lLCAnbGFtYmRhcycsICdnZXQtb25lLnRzJyksXG4gICAgICAuLi5ub2RlSnNGdW5jdGlvblByb3BzLFxuICAgIH0pXG4gICAgLy8gZHluYW1vVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGdldE9uZUxhbWJkYSlcblxuICAgIC8vIGNvbnN0IGdldE9uZUludGVncmF0aW9uID0gbmV3IExhbWJkYUludGVncmF0aW9uKGdldE9uZUxhbWJkYSlcbiAgICAvLyBjb25zdCBhcGkgPSBuZXcgUmVzdEFwaSh0aGlzLCAnaXRlbXNBcGknLCB7XG4gICAgLy8gICByZXN0QXBpTmFtZTogJ0l0ZW1zIFNlcnZpY2UnLFxuICAgIC8vICAgLy8gSW4gY2FzZSB5b3Ugd2FudCB0byBtYW5hZ2UgYmluYXJ5IHR5cGVzLCB1bmNvbW1lbnQgdGhlIGZvbGxvd2luZ1xuICAgIC8vICAgLy8gYmluYXJ5TWVkaWFUeXBlczogW1wiKi8qXCJdLFxuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCBpdGVtcyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdpdGVtcycpXG4gICAgLy8gYWRkQ29yc09wdGlvbnMoaXRlbXMpXG5cbiAgICAvLyBjb25zdCBzaW5nbGVJdGVtID0gaXRlbXMuYWRkUmVzb3VyY2UoJ3tpZH0nKVxuICAgIC8vIHNpbmdsZUl0ZW0uYWRkTWV0aG9kKCdHRVQnLCBnZXRPbmVJbnRlZ3JhdGlvbilcbiAgICAvLyBhZGRDb3JzT3B0aW9ucyhzaW5nbGVJdGVtKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRDb3JzT3B0aW9ucyhhcGlSZXNvdXJjZTogSVJlc291cmNlKSB7XG4gIGFwaVJlc291cmNlLmFkZE1ldGhvZChcbiAgICAnT1BUSU9OUycsXG4gICAgbmV3IE1vY2tJbnRlZ3JhdGlvbih7XG4gICAgICAvLyBJbiBjYXNlIHlvdSB3YW50IHRvIHVzZSBiaW5hcnkgbWVkaWEgdHlwZXMsIHVuY29tbWVudCB0aGUgZm9sbG93aW5nIGxpbmVcbiAgICAgIC8vIGNvbnRlbnRIYW5kbGluZzogQ29udGVudEhhbmRsaW5nLkNPTlZFUlRfVE9fVEVYVCxcbiAgICAgIGludGVncmF0aW9uUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOlxuICAgICAgICAgICAgICBcIidDb250ZW50LVR5cGUsWC1BbXotRGF0ZSxBdXRob3JpemF0aW9uLFgtQXBpLUtleSxYLUFtei1TZWN1cml0eS1Ub2tlbixYLUFtei1Vc2VyLUFnZW50J1wiLFxuICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogXCInKidcIixcbiAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzpcbiAgICAgICAgICAgICAgXCInZmFsc2UnXCIsXG4gICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzpcbiAgICAgICAgICAgICAgXCInT1BUSU9OUyxHRVQsUFVULFBPU1QsREVMRVRFJ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgLy8gSW4gY2FzZSB5b3Ugd2FudCB0byB1c2UgYmluYXJ5IG1lZGlhIHR5cGVzLCBjb21tZW50IG91dCB0aGUgZm9sbG93aW5nIGxpbmVcbiAgICAgIHBhc3N0aHJvdWdoQmVoYXZpb3I6IFBhc3N0aHJvdWdoQmVoYXZpb3IuTkVWRVIsXG4gICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7XG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogJ3tcInN0YXR1c0NvZGVcIjogMjAwfScsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIHtcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogdHJ1ZSxcbiAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiB0cnVlLFxuICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHMnOiB0cnVlLFxuICAgICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICApXG59XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKVxubmV3IEFwcFN0YWNrKGFwcCwgJ0FwaUxhbWJkYUNydWREeW5hbW9EQkV4YW1wbGUnKVxuYXBwLnN5bnRoKClcbiJdfQ==