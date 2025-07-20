import { Heading, Button, View } from '@aws-amplify/ui-react';

interface RoleSelectProps {
  onRoleSelect: (role: string) => void;
  signOut?: () => void;
}

export default function RoleSelect({ onRoleSelect, signOut }: RoleSelectProps) {
  const chooseRole = (role: string) => {
    onRoleSelect(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center space-y-6">
        <Heading level={3} fontWeight="bold">Select Your Dashboard</Heading>
        <View className="space-y-4">
          <Button variation="primary" className="w-full" onClick={() => chooseRole('User')}>Continue as User</Button>
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => chooseRole('Admin')}>Continue as Admin</Button>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => chooseRole('Technician')}>Continue as Technician</Button>
        </View>
        {signOut && (
          <Button className="w-full mt-4" variation="link" onClick={signOut}>Sign Out</Button>
        )}
      </div>
    </div>
  );
} 