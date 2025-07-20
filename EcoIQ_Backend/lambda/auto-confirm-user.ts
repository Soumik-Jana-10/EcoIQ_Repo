import { CognitoUserPoolTriggerEvent } from 'aws-lambda';

export const handler = async (event: CognitoUserPoolTriggerEvent) => {
  console.log('Auto-confirming user:', event.userName);
  
  // Auto confirm the user
  event.response.autoConfirmUser = true;
  
  // Auto verify email and phone if present
  event.response.autoVerifyEmail = true;
  event.response.autoVerifyPhone = true;

  return event;
}; 