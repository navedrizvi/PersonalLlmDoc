"use strict";
// Infrastructure as code
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStack = void 0;
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const fs = require("fs");
const aws_ecr_1 = require("aws-cdk-lib/aws-ecr");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const path_1 = require("path");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const aws_s3_deployment_1 = require("aws-cdk-lib/aws-s3-deployment");
class AppStack extends aws_cdk_lib_1.Stack {
    constructor(app, id) {
        super(app, id);
        const runOllamaLocally = app.node.tryGetContext('RunOllamaLocally');
        const runOnSchedule = app.node.tryGetContext('RunOnSchedule');
        const modelName = app.node.tryGetContext('ModelName');
        if (runOllamaLocally === 'true') {
            if (!modelName) {
                throw new Error('ModelName and DockerImageUri must be provided in context');
            }
        }
        else {
            const cdkParams = JSON.parse(fs.readFileSync('cdk-params.json', 'utf8'));
            const dockerImageUri = app.node.tryGetContext('DockerImageUri');
            if (!modelName || !dockerImageUri) {
                throw new Error('ModelName and DockerImageUri must be provided in context');
            }
            const dockerImageFunctionProps = {
                functionName: `ollama_${cdkParams.MODEL_NAME}_runner`,
                memorySize: 3008,
                ephemeralStorageSize: aws_cdk_lib_1.Size.gibibytes(10),
                timeout: aws_cdk_lib_1.Duration.seconds(300),
                architecture: aws_lambda_1.Architecture.ARM_64,
                code: aws_lambda_1.DockerImageCode.fromEcr(aws_ecr_1.Repository.fromRepositoryName(this, 'EcrRepo', `ollama-${cdkParams.MODEL_NAME}-repo`)),
            };
            const lambda = new aws_lambda_1.DockerImageFunction(this, 'OllamaRunnerLambda', dockerImageFunctionProps);
            const loggingPolicy = new aws_iam_1.PolicyStatement({
                effect: aws_iam_1.Effect.ALLOW,
                actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                ],
                resources: ['*'],
            });
            lambda.addToRolePolicy(loggingPolicy);
        }
        const bucket = new aws_s3_1.Bucket(this, 'PhiRawRecordsBucket', {
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            accessControl: aws_s3_1.BucketAccessControl.PRIVATE,
            bucketName: `${this.stackName}-phi-raw-records`,
        });
        new aws_s3_deployment_1.BucketDeployment(this, 'DeployFiles', {
            sources: [aws_s3_deployment_1.Source.asset('phi-raw-records')],
            destinationBucket: bucket,
        });
        const nodeJsFunctionProps = {
            bundling: {
                externalModules: [
                    // Use the 'aws-sdk' available in the Lambda runtime (sdk v3 is available by default in Node v20)
                    'aws-sdk',
                ],
            },
            depsLockFilePath: (0, path_1.join)(__dirname, 'lambdas', 'package-lock.json'),
            environment: {
                PRIMARY_KEY: 'itemId',
                DYNAMO_TABLE_NAME: 'TEMP',
                S3_BUCKET_NAME: bucket.bucketName,
                // TABLE_NAME: dynamoTable.tableName,
            },
            timeout: aws_cdk_lib_1.Duration.minutes(10),
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
        };
        let lambda = new aws_lambda_nodejs_1.NodejsFunction(this, 'SyncData', {
            entry: (0, path_1.join)(__dirname, 'lambdas', 'sync-data.ts'),
            ...nodeJsFunctionProps,
        });
        lambda.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: ['textract:AnalyzeDocument'],
            resources: ['*'],
        }));
        lambda.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [bucket.bucketArn + '/*'],
        }));
        if (runOnSchedule !== 'false') {
            // schedule starts at 1:00am UTC every day by default
            const eventRule = new aws_events_1.Rule(this, 'scheduleRule', {
                // TODO user should be able to adjust this cron as preferred; can just update here for now as needed
                schedule: aws_events_1.Schedule.cron({ minute: '0', hour: '1' }),
            });
            eventRule.addTarget(new aws_events_targets_1.LambdaFunction(lambda));
        }
        else {
        }
        bucket.grantRead(lambda);
    }
}
exports.AppStack = AppStack;
const app = new aws_cdk_lib_1.App();
const MODEL_NAME = app.node.tryGetContext('ModelName');
new AppStack(app, `ollama-${MODEL_NAME}-stack`);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUJBQXlCOzs7QUFFekIsdURBTStCO0FBQy9CLDZDQUF1RTtBQUN2RSxpREFBNkQ7QUFDN0QseUJBQXdCO0FBQ3hCLGlEQUFnRDtBQUNoRCxxRUFHc0M7QUFDdEMsK0JBQTJCO0FBQzNCLHVEQUF1RDtBQUN2RCx1RUFBK0Q7QUFDL0QsK0NBQWdFO0FBQ2hFLHFFQUF3RTtBQUV4RSxNQUFhLFFBQVMsU0FBUSxtQkFBSztJQUNqQyxZQUFZLEdBQVEsRUFBRSxFQUFVO1FBQzlCLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFZCxNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFDbkUsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUE7UUFDN0QsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUE7UUFFckQsSUFBSSxnQkFBZ0IsS0FBSyxNQUFNLEVBQUU7WUFDL0IsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDZCxNQUFNLElBQUksS0FBSyxDQUNiLDBEQUEwRCxDQUMzRCxDQUFBO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUE7WUFDeEUsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtZQUMvRCxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNqQyxNQUFNLElBQUksS0FBSyxDQUNiLDBEQUEwRCxD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QUM3QixxREFBcUQ7WUFDckQsTUFBTSxTQUFTLEdBQUcsSUFBSSxpQkFBSSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7Z0JBQy9DLG9HQUFvRztnQkFDcEcsUUFBUSxFQUFFLHFCQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7YUFDcEQsQ0FBQyxDQUFBO1lBQ0YsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1DQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtTQUNoRDthQUFNO1NBQ047UUFDRCxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzFCLENBQUM7Q0FDRjtBQXBIRCw0QkFvSEM7QUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFHLEVBQUUsQ0FBQTtBQUNyQixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUN0RCxJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsVUFBVSxVQUFVLFFBQVEsQ0FBQyxDQUFBO0FBQy9DLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIEluZnJhc3RydWN0dXJlIGFzIGNvZGVcblxuaW1wb3J0IHtcbiAgQXJjaGl0ZWN0dXJlLFxuICBEb2NrZXJJbWFnZUNvZGUsXG4gIERvY2tlckltYWdlRnVuY3Rpb24sXG4gIERvY2tlckltYWdlRnVuY3Rpb25Qcm9wcyxcbiAgUnVudGltZSxcbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSdcbmltcG9ydCB7IEFwcCwgRHVyYXRpb24sIFJlbW92YWxQb2xpY3ksIFNpemUsIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInXG5pbXBvcnQgeyBFZmZlY3QsIFBvbGljeVN0YXRlbWVudCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCB7IFJlcG9zaXRvcnkgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyJ1xuaW1wb3J0IHtcbiAgTm9kZWpzRnVuY3Rpb24sXG4gIE5vZGVqc0Z1bmN0aW9uUHJvcHMsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJ1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBSdWxlLCBTY2hlZHVsZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnXG5pbXBvcnQgeyBMYW1iZGFGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cydcbmltcG9ydCB7IEJ1Y2tldCwgQnVja2V0QWNjZXNzQ29udHJvbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMydcbmltcG9ydCB7IEJ1Y2tldERlcGxveW1lbnQsIFNvdXJjZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50J1xuXG5leHBvcnQgY2xhc3MgQXBwU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYXBwLCBpZClcblxuICAgIGNvbnN0IHJ1bk9sbGFtYUxvY2FsbHkgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdSdW5PbGxhbWFMb2NhbGx5JylcbiAgICBjb25zdCBydW5PblNjaGVkdWxlID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnUnVuT25TY2hlZHVsZScpXG4gICAgY29uc3QgbW9kZWxOYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnTW9kZWxOYW1lJylcblxuICAgIGlmIChydW5PbGxhbWFMb2NhbGx5ID09PSAndHJ1ZScpIHtcbiAgICAgIGlmICghbW9kZWxOYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnTW9kZWxOYW1lIGFuZCBEb2NrZXJJbWFnZVVyaSBtdXN0IGJlIHByb3ZpZGVkIGluIGNvbnRleHQnLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNka1BhcmFtcyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKCdjZGstcGFyYW1zLmpzb24nLCAndXRmOCcpKVxuICAgICAgY29uc3QgZG9ja2VySW1hZ2VVcmkgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdEb2NrZXJJbWFnZVVyaScpXG4gICAgICBpZiAoIW1vZGVsTmFtZSB8fCAhZG9ja2VySW1hZ2VVcmkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdNb2RlbE5hbWUgYW5kIERvY2tlckltYWdlVXJpIG11c3QgYmUgcHJvdmlkZWQgaW4gY29udGV4dCcsXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG9ja2VySW1hZ2VGdW5jdGlvblByb3BzOiBEb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHMgPSB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogYG9sbGFtYV8ke2Nka1BhcmFtcy5NT0RFTF9OQU1FfV9ydW5uZXJgLFxuICAgICAgICBtZW1vcnlTaXplOiAzMDA4LFxuICAgICAgICBlcGhlbWVyYWxTdG9yYWdlU2l6ZTogU2l6ZS5naWJpYnl0ZXMoMTApLFxuICAgICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwMCksXG4gICAgICAgIGFyY2hpdGVjdHVyZTogQXJjaGl0ZWN0dXJlLkFSTV82NCxcbiAgICAgICAgY29kZTogRG9ja2VySW1hZ2VDb2RlLmZyb21FY3IoXG4gICAgICAgICAgUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgJ0VjclJlcG8nLFxuICAgICAgICAgICAgYG9sbGFtYS0ke2Nka1BhcmFtcy5NT0RFTF9OQU1FfS1yZXBvYCxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBsYW1iZGEgPSBuZXcgRG9ja2VySW1hZ2VGdW5jdGlvbihcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ09sbGFtYVJ1bm5lckxhbWJkYScsXG4gICAgICAgIGRvY2tlckltYWdlRnVuY3Rpb25Qcm9wcyxcbiAgICAgIClcblxuICAgICAgY29uc3QgbG9nZ2luZ1BvbGljeSA9IG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuXG4gICAgICBsYW1iZGEuYWRkVG9Sb2xlUG9saWN5KGxvZ2dpbmdQb2xpY3kpXG4gICAgfVxuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCAnUGhpUmF3UmVjb3Jkc0J1Y2tldCcsIHtcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGFjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuUFJJVkFURSxcbiAgICAgIGJ1Y2tldE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1waGktcmF3LXJlY29yZHNgLFxuICAgIH0pXG5cbiAgICBuZXcgQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95RmlsZXMnLCB7XG4gICAgICBzb3VyY2VzOiBbU291cmNlLmFzc2V0KCdwaGktcmF3LXJlY29yZHMnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0LFxuICAgIH0pXG5cbiAgICBjb25zdCBub2RlSnNGdW5jdGlvblByb3BzOiBOb2RlanNGdW5jdGlvblByb3BzID0ge1xuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbXG4gICAgICAgICAgLy8gVXNlIHRoZSAnYXdzLXNkaycgYXZhaWxhYmxlIGluIHRoZSBMYW1iZGEgcnVudGltZSAoc2RrIHYzIGlzIGF2YWlsYWJsZSBieSBkZWZhdWx0IGluIE5vZGUgdjIwKVxuICAgICAgICAgICdhd3Mtc2RrJyxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkZXBzTG9ja0ZpbGVQYXRoOiBqb2luKF9fZGlybmFtZSwgJ2xhbWJkYXMnLCAncGFja2FnZS1sb2NrLmpzb24nKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFBSSU1BUllfS0VZOiAnaXRlbUlkJyxcbiAgICAgICAgRFlOQU1PX1RBQkxFX05BTUU6ICdURU1QJyxcbiAgICAgICAgUzNfQlVDS0VUX05BTUU6IGJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICAvLyBUQUJMRV9OQU1FOiBkeW5hbW9UYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogRHVyYXRpb24ubWludXRlcygxMCksXG4gICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU18yMF9YLFxuICAgIH1cblxuICAgIGxldCBsYW1iZGEgPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ1N5bmNEYXRhJywge1xuICAgICAgZW50cnk6IGpvaW4oX19kaXJuYW1lLCAnbGFtYmRhcycsICdzeW5jLWRhdGEudHMnKSxcbiAgICAgIC4uLm5vZGVKc0Z1bmN0aW9uUHJvcHMsXG4gICAgfSlcblxuICAgIGxhbWJkYS5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogWyd0ZXh0cmFjdDpBbmFseXplRG9jdW1lbnQnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgIH0pLFxuICAgIClcblxuICAgIGxhbWJkYS5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbYnVja2V0LmJ1Y2tldEFybiArICcvKiddLFxuICAgICAgfSksXG4gICAgKVxuXG4gICAgaWYgKHJ1bk9uU2NoZWR1bGUgIT09ICdmYWxzZScpIHtcbiAgICAgIC8vIHNjaGVkdWxlIHN0YXJ0cyBhdCAxOjAwYW0gVVRDIGV2ZXJ5IGRheSBieSBkZWZhdWx0XG4gICAgICBjb25zdCBldmVudFJ1bGUgPSBuZXcgUnVsZSh0aGlzLCAnc2NoZWR1bGVSdWxlJywge1xuICAgICAgICAvLyBUT0RPIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gYWRqdXN0IHRoaXMgY3JvbiBhcyBwcmVmZXJyZWQ7IGNhbiBqdXN0IHVwZGF0ZSBoZXJlIGZvciBub3cgYXMgbmVlZGVkXG4gICAgICAgIHNjaGVkdWxlOiBTY2hlZHVsZS5jcm9uKHsgbWludXRlOiAnMCcsIGhvdXI6ICcxJyB9KSxcbiAgICAgIH0pXG4gICAgICBldmVudFJ1bGUuYWRkVGFyZ2V0KG5ldyBMYW1iZGFGdW5jdGlvbihsYW1iZGEpKVxuICAgIH0gZWxzZSB7XG4gICAgfVxuICAgIGJ1Y2tldC5ncmFudFJlYWQobGFtYmRhKVxuICB9XG59XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKVxuY29uc3QgTU9ERUxfTkFNRSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ01vZGVsTmFtZScpXG5uZXcgQXBwU3RhY2soYXBwLCBgb2xsYW1hLSR7TU9ERUxfTkFNRX0tc3RhY2tgKVxuYXBwLnN5bnRoKClcbiJdfQ==