import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { v4 as uuidv4 } from 'uuid';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const sesClient = new SESClient({});

const ALERTS_TABLE = process.env.ALERTS_TABLE || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || '';

interface RoomData {
  room_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  occupancy: number;
  aqi: number;
  mode: string;
}

interface Alert {
  id: string;
  timestamp: string;
  room_id: string;
  type: 'mode_change' | 'system_fault' | 'high_occupancy' | 'temperature_threshold';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  details?: {
    oldMode?: string;
    newMode?: string;
    faultCode?: string;
    temperature?: number;
    occupancy?: number;
  };
}

// Configuration for thresholds
const CONFIG = {
  temperatureThresholds: {
    min: 18,
    max: 30
  },
  occupancyThreshold: 8
};

export const handler = async (event: DynamoDBStreamEvent, context: Context) => {
  try {
    console.log('Processing DynamoDB Stream event:', JSON.stringify(event, null, 2));
    
    // Process each record in the stream
    for (const record of event.Records) {
      // Only process new images (new or updated items)
      if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
        continue;
      }
      
      // Skip if there's no new image
      if (!record.dynamodb?.NewImage) {
        continue;
      }
      
      // Convert DynamoDB format to JavaScript object
      const newImage = record.dynamodb?.NewImage;
      const oldImage = record.dynamodb?.OldImage;
      
      const roomData: RoomData = {
        room_id: newImage?.room_id?.S || '',
        timestamp: newImage?.timestamp?.S || '',
        temperature: parseFloat(newImage?.temperature?.N || '0'),
        humidity: parseFloat(newImage?.humidity?.N || '0'),
        occupancy: parseInt(newImage?.occupancy?.N || '0', 10),
        aqi: parseFloat(newImage?.aqi?.N || '0'),
        mode: newImage?.mode?.S || ''
      };
      
      // Check for conditions that should trigger alerts
      const alerts: Alert[] = [];
      
      // Check for mode changes
      if (oldImage && oldImage.mode && oldImage.mode.S !== roomData.mode) {
        alerts.push({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          room_id: roomData.room_id,
          type: 'mode_change',
          severity: 'info',
          message: `Room ${roomData.room_id} HVAC mode changed to ${roomData.mode}`,
          acknowledged: false,
          details: {
            oldMode: oldImage.mode.S,
            newMode: roomData.mode
          }
        });
      }
      
      // Check for temperature thresholds
      if (roomData.temperature > CONFIG.temperatureThresholds.max) {
        alerts.push({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          room_id: roomData.room_id,
          type: 'temperature_threshold',
          severity: 'critical',
          message: `High temperature detected in Room ${roomData.room_id}`,
          acknowledged: false,
          details: {
            temperature: roomData.temperature
          }
        });
      } else if (roomData.temperature < CONFIG.temperatureThresholds.min) {
        alerts.push({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          room_id: roomData.room_id,
          type: 'temperature_threshold',
          severity: 'warning',
          message: `Low temperature detected in Room ${roomData.room_id}`,
          acknowledged: false,
          details: {
            temperature: roomData.temperature
          }
        });
      }
      
      // Check for high occupancy
      if (roomData.occupancy > CONFIG.occupancyThreshold) {
        alerts.push({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          room_id: roomData.room_id,
          type: 'high_occupancy',
          severity: 'warning',
          message: `High occupancy detected in Room ${roomData.room_id}`,
          acknowledged: false,
          details: {
            occupancy: roomData.occupancy
          }
        });
      }
      
      // Simulate system fault for demo purposes (randomly)
      if (Math.random() < 0.05) { // 5% chance of a fault
        const faultCodes = ['F104', 'E201', 'H503'];
        const randomFaultCode = faultCodes[Math.floor(Math.random() * faultCodes.length)];
        
        alerts.push({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          room_id: roomData.room_id,
          type: 'system_fault',
          severity: 'critical',
          message: `HVAC system fault detected in Room ${roomData.room_id}`,
          acknowledged: false,
          details: {
            faultCode: randomFaultCode
          }
        });
      }
      
      // Save alerts to DynamoDB and send emails
      for (const alert of alerts) {
        // Save to DynamoDB
        await docClient.send(new PutCommand({
          TableName: ALERTS_TABLE,
          Item: alert
        }));
        
        // Send email notification
        await sendAlertEmail(alert);
        
        console.log(`Alert created: ${alert.type} for room ${alert.room_id}`);
      }
    }
    
    return { statusCode: 200, body: 'Alerts processed successfully' };
  } catch (error) {
    console.error('Error processing alerts:', error);
    return { statusCode: 500, body: 'Error processing alerts' };
  }
};

async function sendAlertEmail(alert: Alert) {
  try {
    // Skip if no sender email is configured
    if (!SENDER_EMAIL) {
      console.log('No sender email configured, skipping email notification');
      return;
    }
    
    // Get recipient email from environment or use a default for demo
    // In a real app, you would get this from a user preferences table or similar
    const recipientEmail = 'admin@example.com'; // Replace with actual recipient
    
    // Create email content
    const subject = `EcoIQ Alert: ${alert.severity.toUpperCase()} - ${alert.message}`;
    
    let detailsText = '';
    if (alert.details) {
      if (alert.type === 'mode_change' && alert.details.oldMode && alert.details.newMode) {
        detailsText = `Mode changed from ${alert.details.oldMode} to ${alert.details.newMode}`;
      } else if (alert.type === 'system_fault' && alert.details.faultCode) {
        detailsText = `Fault code: ${alert.details.faultCode}`;
      } else if (alert.type === 'high_occupancy' && alert.details.occupancy) {
        detailsText = `Current occupancy: ${alert.details.occupancy} people`;
      } else if (alert.type === 'temperature_threshold' && alert.details.temperature) {
        detailsText = `Current temperature: ${alert.details.temperature}°C`;
      }
    }
    
    const body = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .alert { padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .info { background-color: #e3f2fd; border-left: 5px solid #2196f3; }
            .warning { background-color: #fff9c4; border-left: 5px solid #fbc02d; }
            .critical { background-color: #ffebee; border-left: 5px solid #f44336; }
            .details { margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h2>EcoIQ Alert Notification</h2>
          <div class="alert ${alert.severity}">
            <h3>${alert.message}</h3>
            <p><strong>Room:</strong> ${alert.room_id}</p>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Severity:</strong> ${alert.severity}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            ${detailsText ? `<div class="details">${detailsText}</div>` : ''}
          </div>
          <p>Please log in to the EcoIQ Dashboard to acknowledge this alert and take appropriate action.</p>
        </body>
      </html>
    `;
    
    // Send email using SES
  const command = new SendEmailCommand({
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [recipientEmail],
      },
    Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: body,
          },
        },
    },
  });

    await sesClient.send(command);
    console.log(`Alert email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending alert email:', error);
    // Don't throw the error, just log it - we don't want to fail the entire function if email fails
  }
} 