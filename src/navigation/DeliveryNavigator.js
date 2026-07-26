// ============================================================
// src/navigation/DeliveryNavigator.js
// ✅ Delivery Boy navigation stack
// ============================================================

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import DeliveryDashboard from '../screens/delivery/DeliveryDashboard';
import SettingsScreen from '../screens/shared/SettingsScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import FeedbackScreen from '../screens/shared/FeedbackScreen';
import HelpAboutScreen from '../screens/shared/HelpAboutScreen';
import LegalScreen from '../screens/shared/LegalScreen';

const Stack = createNativeStackNavigator();

const DeliveryNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboard} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} />
    <Stack.Screen name="HelpAbout" component={HelpAboutScreen} />
    <Stack.Screen name="Legal" component={LegalScreen} />
  </Stack.Navigator>
);

export default DeliveryNavigator;
