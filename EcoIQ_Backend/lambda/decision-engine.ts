import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { room_id, temperature, humidity, occupancy, aqi } = requestBody;

    if (!room_id || temperature === undefined || humidity === undefined || occupancy === undefined || aqi === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required sensor data' }),
      };
    }

    let mode: 'Eco' | 'Comfort' | 'Cool' = 'Comfort';

    // Simplified decision logic
    if (occupancy === 0) {
      mode = 'Eco';
    } else if (temperature > 26 || aqi > 100) {
      mode = 'Cool';
    }

    const item = {
      room_id,
      timestamp: new Date().toISOString(),
      temperature,
      humidity,
      occupancy,
      aqi,
      mode,
    };

    const command = new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: item,
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
}; 