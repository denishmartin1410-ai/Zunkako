import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {COLORS, FONTS} from '../utils/theme';

// Farmer Screens
import FarmerDashboardScreen from '../screens/farmer/FarmerDashboardScreen';
import MyProductsScreen from '../screens/farmer/MyProductsScreen';
import AddProductScreen from '../screens/farmer/AddProductScreen';
import EditProductScreen from '../screens/farmer/EditProductScreen';
import FarmerOrdersScreen from '../screens/farmer/FarmerOrdersScreen';
import FarmerProfileScreen from '../screens/farmer/FarmerProfileScreen';
import FarmerAddHarvestScreen from '../screens/farmer/FarmerAddHarvestScreen';
import StoryVideoScreen from '../screens/farmer/StoryVideoScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import NotificationScreen from '../screens/shared/NotificationScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import HelpAboutScreen from '../screens/shared/HelpAboutScreen';
import FeedbackScreen from '../screens/shared/FeedbackScreen';
import FarmerQRScreen from '../screens/farmer/FarmerQRScreen';
import {
  FarmerChatListScreen,
  FarmerCustomerChatRoomScreen,
} from '../screens/farmer/FarmerCustomerChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({label, emoji, focused}) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
      {emoji}
    </Text>
    <Text
      style={[styles.tabLabel, focused && styles.tabLabelActive]}
      numberOfLines={1}
      adjustsFontSizeToFit={true}
      minimumFontScale={0.8}>
      {label}
    </Text>
  </View>
);

const FarmerTabs = () => {
  const {t} = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={FarmerDashboardScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={t('nav.dashboard', {defaultValue: 'டாஷ்போர்டு'})}
              emoji="📊"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyProducts"
        component={MyProductsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={t('nav.products', {defaultValue: 'தயாரிப்புகள்'})}
              emoji="🥬"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FarmerOrders"
        component={FarmerOrdersScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={t('nav.orders', {defaultValue: 'ஆர்டர்கள்'})}
              emoji="📦"
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FarmerProfile"
        component={FarmerProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={t('nav.profile', {defaultValue: 'சுயவிவரம்'})}
              emoji="👨‍🌾"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const FarmerNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="FarmerTabs" component={FarmerTabs} />
    <Stack.Screen
      name="AddProduct"
      component={AddProductScreen}
      options={{animation: 'slide_from_bottom'}}
    />
    <Stack.Screen name="EditProduct" component={EditProductScreen} />
    <Stack.Screen name="StoryVideo" component={StoryVideoScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="HelpAbout" component={HelpAboutScreen} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} />
    <Stack.Screen name="FarmerQR" component={FarmerQRScreen} />
    <Stack.Screen name="FarmerCustomerChats" component={FarmerChatListScreen} />
    <Stack.Screen
      name="FarmerCustomerChatRoom"
      component={FarmerCustomerChatRoomScreen}
    />
    <Stack.Screen
      name="FarmerAddHarvest"
      component={FarmerAddHarvestScreen}
      options={{animation: 'slide_from_bottom'}}
    />
    <Stack.Screen
      name="Legal"
      component={require('../screens/shared/LegalScreen').default}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    minWidth: 50,
  },
  tabEmoji: {fontSize: 22, opacity: 0.5},
  tabEmojiActive: {opacity: 1},
  tabLabel: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelActive: {color: COLORS.primaryGreen, fontWeight: FONTS.bold},
});

export default FarmerNavigator;
