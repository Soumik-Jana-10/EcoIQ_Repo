import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error('TABLE_NAME environment variable is not set.');
    }

    const roomId = event.pathParameters?.id;
    if (!roomId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Room ID is missing' }),
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
      };
    }

    const queryCommand = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'room_id = :roomId',
      ExpressionAttributeValues: {
        ':roomId': roomId,
      },
    });

    const { Items } = await docClient.send(queryCommand);

    return {
      statusCode: 200,
      body: JSON.stringify(Items || []),
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    };
  } catch (error: any) {
    console.error('Error fetching room history:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch room history', error: error.message }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    };
  }
}; 