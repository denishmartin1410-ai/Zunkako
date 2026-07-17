// ============================================================
// src/navigation/DeliveryNavigator.js
// ✅ Delivery Boy navigation stack
// ============================================================

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import DeliveryDashboard from '../screens/delivery/DeliveryDashboard';
import SettingsScreen from '../screens/shared/SettingsScreen';

const Stack = createNativeStackNavigator();

const DeliveryNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboard} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

export default DeliveryNavigator;
