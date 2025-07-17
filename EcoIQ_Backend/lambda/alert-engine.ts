import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';

const sesClient = new SESClient({});
const SENDER_EMAIL = process.env.SENDER_EMAIL;

export const handler = async (event: DynamoDBStreamEvent) => {
  if (!SENDER_EMAIL) {
    console.error('SENDER_EMAIL environment variable not set.');
    return;
  }

  for (const record of event.Records) {
    if (record.eventName === 'MODIFY') {
      const oldImage = record.dynamodb?.OldImage;
      const newImage = record.dynamodb?.NewImage;

      if (oldImage && newImage) {
        const oldMode = oldImage.mode?.S;
        const newMode = newImage.mode?.S;
        const roomId = newImage.room_id?.S;

        if (oldMode && newMode && oldMode !== newMode) {
          console.log(`Mode changed for room ${roomId} from ${oldMode} to ${newMode}. Sending alert.`);
          
          await sendAlertEmail(roomId, oldMode, newMode);
        }
      }
    }
  }
};

async function sendAlertEmail(roomId: string | undefined, oldMode: string, newMode: string) {
    if(!roomId) return;

  const toAddress = SENDER_EMAIL; // In a real app, you might look up a recipient list
  const subject = `HVAC Mode Change Alert for Room ${roomId}`;
  const body = `The HVAC mode for room ${roomId} has changed from ${oldMode} to ${newMode}.`;

  const command = new SendEmailCommand({
    Source: SENDER_EMAIL!,
    Destination: { ToAddresses: [toAddress!] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: body } },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`Email alert sent to ${toAddress}`);
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
} 