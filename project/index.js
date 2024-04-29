"use strict";
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
const cdkParams = JSON.parse(fs.readFileSync('cdk-params.json', 'utf8'));
class AppStack extends aws_cdk_lib_1.Stack {
    constructor(app, id) {
        super(app, id);
        const runOllamaLocally = app.node.tryGetContext('RunOllamaLocally');
        const runOnSchedule = app.node.tryGetContext('RunOnSchedule');
        if (runOllamaLocally === 'true') {
        }
        else {
            const modelName = app.node.tryGetContext('ModelName');
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
        // Create an S3 bucket
        const bucket = new aws_s3_1.Bucket(this, 'PhiRawRecordsBucket', {
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            accessControl: aws_s3_1.BucketAccessControl.PRIVATE,
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
                TABLE_NAME: 'TEMP',
                // TABLE_NAME: dynamoTable.tableName,
            },
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
        };
        let lambda = new aws_lambda_nodejs_1.NodejsFunction(this, 'SyncData', {
            entry: (0, path_1.join)(__dirname, 'lambdas', 'sync-data.ts'),
            ...nodeJsFunctionProps,
        });
        if (runOnSchedule !== 'false') {
            // schedule starts at 1:00am UTC every day.
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
new AppStack(app, `ollama-${cdkParams.MODEL_NAME}-stack`);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1REFNK0I7QUFDL0IsNkNBQXVFO0FBQ3ZFLGlEQUE2RDtBQUM3RCx5QkFBd0I7QUFDeEIsaURBQWdEO0FBQ2hELHFFQUdzQztBQUN0QywrQkFBMkI7QUFDM0IsdURBQXVEO0FBQ3ZELHVFQUErRDtBQUMvRCwrQ0FBZ0U7QUFDaEUscUVBQXdFO0FBRXhFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO0FBQ3hFLE1BQWEsUUFBUyxTQUFRLG1CQUFLO0lBQ2pDLFlBQVksR0FBUSxFQUFFLEVBQVU7UUFDOUIsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUVkLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtRQUNuRSxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUU3RCxJQUFJLGdCQUFnQixLQUFLLE1BQU0sRUFBRTtTQUNoQzthQUFNO1lBQ0wsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDckQsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtZQUMvRCxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNqQyxNQUFNLElBQUksS0FBSyxDQUNiLDBEQUEwRCxDQUMzRCxDQUFBO2FBQ0Y7WUFFRCxNQUFNLHdCQUF3QixHQUE2QjtnQkFDekQsWUFBWSxFQUFFLFVBQVUsU0FBUyxDQUFDLFVBQVUsU0FBUztnQkFDckQs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Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQXJjaGl0ZWN0dXJlLFxuICBEb2NrZXJJbWFnZUNvZGUsXG4gIERvY2tlckltYWdlRnVuY3Rpb24sXG4gIERvY2tlckltYWdlRnVuY3Rpb25Qcm9wcyxcbiAgUnVudGltZSxcbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSdcbmltcG9ydCB7IEFwcCwgRHVyYXRpb24sIFJlbW92YWxQb2xpY3ksIFNpemUsIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInXG5pbXBvcnQgeyBFZmZlY3QsIFBvbGljeVN0YXRlbWVudCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCB7IFJlcG9zaXRvcnkgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyJ1xuaW1wb3J0IHtcbiAgTm9kZWpzRnVuY3Rpb24sXG4gIE5vZGVqc0Z1bmN0aW9uUHJvcHMsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJ1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBSdWxlLCBTY2hlZHVsZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnXG5pbXBvcnQgeyBMYW1iZGFGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cydcbmltcG9ydCB7IEJ1Y2tldCwgQnVja2V0QWNjZXNzQ29udHJvbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMydcbmltcG9ydCB7IEJ1Y2tldERlcGxveW1lbnQsIFNvdXJjZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50J1xuXG5jb25zdCBjZGtQYXJhbXMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnY2RrLXBhcmFtcy5qc29uJywgJ3V0ZjgnKSlcbmV4cG9ydCBjbGFzcyBBcHBTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihhcHAsIGlkKVxuXG4gICAgY29uc3QgcnVuT2xsYW1hTG9jYWxseSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ1J1bk9sbGFtYUxvY2FsbHknKVxuICAgIGNvbnN0IHJ1bk9uU2NoZWR1bGUgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdSdW5PblNjaGVkdWxlJylcblxuICAgIGlmIChydW5PbGxhbWFMb2NhbGx5ID09PSAndHJ1ZScpIHtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbW9kZWxOYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnTW9kZWxOYW1lJylcbiAgICAgIGNvbnN0IGRvY2tlckltYWdlVXJpID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnRG9ja2VySW1hZ2VVcmknKVxuICAgICAgaWYgKCFtb2RlbE5hbWUgfHwgIWRvY2tlckltYWdlVXJpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnTW9kZWxOYW1lIGFuZCBEb2NrZXJJbWFnZVVyaSBtdXN0IGJlIHByb3ZpZGVkIGluIGNvbnRleHQnLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvY2tlckltYWdlRnVuY3Rpb25Qcm9wczogRG9ja2VySW1hZ2VGdW5jdGlvblByb3BzID0ge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IGBvbGxhbWFfJHtjZGtQYXJhbXMuTU9ERUxfTkFNRX1fcnVubmVyYCxcbiAgICAgICAgbWVtb3J5U2l6ZTogMzAwOCxcbiAgICAgICAgZXBoZW1lcmFsU3RvcmFnZVNpemU6IFNpemUuZ2liaWJ5dGVzKDEwKSxcbiAgICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygzMDApLFxuICAgICAgICBhcmNoaXRlY3R1cmU6IEFyY2hpdGVjdHVyZS5BUk1fNjQsXG4gICAgICAgIGNvZGU6IERvY2tlckltYWdlQ29kZS5mcm9tRWNyKFxuICAgICAgICAgIFJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICdFY3JSZXBvJyxcbiAgICAgICAgICAgIGBvbGxhbWEtJHtjZGtQYXJhbXMuTU9ERUxfTkFNRX0tcmVwb2AsXG4gICAgICAgICAgKSxcbiAgICAgICAgKSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGFtYmRhID0gbmV3IERvY2tlckltYWdlRnVuY3Rpb24oXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdPbGxhbWFSdW5uZXJMYW1iZGEnLFxuICAgICAgICBkb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHMsXG4gICAgICApXG5cbiAgICAgIGNvbnN0IGxvZ2dpbmdQb2xpY3kgPSBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSlcblxuICAgICAgbGFtYmRhLmFkZFRvUm9sZVBvbGljeShsb2dnaW5nUG9saWN5KVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhbiBTMyBidWNrZXRcbiAgICBjb25zdCBidWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsICdQaGlSYXdSZWNvcmRzQnVja2V0Jywge1xuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYWNjZXNzQ29udHJvbDogQnVja2V0QWNjZXNzQ29udHJvbC5QUklWQVRFLFxuICAgIH0pXG5cbiAgICBuZXcgQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95RmlsZXMnLCB7XG4gICAgICBzb3VyY2VzOiBbU291cmNlLmFzc2V0KCdwaGktcmF3LXJlY29yZHMnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0LFxuICAgIH0pXG5cbiAgICBjb25zdCBub2RlSnNGdW5jdGlvblByb3BzOiBOb2RlanNGdW5jdGlvblByb3BzID0ge1xuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbXG4gICAgICAgICAgLy8gVXNlIHRoZSAnYXdzLXNkaycgYXZhaWxhYmxlIGluIHRoZSBMYW1iZGEgcnVudGltZSAoc2RrIHYzIGlzIGF2YWlsYWJsZSBieSBkZWZhdWx0IGluIE5vZGUgdjIwKVxuICAgICAgICAgICdhd3Mtc2RrJyxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkZXBzTG9ja0ZpbGVQYXRoOiBqb2luKF9fZGlybmFtZSwgJ2xhbWJkYXMnLCAncGFja2FnZS1sb2NrLmpzb24nKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFBSSU1BUllfS0VZOiAnaXRlbUlkJyxcbiAgICAgICAgVEFCTEVfTkFNRTogJ1RFTVAnLFxuICAgICAgICAvLyBUQUJMRV9OQU1FOiBkeW5hbW9UYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICB9XG5cbiAgICBsZXQgbGFtYmRhID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdTeW5jRGF0YScsIHtcbiAgICAgIGVudHJ5OiBqb2luKF9fZGlybmFtZSwgJ2xhbWJkYXMnLCAnc3luYy1kYXRhLnRzJyksXG4gICAgICAuLi5ub2RlSnNGdW5jdGlvblByb3BzLFxuICAgIH0pXG4gICAgaWYgKHJ1bk9uU2NoZWR1bGUgIT09ICdmYWxzZScpIHtcbiAgICAgIC8vIHNjaGVkdWxlIHN0YXJ0cyBhdCAxOjAwYW0gVVRDIGV2ZXJ5IGRheS5cbiAgICAgIGNvbnN0IGV2ZW50UnVsZSA9IG5ldyBSdWxlKHRoaXMsICdzY2hlZHVsZVJ1bGUnLCB7XG4gICAgICAgIC8vIFRPRE8gdXNlciBzaG91bGQgYmUgYWJsZSB0byBhZGp1c3QgdGhpcyBjcm9uIGFzIHByZWZlcnJlZDsgY2FuIGp1c3QgdXBkYXRlIGhlcmUgZm9yIG5vdyBhcyBuZWVkZWRcbiAgICAgICAgc2NoZWR1bGU6IFNjaGVkdWxlLmNyb24oeyBtaW51dGU6ICcwJywgaG91cjogJzEnIH0pLFxuICAgICAgfSlcbiAgICAgIGV2ZW50UnVsZS5hZGRUYXJnZXQobmV3IExhbWJkYUZ1bmN0aW9uKGxhbWJkYSkpXG4gICAgfSBlbHNlIHtcbiAgICB9XG4gICAgYnVja2V0LmdyYW50UmVhZChsYW1iZGEpXG4gIH1cbn1cblxuY29uc3QgYXBwID0gbmV3IEFwcCgpXG5uZXcgQXBwU3RhY2soYXBwLCBgb2xsYW1hLSR7Y2RrUGFyYW1zLk1PREVMX05BTUV9LXN0YWNrYClcbmFwcC5zeW50aCgpXG4iXX0=