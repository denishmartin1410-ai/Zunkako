// ============================================================
// src/screens/delivery/DeliveryDashboard.js
// ✅ Delivery Boy Dashboard - Swiggy/Zomato style
// ✅ View assigned orders
// ✅ Navigate to Farmer (pickup) location via Google Maps
// ✅ Navigate to Customer (delivery) location via Google Maps
// ✅ Update order status
// ============================================================

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  PermissionsAndroid,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {createNotification} from '../../services/firebase';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const STATUS_FLOW = {
  Confirmed: {
    next: 'Shipped',
    labelKey: 'delivery.markPurchased',
    defaultLabel: '📦 Mark Purchased',
    color: '#2196F3',
  },
  Shipped: {
    next: 'Delivered',
    labelKey: 'delivery.markDelivered',
    defaultLabel: '🎉 Mark Delivered',
    color: '#4CAF50',
  },
};

const DeliveryDashboard = () => {
  const {t} = useTranslation();
  const {user, logout} = useAuth();
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  const deliveryBoyId = user?.id || user?.uid;

  const activeOrders = orders.filter(
    o =>
      !['Delivered', 'Cancelled', 'Refund Requested', 'Refunded'].includes(
        o.status,
      ),
  );
  const completedOrders = orders.filter(o =>
    ['Delivered', 'Cancelled', 'Refund Requested', 'Refunded'].includes(
      o.status,
    ),
  );

  const displayOrders =
    activeTab === 'available'
      ? availableOrders
      : activeTab === 'active'
      ? activeOrders
      : completedOrders;

  // Get current location initially
  useEffect(() => {
    const getLocation = async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
        }
        Geolocation.getCurrentPosition(
          pos =>
            setCurrentLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          err => console.log('Location error:', err.message),
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      } catch (e) {
        console.log('Permission error:', e.message);
      }
    };
    getLocation();
  }, []);

  // Live location tracking when there are active orders
  useEffect(() => {
    if (!deliveryBoyId || activeOrders.length === 0) {
      return;
    }

    let watchId;
    const startTracking = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return;
          }
        }

        watchId = Geolocation.watchPosition(
          async pos => {
            const {latitude, longitude} = pos.coords;
            const newLoc = {lat: latitude, lng: longitude};
            setCurrentLocation(newLoc);

            // 1. Update delivery boy profile in Firestore
            firestore()
              .collection('deliveryBoys')
              .doc(deliveryBoyId)
              .set(
                {
                  currentLocation: newLoc,
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                },
                {merge: true},
              )
              .catch(err =>
                console.log('Firestore location update error:', err),
              );

            // 2. Update each active order's tracking in Realtime DB
            activeOrders.forEach(order => {
              database()
                .ref(`deliveries/${order.id}/location`)
                .set({
                  lat: latitude,
                  lng: longitude,
                  timestamp: database.ServerValue.TIMESTAMP,
                })
                .catch(err =>
                  console.log('Realtime DB location update error:', err),
                );
            });
          },
          err => console.log('watchPosition error:', err.message),
          {
            enableHighAccuracy: true,
            distanceFilter: 10,
            interval: 5000,
            fastInterval: 2000,
          },
        );
      } catch (e) {
        console.log('Tracking setup error:', e.message);
      }
    };

    startTracking();

    return () => {
      if (watchId !== undefined) {
        Geolocation.clearWatch(watchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryBoyId, activeOrders.length]);

  // Listen to assigned orders
  useEffect(() => {
    if (!deliveryBoyId) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection('orders')
      .where('deliveryBoyId', '==', deliveryBoyId)
      .onSnapshot(
        snap => {
          if (snap) {
            const list = snap.docs
              .map(doc => ({id: doc.id, ...doc.data()}))
              .sort((a, b) => {
                const tA = a.createdAt?.toMillis?.() || 0;
                const tB = b.createdAt?.toMillis?.() || 0;
                return tB - tA;
              });
            setOrders(list);
          }
          setLoading(false);
        },
        error => {
          console.log('Delivery orders error:', error.message);
          setLoading(false);
        },
      );

    return unsubscribe;
  }, [deliveryBoyId]);

  // Listen to unassigned confirmed orders (Available)
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
      .where('status', '==', 'Confirmed')
      .onSnapshot(
        snap => {
          if (snap) {
            const list = snap.docs
              .map(doc => ({id: doc.id, ...doc.data()}))
              .filter(o => !o.deliveryBoyId)
              .sort((a, b) => {
                const tA = a.createdAt?.toMillis?.() || 0;
                const tB = b.createdAt?.toMillis?.() || 0;
                return tB - tA;
              });
            setAvailableOrders(list);
          }
        },
        error => {
          console.log('Available orders error:', error.message);
        },
      );

    return unsubscribe;
  }, []);

  // Open Google Maps navigation
  const navigateToLocation = (lat, lng, label = 'Destination') => {
    if (!lat || !lng) {
      Alert.alert(
        '❌ Location Error',
        'Location coordinates not available for this address.',
      );
      return;
    }
    const url = Platform.select({
      android: `google.navigation:q=${lat},${lng}&mode=d`,
      ios: `maps://app?daddr=${lat},${lng}&dirflg=d`,
    });
    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps web
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      );
    });
  };

  // Accept unassigned delivery order
  const handleAcceptOrder = async order => {
    Alert.alert(
      t('delivery.acceptTitle', {defaultValue: 'Accept Order'}),
      t('delivery.acceptConfirm', {
        defaultValue: 'Do you want to accept this delivery order?',
      }),
      [
        {text: t('common.cancel', {defaultValue: 'Cancel'}), style: 'cancel'},
        {
          text: t('common.yes', {defaultValue: 'Yes'}),
          onPress: async () => {
            try {
              setLoading(true);
              await firestore()
                .collection('orders')
                .doc(order.id)
                .update({
                  deliveryBoyId: deliveryBoyId,
                  deliveryBoyName: user?.name || user?.email || 'Partner',
                  deliveryBoyPhone: user?.phone || '',
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                });

              Alert.alert(
                t('common.success', {defaultValue: 'Success'}),
                t('delivery.acceptedMsg', {
                  defaultValue: 'Order accepted! Go to Active tab to navigate.',
                }),
              );
              setActiveTab('active');
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Update order status
  const handleStatusUpdate = async (order, newStatus) => {
    try {
      // Save delivery boy's current location
      const locationUpdate = currentLocation
        ? {
            deliveryBoyLocation: currentLocation,
            [`${newStatus.toLowerCase().replace(/ /g, '')}Location`]:
              currentLocation,
          }
        : {};

      await firestore()
        .collection('orders')
        .doc(order.id)
        .update({
          status: newStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          [`${newStatus.toLowerCase().replace(/ /g, '')}At`]:
            firestore.FieldValue.serverTimestamp(),
          ...locationUpdate,
        });

      // Notify consumer
      if (order.consumerId) {
        await createNotification({
          userId: order.consumerId,
          title:
            newStatus === 'Delivered'
              ? '🎉 Order Delivered!'
              : `📦 Order ${newStatus === 'Shipped' ? 'Purchased' : newStatus}`,
          message: `Your order #${
            order.orderId || order.id?.slice(-4)
          } is now ${
            newStatus === 'Shipped' ? 'purchased' : newStatus.toLowerCase()
          }.`,
          emoji: newStatus === 'Delivered' ? '🎉' : '🚚',
          bgColor: newStatus === 'Delivered' ? '#E8F5E9' : '#FFF3E0',
          type: `delivery_${newStatus.toLowerCase().replace(/ /g, '_')}`,
        });
      }

      // Notify farmer
      if (order.farmerId) {
        await createNotification({
          userId: order.farmerId,
          title: `Order ${newStatus === 'Shipped' ? 'Purchased' : newStatus}`,
          message: `Order #${order.orderId || order.id?.slice(-4)} is ${
            newStatus === 'Shipped' ? 'purchased' : newStatus.toLowerCase()
          }.`,
          emoji: newStatus === 'Delivered' ? '🎉' : '🚚',
          bgColor: '#E8F5E9',
          type: `delivery_${newStatus.toLowerCase().replace(/ /g, '_')}`,
        });
      }

      Alert.alert('✅ Updated', `Order marked as ${newStatus}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const renderOrder = ({item}) => {
    const statusConfig = STATUS_FLOW[item.status];
    const localizedStatus = t('orders.status' + item.status, {
      defaultValue: item.status,
    });

    const isAvailableTab = activeTab === 'available';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>
              📦 #{item.orderId || item.id?.slice(-4)}
            </Text>
            <Text style={styles.orderDate}>
              {item.createdAt?.toDate?.()?.toLocaleDateString() || ''}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig?.color
                  ? statusConfig.color + '22'
                  : '#F5F5F5',
              },
            ]}>
            <Text
              style={[
                styles.statusTxt,
                {color: statusConfig?.color || '#999'},
              ]}>
              {localizedStatus}
            </Text>
          </View>
        </View>

        {isAvailableTab ? (
          // AVAILABLE TAB: Accept Delivery card
          <View>
            <View style={styles.locationCard}>
              <Text style={styles.locationLabel}>🧑‍🌾 PICKUP AREA</Text>
              <Text style={styles.locationName}>
                {item.farmerName || 'Farmer'}
              </Text>
              <Text style={styles.locationAddr}>
                {item.farmerLocation || 'Farmer location not specified'}
              </Text>
            </View>

            <View style={styles.itemsBox}>
              <Text style={styles.itemsTitle}>
                📋 {t('delivery.items', {defaultValue: 'Items'})} (
                {(item.items || []).length})
              </Text>
              {(item.items || []).map((itm, idx) => (
                <Text key={idx} style={styles.itemLine}>
                  • {itm.nameTa || itm.name} x{itm.quantity}
                </Text>
              ))}
              <Text style={styles.totalLine}>
                💰 {t('delivery.totalAmount', {defaultValue: 'Total'})}: ₹
                {item.total}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.updateBtn, {backgroundColor: COLORS.primaryGreen}]}
              onPress={() => handleAcceptOrder(item)}>
              <Text style={styles.updateBtnTxt}>
                {t('delivery.acceptDeliveryBtn', {
                  defaultValue: '🤝 Accept Delivery',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ACTIVE/COMPLETED TAB: Unified pickup/delivery cards
          <View>
            {/* Farmer Pickup Card */}
            <View
              style={[
                styles.locationCard,
                item.status !== 'Confirmed' && {opacity: 0.7},
              ]}>
              <Text style={styles.locationLabel}>🧑‍🌾 PICKUP FROM (FARMER)</Text>
              <Text style={styles.locationName}>
                {item.farmerName || 'Farmer'}
              </Text>
              {item.farmerPhone ? (
                <Text style={styles.locationPhone}>📞 {item.farmerPhone}</Text>
              ) : null}
              <Text style={styles.locationAddr}>
                {item.farmerLocation || 'No address'}
              </Text>

              {item.status === 'Confirmed' ? (
                <TouchableOpacity
                  style={[styles.navBtn, {backgroundColor: '#E3F2FD'}]}
                  onPress={() =>
                    navigateToLocation(
                      item.farmerCoords?.lat || item.farmerCoords?.latitude,
                      item.farmerCoords?.lng || item.farmerCoords?.longitude,
                      'Farmer',
                    )
                  }>
                  <Text style={[styles.navBtnTxt, {color: '#1565C0'}]}>
                    🗺️ Navigate to Farmer
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.stepCompletedLabel}>
                  ✅ Picked Up from Farmer
                </Text>
              )}
            </View>

            {/* Customer Delivery Card */}
            <View
              style={[
                styles.locationCard,
                item.status === 'Confirmed' && {opacity: 0.7},
              ]}>
              <Text style={styles.locationLabel}>🏠 DELIVER TO (CUSTOMER)</Text>
              <Text style={styles.locationName}>
                {item.consumerName || 'Customer'}
              </Text>
              {item.consumerPhone ? (
                <Text style={styles.locationPhone}>
                  📞 {item.consumerPhone}
                </Text>
              ) : null}
              <Text style={styles.locationAddr}>
                {item.deliveryAddress || 'No address'}
              </Text>
              {item.deliveryPincode && (
                <Text style={styles.locationAddr}>
                  PIN: {item.deliveryPincode}
                </Text>
              )}

              {item.status !== 'Confirmed' ? (
                <TouchableOpacity
                  style={[styles.navBtn, {backgroundColor: '#E8F5E9'}]}
                  onPress={() =>
                    navigateToLocation(
                      item.consumerCoords?.lat || item.consumerCoords?.latitude,
                      item.consumerCoords?.lng ||
                        item.consumerCoords?.longitude,
                      'Customer',
                    )
                  }>
                  <Text style={[styles.navBtnTxt, {color: '#2E7D32'}]}>
                    🗺️ Navigate to Customer
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.stepLockedLabel}>
                  🔒 Available after product pickup
                </Text>
              )}
            </View>

            {/* Items */}
            <View style={styles.itemsBox}>
              <Text style={styles.itemsTitle}>
                📋 {t('delivery.items', {defaultValue: 'Items'})} (
                {(item.items || []).length})
              </Text>
              {(item.items || []).map((itm, idx) => (
                <Text key={idx} style={styles.itemLine}>
                  • {itm.nameTa || itm.name} x{itm.quantity}
                </Text>
              ))}
              <Text style={styles.totalLine}>
                💰 {t('delivery.totalAmount', {defaultValue: 'Total'})}: ₹
                {item.total}
              </Text>
            </View>

            {/* Status Update Button */}
            {statusConfig && (
              <TouchableOpacity
                style={[
                  styles.updateBtn,
                  {backgroundColor: statusConfig.color},
                ]}
                onPress={() => handleStatusUpdate(item, statusConfig.next)}>
                <Text style={styles.updateBtnTxt}>
                  {t(statusConfig.labelKey, {
                    defaultValue: statusConfig.defaultLabel,
                  })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#2196F3']}
        style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flex: 1}}>
            <Text style={styles.greeting}>
              🚚 {t('delivery.title', {defaultValue: 'Delivery Partner'})}
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || 'Partner'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutTxt}>
              {t('settings.logout', {defaultValue: 'Logout'})}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>
              {t('delivery.active', {defaultValue: 'Active'})}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>
              {t('delivery.completed', {defaultValue: 'Completed'})}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{availableOrders.length}</Text>
            <Text style={styles.statLabel}>
              {t('delivery.available', {defaultValue: 'Available'})}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          {
            key: 'available',
            label: `🤝 ${t('delivery.available', {
              defaultValue: 'Available',
            })} (${availableOrders.length})`,
          },
          {
            key: 'active',
            label: `🟢 ${t('delivery.active', {defaultValue: 'Active'})} (${
              activeOrders.length
            })`,
          },
          {
            key: 'completed',
            label: `✅ ${t('delivery.completed', {
              defaultValue: 'Completed',
            })} (${completedOrders.length})`,
          },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text
              style={[
                styles.tabTxt,
                activeTab === tab.key && styles.tabTxtActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1565C0"
          style={{marginTop: 50}}
        />
      ) : (
        <FlatList
          data={displayOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{padding: SPACING.md, paddingBottom: 100}}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>
                {activeTab === 'available'
                  ? '🤝'
                  : activeTab === 'active'
                  ? '🚚'
                  : '📦'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'available'
                  ? t('delivery.noAvailable', {
                      defaultValue: 'No available orders',
                    })
                  : activeTab === 'active'
                  ? t('orders.noOrders', {defaultValue: 'No active deliveries'})
                  : t('orders.noOrders', {
                      defaultValue: 'No completed deliveries',
                    })}
              </Text>
              <Text style={styles.emptyMsg}>
                {activeTab === 'available'
                  ? 'Confirmed orders waiting for delivery will appear here'
                  : activeTab === 'active'
                  ? 'New orders will appear here when accepted/assigned'
                  : 'Completed deliveries will show here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  // Header
  header: {
    paddingTop: rs(50),
    paddingBottom: rs(24),
    paddingHorizontal: SPACING.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {fontSize: rs(FONTS.sm), color: 'rgba(255,255,255,0.8)'},
  userName: {fontSize: rs(FONTS.xxl), fontWeight: 'bold', color: COLORS.white},
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutTxt: {color: COLORS.white, fontWeight: 'bold', fontSize: rs(FONTS.sm)},
  statsRow: {flexDirection: 'row', gap: SPACING.md},
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statNum: {fontSize: rs(FONTS.xxl), fontWeight: 'bold', color: COLORS.white},
  statLabel: {
    fontSize: rs(FONTS.xs),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: rs(14),
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {borderBottomColor: '#1565C0'},
  tabTxt: {fontSize: rs(FONTS.sm), color: COLORS.textMuted, fontWeight: '600'},
  tabTxtActive: {color: '#1565C0', fontWeight: 'bold'},

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  orderId: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  orderDate: {fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: 2},
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  statusTxt: {fontSize: rs(FONTS.xs), fontWeight: 'bold'},

  // Location cards
  locationCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#E0E0E0',
  },
  locationLabel: {
    fontSize: rs(FONTS.xs),
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 4,
    letterSpacing: 1,
  },
  locationName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  locationPhone: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  locationAddr: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  navBtn: {
    marginTop: SPACING.sm,
    paddingVertical: rs(10),
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  navBtnTxt: {fontSize: rs(FONTS.sm), fontWeight: 'bold'},
  stepCompletedLabel: {
    fontSize: rs(FONTS.xs),
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: SPACING.sm,
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  stepLockedLabel: {
    fontSize: rs(FONTS.xs),
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },

  // Items
  itemsBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  itemsTitle: {
    fontSize: rs(FONTS.sm),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  itemLine: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  totalLine: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },

  // Update button
  updateBtn: {
    paddingVertical: rs(14),
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  updateBtnTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
  },

  // Empty
  emptyBox: {alignItems: 'center', paddingVertical: rs(80)},
  emptyEmoji: {fontSize: rs(64), marginBottom: SPACING.lg},
  emptyTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  emptyMsg: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default DeliveryDashboard;
