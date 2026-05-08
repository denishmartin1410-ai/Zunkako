// ============================================================
// src/screens/admin/AdminDashboard.js
// ✅ Full admin dashboard with all order management
// ✅ Mark as Delivered
// ✅ Mark as Refunded
// ✅ View Refund Requests
// ✅ Assign Delivery Boy
// ============================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { createNotification } from '../../services/firebase';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const STATUS_CONFIG = {
  Pending:            { bg: '#E3F2FD', color: '#1565C0', emoji: '⏳' },
  Confirmed:          { bg: '#E8F5E9', color: '#2E7D32', emoji: '✅' },
  Shipped:            { bg: '#FFF3E0', color: '#E65100', emoji: '🚚' },
  Delivered:          { bg: '#E8F5E9', color: '#2E7D32', emoji: '🎉' },
  Cancelled:          { bg: '#FFEBEE', color: '#C62828', emoji: '❌' },
  'Refund Requested': { bg: '#FFF3E0', color: '#FF5722', emoji: '💸' },
  Refunded:           { bg: '#F3E5F5', color: '#7B1FA2', emoji: '💜' },
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userStats, setUserStats] = useState({ farmers: 0, consumers: 0, deliveryBoys: 0 });

  // Fetch total user counts
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const usersSnap = await firestore().collection('users').get();
        let f = 0, c = 0;
        usersSnap.docs.forEach(doc => {
          if (doc.data().userType === 'farmer') f++;
          else if (doc.data().userType === 'consumer') c++;
        });
        const dbSnap = await firestore().collection('deliveryBoys').get();
        setUserStats({ farmers: f, consumers: c, deliveryBoys: dbSnap.size });
      } catch (err) {
        console.log('Stats error:', err);
      }
    };
    fetchUserStats();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
      .onSnapshot(snap => {
        if (snap) {
          const list = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const tA = a.createdAt?.toMillis?.() || 0;
              const tB = b.createdAt?.toMillis?.() || 0;
              return tB - tA;
            });
          setOrders(list);
        }
        setLoading(false);
      }, error => {
        console.error("Admin order fetch error:", error);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  // Fetch available delivery boys
  useEffect(() => {
    const unsub = firestore()
      .collection('deliveryBoys')
      .onSnapshot(snap => {
        if (snap) {
          setDeliveryBoys(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }, err => console.log('Delivery boys fetch error:', err.message));
    return unsub;
  }, []);

  const filteredOrders = activeFilter === 'all'
    ? orders
    : activeFilter === 'refund'
    ? orders.filter(o => o.status === 'Refund Requested')
    : orders.filter(o => o.status === activeFilter);

  const refundCount = orders.filter(o => o.status === 'Refund Requested').length;

  const updateStatus = async (order, newStatus, confirmMsg) => {
    Alert.alert(
      "Confirm",
      confirmMsg,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await firestore().collection('orders').doc(order.id).update({
                status: newStatus,
                updatedAt: firestore.FieldValue.serverTimestamp(),
                [`${newStatus.toLowerCase().replace(' ', '')}At`]: firestore.FieldValue.serverTimestamp(),
              });

              // Send notifications to both parties
              if (order.consumerId) {
                await createNotification({
                  userId: order.consumerId,
                  title: `Order ${newStatus}`,
                  message: `Your order #${order.orderId || order.id?.slice(-4)} has been ${newStatus.toLowerCase()}.`,
                  emoji: STATUS_CONFIG[newStatus]?.emoji || '📦',
                  bgColor: STATUS_CONFIG[newStatus]?.bg || '#E8F5E9',
                  type: `order_${newStatus.toLowerCase()}`,
                });
              }
              if (order.farmerId) {
                await createNotification({
                  userId: order.farmerId,
                  title: `Order ${newStatus}`,
                  message: `Order #${order.orderId || order.id?.slice(-4)} status changed to ${newStatus}.`,
                  emoji: STATUS_CONFIG[newStatus]?.emoji || '📦',
                  bgColor: STATUS_CONFIG[newStatus]?.bg || '#E8F5E9',
                  type: `order_${newStatus.toLowerCase()}`,
                });
              }

              Alert.alert("✅ Success", `Order marked as ${newStatus}!`);
            } catch (e) {
              Alert.alert("❌ Error", e.message);
            }
          }
        }
      ]
    );
  };

  // ✅ Assign Delivery Boy to Order
  const handleAssignDeliveryBoy = (order) => {
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
          await firestore().collection('orders').doc(order.id).update({
            deliveryBoyId: db.id,
            deliveryBoyName: db.name || db.email || 'Delivery Partner',
            assignedAt: firestore.FieldValue.serverTimestamp(),
          });

          // Notify the delivery boy
          await createNotification({
            userId: db.id,
            title: '📦 New Delivery Assigned!',
            message: `Order #${order.orderId || order.id?.slice(-4)} assigned to you.\nPickup: ${order.farmerName || 'Farmer'}\nDeliver to: ${order.consumerName || 'Customer'}`,
            emoji: '🚚',
            bgColor: '#E3F2FD',
            type: 'delivery_assigned',
          });

          if (order.farmerId) {
            await createNotification({
              userId: order.farmerId,
              title: '🚚 Delivery Partner Assigned',
              message: `Delivery partner ${db.name || 'Partner'} assigned for order #${order.orderId || order.id?.slice(-4)}.`,
              emoji: '🚚',
              bgColor: '#E3F2FD',
              type: 'delivery_assigned',
            });
          }

          Alert.alert('✅ Assigned!', `${db.name || 'Partner'} assigned to order #${order.orderId || order.id?.slice(-4)}`);
        } catch (e) {
          Alert.alert('Error', e.message);
        }
      },
    }));

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      '🚚 Select Delivery Partner',
      `Order #${order.orderId || order.id?.slice(-4)}\nCustomer: ${order.consumerName || 'N/A'}\nAddress: ${order.deliveryAddress || 'N/A'}`,
      buttons,
    );
  };

  const renderOrder = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || { bg: '#F5F5F5', color: '#999', emoji: '📦' };
    const orderDate = item.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>📦 #{item.orderId || item.id.slice(-4)}</Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusTxt, { color: cfg.color }]}>
              {cfg.emoji} {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detail}>🧑‍🌾 Farmer: {item.farmerName || 'N/A'}</Text>
          <Text style={styles.detail}>🛒 Customer: {item.consumerName || 'N/A'}</Text>
          <Text style={styles.detail}>💰 Total: ₹{item.total}</Text>
          {item.deliveryAddress && (
            <Text style={styles.detail}>📍 Address: {item.deliveryAddress}</Text>
          )}
          {item.deliveryBoyName && (
            <Text style={[styles.detail, { color: '#1565C0', fontWeight: 'bold' }]}>🚚 Delivery: {item.deliveryBoyName}</Text>
          )}
        </View>

        {/* Items list */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsList}>
            {item.items.map((itm, idx) => (
              <Text key={idx} style={styles.itemText}>
                • {itm.nameTa || itm.name} x{itm.quantity} = ₹{itm.price * itm.quantity}
              </Text>
            ))}
          </View>
        )}

        {/* Action Buttons based on status */}
        <View style={styles.actionsRow}>
          {item.status === 'Pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}
              onPress={() => updateStatus(item, 'Confirmed', `Confirm order #${item.orderId || item.id.slice(-4)}?`)}>
              <Text style={[styles.actionBtnTxt, { color: '#2E7D32' }]}>✅ Confirm</Text>
            </TouchableOpacity>
          )}

          {item.status === 'Confirmed' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}
              onPress={() => updateStatus(item, 'Shipped', `Mark order #${item.orderId || item.id.slice(-4)} as Shipped?`)}>
              <Text style={[styles.actionBtnTxt, { color: '#E65100' }]}>🚚 Ship</Text>
            </TouchableOpacity>
          )}

          {item.status === 'Shipped' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}
              onPress={() => updateStatus(item, 'Delivered', `Mark order #${item.orderId || item.id.slice(-4)} as Delivered?`)}>
              <Text style={[styles.actionBtnTxt, { color: '#2E7D32' }]}>🎉 Deliver</Text>
            </TouchableOpacity>
          )}

          {/* ✅ Mark as Refunded button for Refund Requested orders */}
          {item.status === 'Refund Requested' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#F3E5F5', borderColor: '#7B1FA2' }]}
              onPress={() => updateStatus(item, 'Refunded', `Mark order #${item.orderId || item.id.slice(-4)} as Refunded?\n\nCustomer: ${item.consumerName}\nAmount: ₹${item.total}`)}>
              <Text style={[styles.actionBtnTxt, { color: '#7B1FA2' }]}>💜 Mark Refunded</Text>
            </TouchableOpacity>
          )}

          {/* ✅ Assign Delivery Boy button - for Confirmed orders without delivery boy */}
          {(item.status === 'Confirmed' || item.status === 'Pending') && !item.deliveryBoyId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#E3F2FD', borderColor: '#1565C0' }]}
              onPress={() => handleAssignDeliveryBoy(item)}>
              <Text style={[styles.actionBtnTxt, { color: '#1565C0' }]}>🚚 Assign Delivery</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const filters = [
    { key: 'all', label: `All (${orders.length})` },
    { key: 'Pending', label: 'Pending' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'refund', label: `💸 Refund (${refundCount})` },
    { key: 'Delivered', label: 'Delivered' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primaryGreen, '#1B8A4E']} style={styles.header}>
        <Text style={styles.headerTitle}>👑 Admin Dashboard</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* User Statistics */}
      <View style={styles.statsContainer}>
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

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}>
            <Text style={[styles.filterTxt, activeFilter === f.key && styles.filterTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryGreen} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders found</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: rs(50), paddingBottom: rs(20), paddingHorizontal: SPACING.lg,
  },
  headerTitle: { color: COLORS.white, fontSize: rs(FONTS.xxl), fontWeight: 'bold' },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
  },
  logoutTxt: { color: COLORS.white, fontWeight: 'bold' },

  // Filter
  filterRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, gap: SPACING.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterChip: {
    paddingHorizontal: rs(12), paddingVertical: rs(6),
    borderRadius: RADIUS.full, backgroundColor: '#F5F5F5',
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen,
  },
  filterTxt: { fontSize: rs(FONTS.xs), color: COLORS.textSecondary, fontWeight: '600' },
  filterTxtActive: { color: COLORS.white, fontWeight: 'bold' },

  // Card
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: SPACING.md,
  },
  orderId: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.textPrimary },
  orderDate: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  statusTxt: { fontSize: rs(FONTS.xs), fontWeight: 'bold' },

  detailSection: { marginBottom: SPACING.sm },
  detail: { fontSize: rs(FONTS.sm), color: COLORS.textSecondary, marginBottom: 3 },

  itemsList: {
    backgroundColor: '#F8F9FA', borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
  },
  itemText: { fontSize: rs(FONTS.xs), color: COLORS.textSecondary, marginBottom: 2 },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1, minWidth: rs(100),
    paddingVertical: rs(12), borderRadius: RADIUS.md,
    alignItems: 'center', borderWidth: 1.5,
  },
  actionBtnTxt: { fontSize: rs(FONTS.sm), fontWeight: 'bold' },

  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted },
  
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
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statNum: { fontSize: FONTS.lg, fontWeight: 'bold', color: COLORS.primaryGreen },
  statLabel: { fontSize: FONTS.xs, color: COLORS.textSecondary },
});

export default AdminDashboard;
