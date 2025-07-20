import { Authenticator, useTheme, View, Image, Text } from '@aws-amplify/ui-react';
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
        <Text color="gray.500">
          &copy; 2024 EcoIQ. All rights reserved.
        </Text>
      </View>
    );
  },
}

export default function Auth() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Authenticator components={components} />
    </div>
  );
} 