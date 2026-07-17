// ============================================================
// src/services/notificationService.js
// App-ல் இருந்து notifications handle பண்ற service
// ============================================================

import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Platform} from 'react-native';
import auth from '@react-native-firebase/auth';

// ════════════════════════════════════════
// STEP 1: App திறக்கும்போது Permission கேளு
// ════════════════════════════════════════
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const {PermissionsAndroid} = require('react-native');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Android POST_NOTIFICATIONS permission denied');
        return false;
      }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted!');
      await saveFCMToken();
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.log('Permission error:', error);
    return false;
  }
};

// ════════════════════════════════════════
// STEP 2: FCM Token save பண்ணு
// (இந்த token-ஐ வைத்துதான் specific user-க்கு notification அனுப்புவார்கள்)
// ════════════════════════════════════════
export const saveFCMToken = async userId => {
  try {
    const finalUserId = userId || auth().currentUser?.uid;
    if (!finalUserId) {
      console.log('No user logged in, FCM token not saved');
      return;
    }

    const token = await messaging().getToken();

    // Check users collection
    const userDoc = await firestore()
      .collection('users')
      .doc(finalUserId)
      .get();
    if (userDoc.exists) {
      await firestore().collection('users').doc(finalUserId).update({
        fcmToken: token,
        tokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
        platform: Platform.OS,
      });
      console.log('FCM Token saved in users collection:', token);
    } else {
      // Check deliveryBoys collection
      const dbDoc = await firestore()
        .collection('deliveryBoys')
        .doc(finalUserId)
        .get();
      if (dbDoc.exists) {
        await firestore().collection('deliveryBoys').doc(finalUserId).update({
          fcmToken: token,
          tokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
          platform: Platform.OS,
        });
        console.log('FCM Token saved in deliveryBoys collection:', token);
      }
    }

    await AsyncStorage.setItem('@F2C_fcmToken', token);
  } catch (error) {
    console.log('Token save error:', error);
  }
};

// ════════════════════════════════════════
// STEP 3: Foreground notification (App திறந்திருக்கும்போது)
// ════════════════════════════════════════
export const setupForegroundNotifications = () => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground notification:', remoteMessage);

    const {title, body} = remoteMessage.notification || {};

    // Alert-ஆக காட்டு (Toast message பயன்படுத்தலாம்)
    Alert.alert(title || 'F2C அறிவிப்பு', body || 'புதிய செய்தி வந்தது!', [
      {text: 'சரி'},
    ]);
  });

  return unsubscribe;
};

// ════════════════════════════════════════
// STEP 4: Background/Quit notification click handle
// ════════════════════════════════════════
export const setupBackgroundNotifications = navigation => {
  // App background-ல் இருக்கும்போது notification click
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Background notification opened:', remoteMessage);
    handleNotificationNavigation(remoteMessage, navigation);
  });

  // App closed-ஆ இருக்கும்போது notification click
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Quit notification opened:', remoteMessage);
        handleNotificationNavigation(remoteMessage, navigation);
      }
    });
};

// ════════════════════════════════════════
// STEP 5: Notification click-ல் screen navigate பண்ணு
// ════════════════════════════════════════
const handleNotificationNavigation = (remoteMessage, navigation) => {
  const data = remoteMessage?.data;

  if (!data || !navigation) {
    return;
  }

  switch (data.type) {
    case 'order_update':
      navigation.navigate('OrderDetail', {orderId: data.orderId});
      break;
    case 'new_order':
      navigation.navigate('FarmerOrders');
      break;
    case 'new_message':
      navigation.navigate('FarmerChatRoom', {
        farmer: {id: data.farmerId},
      });
      break;
    case 'pre_order_ready':
      navigation.navigate('PreOrder');
      break;
    default:
      navigation.navigate('Notifications');
  }
};

// ════════════════════════════════════════
// STEP 6: Manual notification send (Admin use)
// Firebase Functions-ல் handle ஆகும், இது testing-க்கு
// ════════════════════════════════════════
export const sendTestNotification = async userId => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();

    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) {
      console.log('No FCM token for user:', userId);
      return false;
    }

    // Firebase Admin SDK (server-side) இதை பண்ணும்
    // Client-side-ல் direct send பண்ண முடியாது - security!
    console.log('Test notification would be sent to token:', fcmToken);
    return true;
  } catch (error) {
    console.log('Test notification error:', error);
    return false;
  }
};
