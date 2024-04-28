"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStack = void 0;
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const fs = require("fs");
const aws_ecr_1 = require("aws-cdk-lib/aws-ecr");
const cdkParams = JSON.parse(fs.readFileSync('cdk-params.json', 'utf8'));
class AppStack extends aws_cdk_lib_1.Stack {
    constructor(app, id) {
        super(app, id);
        const modelName = app.node.tryGetContext('ModelName');
        const dockerImageUri = app.node.tryGetContext('DockerImageUri');
        const runOllamaLocally = app.node.tryGetContext('RunOllamaLocally');
        console.log('BOO' + runOllamaLocally);
        if (runOllamaLocally === 'true') {
            if (!modelName) {
                throw new Error('ModelName must be provided in context');
            }
            console.log(modelName);
        }
        else {
            if (!modelName || !dockerImageUri) {
                throw new Error('ModelName and DockerImageUri must be provided in context');
            }
            const dockerImageFunctionProps = {
                functionName: `ollama_${cdkParams.MODEL_NAME}_runner`,
                memorySize: 3008,
                ephemeralStorageSize: aws_cdk_lib_1.Size.gibibytes(10),
                timeout: aws_cdk_lib_1.Duration.seconds(300),
                code: aws_lambda_1.DockerImageCode.fromEcr(aws_ecr_1.Repository.fromRepositoryName(this, 'EcrRepo', `ollama-${cdkParams.MODEL_NAME}-repo`)),
                environment: {
                    TABLE_NAME: 'TEMP',
                    MODEL_NAME: cdkParams.MODEL_NAME,
                },
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
    }
}
exports.AppStack = AppStack;
const app = new aws_cdk_lib_1.App();
new AppStack(app, `ollama-${cdkParams.MODEL_NAME}-stack`);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1REFJK0I7QUFDL0IsNkNBQXdEO0FBQ3hELGlEQUE2RDtBQUM3RCx5QkFBd0I7QUFDeEIsaURBQWdEO0FBRWhELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO0FBQ3hFLE1BQWEsUUFBUyxTQUFRLG1CQUFLO0lBQ2pDLFlBQVksR0FBUSxFQUFFLEVBQVU7UUFDOUIsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUVkLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3JELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUE7UUFDL0QsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1FBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLGdCQUFnQixDQUFDLENBQUE7UUFFckMsSUFBSSxnQkFBZ0IsS0FBSyxNQUFNLEVBQUU7WUFDL0IsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUE7YUFDekQ7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1NBQ3ZCO2FBQU07WUFDTCxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNqQyxNQUFNLElBQUksS0FBSyxDQUNiLDBEQUEwRCxDQUMzRCxDQUFBO2FBQ0Y7WUFFRCxNQUFNLHdCQUF3QixHQUE2QjtnQkFDekQsWUFBWSxFQUFFLFVBQVUsU0FBUyxDQUFDLFVBQVUsU0FBUztnQkFDckQsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLG9CQUFvQixFQUFFLGtCQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFDOUIsSUFBSSxFQUFFLDRCQUFlLENBQUMsT0FBTyxDQUMzQixvQkFBVSxDQUFDLGtCQUFrQixDQUMzQixJQUFJLEVBQ0osU0FBUyxFQUNULFVBQVUsU0FBUyxDQUFDLFVBQVUsT0FBTyxDQUN0QyxDQUNGO2dCQUNELFdBQVcsRUFBRTtvQkFDWCxVQUFVLEVBQUUsTUFBTTtvQkFDbEIsVUFBVSxFQUFFLFNBQVMsQ0FBQyxVQUFVO2lCQUNqQzthQUNGLENBQUE7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGdDQUFtQixDQUNwQyxJQUFJLEVBQ0osb0JBQW9CLEVBQ3BCLHdCQUF3QixDQUN6QixDQUFBO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSx5QkFBZSxDQUFDO2dCQUN4QyxNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLO2dCQUNwQixPQUFPLEVBQUU7b0JBQ1AscUJBQXFCO29CQUNyQixzQkFBc0I7b0JBQ3RCLG1CQUFtQjtpQkFDcEI7Z0JBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO2FBQ2pCLENBQUMsQ0FBQTtZQUVGLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUE7U0FDdEM7SUFDSCxDQUFDO0NBQ0Y7QUExREQsNEJBMERDO0FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxFQUFFLENBQUE7QUFDckIsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLFVBQVUsU0FBUyxDQUFDLFVBQVUsUUFBUSxDQUFDLENBQUE7QUFDekQsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgRG9ja2VySW1hZ2VDb2RlLFxuICBEb2NrZXJJbWFnZUZ1bmN0aW9uLFxuICBEb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHMsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnXG5pbXBvcnQgeyBBcHAsIER1cmF0aW9uLCBTaXplLCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJ1xuaW1wb3J0IHsgRWZmZWN0LCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgeyBSZXBvc2l0b3J5IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcidcblxuY29uc3QgY2RrUGFyYW1zID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoJ2Nkay1wYXJhbXMuanNvbicsICd1dGY4JykpXG5leHBvcnQgY2xhc3MgQXBwU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYXBwLCBpZClcblxuICAgIGNvbnN0IG1vZGVsTmFtZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ01vZGVsTmFtZScpXG4gICAgY29uc3QgZG9ja2VySW1hZ2VVcmkgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdEb2NrZXJJbWFnZVVyaScpXG4gICAgY29uc3QgcnVuT2xsYW1hTG9jYWxseSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ1J1bk9sbGFtYUxvY2FsbHknKVxuICAgIGNvbnNvbGUubG9nKCdCT08nICsgcnVuT2xsYW1hTG9jYWxseSlcblxuICAgIGlmIChydW5PbGxhbWFMb2NhbGx5ID09PSAndHJ1ZScpIHtcbiAgICAgIGlmICghbW9kZWxOYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kZWxOYW1lIG11c3QgYmUgcHJvdmlkZWQgaW4gY29udGV4dCcpXG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhtb2RlbE5hbWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghbW9kZWxOYW1lIHx8ICFkb2NrZXJJbWFnZVVyaSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ01vZGVsTmFtZSBhbmQgRG9ja2VySW1hZ2VVcmkgbXVzdCBiZSBwcm92aWRlZCBpbiBjb250ZXh0JyxcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBjb25zdCBkb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHM6IERvY2tlckltYWdlRnVuY3Rpb25Qcm9wcyA9IHtcbiAgICAgICAgZnVuY3Rpb25OYW1lOiBgb2xsYW1hXyR7Y2RrUGFyYW1zLk1PREVMX05BTUV9X3J1bm5lcmAsXG4gICAgICAgIG1lbW9yeVNpemU6IDMwMDgsXG4gICAgICAgIGVwaGVtZXJhbFN0b3JhZ2VTaXplOiBTaXplLmdpYmlieXRlcygxMCksXG4gICAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMzAwKSxcbiAgICAgICAgY29kZTogRG9ja2VySW1hZ2VDb2RlLmZyb21FY3IoXG4gICAgICAgICAgUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgJ0VjclJlcG8nLFxuICAgICAgICAgICAgYG9sbGFtYS0ke2Nka1BhcmFtcy5NT0RFTF9OQU1FfS1yZXBvYCxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFRBQkxFX05BTUU6ICdURU1QJyxcbiAgICAgICAgICBNT0RFTF9OQU1FOiBjZGtQYXJhbXMuTU9ERUxfTkFNRSxcbiAgICAgICAgfSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGFtYmRhID0gbmV3IERvY2tlckltYWdlRnVuY3Rpb24oXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdPbGxhbWFSdW5uZXJMYW1iZGEnLFxuICAgICAgICBkb2NrZXJJbWFnZUZ1bmN0aW9uUHJvcHMsXG4gICAgICApXG5cbiAgICAgIGNvbnN0IGxvZ2dpbmdQb2xpY3kgPSBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSlcblxuICAgICAgbGFtYmRhLmFkZFRvUm9sZVBvbGljeShsb2dnaW5nUG9saWN5KVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBhcHAgPSBuZXcgQXBwKClcbm5ldyBBcHBTdGFjayhhcHAsIGBvbGxhbWEtJHtjZGtQYXJhbXMuTU9ERUxfTkFNRX0tc3RhY2tgKVxuYXBwLnN5bnRoKClcbiJdfQ==