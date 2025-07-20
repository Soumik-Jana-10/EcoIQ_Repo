import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const ALERTS_TABLE = process.env.ALERTS_TABLE || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const roomId = queryParams.roomId;
    const alertType = queryParams.type;
    const acknowledged = queryParams.acknowledged;
    const severity = queryParams.severity;
    
    let items;
    
    // If filtering by room_id, use the GSI
    if (roomId) {
      const params = {
        TableName: ALERTS_TABLE,
        IndexName: 'room_id-index',
        KeyConditionExpression: 'room_id = :roomId',
        ExpressionAttributeValues: {
          ':roomId': roomId
        },
        ScanIndexForward: false // Sort by timestamp descending (newest first)
      };
      
      const result = await docClient.send(new QueryCommand(params));
      items = result.Items;
    }
    // If filtering by type, use the type-index GSI
    else if (alertType) {
      const params = {
        TableName: ALERTS_TABLE,
        IndexName: 'type-index',
        KeyConditionExpression: 'type = :type',
        ExpressionAttributeValues: {
          ':type': alertType
        },
        ScanIndexForward: false // Sort by timestamp descending (newest first)
      };
      
      const result = await docClient.send(new QueryCommand(params));
      items = result.Items;
    }
    // Otherwise, scan the table for all alerts
    else {
      const params = {
        TableName: ALERTS_TABLE,
      };
      
      const result = await docClient.send(new ScanCommand(params));
      items = result.Items;
      
      // Sort by timestamp (newest first)
      if (items) {
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }
    
    // Apply additional filters if needed
    if (items && items.length > 0) {
      // Filter by acknowledged status if specified
      if (acknowledged !== undefined) {
        const isAcknowledged = acknowledged === 'true';
        items = items.filter(item => item.acknowledged === isAcknowledged);
      }
      
      // Filter by severity if specified
      if (severity) {
        items = items.filter(item => item.severity === severity);
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(items || [])
    };
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Failed to fetch alerts', error: (error as Error).message })
    };
  }
}; 