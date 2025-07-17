import {
  CognitoUserPoolTriggerEvent,
} from 'aws-lambda';

export const handler = async (event: CognitoUserPoolTriggerEvent) => {
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
}; 