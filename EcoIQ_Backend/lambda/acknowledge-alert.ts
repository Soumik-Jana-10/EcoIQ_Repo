import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const ALERTS_TABLE = process.env.ALERTS_TABLE || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Get alert ID from path parameters
    const alertId = event.pathParameters?.id;
    
    if (!alertId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Alert ID is required' })
      };
    }
    
    // Parse request body if present
    let timestamp;
    if (event.body) {
      const body = JSON.parse(event.body);
      timestamp = body.timestamp;
    }
    
    // If timestamp wasn't provided, try to get it from DynamoDB
    if (!timestamp) {
      const getParams = {
        TableName: ALERTS_TABLE,
        Key: {
          id: alertId
        }
      };
      
      const getResult = await docClient.send(new GetCommand(getParams));
      if (!getResult.Item) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Alert not found' })
        };
      }
      
      timestamp = getResult.Item.timestamp;
    }
    
    // Update the alert to mark it as acknowledged
    const updateParams = {
      TableName: ALERTS_TABLE,
      Key: {
        id: alertId,
        timestamp: timestamp
      },
      UpdateExpression: 'SET acknowledged = :acknowledged, acknowledgedAt = :acknowledgedAt',
      ExpressionAttributeValues: {
        ':acknowledged': true,
        ':acknowledgedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW' as const
    };
    
    const result = await docClient.send(new UpdateCommand(updateParams));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Alert acknowledged successfully',
        alert: result.Attributes
      })
    };
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Failed to acknowledge alert', error: (error as Error).message })
    };
  }
}; 