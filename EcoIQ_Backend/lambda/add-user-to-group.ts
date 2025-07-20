import { CognitoUserPoolTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event: CognitoUserPoolTriggerEvent): Promise<CognitoUserPoolTriggerEvent> => {
  const { userName } = event;
  const role = event.request.userAttributes['custom:role'];

  if (!role) {
    console.log(`No role selected for user ${userName}.`);
    return event;
  }

  const command = new AdminAddUserToGroupCommand({
    GroupName: role,
    UserPoolId: event.userPoolId,
    Username: userName,
  });

  try {
    console.log(`Adding user ${userName} to group ${role}.`);
    await cognito.send(command);
    console.log(`Successfully added user ${userName} to group ${role}.`);
  } catch (error) {
    console.error(`Error adding user ${userName} to group ${role}:`, error);
  }

  return event;
}; 