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

    // LAM-4: Create Lambda function for alert engine
    const alertEngineLambda = new lambda.Function(this, 'AlertEngineLambda', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'alert-engine.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
        environment: {
            SENDER_EMAIL: 'your-verified-email@example.com', // Replace with your verified SES email
        },
    });

    // SES-1: Grant Lambda send email permissions
    alertEngineLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: ['*'], // In a real app, you might restrict this to a specific SES identity
    }));

    // DDB-4: Add DynamoDB stream as an event source for the alert Lambda
    alertEngineLambda.addEventSource(new DynamoEventSource(roomDataTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 1,
    }));

    // LAM-1: Create Lambda function for decision engine
    const decisionEngineLambda = new lambda.Function(this, 'DecisionEngineLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'decision-engine.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: roomDataTable.tableName,
      },
    });

    // DDB-2: Grant Lambda write permissions to DynamoDB table
    roomDataTable.grantWriteData(decisionEngineLambda);

    // LAM-2: Create Lambda function for fetching latest room data
    const getLatestRoomDataLambda = new lambda.Function(this, 'GetLatestRoomDataLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get-latest-room-data.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: roomDataTable.tableName,
      },
    });

    // LAM-3: Create Lambda function for fetching room history
    const getRoomHistoryLambda = new lambda.Function(this, 'GetRoomHistoryLambda', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'get-room-history.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
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
        lambdaTriggers: {
          preSignUp: new lambda.Function(this, 'AutoConfirmUserLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'auto-confirm-user.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
          }),
        }
    });

    // COGNITO-AUTH-1: Create API Gateway Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'EcoIqAuthorizer', {
        cognitoUserPools: [userPool],
    });

    // API-1: Create API Gateway to trigger Lambda
    const api = new apigateway.RestApi(this, 'EcoIqApi', {
      restApiName: 'EcoIQ Service',
      description: 'This service handles indoor environment data.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const ingestIntegration = new apigateway.LambdaIntegration(decisionEngineLambda);
    const ingestResource = api.root.addResource('ingest');
    ingestResource.addMethod('POST', ingestIntegration, {
        authorizationType: apigateway.AuthorizationType.NONE,
    });

    // API-2: Create /rooms endpoint
    const roomsResource = api.root.addResource('rooms');
    const getLatestRoomDataIntegration = new apigateway.LambdaIntegration(getLatestRoomDataLambda);
    roomsResource.addMethod('GET', getLatestRoomDataIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
    });

    // API-3: Create /rooms/{id} endpoint
    const roomHistoryResource = roomsResource.addResource('{id}');
    const getRoomHistoryIntegration = new apigateway.LambdaIntegration(getRoomHistoryLambda);
    roomHistoryResource.addMethod('GET', getRoomHistoryIntegration, {
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
        }),
    });

    // S3-2: Deploy frontend build to S3
    new s3deploy.BucketDeployment(this, 'DeployEcoIqWebsite', {
        sources: [s3deploy.Source.asset(path.join(__dirname, '../../EcoIQ_Dashboard/dist'))],
        destinationBucket: websiteBucket,
    });

    // CDK-OUT-2: Output website URL
    new cdk.CfnOutput(this, 'WebsiteUrl', {
        value: websiteBucket.bucketWebsiteUrl,
        description: 'The URL of the deployed frontend website',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
        value: websiteBucket.bucketName,
        description: 'The name of the S3 bucket hosting the frontend',
    });
  }
}
