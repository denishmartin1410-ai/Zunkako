/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import messaging from '@react-native-firebase/messaging';

// Global crash guard for unhandled JS errors in production
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('Global Error Caught:', error, 'isFatal:', isFatal);
    if (!__DEV__ && originalHandler) {
      originalHandler(error, false); // Prevent force-closing app on non-critical release errors
    } else if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Fix for "No background message handler has been set" warning
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });
} catch (e) {
  console.log('Background messaging init skipped:', e);
}

AppRegistry.registerComponent(appName, () => App);
