// src/screens/farmer/FarmerScreens.js - Full i18n ✅
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import {useTheme} from '../../context/ThemeContext';
import Geolocation from '@react-native-community/geolocation';
import BackButton from '../../utils/BackButton';
import {getLocalProductName} from '../../utils/translationHelper';
import {CATEGORIES} from '../../utils/dummyData';
import {getCatName} from '../../utils/categoryHelper';
import {
  getFarmerOrderTotal,
  getFarmerItemPrice,
  formatUnitPrice,
  validateUnitAndCategory,
} from '../../utils/priceHelper';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const AvatarView = ({uri, name, size = 60, style}) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'F').charAt(0).toUpperCase();
  const bg = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'][
    letter.charCodeAt(0) % 4
  ];
  if (!uri || err) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}>
        <Text style={{color: '#fff', fontSize: size * 0.4, fontWeight: 'bold'}}>
          {letter}
        </Text>
      </View>
    );
  }
  return (
    <FastImage
      source={{uri, priority: FastImage.priority.normal}}
      style={[{width: size, height: size, borderRadius: size / 2}, style]}
      resizeMode={FastImage.resizeMode.cover}
      onError={() => setErr(true)}
    />
  );
};

// FormField outside component - no re-render/focus bug
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard = 'default',
  multiline = false,
}) => {
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  return (
    <View style={S.fieldWrap}>
      <Text style={[S.fieldLabel, {color: themeColors.text}]}>{label}</Text>
      <TextInput
        style={[
          S.fieldInput,
          {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.border,
            color: themeColors.text,
          },
          multiline && {
            height: rs(80),
            textAlignVertical: 'top',
            paddingTop: 10,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
        }
        keyboardType={keyboard}
        autoCorrect={false}
        autoCapitalize="none"
        multiline={multiline}
      />
    </View>
  );
};

// ── FARMER DASHBOARD ──
export const FarmerDashboardScreen = ({navigation, route}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    thisMonthRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
  });
  const [myProducts, setMyProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [detailsOrders, setDetailsOrders] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [preOrdersModalVisible, setPreOrdersModalVisible] = useState(false);
  const [preOrders, setPreOrders] = useState([]);
  const [preOrdersLoading, setPreOrdersLoading] = useState(false);

  const loadFarmerPreOrders = async () => {
    const farmerId = user?.id || user?.uid;
    if (!farmerId) {
      return;
    }
    setPreOrdersLoading(true);
    try {
      const {getFarmerPreOrders} = require('../../services/firebase');
      const res = await getFarmerPreOrders(farmerId);
      if (res.success) {
        setPreOrders(res.data);
      }
    } catch (e) {
      console.log('loadFarmerPreOrders error:', e);
    }
    setPreOrdersLoading(false);
  };

  useEffect(() => {
    if (route.params?.openPreOrders) {
      setPreOrdersModalVisible(true);
      loadFarmerPreOrders();
      // Clear route params so it doesn't open again on subsequent visits
      navigation.setParams({openPreOrders: undefined});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.openPreOrders]);

  const handleUpdateFarmerPreOrderStatus = async (item, newStatus) => {
    try {
      const {updatePreOrderStatus} = require('../../services/firebase');
      const targetUserId = item.userId || item.id;
      const r = await updatePreOrderStatus(
        item.harvestId,
        targetUserId,
        newStatus,
      );
      if (r.success) {
        Alert.alert('✅ Success', `Pre-Order status updated to: ${newStatus}`);

        // Update locally
        setPreOrders(prev =>
          prev.map(o =>
            o.userId === targetUserId && o.harvestId === item.harvestId
              ? {...o, status: newStatus}
              : o,
          ),
        );

        // Notify user about status change
        const firestore = require('@react-native-firebase/firestore').default;
        let title = '📅 Pre-Order Update';
        let message = `Your pre-ordered ${
          item.nameEn || item.name
        } has been updated to ${newStatus} by the farmer.`;
        let emoji = '📅';
        let bgColor = '#E3F2FD';

        if (newStatus === 'harvested') {
          title = '🌾 Crop Harvested!';
          message = `Your pre-ordered ${
            item.nameEn || item.name || 'crop'
          } has been harvested and is ready for pickup/delivery!`;
          emoji = '🌾';
          bgColor = '#E8F5E9';
        } else if (newStatus === 'completed') {
          title = '🎉 Pre-Order Completed!';
          message = `Your pre-order for ${
            item.nameEn || item.name || 'crop'
          } has been successfully delivered and completed.`;
          emoji = '🎉';
          bgColor = '#E8F5E9';
        }

        await firestore()
          .collection('notifications')
          .doc(targetUserId)
          .collection('items')
          .add({
            userId: targetUserId,
            title,
            message,
            emoji,
            bgColor,
            isRead: false,
            type: 'preorder_update',
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (e) {
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  const loadDashboardData = useCallback(
    async (isRefresh = false) => {
      const farmerId = user?.id || user?.uid;
      if (!farmerId) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const {
          getFarmerStats,
          getFarmerProducts,
        } = require('../../services/firebase');
        const [sr, pr] = await Promise.all([
          getFarmerStats(farmerId),
          getFarmerProducts(farmerId),
        ]);
        if (sr.success) {
          setStats(sr.data);
        }
        if (pr.success) {
          setMyProducts(pr.data);
        }
      } catch (e) {
        console.log('dashboard error:', e);
      }
      setIsLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefreshDashboard = () => {
    loadDashboardData(true);
  };

  const openSalesDetails = async () => {
    setSalesModalVisible(true);
    setDetailsLoading(true);
    const farmerId = user?.id || user?.uid;
    if (farmerId) {
      try {
        const {getFarmerOrders} = require('../../services/firebase');
        const res = await getFarmerOrders(farmerId);
        if (res.success) {
          const delivered = res.data.filter(o => o.status === 'Delivered');
          setDetailsOrders(delivered);
        }
      } catch (e) {
        console.log(e);
      }
    }
    setDetailsLoading(false);
  };

  const openMonthlyDetails = async () => {
    setMonthlyModalVisible(true);
    setDetailsLoading(true);
    const farmerId = user?.id || user?.uid;
    if (farmerId) {
      try {
        const {getFarmerOrders} = require('../../services/firebase');
        const res = await getFarmerOrders(farmerId);
        if (res.success) {
          const now = new Date();
          const thisMonth = res.data.filter(o => {
            const created = o.createdAt?.toDate?.();
            return (
              created &&
              created.getMonth() === now.getMonth() &&
              created.getFullYear() === now.getFullYear()
            );
          });
          setDetailsOrders(thisMonth);
        }
      } catch (e) {
        console.log(e);
      }
    }
    setDetailsLoading(false);
  };

  const statCards = [
    {
      label: t('farmer.totalSales', {defaultValue: 'மொத்த விற்பனை'}),
      val: `₹${stats.totalSales.toLocaleString()}`,
      icon: '💰',
      color: '#4CAF50',
      onPress: openSalesDetails,
    },
    {
      label: t('farmer.thisMonth', {defaultValue: 'இந்த மாதம்'}),
      val: `₹${stats.thisMonthRevenue.toLocaleString()}`,
      icon: '📈',
      color: '#2196F3',
      onPress: openMonthlyDetails,
    },
    {
      label: t('nav.orders', {defaultValue: 'ஆர்டர்கள்'}),
      val: `${stats.totalOrders}`,
      icon: '📦',
      color: '#FF9800',
      onPress: () => navigation.navigate('FarmerOrders'),
    },
    {
      label: t('nav.products', {defaultValue: 'தயாரிப்புகள்'}),
      val: `${myProducts.length}`,
      icon: '🥬',
      color: '#9C27B0',
      onPress: () => navigation.navigate('MyProducts'),
    },
  ];

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={S.dashHeader}>
        <View style={S.dashHeaderTop}>
          <View style={{flex: 1}}>
            <Text style={S.dashGreeting}>
              {t('home.greeting', {defaultValue: 'வணக்கம்! 👨‍🌾'})}
            </Text>
            <Text style={S.dashName} numberOfLines={1}>
              {user?.name || t('farmer.farmerLabel', {defaultValue: 'Farmer'})}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
            }}>
            <TouchableOpacity
              style={S.notifBtn}
              onPress={() => navigation.navigate('Notifications')}>
              <Text style={{fontSize: rs(24)}}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('FarmerProfile')}>
              <AvatarView
                uri={user?.avatar}
                name={user?.name}
                size={rs(56)}
                style={{borderWidth: 2, borderColor: COLORS.white}}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={S.farmName}>
          {user?.farmName || t('farmer.myFarm', {defaultValue: 'என் பண்ணை'})}
        </Text>
      </LinearGradient>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshDashboard}
            colors={[COLORS.primaryGreen]}
            tintColor={COLORS.primaryGreen}
          />
        }>
        {isLoading && !refreshing ? (
          <ActivityIndicator
            color={COLORS.primaryGreen}
            size="large"
            style={{marginTop: 40}}
          />
        ) : (
          <View style={S.statsGrid}>
            {statCards.map((stat, i) => (
              <TouchableOpacity
                key={i}
                onPress={stat.onPress}
                activeOpacity={0.7}
                style={[
                  S.statCard,
                  {
                    borderTopColor: stat.color,
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  },
                ]}>
                <Text style={S.statEmoji}>{stat.icon}</Text>
                <Text style={[S.statVal, {color: stat.color}]}>{stat.val}</Text>
                <Text style={[S.statLbl, {color: themeColors.subText}]}>
                  {stat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={S.section}>
          <Text style={[S.sTitle, {color: themeColors.text}]}>
            ⚡ {t('farmer.quickActions', {defaultValue: 'விரைவு செயல்கள்'})}
          </Text>
          <View style={S.qaGrid}>
            {[
              {
                icon: '➕',
                label: t('farmer.addProduct', {defaultValue: 'தயாரிப்பு சேர்'}),
                screen: 'AddProduct',
              },
              {
                icon: '📷',
                label: t('farmer.qrCode', {defaultValue: 'QR குறியீடு'}),
                screen: 'FarmerQR',
              },
              {
                icon: '📅',
                label: t('farmer.addHarvest', {defaultValue: 'அறுவடை சேர்'}),
                screen: 'FarmerAddHarvest',
              },
              {
                icon: '📋',
                label: t('preOrder.title', {defaultValue: 'മുൻകൂട്ടി ഓർഡറുകൾ'}),
                onPress: () => {
                  loadFarmerPreOrders();
                  setPreOrdersModalVisible(true);
                },
              },
              {
                icon: '💬',
                label: t('farmer.customerChats', {
                  defaultValue: 'வாடிக்கையாளர் அரட்டை',
                }),
                screen: 'FarmerCustomerChats',
              },
              {
                icon: '🎬',
                label: t('farmer.myStory', {defaultValue: 'என் கதை'}),
                screen: 'StoryVideo',
              },
              {
                icon: '⚙️',
                label: t('profile.settings', {defaultValue: 'அமைப்புகள்'}),
                screen: 'Settings',
              },
            ].map((qa, i) => (
              <TouchableOpacity
                key={i}
                style={S.qaCard}
                onPress={
                  qa.onPress ? qa.onPress : () => navigation.navigate(qa.screen)
                }>
                <LinearGradient
                  colors={
                    isDark ? ['#1A3028', '#152A20'] : ['#E8F5E9', '#E3F2FD']
                  }
                  style={S.qaGrad}>
                  <Text style={S.qaIcon}>{qa.icon}</Text>
                  <Text style={[S.qaLabel, {color: themeColors.text}]}>
                    {qa.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={[S.sTitle, {color: themeColors.text}]}>
              🥬 {t('farmer.myProducts', {defaultValue: 'என் தயாரிப்புகள்'})}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyProducts')}>
              <Text style={S.seeAll}>
                {t('home.viewAll', {defaultValue: 'அனைத்தும் →'})}
              </Text>
            </TouchableOpacity>
          </View>
          {myProducts.length === 0 && !isLoading ? (
            <TouchableOpacity
              style={[
                S.emptyAddBtn,
                {
                  backgroundColor: COLORS.primaryGreen,
                  borderWidth: 0,
                },
              ]}
              onPress={() => navigation.navigate('AddProduct')}>
              <Text style={S.emptyAddTxt}>
                ➕{' '}
                {t('farmer.addProduct', {
                  defaultValue: 'தயாரிப்பு சேர்',
                })}{' '}
                🌱
              </Text>
            </TouchableOpacity>
          ) : (
            myProducts.slice(0, 3).map(p => (
              <View
                key={p.id}
                style={[
                  S.prodRow,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  },
                ]}>
                <FastImage
                  source={{uri: p.image}}
                  style={S.prodRowImg}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <View style={S.prodRowInfo}>
                  <Text
                    style={[S.prodRowName, {color: themeColors.text}]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {getLocalProductName(p.name, p.nameTa, i18n.language)}
                  </Text>
                  <Text style={S.prodRowPrice}>
                    ₹{p.price}/{p.unit}
                  </Text>
                </View>
                <View
                  style={[
                    S.stockBadge,
                    {backgroundColor: isDark ? '#1E3A2F' : '#E8F5E9'},
                  ]}>
                  <Text style={S.stockText}>
                    {p.stock} {t('farmer.available', {defaultValue: 'உள்ளது'})}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{height: 90}} />
      </ScrollView>

      {/* Farmer Pre-Orders Modal */}
      <Modal
        visible={preOrdersModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreOrdersModalVisible(false)}>
        <View style={[S.container, {backgroundColor: themeColors.bg}]}>
          <LinearGradient
            colors={['#0D5C32', '#1B8A4E']}
            style={[
              S.headerRow,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}>
            <BackButton onPress={() => setPreOrdersModalVisible(false)} />
            <Text style={[S.headerTitle, {flex: 1, marginLeft: 16}]}>
              📅 {t('preOrder.title', {defaultValue: 'முன்பதிவுகள்'})} (
              {preOrders.length})
            </Text>
          </LinearGradient>

          {preOrdersLoading ? (
            <ActivityIndicator
              color={COLORS.primaryGreen}
              size="large"
              style={{marginTop: 50}}
            />
          ) : (
            <FlatList
              data={preOrders}
              keyExtractor={(item, index) =>
                item.harvestId + '_' + item.userId + '_' + index
              }
              contentContainerStyle={{padding: 16}}
              renderItem={({item}) => {
                const dateLocale =
                  i18n.language === 'ta'
                    ? 'ta-IN'
                    : i18n.language === 'ml'
                    ? 'ml-IN'
                    : 'en-US';
                const formattedDate =
                  item.createdAt?.toDate?.()?.toLocaleDateString(dateLocale) ||
                  '';

                return (
                  <View
                    style={{
                      backgroundColor: themeColors.cardBg,
                      borderRadius: 12,
                      padding: 16,
                      marginVertical: 8,
                      borderWidth: 1,
                      borderColor: themeColors.border,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}>
                      <Text
                        style={{
                          fontWeight: 'bold',
                          fontSize: 16,
                          color: themeColors.text,
                          flexShrink: 1,
                        }}>
                        {getLocalProductName(
                          item.nameEn,
                          item.name,
                          i18n.language,
                        )}
                      </Text>
                      <View
                        style={{
                          backgroundColor:
                            item.status === 'completed'
                              ? '#E8F5E9'
                              : item.status === 'harvested'
                              ? '#FFF3E0'
                              : item.status === 'Cancelled' ||
                                item.status === 'Refund Requested' ||
                                item.status === 'Refunded'
                              ? '#FFEBEE'
                              : '#E3F2FD',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          maxWidth: '65%',
                          marginLeft: 8,
                          flexShrink: 1,
                        }}>
                        <Text
                          numberOfLines={2}
                          style={{
                            color:
                              item.status === 'completed'
                                ? '#4CAF50'
                                : item.status === 'harvested'
                                ? '#FF9800'
                                : item.status === 'Cancelled' ||
                                  item.status === 'Refund Requested' ||
                                  item.status === 'Refunded'
                                ? '#FF5252'
                                : '#1565C0',
                            fontWeight: 'bold',
                            fontSize: 10,
                            textAlign: 'center',
                          }}>
                          {item.status === 'completed'
                            ? t('preOrder.statusCompleted', {
                                defaultValue: 'Completed',
                              })
                            : item.status === 'harvested'
                            ? t('preOrder.statusHarvested', {
                                defaultValue: 'Harvested',
                              })
                            : item.status === 'Cancelled'
                            ? t('orders.statusCancelled', {
                                defaultValue: 'Cancelled',
                              })
                            : item.status === 'Refund Requested'
                            ? t('orders.refundRequested', {
                                defaultValue: 'Refund Requested',
                              })
                            : item.status === 'Refunded'
                            ? t('orders.statusRefunded', {
                                defaultValue: 'Refunded',
                              })
                            : t('preOrder.statusReserved', {
                                defaultValue: 'Reserved',
                              })}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={{
                        color: themeColors.subText,
                        fontSize: 14,
                        marginVertical: 2,
                      }}>
                      👤{' '}
                      {t('preOrder.deliveryName', {defaultValue: 'Customer'})}:{' '}
                      <Text
                        style={{fontWeight: '600', color: themeColors.text}}>
                        {item.deliveryName || item.userName || 'User'}
                      </Text>
                    </Text>
                    {item.deliveryPhone && (
                      <Text
                        style={{
                          color: themeColors.subText,
                          fontSize: 14,
                          marginVertical: 2,
                        }}>
                        📞{' '}
                        {t('preOrder.deliveryPhone', {defaultValue: 'Phone'})}:{' '}
                        <Text
                          style={{fontWeight: '600', color: themeColors.text}}>
                          {item.deliveryPhone}
                        </Text>
                      </Text>
                    )}
                    {item.deliveryAddress && (
                      <Text
                        style={{
                          color: themeColors.subText,
                          fontSize: 14,
                          marginVertical: 2,
                        }}>
                        📍{' '}
                        {t('preOrder.deliveryAddress', {
                          defaultValue: 'Address',
                        })}
                        :{' '}
                        <Text
                          style={{fontWeight: '600', color: themeColors.text}}>
                          {item.deliveryAddress}{' '}
                          {item.deliveryPincode
                            ? `(PIN: ${item.deliveryPincode})`
                            : ''}
                        </Text>
                      </Text>
                    )}
                    {item.deliveryLocation && (
                      <Text
                        style={{
                          color: themeColors.subText,
                          fontSize: 14,
                          marginVertical: 2,
                        }}>
                        🌐 GPS:{' '}
                        <Text
                          style={{fontWeight: '600', color: themeColors.text}}>
                          {item.deliveryLocation}
                        </Text>
                      </Text>
                    )}
                    <Text
                      style={{
                        color: themeColors.subText,
                        fontSize: 14,
                        marginVertical: 2,
                      }}>
                      📅{' '}
                      {t('orders.preOrderedOn', {defaultValue: 'Ordered On'})}:{' '}
                      <Text
                        style={{fontWeight: '600', color: themeColors.text}}>
                        {formattedDate}
                      </Text>
                    </Text>
                    <Text
                      style={{
                        color: themeColors.subText,
                        fontSize: 14,
                        marginVertical: 2,
                      }}>
                      📦 {t('orders.quantity', {defaultValue: 'Quantity'})}:{' '}
                      <Text
                        style={{fontWeight: '600', color: themeColors.text}}>
                        {item.quantity || item.qty} {item.unit || 'kg'}
                      </Text>
                    </Text>
                    <Text
                      style={{
                        color: themeColors.subText,
                        fontSize: 14,
                        marginVertical: 2,
                      }}>
                      💵 {t('orders.total', {defaultValue: 'Price'})}:{' '}
                      <Text
                        style={{fontWeight: '600', color: themeColors.text}}>
                        ₹{item.totalAmount || item.totalPrice}
                      </Text>
                    </Text>
                    <Text
                      style={{
                        color: themeColors.subText,
                        fontSize: 14,
                        marginVertical: 2,
                      }}>
                      🌾 {t('product.harvest', {defaultValue: 'Harvest'})}:{' '}
                      <Text
                        style={{fontWeight: '600', color: themeColors.text}}>
                        {item.harvestDate || '-'}
                      </Text>
                    </Text>

                    {item.status === 'Cancelled' ||
                    item.status === 'Refund Requested' ||
                    item.status === 'Refunded' ? (
                      <View
                        style={{
                          marginTop: 12,
                          paddingVertical: 8,
                          backgroundColor: '#FFEBEE',
                          borderColor: '#FF5252',
                          borderWidth: 1,
                          borderRadius: 6,
                          alignItems: 'center',
                        }}>
                        <Text style={{color: '#FF5252', fontWeight: 'bold'}}>
                          🚫 {item.status.toUpperCase()}
                        </Text>
                        {item.cancelReason && (
                          <Text
                            style={{
                              color: themeColors.subText,
                              fontSize: 12,
                              marginTop: 4,
                              textAlign: 'center',
                              paddingHorizontal: 12,
                            }}>
                            {item.cancelReason}
                          </Text>
                        )}
                        {item.refundReason && (
                          <Text
                            style={{
                              color: themeColors.subText,
                              fontSize: 12,
                              marginTop: 4,
                              textAlign: 'center',
                              paddingHorizontal: 12,
                            }}>
                            {item.refundReason}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View
                        style={{flexDirection: 'row', gap: 8, marginTop: 12}}>
                        {/* Harvest Process */}
                        {item.status === 'pending' ||
                        item.status === 'Reserved' ||
                        !item.status ? (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: '#FFF3E0',
                              borderColor: '#FF9800',
                              borderWidth: 1,
                              paddingVertical: 8,
                              borderRadius: 6,
                              alignItems: 'center',
                            }}
                            onPress={() =>
                              handleUpdateFarmerPreOrderStatus(
                                item,
                                'harvested',
                              )
                            }>
                            <Text
                              style={{color: '#FF9800', fontWeight: 'bold'}}>
                              🚜{' '}
                              {t('farmer.markHarvest', {
                                defaultValue: 'Mark Harvest',
                              })}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: '#E8F5E9',
                              borderColor: '#4CAF50',
                              borderWidth: 1,
                              paddingVertical: 8,
                              borderRadius: 6,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Text
                              style={{color: '#4CAF50', fontWeight: 'bold'}}>
                              🚜{' '}
                              {t('preOrder.statusHarvested', {
                                defaultValue: 'Harvested ✓',
                              })}
                            </Text>
                          </View>
                        )}

                        {/* Deliver Process */}
                        {item.status !== 'completed' ? (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: '#FFF3E0',
                              borderColor: '#FF9800',
                              borderWidth: 1,
                              paddingVertical: 8,
                              borderRadius: 6,
                              alignItems: 'center',
                            }}
                            onPress={() =>
                              handleUpdateFarmerPreOrderStatus(
                                item,
                                'completed',
                              )
                            }>
                            <Text
                              style={{color: '#FF9800', fontWeight: 'bold'}}>
                              ✅{' '}
                              {t('farmer.markDeliver', {
                                defaultValue: 'Mark Deliver',
                              })}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: '#E8F5E9',
                              borderColor: '#4CAF50',
                              borderWidth: 1,
                              paddingVertical: 8,
                              borderRadius: 6,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Text
                              style={{color: '#4CAF50', fontWeight: 'bold'}}>
                              ✅{' '}
                              {t('preOrder.statusCompleted', {
                                defaultValue: 'Delivered ✓',
                              })}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{alignItems: 'center', paddingVertical: 80}}>
                  <Text style={{fontSize: 50, marginBottom: 12}}>📅</Text>
                  <Text style={{color: themeColors.textMuted, fontSize: 16}}>
                    {t('preOrder.noPreOrders', {
                      defaultValue: 'No pre-orders found',
                    })}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* 💰 Total Sales Details Modal */}
      <Modal
        visible={salesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSalesModalVisible(false)}>
        <View style={S.modalOverlay}>
          <View
            style={[S.modalContainer, {backgroundColor: themeColors.cardBg}]}>
            <View style={S.modalHeader}>
              <Text style={[S.modalTitle, {color: themeColors.text}]}>
                💰 {t('farmer.totalSales', {defaultValue: 'மொத்த விற்பனை'})}
              </Text>
              <TouchableOpacity
                onPress={() => setSalesModalVisible(false)}
                style={S.modalCloseBtn}>
                <Text style={{fontSize: 20, color: themeColors.text}}>✕</Text>
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primaryGreen}
                style={{marginVertical: 40}}
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    S.summaryBox,
                    {backgroundColor: isDark ? '#1E3A24' : '#E8F5E9'},
                  ]}>
                  <Text style={[S.summaryVal, {color: '#4CAF50'}]}>
                    ₹{stats.totalSales.toLocaleString()}
                  </Text>
                  <Text style={[S.summaryLbl, {color: themeColors.text}]}>
                    {t('farmer.totalCompletedEarnings', {
                      defaultValue:
                        'மொத்த வருவாய் (பூர்த்தி செய்யப்பட்ட ஆர்டர்கள்)',
                    })}
                  </Text>
                  <Text
                    style={[
                      S.summarySub,
                      {color: themeColors.subText, marginTop: 4},
                    ]}>
                    {t('farmer.completedCount', {
                      defaultValue: 'மொத்த ஆர்டர்கள்',
                    })}
                    : {detailsOrders.length}
                  </Text>
                </View>

                <Text style={[S.modalSecTitle, {color: themeColors.text}]}>
                  📦{' '}
                  {t('farmer.salesList', {defaultValue: 'விற்பனைப் பட்டியல்'})}
                </Text>

                {detailsOrders.length === 0 ? (
                  <View style={{alignItems: 'center', paddingVertical: 40}}>
                    <Text style={{fontSize: 40, marginBottom: 8}}>💰</Text>
                    <Text style={{color: themeColors.textMuted}}>
                      {t('orders.noOrders', {
                        defaultValue: 'ஆர்டர்கள் எதுவும் இல்லை',
                      })}
                    </Text>
                  </View>
                ) : (
                  detailsOrders.map((order, index) => (
                    <View
                      key={order.id || index}
                      style={[
                        S.detailOrderCard,
                        {
                          backgroundColor: themeColors.bg,
                          borderColor: themeColors.border,
                          borderWidth: 1,
                        },
                      ]}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}>
                        <Text
                          style={{fontWeight: 'bold', color: themeColors.text}}>
                          #{order.orderId || order.id?.slice(-4)}
                        </Text>
                        <Text
                          style={{fontSize: 12, color: themeColors.subText}}>
                          {order.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString('ta-IN') || ''}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: themeColors.text,
                          fontSize: 13,
                          fontWeight: '600',
                        }}>
                        👤{' '}
                        {order.consumerName || order.customerName || 'Customer'}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: themeColors.subText,
                          marginVertical: 4,
                        }}>
                        📍 {order.deliveryAddress || order.address || ''}
                      </Text>
                      <View
                        style={{
                          borderTopWidth: 0.5,
                          borderTopColor: themeColors.border,
                          paddingTop: 4,
                          marginTop: 4,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{fontSize: 12, color: themeColors.subText}}>
                          {(order.items || [])
                            .map(i => i.nameTa || i.name)
                            .join(', ')}
                        </Text>
                        <Text style={{fontWeight: 'bold', color: '#4CAF50'}}>
                          ₹{getFarmerOrderTotal(order)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 📈 This Month Revenue Details Modal */}
      <Modal
        visible={monthlyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMonthlyModalVisible(false)}>
        <View style={S.modalOverlay}>
          <View
            style={[S.modalContainer, {backgroundColor: themeColors.cardBg}]}>
            <View style={S.modalHeader}>
              <Text style={[S.modalTitle, {color: themeColors.text}]}>
                📈 {t('farmer.thisMonth', {defaultValue: 'இந்த மாதம்'})}
              </Text>
              <TouchableOpacity
                onPress={() => setMonthlyModalVisible(false)}
                style={S.modalCloseBtn}>
                <Text style={{fontSize: 20, color: themeColors.text}}>✕</Text>
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primaryGreen}
                style={{marginVertical: 40}}
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    S.summaryBox,
                    {backgroundColor: isDark ? '#1A334B' : '#E3F2FD'},
                  ]}>
                  <Text style={[S.summaryVal, {color: '#2196F3'}]}>
                    ₹{stats.thisMonthRevenue.toLocaleString()}
                  </Text>
                  <Text style={[S.summaryLbl, {color: themeColors.text}]}>
                    {t('farmer.thisMonthEarnings', {
                      defaultValue: 'இந்த மாத வருவாய்',
                    })}
                  </Text>
                  <Text
                    style={[
                      S.summarySub,
                      {color: themeColors.subText, marginTop: 4},
                    ]}>
                    {t('farmer.thisMonthOrders', {
                      defaultValue: 'இந்த மாத ஆர்டர்கள்',
                    })}
                    : {detailsOrders.length}
                  </Text>
                </View>

                <Text style={[S.modalSecTitle, {color: themeColors.text}]}>
                  📦{' '}
                  {t('farmer.thisMonthOrdersList', {
                    defaultValue: 'இந்த மாத ஆர்டர்கள் பட்டியல்',
                  })}
                </Text>

                {detailsOrders.length === 0 ? (
                  <View style={{alignItems: 'center', paddingVertical: 40}}>
                    <Text style={{fontSize: 40, marginBottom: 8}}>📈</Text>
                    <Text style={{color: themeColors.textMuted}}>
                      {t('orders.noOrders', {
                        defaultValue: 'ஆர்டர்கள் எதுவும் இல்லை',
                      })}
                    </Text>
                  </View>
                ) : (
                  detailsOrders.map((order, index) => (
                    <View
                      key={order.id || index}
                      style={[
                        S.detailOrderCard,
                        {
                          backgroundColor: themeColors.bg,
                          borderColor: themeColors.border,
                          borderWidth: 1,
                        },
                      ]}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}>
                        <Text
                          style={{fontWeight: 'bold', color: themeColors.text}}>
                          #{order.orderId || order.id?.slice(-4)}
                        </Text>
                        <Text
                          style={{fontSize: 12, color: themeColors.subText}}>
                          {order.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString('ta-IN') || ''}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{
                            color: themeColors.text,
                            fontSize: 13,
                            fontWeight: '600',
                          }}>
                          👤{' '}
                          {order.consumerName ||
                            order.customerName ||
                            'Customer'}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor:
                              order.status === 'Delivered'
                                ? '#E8F5E9'
                                : order.status === 'Cancelled'
                                ? '#FFEBEE'
                                : '#FFF9C4',
                          }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: 'bold',
                              color:
                                order.status === 'Delivered'
                                  ? '#4CAF50'
                                  : order.status === 'Cancelled'
                                  ? '#FF5252'
                                  : '#FFB300',
                            }}>
                            {order.status}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: themeColors.subText,
                          marginVertical: 4,
                        }}>
                        📍 {order.deliveryAddress || order.address || ''}
                      </Text>
                      <View
                        style={{
                          borderTopWidth: 0.5,
                          borderTopColor: themeColors.border,
                          paddingTop: 4,
                          marginTop: 4,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{fontSize: 12, color: themeColors.subText}}>
                          {(order.items || [])
                            .map(i => i.nameTa || i.name)
                            .join(', ')}
                        </Text>
                        <Text style={{fontWeight: 'bold', color: '#2196F3'}}>
                          ₹{getFarmerOrderTotal(order)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── MY PRODUCTS ──
export const MyProductsScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [myProducts, setMyProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      const farmerId = user?.id || user?.uid;
      if (!farmerId) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const {getFarmerProducts} = require('../../services/firebase');
        const r = await getFarmerProducts(farmerId);
        setMyProducts(r.success ? r.data : []);
      } catch (e) {
        setMyProducts([]);
      }
      setIsLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = id => {
    Alert.alert(t('farmer.deleteProduct', {defaultValue: 'நீக்கவா?'}), '', [
      {text: t('common.cancel', {defaultValue: 'இல்லை'}), style: 'cancel'},
      {
        text: t('farmer.delete', {defaultValue: 'நீக்கு'}),
        style: 'destructive',
        onPress: async () => {
          const {deleteProduct} = require('../../services/firebase');
          const r = await deleteProduct(id);
          if (r.success) {
            setMyProducts(prev => prev.filter(p => p.id !== id));
          }
        },
      },
    ]);
  };

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <Text style={S.headerTitle}>
          🥬 {t('farmer.myProducts', {defaultValue: 'என் தயாரிப்புகள்'})}
        </Text>
        <TouchableOpacity
          style={S.addBtn}
          onPress={() => navigation.navigate('AddProduct')}>
          <Text style={S.addBtnTxt}>
            + {t('farmer.add', {defaultValue: 'சேர்'})}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
      {isLoading && myProducts.length === 0 ? (
        <ActivityIndicator
          color={COLORS.primaryGreen}
          size="large"
          style={{marginTop: 40}}
        />
      ) : (
        <FlatList
          data={myProducts}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: SPACING.lg}}
          onRefresh={() => load(true)}
          refreshing={refreshing}
          renderItem={({item}) => (
            <View
              style={[
                S.mpCard,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                  borderWidth: 1,
                },
              ]}>
              <FastImage
                source={{uri: item.image}}
                style={S.mpImg}
                resizeMode={FastImage.resizeMode.cover}
              />
              <View style={S.mpInfo}>
                <Text
                  style={[S.mpName, {color: themeColors.text}]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {getLocalProductName(item.name, item.nameTa, i18n.language)}
                </Text>
                <Text style={S.mpPrice}>
                  ₹{item.price} / 1{item.unit}
                </Text>
                <Text style={[S.mpStock, {color: themeColors.subText}]}>
                  {t('farmer.stock', {defaultValue: 'கையிருப்பு'})}:{' '}
                  {item.stock}
                </Text>
              </View>
              <View style={S.mpActions}>
                <TouchableOpacity
                  style={S.delBtn}
                  onPress={() => handleDelete(item.id)}>
                  <Text style={S.delBtnTxt}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={S.emptyBox}>
              <Text style={S.MP_emptyEmoji || S.emptyEmoji}>🥬</Text>
              <Text style={[S.emptyText, {color: themeColors.textMuted}]}>
                {t('farmer.noProducts', {defaultValue: 'தயாரிப்புகள் இல்லை'})}
              </Text>
              <TouchableOpacity
                style={[
                  S.emptyAddBtn,
                  {
                    backgroundColor: COLORS.primaryGreen,
                    borderWidth: 0,
                  },
                ]}
                onPress={() => navigation.navigate('AddProduct')}>
                <Text style={S.emptyAddTxt}>
                  ➕{' '}
                  {t('farmer.addProduct', {
                    defaultValue: 'தயாரிப்பு சேர்',
                  })}{' '}
                  🌱
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      <View style={{height: 80}} />
    </View>
  );
};

// ── ADD PRODUCT ──
export const AddProductScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [name, setName] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('vegetables');
  const [freshHours, setFreshHours] = useState('24'); // Default 24 hours
  const [shelfLife, setShelfLife] = useState('6'); // Default 6 months
  const [material, setMaterial] = useState('');
  const [craftingTime, setCraftingTime] = useState('1'); // Default 1 day
  const [descriptionTa, setDescriptionTa] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const imageUrlRef = useRef('');

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locStatus, setLocStatus] = useState('fetching'); // fetching, success, error

  const getCurrentLocationWithFallback = () => {
    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocStatus('success');
      },
      error => {
        console.log(
          'High accuracy location failed, retrying with low accuracy:',
          error,
        );
        Geolocation.getCurrentPosition(
          pos => {
            setLatitude(pos.coords.latitude);
            setLongitude(pos.coords.longitude);
            setLocStatus('success');
          },
          err => {
            console.log('Low accuracy location failed:', err);
            setLocStatus('error');
          },
          {enableHighAccuracy: false, timeout: 15000, maximumAge: 10000},
        );
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
    );
  };

  const fetchLocation = async () => {
    setLocStatus('fetching');
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('farmer.locationPermissionTitle', {
              defaultValue: 'இருப்பிட அனுமதி',
            }),
            message: t('farmer.locationPermissionMsg', {
              defaultValue:
                'பொருளின் இடத்தை வாடிக்கையாளருக்கு காட்ட இருப்பிட அனுமதி தேவை.',
            }),
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocationWithFallback();
        } else {
          setLocStatus('error');
          Alert.alert(
            t('farmer.locationPermissionTitle', {
              defaultValue: 'இருப்பிட அனுமதி',
            }),
            t('farmer.locationDeniedMsg', {
              defaultValue:
                'தயாரிப்பைச் சேர்க்க இருப்பிட அனுமதி தேவை. அதை அமைப்புகளில் அனுமதிக்கவும்.\nLocation permission is required to add products. Please allow it in App Settings.',
            }),
            [
              {
                text: t('common.cancel', {defaultValue: 'Cancel'}),
                style: 'cancel',
              },
              {
                text: t('profile.settings', {defaultValue: 'Settings'}),
                onPress: () => Linking.openSettings(),
              },
            ],
          );
        }
      } else {
        getCurrentLocationWithFallback();
      }
    } catch (err) {
      setLocStatus('error');
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const units = ['kg', 'g', 'piece', 'dozen', 'bunch', 'litre'];
  const categories = [
    'vegetables',
    'fruits',
    'grains',
    'millets',
    'greens',
    'dairy',
    'herbs',
    'organic',
    'nuts',
    'handicrafts',
  ];

  const handleImagePick = async () => {
    try {
      const {launchImageLibrary} = require('react-native-image-picker');
      const {
        uploadImageToCloudinary,
      } = require('../../services/cloudinaryServices');
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });
      if (result.didCancel || !result.assets?.[0]) {
        return;
      }
      const uri = result.assets[0].uri;
      setImageUri(uri);
      imageUrlRef.current = '';
      setIsUploading(true);
      const up = await uploadImageToCloudinary(uri, 'products');
      setIsUploading(false);
      if (up.success) {
        imageUrlRef.current = up.url;
        setImageUri(uri + '?uploaded=1');
        Alert.alert(
          '✅',
          t('farmer.photoUploaded', {
            defaultValue: 'புகைப்படம் பதிவேற்றம் செய்யப்பட்டது!',
          }),
        );
      } else {
        setImageUri(null);
        imageUrlRef.current = '';
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          t('farmer.uploadFailed', {defaultValue: 'Upload failed'}),
        );
      }
    } catch (e) {
      setIsUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !price.trim() || !stock.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.fillAll', {
          defaultValue: 'பெயர், விலை, கையிருப்பு அனைத்தும் நிரப்பவும்',
        }),
      );
      return;
    }

    const valCheck = validateUnitAndCategory(unit, category, name, nameTa);
    if (!valCheck.valid) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை / Validation Alert'}),
        valCheck.msg,
      );
      return;
    }

    const isPerishable = [
      'vegetables',
      'fruits',
      'greens',
      'dairy',
      'herbs',
      'organic',
    ].includes(category);
    const isNonPerishable = ['grains', 'millets', 'nuts'].includes(category);
    const isHandicraft = category === 'handicrafts';

    if (isPerishable && !freshHours.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.fillFreshHours', {
          defaultValue: 'புத்துணர்வு நேரத்தை உள்ளிடவும்',
        }),
      );
      return;
    }

    if (isNonPerishable && !shelfLife.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.fillShelfLife', {
          defaultValue: 'பாதுகாப்பு காலத்தை உள்ளிடவும்',
        }),
      );
      return;
    }

    if (isHandicraft) {
      if (!material.trim()) {
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          t('farmer.fillMaterial', {
            defaultValue: 'பயன்படுத்தப்பட்ட பொருளின் பெயரை உள்ளிடவும்!',
          }),
        );
        return;
      }
      if (!craftingTime.trim()) {
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          t('farmer.fillCraftingTime', {
            defaultValue: 'தயாரிப்பு காலத்தை உள்ளிடவும்',
          }),
        );
        return;
      }
    }

    if (!imageUrlRef.current) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.addPhoto', {
          defaultValue: 'தயாரிப்பு புகைப்படம் சேர்க்கவும்!',
        }),
      );
      return;
    }
    setIsSaving(true);
    try {
      const {addProduct} = require('../../services/firebase');

      const productPayload = {
        name: name.trim(),
        nameTa: nameTa.trim() || name.trim(),
        price: parseFloat(price),
        unit,
        stock: parseInt(stock, 10),
        category,
        descriptionTa: descriptionTa.trim(),
        description: descriptionTa.trim(),
        image: imageUrlRef.current,
        images: [imageUrlRef.current],
        farmerId: user?.id || user?.uid || '',
        farmerName: user?.name || '',
        farmerNameTa: user?.name || '',
        location: user?.location || '',
        coordinates:
          latitude && longitude ? {lat: latitude, lng: longitude} : null,
        isOrganic: category === 'organic',
        isFeatured: false,
        rating: 0,
        reviews: 0,
        originalPrice: parseFloat(price),
      };

      if (isPerishable) {
        productPayload.freshHours = parseInt(freshHours, 10) || 24;
        productPayload.harvestTime = new Date().toISOString();
      } else if (isNonPerishable) {
        productPayload.shelfLife = parseInt(shelfLife, 10) || 6;
        productPayload.harvestTime = null;
      } else if (isHandicraft) {
        productPayload.material = material.trim();
        productPayload.craftingTime = parseInt(craftingTime, 10) || 1;
        productPayload.harvestTime = null;
      }

      const r = await addProduct(productPayload);
      setIsSaving(false);
      if (r.success) {
        Alert.alert(
          '✅',
          t('farmer.productAdded', {
            defaultValue: 'தயாரிப்பு சேர்க்கப்பட்டது!',
          }),
          [
            {
              text: t('common.ok', {defaultValue: 'சரி'}),
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          r.error || 'Save failed',
        );
      }
    } catch (e) {
      setIsSaving(false);
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  const isUploaded = imageUri && imageUrlRef.current;

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={S.headerTitle}>
          ➕ {t('farmer.addProduct', {defaultValue: 'தயாரிப்பு சேர்'})}
        </Text>
        <View style={{width: 40}} />
      </LinearGradient>
      <ScrollView
        contentContainerStyle={{padding: SPACING.lg}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={[
            S.imgUpload,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
            },
            imageUri && S.imgUploadFilled,
          ]}
          onPress={handleImagePick}
          disabled={isUploading}>
          {isUploading ? (
            <View style={{alignItems: 'center', paddingVertical: 20}}>
              <ActivityIndicator color={COLORS.primaryGreen} size="large" />
              <Text style={{color: themeColors.textMuted, marginTop: 8}}>
                {t('farmer.uploading', {defaultValue: 'Uploading...'})}
              </Text>
            </View>
          ) : imageUri ? (
            <View style={{alignItems: 'center', width: '100%'}}>
              <FastImage
                source={{uri: imageUri.replace('?uploaded=1', '')}}
                style={S.previewImage}
                resizeMode={FastImage.resizeMode.cover}
              />
              {isUploaded && (
                <View style={S.uploadBadge}>
                  <Text style={S.uploadBadgeTxt}>
                    ✅ {t('farmer.uploaded', {defaultValue: 'Uploaded!'})}
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontSize: rs(FONTS.xs),
                  color: themeColors.textMuted,
                  marginTop: 4,
                }}>
                {t('farmer.tapToChange', {defaultValue: 'Tap to change photo'})}
              </Text>
            </View>
          ) : (
            <>
              <Text style={S.imgUploadEmoji}>📷</Text>
              <Text style={[S.imgUploadTxt, {color: themeColors.text}]}>
                {t('farmer.addPhotoLabel', {defaultValue: 'படம் சேர்க்கவும்'})}
              </Text>
              <Text style={[S.imgUploadSub, {color: themeColors.textMuted}]}>
                {t('farmer.cameraOrGallery', {
                  defaultValue: 'கேமரா அல்லது கேலரி',
                })}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <FormField
          label={`📦 ${t('farmer.productNameEn', {
            defaultValue: 'Product Name (English)',
          })}`}
          value={name}
          onChangeText={setName}
        />
        <FormField
          label={`📦 ${t('farmer.productNameTa', {
            defaultValue: 'தயாரிப்பு பெயர் (தமிழ்)',
          })}`}
          value={nameTa}
          onChangeText={setNameTa}
        />
        <FormField
          label={`💰 ${t('farmer.price', {defaultValue: 'விலை (₹)'})}`}
          value={price}
          onChangeText={setPrice}
          keyboard="numeric"
        />
        <FormField
          label={`📦 ${t('farmer.stockQty', {defaultValue: 'Stock Quantity'})}`}
          value={stock}
          onChangeText={setStock}
          keyboard="numeric"
        />
        {[
          'vegetables',
          'fruits',
          'greens',
          'dairy',
          'herbs',
          'organic',
        ].includes(category) && (
          <FormField
            label={`⏱️ ${t('farmer.freshHours', {
              defaultValue: 'Freshness Time (Hours)',
            })}`}
            value={freshHours}
            onChangeText={setFreshHours}
            keyboard="numeric"
            placeholder={t('farmer.freshHoursPlaceholder', {
              defaultValue: 'Enter freshness time in hours',
            })}
          />
        )}

        {['grains', 'millets', 'nuts'].includes(category) && (
          <FormField
            label={`📦 ${t('farmer.shelfLife', {
              defaultValue: 'Shelf Life (Months)',
            })}`}
            value={shelfLife}
            onChangeText={setShelfLife}
            keyboard="numeric"
            placeholder={t('farmer.shelfLifePlaceholder', {
              defaultValue: 'Enter shelf life in months (e.g. 6)',
            })}
          />
        )}

        {category === 'handicrafts' && (
          <>
            <FormField
              label={`🧶 ${t('farmer.material', {
                defaultValue: 'Material Used',
              })}`}
              value={material}
              onChangeText={setMaterial}
              placeholder={t('farmer.materialPlaceholder', {
                defaultValue: '',
              })}
            />
            <FormField
              label={`⏳ ${t('farmer.craftingTime', {
                defaultValue: 'Crafting Time (Days)',
              })}`}
              value={craftingTime}
              onChangeText={setCraftingTime}
              keyboard="numeric"
              placeholder={t('farmer.craftingTimePlaceholder', {
                defaultValue: 'Enter crafting time in days (e.g. 3)',
              })}
            />
          </>
        )}

        <Text style={[S.fieldLabel, {color: themeColors.text}]}>
          ⚖️ {t('farmer.unit', {defaultValue: 'அளவு வகை'})}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginBottom: SPACING.lg}}>
          {units.map(u => (
            <TouchableOpacity
              key={u}
              style={[
                S.chip,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                },
                unit === u && S.chipActive,
              ]}
              onPress={() => setUnit(u)}>
              <Text
                style={[
                  S.chipTxt,
                  {color: themeColors.text},
                  unit === u && S.chipTxtActive,
                ]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[S.fieldLabel, {color: themeColors.text}]}>
          📂 {t('farmer.category', {defaultValue: 'வகை'})}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginBottom: SPACING.xl}}>
          {categories.map(c => {
            const catObj = CATEGORIES.find(cat => cat.id === c);
            const displayName = catObj ? getCatName(catObj, i18n.language) : c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  S.chip,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                  },
                  category === c && S.chipActive,
                ]}
                onPress={() => setCategory(c)}>
                <Text
                  style={[
                    S.chipTxt,
                    {color: themeColors.text},
                    category === c && S.chipTxtActive,
                  ]}>
                  {displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={fetchLocation}
          style={{
            marginBottom: SPACING.xl,
            padding: SPACING.md,
            backgroundColor: isDark ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9',
            borderRadius: RADIUS.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 24, marginRight: 10}}>📍</Text>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: FONTS.sm,
                fontWeight: FONTS.semiBold,
                color: isDark ? COLORS.primaryGreen : COLORS.primaryGreenDark,
              }}>
              {locStatus === 'fetching'
                ? t('farmer.fetchingLocation', {
                    defaultValue: 'Fetching your location...',
                  })
                : locStatus === 'success'
                ? t('farmer.locationAdded', {
                    defaultValue: 'Your location added successfully!',
                  })
                : t('farmer.locationError', {
                    defaultValue: 'Could not get location. Turn on GPS.',
                  })}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.submitBtn}
          onPress={handleAdd}
          disabled={isSaving || isUploading}>
          <LinearGradient
            colors={isSaving ? ['#9E9E9E', '#757575'] : COLORS.gradientButton}
            style={S.submitGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={S.submitTxt}>
              {isSaving
                ? `⏳ ${t('farmer.saving', {defaultValue: 'சேமிக்கிறோம்...'})}`
                : `✅ ${t('farmer.addProduct', {
                    defaultValue: 'தயாரிப்பு சேர்க்கவும்',
                  })}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

// ── EDIT PRODUCT ──
export const EditProductScreen = ({route, navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {product} = route.params;
  const [price, setPrice] = useState(`${product.price}`);
  const [stock, setStock] = useState(`${product.stock}`);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    // Fetch fresh coordinates before saving to confirm live location
    const loc = await new Promise(resolve => {
      try {
        if (Platform.OS === 'android') {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          )
            .then(granted => {
              if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
                  pos =>
                    resolve({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                    }),
                  () => resolve(null),
                  {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
                );
              } else {
                resolve(null);
              }
            })
            .catch(() => resolve(null));
        } else {
          Geolocation.getCurrentPosition(
            pos =>
              resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
            () => resolve(null),
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
          );
        }
      } catch (e) {
        resolve(null);
      }
    });

    if (!loc) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.locationError', {
          defaultValue: 'இருப்பிடத்தை பெற முடியவில்லை. GPS ஆன் செய்யவும்.',
        }),
      );
      setIsSaving(false);
      return;
    }

    try {
      const {updateProduct} = require('../../services/firebase');
      const r = await updateProduct(product.id, {
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        coordinates: loc,
      });
      setIsSaving(false);
      if (r.success) {
        Alert.alert(
          '✅',
          t('farmer.changesSaved', {
            defaultValue: 'மாற்றங்கள் சேமிக்கப்பட்டன!',
          }),
          [
            {
              text: t('common.ok', {defaultValue: 'சரி'}),
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          r.error || 'Update failed',
        );
      }
    } catch (e) {
      setIsSaving(false);
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={S.headerTitle}>
          ✏️ {t('farmer.editProduct', {defaultValue: 'தயாரிப்பு திருத்து'})}
        </Text>
        <View style={{width: 40}} />
      </LinearGradient>
      <ScrollView
        contentContainerStyle={{padding: SPACING.lg}}
        keyboardShouldPersistTaps="handled">
        <FastImage
          source={{uri: product.image}}
          style={S.editImg}
          resizeMode={FastImage.resizeMode.cover}
        />
        <Text style={[S.editProdName, {color: themeColors.text}]}>
          {getLocalProductName(product.name, product.nameTa, i18n.language)}
        </Text>
        <FormField
          label={`💰 ${t('farmer.price', {defaultValue: 'விலை (₹)'})}`}
          value={price}
          onChangeText={setPrice}
          keyboard="numeric"
        />
        <FormField
          label={`📦 ${t('farmer.stock', {defaultValue: 'கையிருப்பு'})}`}
          value={stock}
          onChangeText={setStock}
          keyboard="numeric"
        />
        <TouchableOpacity
          style={S.submitBtn}
          onPress={handleSave}
          disabled={isSaving}>
          <LinearGradient colors={COLORS.gradientButton} style={S.submitGrad}>
            <Text style={S.submitTxt}>
              {isSaving
                ? '⏳...'
                : '💾 ' + t('common.save', {defaultValue: 'சேமிக்கவும்'})}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ── FARMER ORDERS ──
export const FarmerOrdersScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      const farmerId = user?.id || user?.uid;
      if (!farmerId) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const {getFarmerOrders} = require('../../services/firebase');
        const r = await getFarmerOrders(farmerId);
        setOrders(r.success ? r.data : []);
      } catch (e) {
        setOrders([]);
      }
      setIsLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefreshOrders = () => {
    loadOrders(true);
  };

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);

  const handleUpdateStatus = async (orderId, newStatus, extraFields = {}) => {
    try {
      const {updateOrderStatus} = require('../../services/firebase');
      const r = await updateOrderStatus(orderId, newStatus, extraFields);
      if (r.success) {
        setOrders(prev =>
          prev.map(o =>
            o.id === orderId ? {...o, status: newStatus, ...extraFields} : o,
          ),
        );
        Alert.alert('✅', `Status: ${newStatus}`);
      }
    } catch (e) {
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  const handleRejectOrder = reason => {
    if (rejectingOrderId) {
      handleUpdateStatus(rejectingOrderId, 'Cancelled', {rejectReason: reason});
      setRejectModalVisible(false);
      setRejectingOrderId(null);
    }
  };

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <Text style={S.headerTitle}>
          📦 {t('farmer.receivedOrders', {defaultValue: 'வந்த ஆர்டர்கள்'})}
        </Text>
      </LinearGradient>
      {isLoading ? (
        <ActivityIndicator
          color={COLORS.primaryGreen}
          size="large"
          style={{marginTop: 40}}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{padding: SPACING.lg}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshOrders}
              colors={[COLORS.primaryGreen]}
              tintColor={COLORS.primaryGreen}
            />
          }>
          {orders.length === 0 ? (
            <View style={S.emptyBox}>
              <Text style={S.emptyEmoji}>📦</Text>
              <Text style={[S.emptyText, {color: themeColors.textMuted}]}>
                {t('orders.noOrders', {
                  defaultValue: 'இன்னும் தயாரிப்புகள் இல்லை',
                })}
              </Text>
            </View>
          ) : (
            orders.map(order => {
              const displayCustomerName =
                order.consumerName || order.customerName || 'Customer';
              const displayCustomerPhone =
                order.consumerPhone || order.customerPhone || '';
              const displayAddress =
                order.deliveryAddress || order.address || '';
              const displayPincode =
                order.deliveryPincode || order.pincode || '';
              const displayLocation = order.consumerCoords
                ? `${
                    order.consumerCoords.lat || order.consumerCoords.latitude
                  }, ${
                    order.consumerCoords.lng || order.consumerCoords.longitude
                  }`
                : order.location || '';

              return (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedOrder(order);
                    setDetailsModalVisible(true);
                  }}
                  style={[
                    S.foCard,
                    {
                      backgroundColor: themeColors.cardBg,
                      borderColor: themeColors.border,
                      borderWidth: 1,
                    },
                  ]}>
                  <View style={S.foTop}>
                    <Text style={[S.foId, {color: themeColors.text}]}>
                      {t('orders.order', {defaultValue: 'ஆர்டர்'})} #
                      {order.orderId || order.id?.slice(-4)}
                    </Text>
                    <Text style={[S.foDate, {color: themeColors.subText}]}>
                      {order.createdAt
                        ?.toDate?.()
                        ?.toLocaleDateString('ta-IN') || ''}
                    </Text>
                  </View>

                  {/* Consumer delivery details */}
                  <View
                    style={{
                      marginVertical: 6,
                      paddingVertical: 6,
                      borderBottomWidth: 0.5,
                      borderBottomColor: themeColors.border,
                    }}>
                    <Text
                      style={{
                        fontSize: 13,
                        color: themeColors.text,
                        fontWeight: 'bold',
                      }}>
                      👤 {displayCustomerName}
                    </Text>
                    {!!displayCustomerPhone && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: themeColors.subText,
                          marginTop: 2,
                        }}>
                        📞 {displayCustomerPhone}
                      </Text>
                    )}
                    {!!displayAddress && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: themeColors.subText,
                          marginTop: 2,
                        }}>
                        📍 {displayAddress}{' '}
                        {displayPincode ? `(PIN: ${displayPincode})` : ''}
                      </Text>
                    )}
                    {!!displayLocation && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: themeColors.subText,
                          marginTop: 2,
                        }}>
                        🌐 GPS: {displayLocation}
                      </Text>
                    )}
                  </View>

                  {(order.items || []).map((item, i) => (
                    <Text
                      key={i}
                      style={[S.foItem, {color: themeColors.subText}]}>
                      • {item.nameTa || item.name} x{item.quantity} — ₹
                      {getFarmerItemPrice(item) * item.quantity}
                    </Text>
                  ))}
                  <View style={S.foBottom}>
                    <Text
                      style={[
                        S.foTotal,
                        {
                          color: isDark
                            ? COLORS.primaryGreen
                            : COLORS.primaryGreenDark || COLORS.primaryGreen,
                        },
                      ]}>
                      {t('orders.total', {defaultValue: 'மொத்தம்'})}: ₹
                      {getFarmerOrderTotal(order)}
                    </Text>
                    <View
                      style={[
                        S.foStatus,
                        {
                          backgroundColor:
                            order.status === 'Delivered'
                              ? isDark
                                ? '#1E3A24'
                                : '#E8F5E9'
                              : order.status === 'Shipped'
                              ? isDark
                                ? '#1A334B'
                                : '#E3F2FD'
                              : isDark
                              ? '#4A3B12'
                              : '#FFF9C4',
                        },
                      ]}>
                      <Text
                        style={[
                          S.foStatusTxt,
                          {
                            color:
                              order.status === 'Delivered'
                                ? '#4CAF50'
                                : order.status === 'Shipped'
                                ? '#2196F3'
                                : '#FFC107',
                          },
                        ]}>
                        {t('orders.status' + order.status, {
                          defaultValue: order.status,
                        })}
                      </Text>
                    </View>
                  </View>
                  {/* Farmer actions & status indicators */}
                  {order.status === 'Pending' && (
                    <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
                      <TouchableOpacity
                        style={[
                          S.statusBtn,
                          {backgroundColor: isDark ? '#1E3A24' : '#E8F5E9'},
                        ]}
                        onPress={() =>
                          handleUpdateStatus(order.id, 'Confirmed')
                        }>
                        <Text
                          style={{
                            color: '#4CAF50',
                            fontSize: rs(FONTS.xs),
                            fontWeight: 'bold',
                          }}>
                          ✅ {t('farmer.accept', {defaultValue: 'Accept'})}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          S.statusBtn,
                          {backgroundColor: isDark ? '#3D1B1E' : '#FFEBEE'},
                        ]}
                        onPress={() => {
                          setRejectingOrderId(order.id);
                          setRejectModalVisible(true);
                        }}>
                        <Text
                          style={{
                            color: '#FF5252',
                            fontSize: rs(FONTS.xs),
                            fontWeight: 'bold',
                          }}>
                          ❌ {t('farmer.reject', {defaultValue: 'Reject'})}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {order.status === 'Confirmed' && (
                    <View
                      style={[
                        S.statusBtn,
                        {
                          backgroundColor: isDark ? '#4A2A0A' : '#FFF3E0',
                          marginTop: 8,
                        },
                      ]}>
                      <Text
                        style={{
                          color: '#FF9800',
                          fontSize: rs(FONTS.xs),
                          fontWeight: '600',
                        }}>
                        ⏳{' '}
                        {t('farmer.waitingPickup', {
                          defaultValue: 'Waiting for pickup',
                        })}
                      </Text>
                    </View>
                  )}
                  {order.status === 'Shipped' && (
                    <View
                      style={[
                        S.statusBtn,
                        {
                          backgroundColor: isDark ? '#1A334B' : '#E3F2FD',
                          marginTop: 8,
                        },
                      ]}>
                      <Text
                        style={{
                          color: '#2196F3',
                          fontSize: rs(FONTS.xs),
                          fontWeight: '600',
                        }}>
                        📦{' '}
                        {t('farmer.itemPurchased', {
                          defaultValue: 'Item has been purchased',
                        })}
                      </Text>
                    </View>
                  )}
                  {order.status === 'Delivered' && (
                    <View
                      style={[
                        S.statusBtn,
                        {
                          backgroundColor: isDark ? '#1E3A24' : '#E8F5E9',
                          marginTop: 8,
                        },
                      ]}>
                      <Text
                        style={{
                          color: '#4CAF50',
                          fontSize: rs(FONTS.xs),
                          fontWeight: '600',
                        }}>
                        🎉{' '}
                        {t('farmer.itemDelivered', {
                          defaultValue: 'Item has been delivered',
                        })}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
          <View style={{height: 90}} />
        </ScrollView>
      )}

      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setRejectModalVisible(false);
          setRejectingOrderId(null);
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}>
          <View
            style={{
              width: '85%',
              backgroundColor: themeColors.cardBg,
              borderRadius: RADIUS.xl,
              padding: SPACING.xl,
              borderWidth: isDark ? 1 : 0,
              borderColor: themeColors.border,
              ...SHADOWS.card,
            }}>
            <Text
              style={{
                fontSize: rs(FONTS.md),
                fontWeight: 'bold',
                color: themeColors.text,
                marginBottom: SPACING.md,
                textAlign: 'center',
              }}>
              ❌{' '}
              {t('orders.rejectTitle', {
                defaultValue: 'Select Rejection Reason',
              })}
            </Text>

            {[
              {key: 'out_of_stock', emoji: '📦'},
              {key: 'out_of_service', emoji: '📍'},
              {key: 'quality_issue', emoji: '⚠️'},
              {key: 'unexpected_conditions', emoji: '☁️'},
            ].map(reason => (
              <TouchableOpacity
                key={reason.key}
                style={{
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.md,
                  backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5',
                  borderRadius: RADIUS.md,
                  marginVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => handleRejectOrder(reason.key)}>
                <Text style={{fontSize: rs(18), marginRight: SPACING.md}}>
                  {reason.emoji}
                </Text>
                <Text
                  style={{
                    fontSize: rs(FONTS.sm),
                    color: themeColors.text,
                    flex: 1,
                  }}>
                  {t('orders.rejectReason_' + reason.key)}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={{
                marginTop: SPACING.lg,
                padding: SPACING.md,
                alignItems: 'center',
                backgroundColor: isDark ? '#3D3D3D' : '#E0E0E0',
                borderRadius: RADIUS.md,
              }}
              onPress={() => {
                setRejectModalVisible(false);
                setRejectingOrderId(null);
              }}>
              <Text
                style={{
                  color: themeColors.text,
                  fontWeight: 'bold',
                  fontSize: rs(FONTS.sm),
                }}>
                {t('orders.close', {defaultValue: 'Close'})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📦 Order Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={S.modalOverlay}>
          <View
            style={[S.modalContainer, {backgroundColor: themeColors.cardBg}]}>
            <View style={S.modalHeader}>
              <Text style={[S.modalTitle, {color: themeColors.text}]}>
                📦{' '}
                {t('orders.orderDetails', {defaultValue: 'ஆர்டர் விவரங்கள்'})}
              </Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={S.modalCloseBtn}>
                <Text style={{fontSize: 20, color: themeColors.text}}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status card banner */}
                <View
                  style={[
                    S.summaryBox,
                    {
                      backgroundColor:
                        selectedOrder.status === 'Delivered'
                          ? '#E8F5E9'
                          : selectedOrder.status === 'Cancelled'
                          ? '#FFEBEE'
                          : selectedOrder.status === 'Shipped'
                          ? '#E3F2FD'
                          : '#FFF9C4',
                    },
                  ]}>
                  <Text
                    style={[
                      S.summaryVal,
                      {
                        color:
                          selectedOrder.status === 'Delivered'
                            ? '#4CAF50'
                            : selectedOrder.status === 'Cancelled'
                            ? '#FF5252'
                            : selectedOrder.status === 'Shipped'
                            ? '#2196F3'
                            : '#FFB300',
                        fontSize: rs(24),
                      },
                    ]}>
                    {t(
                      'orders.status' + selectedOrder.status.replace(/ /g, '_'),
                      {
                        defaultValue: selectedOrder.status,
                      },
                    )}
                  </Text>
                  <Text style={[S.summaryLbl, {color: themeColors.text}]}>
                    {t('orders.order', {defaultValue: 'ஆர்டர்'})} #
                    {selectedOrder.orderId || selectedOrder.id?.slice(-4)}
                  </Text>
                  <Text
                    style={[
                      S.summarySub,
                      {color: themeColors.subText, marginTop: 4},
                    ]}>
                    {selectedOrder.createdAt
                      ?.toDate?.()
                      ?.toLocaleDateString('ta-IN') || ''}
                  </Text>
                </View>

                {/* Consumer Details */}
                <View style={{marginBottom: SPACING.lg}}>
                  <Text style={[S.modalSecTitle, {color: themeColors.text}]}>
                    👤{' '}
                    {t('orders.customerDetails', {
                      defaultValue: 'வாடிக்கையாளர் விவரங்கள்',
                    })}
                  </Text>
                  <View
                    style={[
                      S.detailOrderCard,
                      {
                        backgroundColor: themeColors.bg,
                        borderColor: themeColors.border,
                        borderWidth: 1,
                      },
                    ]}>
                    <Text
                      style={{
                        color: themeColors.text,
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}>
                      {selectedOrder.consumerName ||
                        selectedOrder.customerName ||
                        'Customer'}
                    </Text>
                    {!!(
                      selectedOrder.consumerPhone || selectedOrder.customerPhone
                    ) && (
                      <Text
                        style={{
                          color: themeColors.subText,
                          fontSize: 13,
                          marginTop: 4,
                        }}>
                        📞{' '}
                        {selectedOrder.consumerPhone ||
                          selectedOrder.customerPhone}
                      </Text>
                    )}
                    {!!(
                      selectedOrder.deliveryAddress || selectedOrder.address
                    ) && (
                      <Text
                        style={{
                          color: themeColors.subText,
                          fontSize: 13,
                          marginTop: 4,
                        }}>
                        📍{' '}
                        {selectedOrder.deliveryAddress || selectedOrder.address}{' '}
                        {selectedOrder.deliveryPincode || selectedOrder.pincode
                          ? `(PIN: ${
                              selectedOrder.deliveryPincode ||
                              selectedOrder.pincode
                            })`
                          : ''}
                      </Text>
                    )}
                    {!!(
                      selectedOrder.consumerCoords || selectedOrder.location
                    ) && (
                      <Text
                        style={{
                          color: themeColors.subText,
                          fontSize: 13,
                          marginTop: 4,
                        }}>
                        🌐 GPS:{' '}
                        {selectedOrder.consumerCoords
                          ? `${
                              selectedOrder.consumerCoords.lat ||
                              selectedOrder.consumerCoords.latitude
                            }, ${
                              selectedOrder.consumerCoords.lng ||
                              selectedOrder.consumerCoords.longitude
                            }`
                          : selectedOrder.location}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Items details */}
                <View style={{marginBottom: SPACING.lg}}>
                  <Text style={[S.modalSecTitle, {color: themeColors.text}]}>
                    🥦 {t('orders.items', {defaultValue: 'தயாரிப்புகள்'})}
                  </Text>
                  {(selectedOrder.items || []).map((item, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        borderBottomWidth: 0.5,
                        borderBottomColor: themeColors.border,
                      }}>
                      <Text style={{color: themeColors.text, fontSize: 13}}>
                        • {item.nameTa || item.name} x{item.quantity} (
                        {item.unit || 'kg'})
                      </Text>
                      <Text
                        style={{
                          color: themeColors.text,
                          fontWeight: '600',
                          fontSize: 13,
                        }}>
                        ₹{getFarmerItemPrice(item) * item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Total & Cancellation/Refund reasons */}
                <View style={{marginBottom: SPACING.lg}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: SPACING.md,
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 15,
                        color: themeColors.text,
                      }}>
                      {t('orders.total', {defaultValue: 'மொத்தம்'})}:
                    </Text>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 18,
                        color: COLORS.primaryGreen,
                      }}>
                      ₹{getFarmerOrderTotal(selectedOrder)}
                    </Text>
                  </View>

                  {selectedOrder.status === 'Cancelled' &&
                  selectedOrder.rejectReason ? (
                    <View
                      style={{
                        backgroundColor: '#FFEBEE',
                        padding: SPACING.md,
                        borderRadius: RADIUS.md,
                        marginTop: 4,
                      }}>
                      <Text
                        style={{
                          color: '#FF5252',
                          fontWeight: 'bold',
                          fontSize: 13,
                        }}>
                        ❌{' '}
                        {t('farmer.rejectReason', {
                          defaultValue: 'Reject Reason',
                        })}
                        :
                      </Text>
                      <Text
                        style={{color: '#D32F2F', fontSize: 12, marginTop: 2}}>
                        {selectedOrder.rejectReason}
                      </Text>
                    </View>
                  ) : null}

                  {selectedOrder.refundReason ? (
                    <View
                      style={{
                        backgroundColor: '#FFEBEE',
                        padding: SPACING.md,
                        borderRadius: RADIUS.md,
                        marginTop: 4,
                      }}>
                      <Text
                        style={{
                          color: '#FF5252',
                          fontWeight: 'bold',
                          fontSize: 13,
                        }}>
                        💸{' '}
                        {t('orders.refundReason', {
                          defaultValue: 'Refund Reason',
                        })}
                        :
                      </Text>
                      <Text
                        style={{color: '#D32F2F', fontSize: 12, marginTop: 2}}>
                        {selectedOrder.refundReason}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── FARMER PROFILE ──
export const FarmerProfileScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user, logout} = useAuth();

  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [farmerRating, setFarmerRating] = useState(user?.rating || 0);

  const loadFarmerReviews = useCallback(async () => {
    const farmerId = user?.id || user?.uid;
    if (!farmerId) return;
    setReviewsLoading(true);
    try {
      const {getFarmerProductReviews} = require('../../services/firebase');
      const res = await getFarmerProductReviews(farmerId);
      if (res.success && res.data) {
        setReviews(res.data);
        if (res.data.length > 0) {
          const total = res.data.reduce(
            (sum, item) => sum + (item.rating || 0),
            0,
          );
          const avg = Math.round((total / res.data.length) * 10) / 10;
          setFarmerRating(avg);
        } else {
          setFarmerRating(0);
        }
      }
    } catch (e) {
      console.log('loadFarmerReviews error:', e);
    }
    setReviewsLoading(false);
  }, [user]);

  useEffect(() => {
    loadFarmerReviews();
  }, [loadFarmerReviews]);

  const openReviewsModal = () => {
    setReviewsModalVisible(true);
    loadFarmerReviews();
  };
  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={S.fProfileHeader}>
        <AvatarView
          uri={user?.avatar}
          name={user?.name}
          size={rs(88)}
          style={{borderWidth: 3, borderColor: COLORS.white, marginBottom: 12}}
        />
        <Text style={S.fProfileName}>{user?.name}</Text>
        {user?.isVerified && (
          <Text style={S.verifiedBadge}>
            ✅ {t('farmer.verified', {defaultValue: 'சரிபார்க்கப்பட்டது'})}
          </Text>
        )}
        <Text style={S.fProfileLoc}>
          📍{' '}
          {user?.location ||
            t('farmer.noLocation', {defaultValue: 'இடம் சேர்க்கவில்லை'})}
        </Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={{padding: SPACING.lg}}>
        {[
          {
            icon: '🏷️',
            label: t('farmer.farmName', {defaultValue: 'பண்ணை பெயர்'}),
            val: user?.farmName || '-',
          },
          {
            icon: '📞',
            label: t('farmer.phone', {defaultValue: 'தொலைபேசி'}),
            val: user?.phone || '-',
          },
          {
            icon: '📧',
            label: t('farmer.email', {defaultValue: 'மின்னஞ்சல்'}),
            val: user?.email || '-',
          },
          {
            icon: '⭐',
            label: t('farmer.rating', {defaultValue: 'மதிப்பீடு'}),
            val: `${farmerRating || '0'} / 5.0`,
            onPress: openReviewsModal,
          },
        ].map((item, i) => {
          const Component = item.onPress ? TouchableOpacity : View;
          return (
            <Component
              key={i}
              onPress={item.onPress}
              activeOpacity={0.7}
              style={[
                S.profileInfoCard,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                  borderWidth: 1,
                },
              ]}>
              <Text style={S.profileInfoIcon}>{item.icon}</Text>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <View>
                  <Text
                    style={[S.profileInfoLabel, {color: themeColors.subText}]}>
                    {item.label}
                  </Text>
                  <Text style={[S.profileInfoVal, {color: themeColors.text}]}>
                    {item.val}
                  </Text>
                </View>
                {item.onPress && (
                  <Text style={{fontSize: 14, color: themeColors.subText}}>
                    ➔
                  </Text>
                )}
              </View>
            </Component>
          );
        })}
        {[
          {
            icon: '📷',
            label: t('farmer.myQrCode', {defaultValue: 'என் QR குறியீடு'}),
            screen: 'FarmerQR',
          },
          {
            icon: '🎬',
            label: t('farmer.myStoryVideo', {defaultValue: 'என் கதை வீடியோ'}),
            screen: 'StoryVideo',
          },
          {
            icon: '⚙️',
            label: t('profile.settings', {defaultValue: 'அமைப்புகள்'}),
            screen: 'Settings',
          },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[
              S.menuItemCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => navigation.navigate(item.screen)}>
            <Text style={S.menuItemIcon}>{item.icon}</Text>
            <Text style={[S.menuItemLabel, {color: themeColors.text}]}>
              {item.label}
            </Text>
            <Text style={{fontSize: rs(20), color: themeColors.textMuted}}>
              ›
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            S.logoutCard,
            {
              backgroundColor: isDark ? 'rgba(211, 47, 47, 0.15)' : '#FFEBEE',
              borderColor: isDark ? 'rgba(211, 47, 47, 0.3)' : 'transparent',
              borderWidth: isDark ? 1 : 0,
            },
          ]}
          onPress={() =>
            Alert.alert(t('settings.logout', {defaultValue: 'வெளியேறு'}), '', [
              {
                text: t('common.cancel', {defaultValue: 'இல்லை'}),
                style: 'cancel',
              },
              {
                text: t('profile.logoutYes', {defaultValue: 'ஆமா'}),
                onPress: logout,
                style: 'destructive',
              },
            ])
          }>
          <Text
            style={[
              S.logoutCardTxt,
              {color: isDark ? '#FF8A80' : COLORS.accentRed},
            ]}>
            🚪 {t('settings.logout', {defaultValue: 'வெளியேறு'})}
          </Text>
        </TouchableOpacity>
        <View style={{height: 90}} />
      </ScrollView>

      {/* ⭐ Product Reviews Modal */}
      <Modal
        visible={reviewsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewsModalVisible(false)}>
        <View style={S.modalOverlay}>
          <View
            style={[S.modalContainer, {backgroundColor: themeColors.cardBg}]}>
            <View style={[S.modalHeader, {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}]}>
              <Text
                style={[S.modalTitle, {color: themeColors.text, flex: 1, marginRight: 8}]}
                numberOfLines={1}
                ellipsizeMode="tail">
                ⭐{' '}
                {t('farmer.ratingAndReviews', {
                  defaultValue: 'Ratings & Reviews',
                })}
              </Text>
              <TouchableOpacity
                onPress={() => setReviewsModalVisible(false)}
                style={S.modalCloseBtn}>
                <Text style={{fontSize: 20, color: themeColors.text}}>✕</Text>
              </TouchableOpacity>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.primaryGreen}
                style={{marginVertical: 40}}
              />
            ) : (
              <FlatList
                data={reviews}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({item}) => {
                  const localProdName =
                    i18n.language === 'ta'
                      ? item.productName
                      : item.productNameEn || item.productName;
                  return (
                    <View
                      style={[
                        S.detailOrderCard,
                        {
                          backgroundColor: themeColors.bg,
                          borderColor: themeColors.border,
                          borderWidth: 1,
                        },
                      ]}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{
                            fontWeight: 'bold',
                            color: themeColors.text,
                            fontSize: 14,
                          }}>
                          🥬 {localProdName}
                        </Text>
                        <Text
                          style={{
                            fontWeight: 'bold',
                            color: '#FFB300',
                            fontSize: 14,
                          }}>
                          ⭐ {item.rating} / 5
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginTop: 6,
                        }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: themeColors.subText,
                            fontWeight: '500',
                          }}>
                          👤 {item.userName || 'Customer'}
                        </Text>
                        <Text
                          style={{fontSize: 11, color: themeColors.subText}}>
                          {item.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString('ta-IN') || ''}
                        </Text>
                      </View>
                      {item.review ? (
                        <Text
                          style={{
                            color: themeColors.text,
                            fontSize: 13,
                            marginTop: 6,
                            fontStyle: 'italic',
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.05)'
                              : '#F5F5F5',
                            padding: 8,
                            borderRadius: 4,
                          }}>
                          "{item.review}"
                        </Text>
                      ) : null}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={{alignItems: 'center', paddingVertical: 60}}>
                    <Text style={{fontSize: 55}}>⭐</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const S = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  headerRow: {
    paddingTop: rs(50),
    paddingBottom: rs(20),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  backTxt: {
    color: COLORS.white,
    fontSize: rs(22),
    fontWeight: 'bold',
    width: 40,
  },
  dashHeader: {
    paddingTop: rs(50),
    paddingBottom: rs(24),
    paddingHorizontal: SPACING.xl,
  },
  dashHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashGreeting: {fontSize: rs(FONTS.sm), color: 'rgba(255,255,255,0.75)'},
  dashName: {fontSize: rs(FONTS.xxl), fontWeight: 'bold', color: COLORS.white},
  verifiedBadge: {
    fontSize: rs(FONTS.xs),
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  farmName: {
    fontSize: rs(FONTS.sm),
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.sm,
  },
  notifBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderTopWidth: 3,
    ...SHADOWS.small,
  },
  statEmoji: {fontSize: rs(28), marginBottom: SPACING.sm},
  statVal: {fontSize: rs(FONTS.xxl), fontWeight: '800'},
  statLbl: {fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: 2},
  section: {paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryBlue,
    fontWeight: '600',
  },
  qaGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
  qaCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.small,
    marginBottom: SPACING.md,
  },
  qaGrad: {
    paddingHorizontal: rs(SPACING.sm),
    paddingVertical: rs(SPACING.lg),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: rs(140),
  },
  qaIcon: {fontSize: rs(36), marginBottom: 8},
  qaLabel: {
    fontSize: rs(FONTS.sm),
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  prodRowImg: {width: rs(56), height: rs(56), borderRadius: RADIUS.md},
  prodRowInfo: {flex: 1, marginLeft: SPACING.md},
  prodRowName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  prodRowPrice: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryGreen,
    fontWeight: '600',
  },
  stockBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: {
    fontSize: rs(FONTS.xs),
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  addBtnTxt: {color: COLORS.white, fontWeight: 'bold'},
  mpCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  mpImg: {
    width: rs(80),
    height: rs(80),
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  mpInfo: {flex: 1, marginLeft: SPACING.md},
  mpName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  mpPrice: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryGreen,
    fontWeight: '600',
  },
  mpStock: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  mpActions: {justifyContent: 'space-between', paddingVertical: 4},
  editBtn: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: RADIUS.md,
    marginBottom: 6,
  },
  editBtnTxt: {fontSize: rs(18)},
  delBtn: {backgroundColor: '#FFEBEE', padding: 8, borderRadius: RADIUS.md},
  delBtnTxt: {fontSize: rs(18)},
  fieldWrap: {marginBottom: SPACING.lg},
  fieldLabel: {
    fontSize: rs(FONTS.sm),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: rs(52),
    fontSize: rs(FONTS.md),
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  imgUpload: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: rs(32),
    alignItems: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  imgUploadFilled: {
    borderStyle: 'solid',
    borderColor: COLORS.primaryGreen,
    padding: SPACING.sm,
  },
  imgUploadEmoji: {fontSize: rs(36), marginBottom: 8},
  imgUploadTxt: {
    fontSize: rs(FONTS.md),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  imgUploadSub: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  previewImage: {width: '100%', height: rs(200), borderRadius: RADIUS.lg},
  uploadBadge: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 8,
  },
  uploadBadgeTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.sm),
    fontWeight: 'bold',
  },
  chip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  chipTxt: {fontSize: rs(FONTS.sm), color: COLORS.textSecondary},
  chipTxtActive: {color: COLORS.white, fontWeight: 'bold'},
  submitBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  submitGrad: {paddingVertical: rs(16), alignItems: 'center'},
  submitTxt: {color: COLORS.white, fontSize: rs(FONTS.lg), fontWeight: 'bold'},
  editImg: {
    width: '100%',
    height: rs(200),
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
  },
  editProdName: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  foCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  foTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  foId: {fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary},
  foDate: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  foItem: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  foBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  foTotal: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  foStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  foStatusTxt: {fontSize: rs(FONTS.xs), fontWeight: 'bold'},
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  fProfileHeader: {
    paddingTop: rs(50),
    paddingBottom: rs(30),
    alignItems: 'center',
  },
  fProfileName: {
    fontSize: rs(FONTS.xxl),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  fProfileLoc: {
    fontSize: rs(FONTS.sm),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  profileInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  profileInfoIcon: {fontSize: rs(28), marginRight: SPACING.md},
  profileInfoLabel: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  profileInfoVal: {
    fontSize: rs(FONTS.md),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  menuItemIcon: {fontSize: rs(22), marginRight: SPACING.md},
  menuItemLabel: {
    flex: 1,
    fontSize: rs(FONTS.md),
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  logoutCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  logoutCardTxt: {
    color: COLORS.accentRed,
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
  },
  emptyBox: {alignItems: 'center', paddingVertical: rs(60)},
  emptyEmoji: {fontSize: rs(64), marginBottom: SPACING.md},
  emptyText: {
    fontSize: rs(FONTS.lg),
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  emptyAddBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyAddTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  summaryBox: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  summaryVal: {
    fontSize: rs(32),
    fontWeight: 'bold',
  },
  summaryLbl: {
    fontSize: rs(14),
    fontWeight: '600',
    marginTop: 4,
  },
  summarySub: {
    fontSize: rs(12),
  },
  modalSecTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  detailOrderCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
});
