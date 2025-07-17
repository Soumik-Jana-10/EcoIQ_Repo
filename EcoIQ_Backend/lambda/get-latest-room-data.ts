import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error('TABLE_NAME environment variable is not set.');
    }

    const scanCommand = new ScanCommand({
      TableName: tableName,
    });

    const { Items } = await docClient.send(scanCommand);

    if (!Items) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
      };
    }

    const latestEntries: { [key: string]: any } = {};
    for (const item of Items) {
      const { room_id, timestamp } = item;
      if (!latestEntries[room_id] || timestamp > latestEntries[room_id].timestamp) {
        latestEntries[room_id] = item;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(Object.values(latestEntries)),
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    };
  } catch (error: any) {
    console.error('Error fetching latest room data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch latest room data', error: error.message }),
       headers: {
        "Access-Control-Allow-Origin": "*",
      }
    };
  }
}; 