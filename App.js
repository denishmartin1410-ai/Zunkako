import React, {useEffect} from 'react';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import {ThemeProvider} from './src/context/ThemeContext';
import {LanguageProvider} from './src/context/LanguageContext';
import {AuthProvider} from './src/context/AuthContext';
import {CartProvider} from './src/context/CartContext';
import {WishlistProvider} from './src/context/WishlistContext';
import RootNavigator from './src/navigation/RootNavigator';
import './src/locales/i18n';

const App = () => {
  useEffect(() => {
    // 1. Request Android Permissions (Location, Camera, Notifications)
    const requestUserPermissions = async () => {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ];
        if (Platform.Version >= 33) {
          permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        try {
          await PermissionsAndroid.requestMultiple(permissions);
        } catch (e) {
          console.log('Permission request error:', e);
        }
      }
    };
    requestUserPermissions();

    // 2. Foreground Message Handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log(
        'A new FCM message arrived in foreground!',
        JSON.stringify(remoteMessage),
      );
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || 'You have a new message',
        );
      }
    });

    return unsubscribe;
  }, []);
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <RootNavigator />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
