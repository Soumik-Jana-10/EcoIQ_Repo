import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class EcoIqBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DDB-1: Create DynamoDB table for room data
    const roomDataTable = new dynamodb.Table(this, 'RoomDataTable', {
      tableName: 'room_data',
      partitionKey: { name: 'room_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev purposes
    });

    // DDB-5: Create DynamoDB table for alerts
    const alertsTable = new dynamodb.Table(this, 'AlertsTable', {
      tableName: 'alerts',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev purposes
    });

    // Add GSI for querying alerts by room_id
    alertsTable.addGlobalSecondaryIndex({
      indexName: 'room_id-index',
      partitionKey: { name: 'room_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Add GSI for querying alerts by type
    alertsTable.addGlobalSecondaryIndex({
      indexName: 'type-index',
      partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // LAM-4: Create Lambda function for alert engine
    const alertEngineLambda = new NodejsFunction(this, 'AlertEngineLambda', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/alert-engine.ts'),
        bundling: { forceDockerBundling: false },
        environment: {
            SENDER_EMAIL: 'your-verified-email@example.com', // Replace with your verified SES email
            ALERTS_TABLE: alertsTable.tableName,
        },
    });

    // SES-1: Grant Lambda send email permissions
    alertEngineLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: ['*'], // In a real app, you might restrict this to a specific SES identity
    }));

    // DDB-6: Grant Lambda write permissions to Alerts table
    alertsTable.grantWriteData(alertEngineLambda);

    // DDB-4: Add DynamoDB stream as an event source for the alert Lambda
    alertEngineLambda.addEventSource(new DynamoEventSource(roomDataTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 1,
    }));

    // LAM-5: Create Lambda function for fetching alerts
    const getAlertsLambda = new NodejsFunction(this, 'GetAlertsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/get-alerts.ts'),
      bundling: { forceDockerBundling: false },
      environment: {
        ALERTS_TABLE: alertsTable.tableName,
      },
    });

    // DDB-7: Grant Lambda read permissions to Alerts table
    alertsTable.grantReadData(getAlertsLambda);

    // LAM-6: Create Lambda function for acknowledging alerts
    const acknowledgeAlertLambda = new NodejsFunction(this, 'AcknowledgeAlertLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/acknowledge-alert.ts'),
      bundling: { forceDockerBundling: false },
      environment: {
        ALERTS_TABLE: alertsTable.tableName,
      },
    });

    // DDB-8: Grant Lambda write permissions to Alerts table
    alertsTable.grantWriteData(acknowledgeAlertLambda);

    // LAM-1: Create Lambda function for decision engine
    const decisionEngineLambda = new NodejsFunction(this, 'DecisionEngineLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/decision-engine.ts'),
      bundling: { forceDockerBundling: false },
      environment: {
        TABLE_NAME: roomDataTable.tableName,
      },
    });

    // DDB-2: Grant Lambda write permissions to DynamoDB table
    roomDataTable.grantWriteData(decisionEngineLambda);

    // LAM-2: Create Lambda function for fetching latest room data
    const getLatestRoomDataLambda = new NodejsFunction(this, 'GetLatestRoomDataLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/get-latest-room-data.ts'),
      bundling: { forceDockerBundling: false },
      environment: {
        TABLE_NAME: roomDataTable.tableName,
      },
    });

    // LAM-3: Create Lambda function for fetching room history
    const getRoomHistoryLambda = new NodejsFunction(this, 'GetRoomHistoryLambda', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/get-room-history.ts'),
        bundling: { forceDockerBundling: false },
        environment: {
            TABLE_NAME: roomDataTable.tableName,
        },
    });

    // DDB-3: Grant Lambdas read permissions to DynamoDB table
    roomDataTable.grantReadData(getLatestRoomDataLambda);
    roomDataTable.grantReadData(getRoomHistoryLambda);

    // COGNITO-1: Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'EcoIqUserPool', {
        userPoolName: 'EcoIqUserPool',
        selfSignUpEnabled: true,
        signInAliases: { email: true },
        autoVerify: { email: true },
        standardAttributes: {
            email: {
                required: true,
                mutable: false,
            },
        },
        passwordPolicy: {
            minLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireDigits: true,
            requireSymbols: true,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        customAttributes: {
            role: new cognito.StringAttribute({ mutable: true }),
        },
        lambdaTriggers: {
          preSignUp: new NodejsFunction(this, 'AutoConfirmUserLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'handler',
            entry: path.join(__dirname, '../lambda/auto-confirm-user.ts'),
            bundling: {
              forceDockerBundling: false,
            },
          }),
          // We'll add the postConfirmation trigger in a separate deployment
        }
    });

    // Create the Lambda but don't attach it to the User Pool yet
    const addUserToGroupLambda = new NodejsFunction(this, 'AddUserToGroupLambda', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/add-user-to-group.ts'),
        bundling: {
            forceDockerBundling: false,
        },
        environment: {
            USER_POOL_ID: userPool.userPoolId,
        },
    });

    // Grant the Lambda permission to add users to groups
    if (addUserToGroupLambda.role) {
      addUserToGroupLambda.role.addToPrincipalPolicy(new iam.PolicyStatement({
          actions: ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminUpdateUserAttributes'],
          resources: [userPool.userPoolArn],
      }));
    }

    // NOTE: We're not adding the trigger here due to circular dependency issues.
    // Instead, we'll use the AWS CLI to manually connect the Lambda to the User Pool.
    // Run the following command:
    // aws cognito-idp update-user-pool --user-pool-id <your-user-pool-id> --lambda-config "PostConfirmation=<your-lambda-arn>"

    // COGNITO-AUTH-1: Create API Gateway Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'EcoIqAuthorizer', {
        cognitoUserPools: [userPool],
    });

    // API-1: Create API Gateway to trigger Lambda
    const api = new apigateway.RestApi(this, 'EcoIqApi', {
      restApiName: 'EcoIQ Service',
      description: 'This service handles indoor environment data.',
      // NOTE: Removing global CORS to apply it at the resource level for maximum specificity
    });

    const ingestIntegration = new apigateway.LambdaIntegration(decisionEngineLambda);
    const ingestResource = api.root.addResource('ingest', {
        defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: ['POST'],
            allowHeaders: ['Content-Type'],
        },
    });
    ingestResource.addMethod('POST', ingestIntegration, {
        authorizationType: apigateway.AuthorizationType.NONE,
    });

    // API-2: Create /rooms endpoint
    const roomsResource = api.root.addResource('rooms', {
        defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: ['GET'],
            allowHeaders: ['Content-Type', 'Authorization'],
        },
    });
    const getLatestRoomDataIntegration = new apigateway.LambdaIntegration(getLatestRoomDataLambda);
    roomsResource.addMethod('GET', getLatestRoomDataIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
    });

    // API-3: Create /rooms/{id} endpoint
    const roomHistoryResource = roomsResource.addResource('{id}', {
        defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: ['GET'],
            allowHeaders: ['Content-Type', 'Authorization'],
        },
    });
    const getRoomHistoryIntegration = new apigateway.LambdaIntegration(getRoomHistoryLambda);
    roomHistoryResource.addMethod('GET', getRoomHistoryIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
    });

    // API-4: Create /alerts endpoint
    const alertsResource = api.root.addResource('alerts', {
        defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: ['GET'],
            allowHeaders: ['Content-Type', 'Authorization'],
        },
    });
    const getAlertsIntegration = new apigateway.LambdaIntegration(getAlertsLambda);
    alertsResource.addMethod('GET', getAlertsIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
    });

    // API-5: Create /alerts/{id}/acknowledge endpoint
    const alertResource = alertsResource.addResource('{id}');
    const acknowledgeResource = alertResource.addResource('acknowledge', {
        defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: ['POST'],
            allowHeaders: ['Content-Type', 'Authorization'],
        },
    });
    const acknowledgeAlertIntegration = new apigateway.LambdaIntegration(acknowledgeAlertLambda);
    acknowledgeResource.addMethod('POST', acknowledgeAlertIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
    });

    // COGNITO-2: Create User Pool Groups
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Admin',
      description: 'Administrators with full access',
    });

    new cognito.CfnUserPoolGroup(this, 'UserGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'User',
      description: 'Regular users with view-only access',
    });

    new cognito.CfnUserPoolGroup(this, 'TechnicianGroup', {
        userPoolId: userPool.userPoolId,
        groupName: 'Technician',
        description: 'Technicians with device management access',
    });

    // COGNITO-3: Create User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'EcoIqUserPoolClient', {
      userPool,
      userPoolClientName: 'EcoIqDashboardClient',
      authFlows: {
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // CDK-OUT-1: Output Cognito details
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      description: 'The ID of the Cognito User Pool',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
        value: userPoolClient.userPoolClientId,
        description: 'The ID of the Cognito User Pool Client',
    });

    // S3-1: Create S3 bucket for frontend deployment
    const websiteBucket = new s3.Bucket(this, 'EcoIqWebsiteBucket', {
        websiteIndexDocument: 'index.html',
        publicReadAccess: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        blockPublicAccess: new s3.BlockPublicAccess({
            blockPublicPolicy: false,
            restrictPublicBuckets: false,
            blockPublicAcls: false,
            ignorePublicAcls: false
        })
    });

    // S3-2: Deploy frontend to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
        sources: [s3deploy.Source.asset('../EcoIQ_Dashboard/dist')],
        destinationBucket: websiteBucket,
    });

    // CDK-OUT-2: Output website URL
    new cdk.CfnOutput(this, 'WebsiteURL', {
        value: websiteBucket.bucketWebsiteUrl,
        description: 'The URL of the website',
    });

    // CDK-OUT-3: Output API URL
    new cdk.CfnOutput(this, 'ApiURL', {
        value: api.url,
        description: 'The URL of the API',
    });
  }
}
