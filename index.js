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
            lambda.addToRolePolicy(new aws_iam_1.PolicyStatement({
                effect: aws_iam_1.Effect.ALLOW,
                actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                ],
                resources: ['*'],
            }));
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
        const wearableTable1 = new aws_dynamodb_1.Table(this, 'ActiveEnergyBurnedTable', {
            partitionKey: {
                name: 'startDateDate',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            sortKey: {
                name: 'endTime',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            tableName: 'ActiveEnergyBurned_Cal',
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // NOT recommended for production code
        });
        const wearableTable2 = new aws_dynamodb_1.Table(this, 'Distance_Mile', {
            partitionKey: {
                name: 'startDateDate',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            sortKey: {
                name: 'endTime',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            tableName: 'Distance_Mile',
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // NOT recommended for production code
        });
        const wearableTable3 = new aws_dynamodb_1.Table(this, 'HeartRate_CountPerMin', {
            partitionKey: {
                name: 'startDateDate',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            sortKey: {
                name: 'endTime',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            tableName: 'HeartRate_CountPerMin',
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // NOT recommended for production code
        });
        const wearableTable4 = new aws_dynamodb_1.Table(this, 'Steps_Count', {
            partitionKey: {
                name: 'startDateDate',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            sortKey: {
                name: 'endTime',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            tableName: 'Steps_Count',
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // NOT recommended for production code
        });
        const wearableTable5 = new aws_dynamodb_1.Table(this, 'BodyTemprature_Farenheit', {
            partitionKey: {
                name: 'startDateDate',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            sortKey: {
                name: 'endTime',
                type: aws_dynamodb_1.AttributeType.STRING,
            },
            tableName: 'BodyTemprature_Farenheit',
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
            // TODO if this is enabled, we should just be writing data from a timeframe of the schedule,
            // but currently the lambda is reading the entire source data.
            eventRule.addTarget(new aws_events_targets_1.LambdaFunction(lambda));
            // TODO0 create an alarm to automatically get alerted on scheduled sync failrues
        }
        bucket.grantRead(lambda);
        ehrTable.grantReadData(lambda);
        ehrTable.grantWriteData(lambda);
        wearableTable1.grantWriteData(lambda);
        wearableTable2.grantWriteData(lambda);
        wearableTable3.grantWriteData(lambda);
        wearableTable4.grantWriteData(lambda);
        wearableTable5.grantWriteData(lambda);
    }
}
exports.AppStack = AppStack;
const app = new aws_cdk_lib_1.App();
const MODEL_NAME = app.node.tryGetContext('ModelName');
new AppStack(app, `ollama-${MODEL_NAME}-stack`);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUJBQXlCOzs7QUFFekIsdURBTStCO0FBQy9CLDZDQUF1RTtBQUN2RSxpREFBNkQ7QUFDN0QseUJBQXdCO0FBQ3hCLGlEQUFnRDtBQUNoRCxxRUFHc0M7QUFDdEMsK0JBQTJCO0FBQzNCLHVEQUF1RDtBQUN2RCx1RUFBK0Q7QUFDL0QsK0NBQWdFO0FBQ2hFLHFFQUF3RTtBQUN4RSwyREFBK0Q7QUFFL0QsTUFBYSxRQUFTLFNBQVEsbUJBQUs7SUFDakMsWUFBWSxHQUFRLEVBQUUsRUFBVTtRQUM5QixLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRWQsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1FBQ25FLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1FBQzdELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBRXJELElBQUksZ0JBQWdCLEtBQUssTUFBTSxFQUFFO1lBQy9CLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FDYiwwREFBMEQsQ0FDM0QsQ0FBQTthQUNGO1NBQ0Y7YUFBTTtZQUNMLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBQ3hFLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUE7WUFDL0QsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDakMsTUFBTSxJQUFJLEtBQUss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LFFBQVEsRUFBRSxxQkFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO2FBQ3BELENBQUMsQ0FBQTtZQUNGLDRGQUE0RjtZQUM1Riw4REFBOEQ7WUFDOUQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1DQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtZQUMvQyxnRkFBZ0Y7U0FDakY7UUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXhCLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDOUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUUvQixjQUFjLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3JDLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDckMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNyQyxjQUFjLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3JDLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDdkMsQ0FBQztDQUNGO0FBOU1ELDRCQThNQztBQUVELE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQUcsRUFBRSxDQUFBO0FBQ3JCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBQ3RELElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRSxVQUFVLFVBQVUsUUFBUSxDQUFDLENBQUE7QUFDL0MsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gSW5mcmFzdHJ1Y3R1cmUgYXMgQ29kZVxuXG5pbXBvcnQge1xuICBBcmNoaXRlY3R1cmUsXG4gIERvY2tlckltYWdlQ29kZSxcbiAgRG9ja2VySW1hZ2VGdW5jdGlvbixcbiAgRG9ja2VySW1hZ2VGdW5jdGlvblByb3BzLFxuICBSdW50aW1lLFxufSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJ1xuaW1wb3J0IHsgQXBwLCBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU2l6ZSwgU3RhY2sgfSBmcm9tICdhd3MtY2RrLWxpYidcbmltcG9ydCB7IEVmZmVjdCwgUG9saWN5U3RhdGVtZW50IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHsgUmVwb3NpdG9yeSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3InXG5pbXBvcnQge1xuICBOb2RlanNGdW5jdGlvbixcbiAgTm9kZWpzRnVuY3Rpb25Qcm9wcyxcbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCdcbmltcG9ydCB7IFJ1bGUsIFNjaGVkdWxlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cydcbmltcG9ydCB7IExhbWJkYUZ1bmN0aW9uIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzJ1xuaW1wb3J0IHsgQnVja2V0LCBCdWNrZXRBY2Nlc3NDb250cm9sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJ1xuaW1wb3J0IHsgQnVja2V0RGVwbG95bWVudCwgU291cmNlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnXG5pbXBvcnQgeyBBdHRyaWJ1dGVUeXBlLCBUYWJsZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYidcblxuZXhwb3J0IGNsYXNzIEFwcFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaWQ6IHN0cmluZykge1xuICAgIHN1cGVyKGFwcCwgaWQpXG5cbiAgICBjb25zdCBydW5PbGxhbWFMb2NhbGx5ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnUnVuT2xsYW1hTG9jYWxseScpXG4gICAgY29uc3QgcnVuT25TY2hlZHVsZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ1J1bk9uU2NoZWR1bGUnKVxuICAgIGNvbnN0IG1vZGVsTmFtZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ01vZGVsTmFtZScpXG5cbiAgICBpZiAocnVuT2xsYW1hTG9jYWxseSA9PT0gJ3RydWUnKSB7XG4gICAgICBpZiAoIW1vZGVsTmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ01vZGVsTmFtZSBhbmQgRG9ja2VySW1hZ2VVcmkgbXVzdCBiZSBwcm92aWRlZCBpbiBjb250ZXh0JyxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjZGtQYXJhbXMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnY2RrLXBhcmFtcy5qc29uJywgJ3V0ZjgnKSlcbiAgICAgIGNvbnN0IGRvY2tlckltYWdlVXJpID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnRG9ja2VySW1hZ2VVcmknKVxuICAgICAgaWYgKCFtb2RlbE5hbWUgfHwgIWRvY2tlckltYWdlVXJpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnTW9kZWxOYW1lIGFuZCBEb2NrZXJJbWFnZVVyaSBtdXN0IGJlIHByb3ZpZGVkIGluIGNvbnRleHQnLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvY2tlckltYWdlRnVuY3Rpb25Qcm9wczogRG9ja2VySW1hZ2VGdW5jdGlvblByb3BzID0ge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IGBvbGxhbWFfJHtjZGtQYXJhbXMuTU9ERUxfTkFNRX1fcnVubmVyYCxcbiAgICAgICAgLy8gVE9ETyBmaXgsIG1pZ2h0IG5lZWQgbW9yZSBtZW1vcnkgdGhhbiBtYXgsIHN3aXRjaCB0byBFQ1MgRmFyZ2F0ZT9cbiAgICAgICAgbWVtb3J5U2l6ZTogMzAwOCxcbiAgICAgICAgZXBoZW1lcmFsU3RvcmFnZVNpemU6IFNpemUuZ2liaWJ5dGVzKDEwKSxcbiAgICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygzMDApLFxuICAgICAgICBhcmNoaXRlY3R1cmU6IEFyY2hpdGVjdHVyZS5BUk1fNjQsXG4gICAgICAgIGNvZGU6IERvY2tlckltYWdlQ29kZS5mcm9tRWNyKFxuICAgICAgICAgIFJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICdFY3JSZXBvJyxcbiAgICAgICAgICAgIGBvbGxhbWEtJHtjZGtQYXJhbXMuTU9ERUxfTkFNRX0tcmVwb2AsXG4gICAgICAgICAgKSxcbiAgICAgICAgKSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGFtYmRhID0gbmV3IERvY2tlckltYWdlRnVuY3Rpb24oXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdPbGxhbWFSdW5uZXJMYW1iZGEnLFxuICAgICAgICBkb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHMsXG4gICAgICApXG5cbiAgICAgIGxhbWJkYS5hZGRUb1JvbGVQb2xpY3koXG4gICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgfSksXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCAnUGhpUmF3UmVjb3Jkc0J1Y2tldCcsIHtcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gTk9UIHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIGNvZGVcbiAgICAgIGFjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuUFJJVkFURSxcbiAgICAgIGJ1Y2tldE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1waGktcmF3LXJlY29yZHNgLFxuICAgIH0pXG5cbiAgICBuZXcgQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95RmlsZXMnLCB7XG4gICAgICBzb3VyY2VzOiBbU291cmNlLmFzc2V0KCdwaGktcmF3LXJlY29yZHMnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0LFxuICAgIH0pXG5cbiAgICBjb25zdCBlaHJUYWJsZSA9IG5ldyBUYWJsZSh0aGlzLCAnRWhyVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2ZpbGVOYW1lJyxcbiAgICAgICAgdHlwZTogQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgLy8gU29ydCBkb2N1bWVudHMgdW5kZXIgYSBwYXJ0aXRpb24ga2V5IGJ5IGluc2VydGlvblRpbWUgdG8gcHJlc2VydmUgcGFnZSBvcmRlciBvZiBFSFJcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ2luc2VydGlvblRpbWUnLFxuICAgICAgICB0eXBlOiBBdHRyaWJ1dGVUeXBlLk5VTUJFUixcbiAgICAgIH0sXG4gICAgICB0YWJsZU5hbWU6ICdFaHJUYWJsZScsXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIE5PVCByZWNvbW1lbmRlZCBmb3IgcHJvZHVjdGlvbiBjb2RlXG4gICAgfSlcblxuICAgIGNvbnN0IHdlYXJhYmxlVGFibGUxID0gbmV3IFRhYmxlKHRoaXMsICdBY3RpdmVFbmVyZ3lCdXJuZWRUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnc3RhcnREYXRlRGF0ZScsXG4gICAgICAgIHR5cGU6IEF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ2VuZFRpbWUnLFxuICAgICAgICB0eXBlOiBBdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICB0YWJsZU5hbWU6ICdBY3RpdmVFbmVyZ3lCdXJuZWRfQ2FsJyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gTk9UIHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIGNvZGVcbiAgICB9KVxuXG4gICAgY29uc3Qgd2VhcmFibGVUYWJsZTIgPSBuZXcgVGFibGUodGhpcywgJ0Rpc3RhbmNlX01pbGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ3N0YXJ0RGF0ZURhdGUnLFxuICAgICAgICB0eXBlOiBBdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdlbmRUaW1lJyxcbiAgICAgICAgdHlwZTogQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgdGFibGVOYW1lOiAnRGlzdGFuY2VfTWlsZScsXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIE5PVCByZWNvbW1lbmRlZCBmb3IgcHJvZHVjdGlvbiBjb2RlXG4gICAgfSlcblxuICAgIGNvbnN0IHdlYXJhYmxlVGFibGUzID0gbmV3IFRhYmxlKHRoaXMsICdIZWFydFJhdGVfQ291bnRQZXJNaW4nLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ3N0YXJ0RGF0ZURhdGUnLFxuICAgICAgICB0eXBlOiBBdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdlbmRUaW1lJyxcbiAgICAgICAgdHlwZTogQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgdGFibGVOYW1lOiAnSGVhcnRSYXRlX0NvdW50UGVyTWluJyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gTk9UIHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIGNvZGVcbiAgICB9KVxuXG4gICAgY29uc3Qgd2VhcmFibGVUYWJsZTQgPSBuZXcgVGFibGUodGhpcywgJ1N0ZXBzX0NvdW50Jywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdzdGFydERhdGVEYXRlJyxcbiAgICAgICAgdHlwZTogQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAnZW5kVGltZScsXG4gICAgICAgIHR5cGU6IEF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHRhYmxlTmFtZTogJ1N0ZXBzX0NvdW50JyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gTk9UIHJlY29tbWVuZGVkIGZvciBwcm9kdWN0aW9uIGNvZGVcbiAgICB9KVxuXG4gICAgY29uc3Qgd2VhcmFibGVUYWJsZTUgPSBuZXcgVGFibGUodGhpcywgJ0JvZHlUZW1wcmF0dXJlX0ZhcmVuaGVpdCcsIHtcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnc3RhcnREYXRlRGF0ZScsXG4gICAgICAgIHR5cGU6IEF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ2VuZFRpbWUnLFxuICAgICAgICB0eXBlOiBBdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICB0YWJsZU5hbWU6ICdCb2R5VGVtcHJhdHVyZV9GYXJlbmhlaXQnLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBOT1QgcmVjb21tZW5kZWQgZm9yIHByb2R1Y3Rpb24gY29kZVxuICAgIH0pXG5cbiAgICBjb25zdCBub2RlSnNGdW5jdGlvblByb3BzOiBOb2RlanNGdW5jdGlvblByb3BzID0ge1xuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbXG4gICAgICAgICAgLy8gVXNlIHRoZSAnYXdzLXNkaycgYXZhaWxhYmxlIGluIHRoZSBMYW1iZGEgcnVudGltZSAoc2RrIHYzIGlzIGF2YWlsYWJsZSBieSBkZWZhdWx0IGluIE5vZGUgdjIwKVxuICAgICAgICAgICdhd3Mtc2RrJyxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkZXBzTG9ja0ZpbGVQYXRoOiBqb2luKF9fZGlybmFtZSwgJ2xhbWJkYXMnLCAncGFja2FnZS1sb2NrLmpzb24nKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFMzX0JVQ0tFVF9OQU1FOiBidWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgRUhSX1RBQkxFX05BTUU6IGVoclRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5taW51dGVzKDEwKSxcbiAgICAgIHJ1bnRpbWU6IFJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgfVxuXG4gICAgbGV0IGxhbWJkYSA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCAnU3luY0RhdGEnLCB7XG4gICAgICBlbnRyeTogam9pbihfX2Rpcm5hbWUsICdsYW1iZGFzJywgJ3N5bmMtZGF0YS50cycpLFxuICAgICAgLi4ubm9kZUpzRnVuY3Rpb25Qcm9wcyxcbiAgICB9KVxuXG4gICAgbGFtYmRhLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3RleHRyYWN0OkFuYWx5emVEb2N1bWVudCddLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSksXG4gICAgKVxuXG4gICAgbGFtYmRhLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICByZXNvdXJjZXM6IFtidWNrZXQuYnVja2V0QXJuICsgJy8qJ10sXG4gICAgICB9KSxcbiAgICApXG5cbiAgICBpZiAocnVuT25TY2hlZHVsZSAhPT0gJ2ZhbHNlJykge1xuICAgICAgLy8gc2NoZWR1bGUgc3RhcnRzIGF0IDE6MDBhbSBVVEMgZXZlcnkgZGF5IGJ5IGRlZmF1bHRcbiAgICAgIGNvbnN0IGV2ZW50UnVsZSA9IG5ldyBSdWxlKHRoaXMsICdzY2hlZHVsZVJ1bGUnLCB7XG4gICAgICAgIC8vIFRPRE8gdXNlciBzaG91bGQgYmUgYWJsZSB0byBhZGp1c3QgdGhpcyBjcm9uIGFzIHByZWZlcnJlZDsgY2FuIGp1c3QgdXBkYXRlIGhlcmUgZm9yIG5vdyBhcyBuZWVkZWRcbiAgICAgICAgc2NoZWR1bGU6IFNjaGVkdWxlLmNyb24oeyBtaW51dGU6ICcwJywgaG91cjogJzEnIH0pLFxuICAgICAgfSlcbiAgICAgIC8vIFRPRE8gaWYgdGhpcyBpcyBlbmFibGVkLCB3ZSBzaG91bGQganVzdCBiZSB3cml0aW5nIGRhdGEgZnJvbSBhIHRpbWVmcmFtZSBvZiB0aGUgc2NoZWR1bGUsXG4gICAgICAvLyBidXQgY3VycmVudGx5IHRoZSBsYW1iZGEgaXMgcmVhZGluZyB0aGUgZW50aXJlIHNvdXJjZSBkYXRhLlxuICAgICAgZXZlbnRSdWxlLmFkZFRhcmdldChuZXcgTGFtYmRhRnVuY3Rpb24obGFtYmRhKSlcbiAgICAgIC8vIFRPRE8wIGNyZWF0ZSBhbiBhbGFybSB0byBhdXRvbWF0aWNhbGx5IGdldCBhbGVydGVkIG9uIHNjaGVkdWxlZCBzeW5jIGZhaWxydWVzXG4gICAgfVxuXG4gICAgYnVja2V0LmdyYW50UmVhZChsYW1iZGEpXG5cbiAgICBlaHJUYWJsZS5ncmFudFJlYWREYXRhKGxhbWJkYSlcbiAgICBlaHJUYWJsZS5ncmFudFdyaXRlRGF0YShsYW1iZGEpXG5cbiAgICB3ZWFyYWJsZVRhYmxlMS5ncmFudFdyaXRlRGF0YShsYW1iZGEpXG4gICAgd2VhcmFibGVUYWJsZTIuZ3JhbnRXcml0ZURhdGEobGFtYmRhKVxuICAgIHdlYXJhYmxlVGFibGUzLmdyYW50V3JpdGVEYXRhKGxhbWJkYSlcbiAgICB3ZWFyYWJsZVRhYmxlNC5ncmFudFdyaXRlRGF0YShsYW1iZGEpXG4gICAgd2VhcmFibGVUYWJsZTUuZ3JhbnRXcml0ZURhdGEobGFtYmRhKVxuICB9XG59XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKVxuY29uc3QgTU9ERUxfTkFNRSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ01vZGVsTmFtZScpXG5uZXcgQXBwU3RhY2soYXBwLCBgb2xsYW1hLSR7TU9ERUxfTkFNRX0tc3RhY2tgKVxuYXBwLnN5bnRoKClcbiJdfQ==