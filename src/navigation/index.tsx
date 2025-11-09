import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SecuritySetupNavigator from './SecuritySetupNavigator';
import ChatRoomScreen from '../screens/Chat/ChatRoomScreen';
import VoiceCallScreen from '../screens/Calls/VoiceCallScreen';
import VideoCallScreen from '../screens/Calls/VideoCallScreen';
import AddParticipantsScreen from '../screens/Calls/AddParticipantsScreen';
import CallParticipantsScreen from '../screens/Calls/CallParticipantsScreen';
import CallSettingsScreen from '../screens/Calls/CallSettingsScreen';
import ContactProfileScreen from '../screens/Profile/ContactProfileScreen';
import SearchInChatScreen from '../screens/Profile/SearchInChatScreen';
import LoginActivityScreen from '../screens/Profile/LoginActivityScreen';
import CallSettingsProfileScreen from '../screens/Profile/CallSettingsScreen';
import SharedMediaScreen from '../screens/Profile/SharedMediaScreen';
import NotificationsScreen from '../screens/Profile/NotificationsScreen';
import PrivacyScreen from '../screens/Profile/PrivacyScreen';
import TwoFactorAuthScreen from '../screens/Profile/TwoFactorAuthScreen';
import SecurityCodeScreen from '../screens/Profile/SecurityCodeScreen';
import LanguageScreen from '../screens/Profile/LanguageScreen';
import HelpSupportScreen from '../screens/Profile/HelpSupportScreen';
import AboutScreen from '../screens/Profile/AboutScreen';
import EnhancedMediaPickerScreen from '../screens/Stories/EnhancedMediaPickerScreen';
import EnhancedVideoEditorScreen from '../screens/Stories/EnhancedVideoEditorScreen';
import EnhancedImageEditorScreen from '../screens/Stories/EnhancedImageEditorScreen';
import StoryViewerScreen from '../screens/Stories/StoryViewerScreen';
import ChatWallpaperScreen from '../screens/Chat/ChatWallpaperScreen';
import CustomWallpaperScreen from '../screens/Chat/CustomWallpaperScreen';
import PrivacyPolicyScreen from '../screens/Profile/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/Profile/TermsOfServiceScreen';
import UserGuideScreen from '../screens/Profile/UserGuideScreen';
import LiveChatScreen from '../screens/Profile/LiveChatScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import GroupManagementScreen from '../screens/Chat/GroupManagementScreen';
import DevNavigationScreen from '../screens/Dev/DevNavigationScreen';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  DevNavigation: undefined;
  ChatRoom: undefined;
  VoiceCall: undefined;
  VideoCall: undefined;
  AddParticipants: undefined;
  CallParticipants: undefined;
  CallSettings: undefined;
  LoginActivity: undefined;
  CallSettingsProfile: undefined;
  ContactProfile: undefined;
  SearchInChat: undefined;
  SharedMedia: undefined;
  Notifications: undefined;
  Privacy: undefined;
  TwoFactorAuth: undefined;
  SecurityCode: undefined;
  Language: undefined;
  HelpSupport: undefined;
  About: undefined;
  EditProfile: undefined;
  GroupManagement: undefined;
  CreateStory: undefined;
  MediaPicker: undefined;
  VideoEditor: {
    mediaUri: string;
    mediaType: 'video';
  };
  EnhancedVideoEditor: {
    mediaUri: string;
    mediaType: 'video';
  };
  ImageEditor: {
    mediaUri: string | null;
    mediaType: 'image' | 'text';
    gradient?: any;
  };
  EnhancedImageEditor: {
    mediaUri: string | null;
    mediaType: 'image' | 'text';
    gradient?: any;
  };
  StoryList: undefined;
  StoryViewer: undefined;
  ChatWallpaper: undefined;
  CustomWallpaper: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  UserGuide: undefined;
  LiveChat: undefined;
  SecuritySetup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const requiresSecuritySetup = Boolean(
    user && (!user.twoFactorEnabled || !user.securityPinConfigured)
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen 
              name="DevNavigation" 
              component={DevNavigationScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
          </>
        ) : requiresSecuritySetup ? (
          <>
            <Stack.Screen name="SecuritySetup" component={SecuritySetupNavigator} />
            <Stack.Screen 
              name="DevNavigation" 
              component={DevNavigationScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen 
              name="SecuritySetup" 
              component={SecuritySetupNavigator}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="DevNavigation" 
              component={DevNavigationScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="ChatRoom" 
              component={ChatRoomScreen}
              options={{ 
                headerShown: true,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="VoiceCall" 
              component={VoiceCallScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen 
              name="VideoCall" 
              component={VideoCallScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen 
              name="AddParticipants" 
              component={AddParticipantsScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="CallParticipants" 
              component={CallParticipantsScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="CallSettings" 
              component={CallSettingsScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="ContactProfile" 
              component={ContactProfileScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="SearchInChat" 
              component={SearchInChatScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="LoginActivity" 
              component={LoginActivityScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="CallSettingsProfile" 
              component={CallSettingsProfileScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="SharedMedia" 
              component={SharedMediaScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Privacy" 
              component={PrivacyScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="TwoFactorAuth" 
              component={TwoFactorAuthScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="SecurityCode" 
              component={SecurityCodeScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="Language" 
              component={LanguageScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="HelpSupport" 
              component={HelpSupportScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="About" 
              component={AboutScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="GroupManagement" 
              component={GroupManagementScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="CreateStory" 
              component={EnhancedMediaPickerScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen 
              name="MediaPicker" 
              component={EnhancedMediaPickerScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen 
              name="VideoEditor" 
              component={EnhancedVideoEditorScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'card',
              }}
            />
            <Stack.Screen 
              name="EnhancedVideoEditor" 
              component={EnhancedVideoEditorScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'card',
              }}
            />
            <Stack.Screen 
              name="ImageEditor" 
              component={EnhancedImageEditorScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'card',
              }}
            />
            <Stack.Screen 
              name="EnhancedImageEditor" 
              component={EnhancedImageEditorScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'card',
              }}
            />
            <Stack.Screen 
              name="StoryList" 
              component={MainNavigator}
              options={{ 
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="StoryViewer" 
              component={StoryViewerScreen}
              options={{ 
                headerShown: false,
                animation: 'fade',
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen 
              name="ChatWallpaper" 
              component={ChatWallpaperScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="CustomWallpaper" 
              component={CustomWallpaperScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="TermsOfService" 
              component={TermsOfServiceScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="UserGuide" 
              component={UserGuideScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="LiveChat" 
              component={LiveChatScreen}
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
