"use strict";
// Infrastructure as Code
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
const aws_dynamodb_1 = require("aws-cdk-lib/aws-dynamodb");
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
                // TODO fix, might need more memory than max, switch to ECS Fargate?
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
        const ehrTable = new aws_dynamodb_1.Table(this, 'EhrTable', {
            partitionKey: {
                name: 'fileName',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            // Sort documents under a partition key by insertionTime to preserve page order of EHR
            sortKey: {
                name: 'insertionTime',
                type: aws_dynamodb_1.AttributeType.NUMBER,
            },
            tableName: 'EhrTable',
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // NOT recommended for production code
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
                S3_BUCKET_NAME: bucket.bucketName,
                EHR_TABLE_NAME: ehrTable.tableName,
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
        ehrTable.grantReadData(lambda);
        ehrTable.grantWriteData(lambda);
        // TODO0 create an alarm for failure alerts
    }
}
exports.AppStack = AppStack;
const app = new aws_cdk_lib_1.App();
const MODEL_NAME = app.node.tryGetContext('ModelName');
new AppStack(app, `ollama-${MODEL_NAME}-stack`);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUJBQXlCOzs7QUFFekIsdURBTStCO0FBQy9CLDZDQUF1RTtBQUN2RSxpREFBNkQ7QUFDN0QseUJBQXdCO0FBQ3hCLGlEQUFnRDtBQUNoRCxxRUFHc0M7QUFDdEMsK0JBQTJCO0FBQzNCLHVEQUF1RDtBQUN2RCx1RUFBK0Q7QUFDL0QsK0NBQWdFO0FBQ2hFLHFFQUF3RTtBQUN4RSwyREFBK0Q7QUFFL0QsTUFBYSxRQUFTLFNBQVEsbUJBQUs7SUFDakMsWUFBWSxHQUFRLEVBQUUsRUFBVTtRQUM5QixLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRWQsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1FBQ25FLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1FBQzdELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBRXJELElBQUksZ0JBQWdCLEtBQUssTUFBTSxFQUFFO1lBQy9CLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FDYiwwREFBMEQsQ0FDM0QsQ0FBQTthQUNGO1NBQ0Y7YUFBTTtZQUNMLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBQ3hFLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUE7WUFDL0QsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDakMsTUFBTSxJQUFJLEtBQUss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LENBQUMsS0FBSyxFQUFFLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBJbmZyYXN0cnVjdHVyZSBhcyBDb2RlXG5cbmltcG9ydCB7XG4gIEFyY2hpdGVjdHVyZSxcbiAgRG9ja2VySW1hZ2VDb2RlLFxuICBEb2NrZXJJbWFnZUZ1bmN0aW9uLFxuICBEb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHMsXG4gIFJ1bnRpbWUsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnXG5pbXBvcnQgeyBBcHAsIER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTaXplLCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJ1xuaW1wb3J0IHsgRWZmZWN0LCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgeyBSZXBvc2l0b3J5IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcidcbmltcG9ydCB7XG4gIE5vZGVqc0Z1bmN0aW9uLFxuICBOb2RlanNGdW5jdGlvblByb3BzLFxufSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcydcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgUnVsZSwgU2NoZWR1bGUgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJ1xuaW1wb3J0IHsgTGFtYmRhRnVuY3Rpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnXG5pbXBvcnQgeyBCdWNrZXQsIEJ1Y2tldEFjY2Vzc0NvbnRyb2wgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnXG5pbXBvcnQgeyBCdWNrZXREZXBsb3ltZW50LCBTb3VyY2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCdcbmltcG9ydCB7IEF0dHJpYnV0ZVR5cGUsIFRhYmxlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJ1xuXG5leHBvcnQgY2xhc3MgQXBwU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYXBwLCBpZClcblxuICAgIGNvbnN0IHJ1bk9sbGFtYUxvY2FsbHkgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdSdW5PbGxhbWFMb2NhbGx5JylcbiAgICBjb25zdCBydW5PblNjaGVkdWxlID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnUnVuT25TY2hlZHVsZScpXG4gICAgY29uc3QgbW9kZWxOYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnTW9kZWxOYW1lJylcblxuICAgIGlmIChydW5PbGxhbWFMb2NhbGx5ID09PSAndHJ1ZScpIHtcbiAgICAgIGlmICghbW9kZWxOYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnTW9kZWxOYW1lIGFuZCBEb2NrZXJJbWFnZVVyaSBtdXN0IGJlIHByb3ZpZGVkIGluIGNvbnRleHQnLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNka1BhcmFtcyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKCdjZGstcGFyYW1zLmpzb24nLCAndXRmOCcpKVxuICAgICAgY29uc3QgZG9ja2VySW1hZ2VVcmkgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdEb2NrZXJJbWFnZVVyaScpXG4gICAgICBpZiAoIW1vZGVsTmFtZSB8fCAhZG9ja2VySW1hZ2VVcmkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdNb2RlbE5hbWUgYW5kIERvY2tlckltYWdlVXJpIG11c3QgYmUgcHJvdmlkZWQgaW4gY29udGV4dCcsXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG9ja2VySW1hZ2VGdW5jdGlvblByb3BzOiBEb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHMgPSB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogYG9sbGFtYV8ke2Nka1BhcmFtcy5NT0RFTF9OQU1FfV9ydW5uZXJgLFxuICAgICAgICAvLyBUT0RPIGZpeCwgbWlnaHQgbmVlZCBtb3JlIG1lbW9yeSB0aGFuIG1heCwgc3dpdGNoIHRvIEVDUyBGYXJnYXRlP1xuICAgICAgICBtZW1vcnlTaXplOiAzMDA4LFxuICAgICAgICBlcGhlbWVyYWxTdG9yYWdlU2l6ZTogU2l6ZS5naWJpYnl0ZXMoMTApLFxuICAgICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwMCksXG4gICAgICAgIGFyY2hpdGVjdHVyZTogQXJjaGl0ZWN0dXJlLkFSTV82NCxcbiAgICAgICAgY29kZTogRG9ja2VySW1hZ2VDb2RlLmZyb21FY3IoXG4gICAgICAgICAgUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgJ0VjclJlcG8nLFxuICAgICAgICAgICAgYG9sbGFtYS0ke2Nka1BhcmFtcy5NT0RFTF9OQU1FfS1yZXBvYCxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBsYW1iZGEgPSBuZXcgRG9ja2VySW1hZ2VGdW5jdGlvbihcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ09sbGFtYVJ1bm5lckxhbWJkYScsXG4gICAgICAgIGRvY2tlckltYWdlRnVuY3Rpb25Qcm9wcyxcbiAgICAgIClcblxuICAgICAgY29uc3QgbG9nZ2luZ1BvbGljeSA9IG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuXG4gICAgICBsYW1iZGEuYWRkVG9Sb2xlUG9saWN5KGxvZ2dpbmdQb2xpY3kpXG4gICAgfVxuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCAnUGhpUmF3UmVjb3Jkc0J1Y2tldCcsIHtcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gTk9UIHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIGNvZGVcbiAgICAgIGFjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuUFJJVkFURSxcbiAgICAgIGJ1Y2tldE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1waGktcmF3LXJlY29yZHNgLFxuICAgIH0pXG5cbiAgICBuZXcgQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95RmlsZXMnLCB7XG4gICAgICBzb3VyY2VzOiBbU291cmNlLmFzc2V0KCdwaGktcmF3LXJlY29yZHMnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0LFxuICAgIH0pXG5cbiAgICBjb25zdCBlaHJUYWJsZSA9IG5ldyBUYWJsZSh0aGlzLCAnRWhyVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2ZpbGVOYW1lJyxcbiAgICAgICAgdHlwZTogQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgLy8gU29ydCBkb2N1bWVudHMgdW5kZXIgYSBwYXJ0aXRpb24ga2V5IGJ5IGluc2VydGlvblRpbWUgdG8gcHJlc2VydmUgcGFnZSBvcmRlciBvZiBFSFJcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ2luc2VydGlvblRpbWUnLFxuICAgICAgICB0eXBlOiBBdHRyaWJ1dGVUeXBlLk5VTUJFUixcbiAgICAgIH0sXG4gICAgICB0YWJsZU5hbWU6ICdFaHJUYWJsZScsXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIE5PVCByZWNvbW1lbmRlZCBmb3IgcHJvZHVjdGlvbiBjb2RlXG4gICAgfSlcblxuICAgIGNvbnN0IG5vZGVKc0Z1bmN0aW9uUHJvcHM6IE5vZGVqc0Z1bmN0aW9uUHJvcHMgPSB7XG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFtcbiAgICAgICAgICAvLyBVc2UgdGhlICdhd3Mtc2RrJyBhdmFpbGFibGUgaW4gdGhlIExhbWJkYSBydW50aW1lIChzZGsgdjMgaXMgYXZhaWxhYmxlIGJ5IGRlZmF1bHQgaW4gTm9kZSB2MjApXG4gICAgICAgICAgJ2F3cy1zZGsnLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGRlcHNMb2NrRmlsZVBhdGg6IGpvaW4oX19kaXJuYW1lLCAnbGFtYmRhcycsICdwYWNrYWdlLWxvY2suanNvbicpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUzNfQlVDS0VUX05BTUU6IGJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBFSFJfVEFCTEVfTkFNRTogZWhyVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLm1pbnV0ZXMoMTApLFxuICAgICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICB9XG5cbiAgICBsZXQgbGFtYmRhID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsICdTeW5jRGF0YScsIHtcbiAgICAgIGVudHJ5OiBqb2luKF9fZGlybmFtZSwgJ2xhbWJkYXMnLCAnc3luYy1kYXRhLnRzJyksXG4gICAgICAuLi5ub2RlSnNGdW5jdGlvblByb3BzLFxuICAgIH0pXG5cbiAgICBsYW1iZGEuYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsndGV4dHJhY3Q6QW5hbHl6ZURvY3VtZW50J10sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KSxcbiAgICApXG5cbiAgICBsYW1iZGEuYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0J10sXG4gICAgICAgIHJlc291cmNlczogW2J1Y2tldC5idWNrZXRBcm4gKyAnLyonXSxcbiAgICAgIH0pLFxuICAgIClcblxuICAgIGlmIChydW5PblNjaGVkdWxlICE9PSAnZmFsc2UnKSB7XG4gICAgICAvLyBzY2hlZHVsZSBzdGFydHMgYXQgMTowMGFtIFVUQyBldmVyeSBkYXkgYnkgZGVmYXVsdFxuICAgICAgY29uc3QgZXZlbnRSdWxlID0gbmV3IFJ1bGUodGhpcywgJ3NjaGVkdWxlUnVsZScsIHtcbiAgICAgICAgLy8gVE9ETyB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGFkanVzdCB0aGlzIGNyb24gYXMgcHJlZmVycmVkOyBjYW4ganVzdCB1cGRhdGUgaGVyZSBmb3Igbm93IGFzIG5lZWRlZFxuICAgICAgICBzY2hlZHVsZTogU2NoZWR1bGUuY3Jvbih7IG1pbnV0ZTogJzAnLCBob3VyOiAnMScgfSksXG4gICAgICB9KVxuICAgICAgZXZlbnRSdWxlLmFkZFRhcmdldChuZXcgTGFtYmRhRnVuY3Rpb24obGFtYmRhKSlcbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgICBidWNrZXQuZ3JhbnRSZWFkKGxhbWJkYSlcblxuICAgIGVoclRhYmxlLmdyYW50UmVhZERhdGEobGFtYmRhKVxuICAgIGVoclRhYmxlLmdyYW50V3JpdGVEYXRhKGxhbWJkYSlcblxuICAgIC8vIFRPRE8wIGNyZWF0ZSBhbiBhbGFybSBmb3IgZmFpbHVyZSBhbGVydHNcbiAgfVxufVxuXG5jb25zdCBhcHAgPSBuZXcgQXBwKClcbmNvbnN0IE1PREVMX05BTUUgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdNb2RlbE5hbWUnKVxubmV3IEFwcFN0YWNrKGFwcCwgYG9sbGFtYS0ke01PREVMX05BTUV9LXN0YWNrYClcbmFwcC5zeW50aCgpXG4iXX0=