import { Authenticator, useTheme, View, Image, Text, Heading, Button, useAuthenticator, SelectField } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const components = {
  Header() {
    const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Image
          alt="EcoIQ logo"
          src="/eco-iq-logo.png"
          height="50%"
          width="50%"
        />
      </View>
    );
  },
  Footer() {
    return (
      <View textAlign="center" padding="1rem">
        <Text color="green.600">
          Note: In development mode, email verification is automatic.
        </Text>
      </View>
    );
  },
  SignUp: {
    FormFields() {
      const { validationErrors } = useAuthenticator();

      return (
        <>
          <Authenticator.SignUp.FormFields />
          <SelectField
            label="Role"
            name="custom:role"
            placeholder="Please select your role"
            required
            hasError={!!validationErrors['custom:role']}
            errorMessage={validationErrors['custom:role'] as string}
          >
            <option value="Admin">Admin</option>
            <option value="User">User</option>
            <option value="Technician">Technician</option>
          </SelectField>
        </>
      );
    },
  },
}

export default function Auth() {
  return (
    <div className="flex items-center justify-center min-h-screen">
        <Authenticator components={components}>
          {({ signOut }) => (
            <div className="text-center">
              <Heading level={3} className="mb-4">You are signed in!</Heading>
              <Button onClick={signOut} variation="primary">Sign Out</Button>
            </div>
          )}
        </Authenticator>
    </div>
  );
} 