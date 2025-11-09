import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Setup2FAScreen from '../screens/Auth/Setup2FAScreen';
import SetupSecurityPinScreen from '../screens/Auth/SetupSecurityPinScreen';

const Stack = createNativeStackNavigator();

export default function SecuritySetupNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="Setup2FA"
    >
      <Stack.Screen name="Setup2FA" component={Setup2FAScreen} />
      <Stack.Screen name="SetupSecurityPin" component={SetupSecurityPinScreen} />
    </Stack.Navigator>
  );
}
