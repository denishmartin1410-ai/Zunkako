// ============================================================
// src/screens/admin/AdminDashboard.js
// ✅ Full admin dashboard with all order management
// ✅ Mark as Delivered
// ✅ Mark as Refunded
// ✅ View Refund Requests
// ✅ Assign Delivery Boy
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
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {useAuth} from '../../context/AuthContext';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import {createNotification} from '../../services/firebase';
import LinearGradient from 'react-native-linear-gradient';
import MapView, {Marker, Polyline} from 'react-native-maps';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const getLat = coords => coords?.lat ?? coords?.latitude;
const getLng = coords => coords?.lng ?? coords?.longitude;

const STATUS_CONFIG = {
  Pending: {bg: '#E3F2FD', color: '#1565C0', emoji: '⏳'},
  Confirmed: {bg: '#E8F5E9', color: '#2E7D32', emoji: '✅'},
  Shipped: {bg: '#FFF3E0', color: '#E65100', emoji: '📦'},
  Delivered: {bg: '#E8F5E9', color: '#2E7D32', emoji: '🎉'},
  Cancelled: {bg: '#FFEBEE', color: '#C62828', emoji: '❌'},
  'Refund Requested': {bg: '#FFF3E0', color: '#FF5722', emoji: '💸'},
  Refunded: {bg: '#F3E5F5', color: '#7B1FA2', emoji: '💜'},
};

const AdminDashboard = () => {
  const {logout} = useAuth();
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [preOrders, setPreOrders] = useState([]);
  const [preOrdersModalVisible, setPreOrdersModalVisible] = useState(false);
  const [userStats, setUserStats] = useState({
    farmers: 0,
    consumers: 0,
    deliveryBoys: 0,
  });

  // Live tracking modal states
  const [selectedOrderForTracking, setSelectedOrderForTracking] =
    useState(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [deliveryBoyLiveLocation, setDeliveryBoyLiveLocation] = useState(null);

  // Listen to live tracking for the selected order
  useEffect(() => {
    if (!selectedOrderForTracking) {
      setDeliveryBoyLiveLocation(null);
      return;
    }
    const orderId = selectedOrderForTracking.id;
    const ref = database().ref(`deliveries/${orderId}/location`);

    const handleValueChange = snapshot => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && typeof val.lat === 'number' && typeof val.lng === 'number') {
          setDeliveryBoyLiveLocation({
            latitude: val.lat,
            longitude: val.lng,
          });
        }
      }
    };

    ref.on('value', handleValueChange);

    return () => {
      ref.off('value', handleValueChange);
    };
  }, [selectedOrderForTracking]);

  const handleTrackLive = order => {
    setSelectedOrderForTracking(order);
    setTrackingModalVisible(true);
  };

  const handleCloseTracking = () => {
    setTrackingModalVisible(false);
    setSelectedOrderForTracking(null);
  };

  // Fetch total user counts
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const usersSnap = await firestore().collection('users').get();
        let f = 0,
          c = 0;
        usersSnap.docs.forEach(doc => {
          if (doc.data().userType === 'farmer') {
            f++;
          } else if (doc.data().userType === 'consumer') {
            c++;
          }
        });
        const dbSnap = await firestore().collection('deliveryBoys').get();
        setUserStats({farmers: f, consumers: c, deliveryBoys: dbSnap.size});
      } catch (err) {
        console.log('Stats error:', err);
      }
    };
    fetchUserStats();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
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
          console.error('Admin order fetch error:', error);
          setLoading(false);
        },
      );
    return unsubscribe;
  }, []);

  // Fetch available delivery boys
  useEffect(() => {
    const unsub = firestore()
      .collection('deliveryBoys')
      .onSnapshot(
        snap => {
          if (snap) {
            setDeliveryBoys(
              snap.docs.map(doc => ({id: doc.id, ...doc.data()})),
            );
          }
        },
        err => console.log('Delivery boys fetch error:', err.message),
      );
    return unsub;
  }, []);

  // Fetch user feedbacks live
  useEffect(() => {
    const unsubFeedbacks = firestore()
      .collection('feedbacks')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snap => {
          if (snap) {
            setFeedbacks(snap.docs.map(doc => ({id: doc.id, ...doc.data()})));
          }
        },
        err => console.log('Feedbacks fetch error:', err.message),
      );
    return unsubFeedbacks;
  }, []);

  // Fetch all pre-orders across harvests live
  useEffect(() => {
    const unsub = firestore()
      .collectionGroup('preOrders')
      .onSnapshot(
        async snap => {
          if (snap) {
            const list = [];
            const promises = snap.docs.map(async doc => {
              const preOrderData = doc.data();
              const harvestRef = doc.ref.parent.parent;
              let harvestData = {};
              if (harvestRef) {
                const hDoc = await harvestRef.get();
                if (hDoc.exists) {
                  harvestData = hDoc.data();
                }
              }
              list.push({
                id: doc.id,
                harvestId: harvestRef ? harvestRef.id : '',
                ...harvestData,
                ...preOrderData,
                userId: doc.id, // Explicitly override with document ID (which is the customer's userId)
              });
            });
            await Promise.all(promises);
            list.sort((a, b) => {
              const tA = a.createdAt?.toMillis?.() || a.createdAt || 0;
              const tB = b.createdAt?.toMillis?.() || b.createdAt || 0;
              return tB - tA;
            });
            setPreOrders(list);
          }
        },
        err => console.log('Admin pre-orders fetch error:', err.message),
      );
    return unsub;
  }, []);

  const handleUpdatePreOrderStatus = async (item, newStatus) => {
    try {
      const targetUserId = item.userId || item.id;
      await firestore()
        .collection('harvests')
        .doc(item.harvestId)
        .collection('preOrders')
        .doc(targetUserId)
        .update({
          status: newStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Send a notification to the Consumer about status change
      let title = '📅 Pre-Order Update';
      let message = `Your pre-ordered ${
        item.nameEn || item.name
      } has been updated to ${newStatus}.`;
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

      Alert.alert('✅ Success', `Pre-Order marked as ${newStatus}`);
    } catch (err) {
      Alert.alert('❌ Error', err.message);
    }
  };

  const filteredOrders =
    activeFilter === 'all'
      ? orders
      : activeFilter === 'refund'
      ? orders.filter(o => o.status === 'Refund Requested')
      : orders.filter(o => o.status === activeFilter);

  const refundCount = orders.filter(
    o => o.status === 'Refund Requested',
  ).length;

  const updateStatus = async (order, newStatus, confirmMsg) => {
    Alert.alert('Confirm', confirmMsg, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await firestore()
              .collection('orders')
              .doc(order.id)
              .update({
                status: newStatus,
                updatedAt: firestore.FieldValue.serverTimestamp(),
                [`${newStatus.toLowerCase().replace(' ', '')}At`]:
                  firestore.FieldValue.serverTimestamp(),
              });

            // Send notifications to both parties
            if (order.consumerId) {
              await createNotification({
                userId: order.consumerId,
                title: `Order ${newStatus}`,
                message: `Your order #${
                  order.orderId || order.id?.slice(-4)
                } has been ${newStatus.toLowerCase()}.`,
                emoji: STATUS_CONFIG[newStatus]?.emoji || '📦',
                bgColor: STATUS_CONFIG[newStatus]?.bg || '#E8F5E9',
                type: `order_${newStatus.toLowerCase()}`,
              });
            }
            if (order.farmerId) {
              await createNotification({
                userId: order.farmerId,
                title: `Order ${newStatus}`,
                message: `Order #${
                  order.orderId || order.id?.slice(-4)
                } status changed to ${newStatus}.`,
                emoji: STATUS_CONFIG[newStatus]?.emoji || '📦',
                bgColor: STATUS_CONFIG[newStatus]?.bg || '#E8F5E9',
                type: `order_${newStatus.toLowerCase()}`,
              });
            }

            Alert.alert('✅ Success', `Order marked as ${newStatus}!`);
          } catch (e) {
            Alert.alert('❌ Error', e.message);
          }
        },
      },
    ]);
  };

  // ✅ Assign Delivery Boy to Order
  const handleAssignDeliveryBoy = order => {
    if (deliveryBoys.length === 0) {
      Alert.alert(
        '🚚 No Delivery Partners',
        'No delivery boys have registered yet.\n\nTo add delivery boys:\n1. They should register in the app with "Delivery" role\n2. They will appear here automatically',
      );
      return;
    }

    const buttons = deliveryBoys.map(db => ({
      text: `🚚 ${db.name || db.email || 'Partner'}`,
      onPress: async () => {
        try {
          await firestore()
            .collection('orders')
            .doc(order.id)
            .update({
              deliveryBoyId: db.id,
              deliveryBoyName: db.name || db.email || 'Delivery Partner',
              assignedAt: firestore.FieldValue.serverTimestamp(),
            });

          // Notify the delivery boy
          await createNotification({
            userId: db.id,
            title: '📦 New Delivery Assigned!',
            message: `Order #${
              order.orderId || order.id?.slice(-4)
            } assigned to you.\nPickup: ${
              order.farmerName || 'Farmer'
            }\nDeliver to: ${order.consumerName || 'Customer'}`,
            emoji: '🚚',
            bgColor: '#E3F2FD',
            type: 'delivery_assigned',
          });

          if (order.farmerId) {
            await createNotification({
              userId: order.farmerId,
              title: '🚚 Delivery Partner Assigned',
              message: `Delivery partner ${
                db.name || 'Partner'
              } assigned for order #${order.orderId || order.id?.slice(-4)}.`,
              emoji: '🚚',
              bgColor: '#E3F2FD',
              type: 'delivery_assigned',
            });
          }

          Alert.alert(
            '✅ Assigned!',
            `${db.name || 'Partner'} assigned to order #${
              order.orderId || order.id?.slice(-4)
            }`,
          );
        } catch (e) {
          Alert.alert('Error', e.message);
        }
      },
    }));

    buttons.push({text: 'Cancel', style: 'cancel'});

    Alert.alert(
      '🚚 Select Delivery Partner',
      `Order #${order.orderId || order.id?.slice(-4)}\nCustomer: ${
        order.consumerName || 'N/A'
      }\nAddress: ${order.deliveryAddress || 'N/A'}`,
      buttons,
    );
  };

  const renderOrder = ({item}) => {
    const cfg = STATUS_CONFIG[item.status] || {
      bg: '#F5F5F5',
      color: '#999',
      emoji: '📦',
    };
    const orderDate =
      item.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '';
    const displayStatus = item.status === 'Shipped' ? 'Purchased' : item.status;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>
              📦 #{item.orderId || item.id.slice(-4)}
            </Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: cfg.bg}]}>
            <Text style={[styles.statusTxt, {color: cfg.color}]}>
              {cfg.emoji} {displayStatus}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detail}>
            🧑‍🌾 Farmer: {item.farmerName || 'N/A'}
          </Text>
          <Text style={styles.detail}>
            🛒 Customer: {item.consumerName || 'N/A'}
          </Text>
          <Text style={styles.detail}>💰 Total: ₹{item.total}</Text>
          {item.deliveryAddress && (
            <View>
              <Text style={styles.detail}>
                📍 Address: {item.deliveryAddress}
              </Text>
              {item.deliveryPincode && (
                <Text style={[styles.detail, {color: COLORS.textSecondary}]}>
                  📌 PIN Code: {item.deliveryPincode}
                </Text>
              )}
              {item.consumerPhone && (
                <Text style={[styles.detail, {color: COLORS.textSecondary}]}>
                  📞 Phone: {item.consumerPhone}
                </Text>
              )}
            </View>
          )}
          {item.deliveryBoyName && (
            <Text
              style={[styles.detail, {color: '#1565C0', fontWeight: 'bold'}]}>
              🚚 Delivery: {item.deliveryBoyName}
            </Text>
          )}
        </View>

        {/* Items list */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsList}>
            {item.items.map((itm, idx) => (
              <Text key={idx} style={styles.itemText}>
                • {itm.nameTa || itm.name} x{itm.quantity} = ₹
                {itm.price * itm.quantity}
              </Text>
            ))}
          </View>
        )}

        {/* Action Buttons based on status */}
        <View style={styles.actionsRow}>
          {item.status === 'Pending' && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {backgroundColor: '#E8F5E9', borderColor: '#4CAF50'},
              ]}
              onPress={() =>
                updateStatus(
                  item,
                  'Confirmed',
                  `Confirm order #${item.orderId || item.id.slice(-4)}?`,
                )
              }>
              <Text style={[styles.actionBtnTxt, {color: '#2E7D32'}]}>
                ✅ Confirm
              </Text>
            </TouchableOpacity>
          )}

          {item.status === 'Confirmed' && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {backgroundColor: '#FFF3E0', borderColor: '#FF9800'},
              ]}
              onPress={() =>
                updateStatus(
                  item,
                  'Shipped',
                  `Mark order #${
                    item.orderId || item.id.slice(-4)
                  } as Purchased?`,
                )
              }>
              <Text style={[styles.actionBtnTxt, {color: '#E65100'}]}>
                📦 Purchased
              </Text>
            </TouchableOpacity>
          )}

          {item.status === 'Shipped' && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {backgroundColor: '#E8F5E9', borderColor: '#4CAF50'},
              ]}
              onPress={() =>
                updateStatus(
                  item,
                  'Delivered',
                  `Mark order #${
                    item.orderId || item.id.slice(-4)
                  } as Delivered?`,
                )
              }>
              <Text style={[styles.actionBtnTxt, {color: '#2E7D32'}]}>
                🎉 Deliver
              </Text>
            </TouchableOpacity>
          )}

          {/* ✅ Mark as Refunded button for Refund Requested orders */}
          {item.status === 'Refund Requested' && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {backgroundColor: '#F3E5F5', borderColor: '#7B1FA2'},
              ]}
              onPress={() =>
                updateStatus(
                  item,
                  'Refunded',
                  `Mark order #${
                    item.orderId || item.id.slice(-4)
                  } as Refunded?\n\nCustomer: ${item.consumerName}\nAmount: ₹${
                    item.total
                  }`,
                )
              }>
              <Text style={[styles.actionBtnTxt, {color: '#7B1FA2'}]}>
                💜 Mark Refunded
              </Text>
            </TouchableOpacity>
          )}

          {/* ✅ Assign Delivery Boy button - for Confirmed orders without delivery boy */}
          {(item.status === 'Confirmed' || item.status === 'Pending') &&
            !item.deliveryBoyId && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {backgroundColor: '#E3F2FD', borderColor: '#1565C0'},
                ]}
                onPress={() => handleAssignDeliveryBoy(item)}>
                <Text style={[styles.actionBtnTxt, {color: '#1565C0'}]}>
                  🚚 Assign Delivery
                </Text>
              </TouchableOpacity>
            )}

          {/* ✅ Track Live button - for active orders with assigned delivery boy */}
          {item.deliveryBoyId &&
            !['Delivered', 'Cancelled', 'Refunded'].includes(item.status) && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {backgroundColor: '#E8EAF6', borderColor: '#3F51B5'},
                ]}
                onPress={() => handleTrackLive(item)}>
                <Text style={[styles.actionBtnTxt, {color: '#3F51B5'}]}>
                  🗺️ Track Live
                </Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  const filters = [
    {key: 'all', label: `All (${orders.length})`},
    {key: 'Pending', label: 'Pending'},
    {key: 'Confirmed', label: 'Confirmed'},
    {key: 'Shipped', label: 'Purchased'},
    {key: 'Delivered', label: 'Delivered'},
    {key: 'refund', label: `💸 Refund (${refundCount})`},
    {key: 'Cancelled', label: 'Cancelled'},
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primaryGreen, '#1B8A4E']}
        style={styles.header}>
        <Text style={styles.headerTitle}>👑 Admin Dashboard</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primaryGreen}
          style={{marginTop: 50}}
        />
      ) : (
        <FlatList
          data={(() => {
            const listData = [{id: 'filters'}];
            if (filteredOrders.length === 0) {
              listData.push({id: 'empty'});
            } else {
              listData.push(...filteredOrders);
            }
            return listData;
          })()}
          keyExtractor={item => item.id}
          renderItem={({item}) => {
            if (item.id === 'filters') {
              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScrollView}
                  contentContainerStyle={styles.filterRow}>
                  {filters.map(f => (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.filterChip,
                        activeFilter === f.key && styles.filterChipActive,
                      ]}
                      onPress={() => setActiveFilter(f.key)}>
                      <Text
                        style={[
                          styles.filterTxt,
                          activeFilter === f.key && styles.filterTxtActive,
                        ]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              );
            }
            if (item.id === 'empty') {
              return <Text style={styles.emptyText}>No orders found</Text>;
            }
            return renderOrder({item});
          }}
          stickyHeaderIndices={[0]}
          contentContainerStyle={{padding: SPACING.md, paddingBottom: 100}}
          ListHeaderComponent={
            <View style={{paddingBottom: SPACING.md}}>
              {/* User Statistics */}
              <View
                style={[
                  styles.statsContainer,
                  {marginHorizontal: 0, marginTop: 8},
                ]}>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>👨‍🌾</Text>
                  <Text style={styles.statNum}>{userStats.farmers}</Text>
                  <Text style={styles.statLabel}>Farmers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🛒</Text>
                  <Text style={styles.statNum}>{userStats.consumers}</Text>
                  <Text style={styles.statLabel}>Customers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🚚</Text>
                  <Text style={styles.statNum}>{userStats.deliveryBoys}</Text>
                  <Text style={styles.statLabel}>Delivery</Text>
                </View>
              </View>

              {/* Feedbacks Banner */}
              <TouchableOpacity
                style={[styles.feedbackBanner, {marginHorizontal: 0}]}
                onPress={() => setFeedbackModalVisible(true)}>
                <View style={styles.feedbackBannerContent}>
                  <Text style={styles.feedbackBannerText}>
                    💬 User Feedbacks ({feedbacks.length})
                  </Text>
                  <Text style={styles.feedbackBannerSub}>
                    View suggestions, voice recordings, & screenshots
                  </Text>
                </View>
                <Text style={styles.feedbackBannerArrow}>›</Text>
              </TouchableOpacity>

              {/* Pre-Orders Banner */}
              <TouchableOpacity
                style={[
                  styles.feedbackBanner,
                  {
                    backgroundColor: '#E3F2FD',
                    borderLeftColor: '#1565C0',
                    marginTop: 8,
                    marginHorizontal: 0,
                  },
                ]}
                onPress={() => setPreOrdersModalVisible(true)}>
                <View style={styles.feedbackBannerContent}>
                  <Text style={[styles.feedbackBannerText, {color: '#1565C0'}]}>
                    📅 User Pre-Orders ({preOrders.length})
                  </Text>
                  <Text style={[styles.feedbackBannerSub, {color: '#1E88E5'}]}>
                    Track crop reservations and update status (Harvested /
                    Delivered)
                  </Text>
                </View>
                <Text style={[styles.feedbackBannerArrow, {color: '#1565C0'}]}>
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      {/* ✅ Live Tracking Map Modal */}
      <Modal
        visible={trackingModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseTracking}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <LinearGradient
            colors={['#1565C0', '#1976D2', '#2196F3']}
            style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCloseTracking}
              style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseTxt}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>🗺️ Live Tracking</Text>
            <View style={{width: 60}} />
          </LinearGradient>

          {/* Order Info Banner */}
          {selectedOrderForTracking && (
            <View style={styles.trackingInfoBanner}>
              <Text style={styles.trackingInfoTxt}>
                📦 #
                {selectedOrderForTracking.orderId ||
                  selectedOrderForTracking.id?.slice(-4)}{' '}
                • {selectedOrderForTracking.consumerName || 'Customer'}
              </Text>
              <Text style={styles.trackingInfoSub}>
                🚚{' '}
                {selectedOrderForTracking.deliveryBoyName || 'Delivery Partner'}
              </Text>
            </View>
          )}

          {/* Map */}
          {selectedOrderForTracking ? (
            (() => {
              const farmerLat = getLat(selectedOrderForTracking.farmerCoords);
              const farmerLng = getLng(selectedOrderForTracking.farmerCoords);
              const customerLat = getLat(
                selectedOrderForTracking.consumerCoords,
              );
              const customerLng = getLng(
                selectedOrderForTracking.consumerCoords,
              );
              const dbLat = deliveryBoyLiveLocation?.latitude;
              const dbLng = deliveryBoyLiveLocation?.longitude;

              // Calculate initial region to fit all markers
              const allLats = [farmerLat, customerLat, dbLat].filter(
                v => typeof v === 'number',
              );
              const allLngs = [farmerLng, customerLng, dbLng].filter(
                v => typeof v === 'number',
              );

              let initialRegion = {
                latitude: 11.0168,
                longitude: 76.9558,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
              };

              if (allLats.length > 0 && allLngs.length > 0) {
                const minLat = Math.min(...allLats);
                const maxLat = Math.max(...allLats);
                const minLng = Math.min(...allLngs);
                const maxLng = Math.max(...allLngs);
                initialRegion = {
                  latitude: (minLat + maxLat) / 2,
                  longitude: (minLng + maxLng) / 2,
                  latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
                  longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
                };
              }

              // Build polyline coordinates
              const polyCoords = [];
              if (
                typeof farmerLat === 'number' &&
                typeof farmerLng === 'number'
              ) {
                polyCoords.push({latitude: farmerLat, longitude: farmerLng});
              }
              if (typeof dbLat === 'number' && typeof dbLng === 'number') {
                polyCoords.push({latitude: dbLat, longitude: dbLng});
              }
              if (
                typeof customerLat === 'number' &&
                typeof customerLng === 'number'
              ) {
                polyCoords.push({
                  latitude: customerLat,
                  longitude: customerLng,
                });
              }

              return (
                <MapView
                  style={styles.map}
                  initialRegion={initialRegion}
                  showsUserLocation={false}
                  showsMyLocationButton={false}>
                  {/* Farmer Marker */}
                  {typeof farmerLat === 'number' &&
                    typeof farmerLng === 'number' && (
                      <Marker
                        coordinate={{latitude: farmerLat, longitude: farmerLng}}
                        title="🧑‍🌾 Farmer"
                        description={
                          selectedOrderForTracking.farmerName ||
                          'Farmer Location'
                        }
                        pinColor="#4CAF50"
                      />
                    )}

                  {/* Customer Marker */}
                  {typeof customerLat === 'number' &&
                    typeof customerLng === 'number' && (
                      <Marker
                        coordinate={{
                          latitude: customerLat,
                          longitude: customerLng,
                        }}
                        title="🏠 Customer"
                        description={
                          selectedOrderForTracking.consumerName ||
                          'Customer Location'
                        }
                        pinColor="#F44336"
                      />
                    )}

                  {/* Delivery Boy Live Marker */}
                  {typeof dbLat === 'number' && typeof dbLng === 'number' && (
                    <Marker
                      coordinate={{latitude: dbLat, longitude: dbLng}}
                      title="🚚 Delivery Partner"
                      description={
                        selectedOrderForTracking.deliveryBoyName ||
                        'Delivery Partner'
                      }
                      pinColor="#1565C0"
                    />
                  )}

                  {/* Polyline connecting all points */}
                  {polyCoords.length >= 2 && (
                    <Polyline
                      coordinates={polyCoords}
                      strokeColor="#1565C0"
                      strokeWidth={3}
                      lineDashPattern={[6, 3]}
                    />
                  )}
                </MapView>
              );
            })()
          ) : (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator size="large" color="#1565C0" />
              <Text style={{marginTop: 12, color: COLORS.textMuted}}>
                Loading map...
              </Text>
            </View>
          )}

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#4CAF50'}]} />
              <Text style={styles.legendTxt}>🧑‍🌾 Farmer</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#1565C0'}]} />
              <Text style={styles.legendTxt}>🚚 Delivery</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#F44336'}]} />
              <Text style={styles.legendTxt}>🏠 Customer</Text>
            </View>
          </View>

          {/* Live Status */}
          <View style={styles.liveStatusBar}>
            <View style={styles.liveDot} />
            <Text style={styles.liveStatusTxt}>
              {deliveryBoyLiveLocation
                ? 'Live tracking active'
                : 'Waiting for delivery partner location...'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ✅ User Feedbacks Viewer Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFeedbackModalVisible(false)}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <LinearGradient
            colors={[COLORS.primaryGreen, '#1B8A4E']}
            style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setFeedbackModalVisible(false)}
              style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseTxt}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>💬 User Feedbacks</Text>
            <View style={{width: 60}} />
          </LinearGradient>

          {/* Feedback List */}
          <FlatList
            data={feedbacks}
            keyExtractor={item => item.id}
            renderItem={({item}) => {
              const dateStr = item.createdAt?.toDate
                ? item.createdAt.toDate().toLocaleString()
                : new Date(item.createdAt || Date.now()).toLocaleString();

              const roleLabel =
                item.userType === 'farmer'
                  ? '👨‍🌾 Farmer'
                  : item.userType === 'delivery'
                  ? '🚚 Delivery'
                  : '🛒 Customer';

              return (
                <View style={styles.feedbackCard}>
                  <View style={styles.feedbackCardHeader}>
                    <View>
                      <Text style={styles.feedbackUser}>{item.userName}</Text>
                      <Text style={styles.feedbackRole}>{roleLabel}</Text>
                    </View>
                    <Text style={styles.feedbackDate}>{dateStr}</Text>
                  </View>

                  {item.userEmail || item.userPhone ? (
                    <View style={styles.contactRow}>
                      {item.userEmail ? (
                        <Text style={styles.contactText}>
                          📧 {item.userEmail}
                        </Text>
                      ) : null}
                      {item.userPhone ? (
                        <Text style={styles.contactText}>
                          📞 {item.userPhone}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={styles.feedbackBody}>
                    <Text style={styles.feedbackType}>
                      {item.type === 'voice'
                        ? '🎙️ Voice Feedback'
                        : '📝 Written Feedback'}
                    </Text>
                    {item.type === 'voice' ? (
                      <Text style={styles.voiceDuration}>
                        Captured duration:{' '}
                        {item.voiceDuration
                          ? `${Math.floor(item.voiceDuration / 60)}:${
                              item.voiceDuration % 60 < 10 ? '0' : ''
                            }${item.voiceDuration % 60}`
                          : 'N/A'}
                      </Text>
                    ) : (
                      <Text style={styles.feedbackContent}>{item.content}</Text>
                    )}
                  </View>

                  {item.attachmentUrl ? (
                    <View style={styles.attachmentBox}>
                      <Text style={styles.attachmentLabel}>
                        📎 Attached Screenshot:
                      </Text>
                      <Image
                        source={{uri: item.attachmentUrl}}
                        style={styles.feedbackImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}
                </View>
              );
            }}
            contentContainerStyle={{padding: SPACING.md, paddingBottom: 60}}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No user feedbacks found</Text>
            }
          />
        </View>
      </Modal>

      {/* Pre-Orders Modal */}
      <Modal
        visible={preOrdersModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPreOrdersModalVisible(false)}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1565C0', '#1E88E5']}
            style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setPreOrdersModalVisible(false)}
              style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseTxt}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📅 Pre-Orders List</Text>
            <View style={{width: 60}} />
          </LinearGradient>

          <FlatList
            data={preOrders}
            keyExtractor={(item, index) =>
              item.harvestId + '_' + item.userId + '_' + index
            }
            contentContainerStyle={{padding: 16}}
            renderItem={({item}) => (
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 12,
                  padding: 16,
                  marginVertical: 8,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                  <Text
                    style={{fontWeight: 'bold', fontSize: 16, color: '#333'}}>
                    {item.nameEn || item.name || 'Crop'}
                  </Text>
                  <View
                    style={{
                      backgroundColor:
                        item.status === 'completed'
                          ? '#E8F5E9'
                          : item.status === 'harvested'
                          ? '#FFF3E0'
                          : '#E3F2FD',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}>
                    <Text
                      style={{
                        color:
                          item.status === 'completed'
                            ? '#4CAF50'
                            : item.status === 'harvested'
                            ? '#FF9800'
                            : '#1565C0',
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}>
                      {item.status === 'completed'
                        ? 'Completed'
                        : item.status === 'harvested'
                        ? 'Harvested'
                        : 'Reserved'}
                    </Text>
                  </View>
                </View>

                <Text style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                  👤 Customer:{' '}
                  <Text style={{fontWeight: '600', color: '#333'}}>
                    {item.deliveryName || item.userName || 'User'}
                  </Text>
                </Text>
                {item.deliveryPhone && (
                  <Text
                    style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                    📞 Phone:{' '}
                    <Text style={{fontWeight: '600', color: '#333'}}>
                      {item.deliveryPhone}
                    </Text>
                  </Text>
                )}
                {item.deliveryAddress && (
                  <Text
                    style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                    📍 Address:{' '}
                    <Text style={{fontWeight: '600', color: '#333'}}>
                      {item.deliveryAddress}
                    </Text>
                  </Text>
                )}
                {item.deliveryPincode && (
                  <Text
                    style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                    📮 PIN Code:{' '}
                    <Text style={{fontWeight: '600', color: '#333'}}>
                      {item.deliveryPincode}
                    </Text>
                  </Text>
                )}
                {item.deliveryLocation && (
                  <Text
                    style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                    🌐 GPS:{' '}
                    <Text style={{fontWeight: '600', color: '#333'}}>
                      {item.deliveryLocation}
                    </Text>
                  </Text>
                )}
                {item.preOrderDate && (
                  <Text
                    style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                    📅 Pre-Ordered Date:{' '}
                    <Text style={{fontWeight: '600', color: '#333'}}>
                      {new Date(item.preOrderDate).toLocaleDateString()}
                    </Text>
                  </Text>
                )}
                <Text style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                  👨‍🌾 Farmer:{' '}
                  <Text style={{fontWeight: '600', color: '#333'}}>
                    {item.farmer || 'Farmer'}
                  </Text>
                </Text>
                <Text style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                  📦 Quantity:{' '}
                  <Text style={{fontWeight: '600', color: '#333'}}>
                    {item.quantity || item.qty} {item.unit || 'kg'}
                  </Text>
                </Text>
                <Text style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                  💵 Price:{' '}
                  <Text style={{fontWeight: '600', color: '#333'}}>
                    ₹{item.totalAmount || item.totalPrice}
                  </Text>
                </Text>
                <Text style={{color: '#666', fontSize: 14, marginVertical: 2}}>
                  📅 Harvest Date:{' '}
                  <Text style={{fontWeight: '600', color: '#333'}}>
                    {item.harvestDate || '-'}
                  </Text>
                </Text>

                {item.status === 'Cancelled' ||
                item.status === 'Refund Requested' ||
                item.status === 'Refunded' ? (
                  <View
                    style={{
                      marginTop: 12,
                      paddingVertical: 10,
                      backgroundColor: '#FFEBEE',
                      borderColor: '#FF5252',
                      borderWidth: 1,
                      borderRadius: 6,
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        color: '#FF5252',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}>
                      🚫 {item.status.toUpperCase()}
                    </Text>
                    {item.cancelReason && (
                      <Text
                        style={{
                          color: '#666',
                          fontSize: 12,
                          marginTop: 4,
                          paddingHorizontal: 12,
                          textAlign: 'center',
                        }}>
                        Reason: {item.cancelReason}
                      </Text>
                    )}
                    {item.refundReason && (
                      <Text
                        style={{
                          color: '#666',
                          fontSize: 12,
                          marginTop: 4,
                          paddingHorizontal: 12,
                          textAlign: 'center',
                        }}>
                        Reason: {item.refundReason}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={{flexDirection: 'row', gap: 8, marginTop: 12}}>
                    {/* Harvest Process: Active (pending/Reserved) or Completed (harvested/completed) */}
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
                          handleUpdatePreOrderStatus(item, 'harvested')
                        }>
                        <Text style={{color: '#FF9800', fontWeight: 'bold'}}>
                          🚜 Mark Harvest
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
                        <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>
                          🚜 Harvested ✓
                        </Text>
                      </View>
                    )}

                    {/* Deliver Process: Active (pending/harvested/Reserved) or Completed (completed) */}
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
                          handleUpdatePreOrderStatus(item, 'completed')
                        }>
                        <Text style={{color: '#FF9800', fontWeight: 'bold'}}>
                          ✅ Mark Deliver
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
                        <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>
                          ✅ Delivered ✓
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={{alignItems: 'center', paddingVertical: 80}}>
                <Text style={{fontSize: 50, marginBottom: 12}}>📅</Text>
                <Text style={{color: '#999', fontSize: 16}}>
                  No user pre-orders found
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: rs(50),
    paddingBottom: rs(20),
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: rs(FONTS.xxl),
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutTxt: {color: COLORS.white, fontWeight: 'bold'},

  // Filter
  filterScrollView: {
    flexGrow: 0,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: RADIUS.full,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  filterTxt: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textSecondary,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterTxtActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },

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

  detailSection: {marginBottom: SPACING.sm},
  detail: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    marginBottom: 3,
  },

  itemsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  itemText: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  // Action buttons
  actionsRow: {flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap'},
  actionBtn: {
    flex: 1,
    minWidth: rs(100),
    paddingVertical: rs(12),
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  actionBtnTxt: {fontSize: rs(FONTS.sm), fontWeight: 'bold'},

  emptyText: {textAlign: 'center', marginTop: 40, color: COLORS.textMuted},

  // User Stats Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {fontSize: 24, marginBottom: 4},
  statNum: {fontSize: FONTS.lg, fontWeight: 'bold', color: COLORS.primaryGreen},
  statLabel: {fontSize: FONTS.xs, color: COLORS.textSecondary},

  // ✅ Live Tracking Modal Styles
  modalContainer: {flex: 1, backgroundColor: COLORS.background},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: rs(50),
    paddingBottom: rs(16),
    paddingHorizontal: SPACING.lg,
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalCloseTxt: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: rs(FONTS.sm),
  },
  modalTitle: {fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white},
  trackingInfoBanner: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  trackingInfoTxt: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  trackingInfoSub: {
    fontSize: rs(FONTS.sm),
    color: '#1565C0',
    fontWeight: '600',
    marginTop: 2,
  },
  map: {flex: 1},
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EAF6',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 6},
  legendDot: {width: 12, height: 12, borderRadius: 6},
  legendTxt: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  liveStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: SPACING.sm,
    paddingBottom: rs(30),
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  liveStatusTxt: {fontSize: rs(FONTS.sm), color: '#2E7D32', fontWeight: '600'},

  // Feedback styles
  feedbackBanner: {
    backgroundColor: '#EDF4FF',
    borderColor: '#1976D2',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  feedbackBannerContent: {
    flex: 1,
  },
  feedbackBannerText: {
    fontSize: rs(15),
    fontWeight: 'bold',
    color: '#1565C0',
  },
  feedbackBannerSub: {
    fontSize: rs(12),
    color: '#424242',
    marginTop: 2,
  },
  feedbackBannerArrow: {
    fontSize: rs(24),
    color: '#1565C0',
    fontWeight: 'bold',
  },
  feedbackCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  feedbackUser: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  feedbackRole: {
    fontSize: rs(FONTS.xs),
    color: COLORS.primaryGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  feedbackDate: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textMuted,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.xs,
  },
  contactText: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textSecondary,
  },
  feedbackBody: {
    marginVertical: SPACING.xs,
  },
  feedbackType: {
    fontSize: rs(FONTS.sm),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  voiceDuration: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  feedbackContent: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    lineHeight: rs(20),
  },
  attachmentBox: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.md,
  },
  attachmentLabel: {
    fontSize: rs(FONTS.xs),
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  feedbackImage: {
    width: '100%',
    height: rs(200),
    borderRadius: RADIUS.md,
    backgroundColor: '#F5F5F5',
  },
});

export default AdminDashboard;
