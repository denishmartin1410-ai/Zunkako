// ============================================================
// src/navigation/RootNavigator.js
// ✅ Auto-login: Firebase auth state → direct home
// ✅ First time → Welcome/Login screen
// ✅ Already logged in → Home screen directly
// ============================================================

import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {COLORS} from '../utils/theme';

import AuthNavigator from './AuthNavigator';
import ConsumerNavigator from './ConsumerNavigator';
import FarmerNavigator from './FarmerNavigator';
import AdminNavigator from './AdminNavigator';
import DeliveryNavigator from './DeliveryNavigator';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['zunkako://', 'f2capp://', 'https://f2capp-e6c1d.web.app'],
  config: {
    screens: {
      Consumer: {
        path: '',
        screens: {
          VillageGroupBuy: 'groupbuy/:groupId',
        },
      },
    },
  },
};

const RootNavigator = () => {
  const {isAuthenticated, isLoading, userType} = useAuth();

  // ✅ App loading-ல் இருக்கும்போது spinner காட்டு
  // Firebase auth state check ஆகும்வரை
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{animationTypeForReplace: 'pop'}}
          />
        ) : userType === 'admin' ? (
          <Stack.Screen
            name="Admin"
            component={AdminNavigator}
            options={{animationTypeForReplace: 'push'}}
          />
        ) : userType === 'delivery' ? (
          <Stack.Screen
            name="Delivery"
            component={DeliveryNavigator}
            options={{animationTypeForReplace: 'push'}}
          />
        ) : userType === 'farmer' ? (
          <Stack.Screen
            name="Farmer"
            component={FarmerNavigator}
            options={{animationTypeForReplace: 'push'}}
          />
        ) : (
          <Stack.Screen
            name="Consumer"
            component={ConsumerNavigator}
            options={{animationTypeForReplace: 'push'}}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});

export default RootNavigator;
