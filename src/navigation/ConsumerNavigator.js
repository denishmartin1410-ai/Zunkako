import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {COLORS, FONTS} from '../utils/theme';

// ── Existing Screens (already in your project ✅) ──
import HomeScreen from '../screens/consumer/HomeScreen';
import CartScreen from '../screens/consumer/CartScreen';
import OrdersScreen from '../screens/consumer/OrdersScreen';
import ConsumerProfileScreen from '../screens/consumer/ConsumerProfileScreen';
import ProductDetailScreen from '../screens/consumer/ProductDetailScreen';
import FarmerProfileScreen from '../screens/consumer/FarmerProfileScreen';
import WishlistScreen from '../screens/consumer/WishlistScreen';
import AllProductsScreen from '../screens/consumer/AllProductsScreen';
import AllFarmersScreen from '../screens/consumer/AllFarmersScreen';
import OrderDetailScreen from '../screens/consumer/OrderDetailScreen';
import QRScanScreen from '../screens/consumer/QRScanScreen';
import CheckoutScreen from '../screens/consumer/CheckoutScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import {useCart} from '../context/CartContext';

// ── Unique Feature Screens ──
import HarvestCalendarScreen from '../screens/consumer/HarvestCalendarScreen';
import FreshnessTrackerScreen from '../screens/consumer/FreshnessTrackerScreen';
import VillageGroupBuyScreen from '../screens/consumer/VillageGroupBuyScreen';
import PreOrderScreen from '../screens/consumer/PreOrderScreen';
import NutritionReportScreen from '../screens/consumer/NutritionReportScreen';
import FarmVisitScreen from '../screens/consumer/FarmVisitScreen';
import ReelsScreen from '../screens/consumer/ReelsScreen';

// ── Batch 3 Screens ──
import ChatListScreen from '../screens/consumer/ChatListScreen';
import FarmerChatRoomScreen from '../screens/consumer/FarmerChatScreen';
import NotificationScreen from '../screens/shared/NotificationScreen';

// ── Batch 4 Screens ──
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import HelpAboutScreen from '../screens/shared/HelpAboutScreen';
import FeedbackScreen from '../screens/shared/FeedbackScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({label, emoji, focused}) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
      {emoji}
    </Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  </View>
);

const ConsumerTabs = () => {
  const {totalItems} = useCart();
  const {t} = useTranslation(); // ✅ Proper hook call (not require)

  const tabs = {
    home: {label: t('nav.home', {defaultValue: 'முகப்பு'}), emoji: '🏠'},
    reels: {label: t('nav.reels', {defaultValue: 'ரீல்ஸ்'}), emoji: '🎬'},
    cart: {label: t('nav.cart', {defaultValue: 'கார்ட்'}), emoji: '🛒'},
    orders: {label: t('nav.orders', {defaultValue: 'ஆர்டர்'}), emoji: '📦'},
    profile: {
      label: t('nav.profile', {defaultValue: 'சுயவிவரம்'}),
      emoji: '👤',
    },
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={tabs.home.label}
              emoji={tabs.home.emoji}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Reels"
        component={ReelsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={tabs.reels.label}
              emoji={tabs.reels.emoji}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <View>
              <TabIcon
                label={tabs.cart.label}
                emoji={tabs.cart.emoji}
                focused={focused}
              />
              {totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={tabs.orders.label}
              emoji={tabs.orders.emoji}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ConsumerProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon
              label={tabs.profile.label}
              emoji={tabs.profile.emoji}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const ConsumerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ConsumerTabs" component={ConsumerTabs} />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{animation: 'slide_from_bottom'}}
      />
      <Stack.Screen name="FarmerProfile" component={FarmerProfileScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="AllProducts" component={AllProductsScreen} />
      <Stack.Screen name="AllFarmers" component={AllFarmersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="QRScan" component={QRScanScreen} />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{animation: 'slide_from_bottom'}}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="HarvestCalendar" component={HarvestCalendarScreen} />
      <Stack.Screen
        name="FreshnessTracker"
        component={FreshnessTrackerScreen}
      />
      <Stack.Screen name="VillageGroupBuy" component={VillageGroupBuyScreen} />
      <Stack.Screen name="PreOrder" component={PreOrderScreen} />
      <Stack.Screen name="NutritionReport" component={NutritionReportScreen} />
      <Stack.Screen name="FarmVisit" component={FarmVisitScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="FarmerChatRoom" component={FarmerChatRoomScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="HelpAbout" component={HelpAboutScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen
        name="Legal"
        component={require('../screens/shared/LegalScreen').default}
      />
    </Stack.Navigator>
  );
};

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
  },
  tabEmoji: {fontSize: 22, opacity: 0.5},
  tabEmojiActive: {opacity: 1, transform: [{scale: 1.1}]},
  tabLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primaryGreen,
    fontWeight: FONTS.bold,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: -8,
    backgroundColor: COLORS.accentRed,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONTS.bold,
  },
});

export default ConsumerNavigator;
