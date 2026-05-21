// src/screens/consumer/ConsumerScreens.js
// ✅ Orders header FIXED
// ✅ Full i18n on all screens

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { CATEGORIES } from '../../utils/dummyData';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getConsumerOrders, getConsumerPreOrders, getAllProducts, getAllFarmers } from '../../services/firebase';
import BackButton from '../../utils/BackButton';
import { parseLocalDate, formatToUiDate } from '../../utils/dateHelper';
import { getLocalProductName } from '../../utils/translationHelper';

const { width } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const AvatarView = ({ uri, name, size = 60, style }) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'U').charAt(0).toUpperCase();
  const bgColors = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'];
  const bg = bgColors[letter.charCodeAt(0) % bgColors.length];
  if (!uri || err) {
    return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}><Text style={{ color: COLORS.white, fontSize: size * 0.4, fontWeight: 'bold' }}>{letter}</Text></View>;
  }
  return <FastImage source={{ uri, priority: FastImage.priority.normal }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} resizeMode={FastImage.resizeMode.cover} onError={() => setErr(true)} />;
};

// ── ORDERS SCREEN ──
export const OrdersScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('normal'); // 'normal' or 'pre'
  const [orders, setOrders] = useState([]);
  const [preOrders, setPreOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const uid = user?.id || user?.uid;
      if (!uid) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        if (activeTab === 'normal') {
          const r = await getConsumerOrders(uid);
          setOrders(Array.isArray(r?.data) ? r.data : []);
        } else {
          const r = await getConsumerPreOrders(uid);
          setPreOrders(Array.isArray(r?.data) ? r.data : []);
        }
      } catch (e) {
        if (activeTab === 'normal') setOrders([]);
        else setPreOrders([]);
      }
      setIsLoading(false);
    };
    load();
  }, [user, activeTab]);

  const STATUS_COLOR = { Pending: '#FF9800', Confirmed: '#2196F3', Shipped: '#9C27B0', Delivered: '#4CAF50', Cancelled: '#F44336', 'Refund Requested': '#FF5722', 'Refunded': '#7B1FA2' };

  return (
    <View style={S.container}>
      {/* ✅ FIXED: header not blank */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={S.headerTitle}>
          📦 {t('nav.orders', { defaultValue: 'Orders' })}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Segmented Tab Bar */}
      <View style={S.tabBar}>
        <TouchableOpacity
          style={[S.tabBtn, activeTab === 'normal' && S.tabBtnActive]}
          onPress={() => setActiveTab('normal')}
        >
          <Text style={[S.tabTxt, activeTab === 'normal' && S.tabTxtActive]}>
            🛍️ {t('orders.normalOrdersTab', { defaultValue: 'சாதாரண ஆர்டர்' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.tabBtn, activeTab === 'pre' && S.tabBtnActive]}
          onPress={() => setActiveTab('pre')}
        >
          <Text style={[S.tabTxt, activeTab === 'pre' && S.tabTxtActive]}>
            📅 {t('orders.preOrdersTab', { defaultValue: 'முன் ஆர்டர்கள்' })}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'normal' ? (
            orders.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyEmoji}>📦</Text>
                <Text style={S.emptyText}>{t('orders.noOrders', { defaultValue: 'இன்னும் ஆர்டர் செய்யவில்லை' })}</Text>
              </View>
            ) : orders.map(order => (
              <TouchableOpacity key={order.id} style={S.orderCard} onPress={() => navigation.navigate('OrderDetail', { order })}>
                <View style={S.orderTop}>
                  <Text style={S.orderId}>#{order.orderId || order.id?.slice(-4)}</Text>
                  <View style={[S.statusBadge, { backgroundColor: (STATUS_COLOR[order.status] || '#999') + '22' }]}>
                    <Text style={[S.statusText, { color: STATUS_COLOR[order.status] || '#999' }]}>{order.status}</Text>
                  </View>
                </View>
                <Text style={S.orderDate}>📅 {order.createdAt?.toDate?.()?.toLocaleDateString('ta-IN') || ''}</Text>
                <Text style={S.orderItems} numberOfLines={1}>{(order.items || []).map(i => i.nameTa || i.name).join(', ')}</Text>
                <View style={S.orderBottom}>
                  <Text style={S.orderTotal}>{t('orders.total', { defaultValue: 'மொத்தம்' })}: ₹{order.total}</Text>
                  <Text style={S.orderArrow}>{t('orders.details', { defaultValue: 'விவரங்கள்' })} →</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            preOrders.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyEmoji}>📅</Text>
                <Text style={S.emptyText}>{t('preOrder.noPreOrders', { defaultValue: 'முன் ஆர்டர்கள் எதுவும் இல்லை' })}</Text>
              </View>
            ) : preOrders.map(order => {
              const localName = getLocalProductName(order.nameEn, order.name, i18n.language);
              const harvestDate = parseLocalDate(order.harvestDate);
              const today = new Date();
              today.setHours(0,0,0,0);
              const diffDays = Math.ceil((harvestDate - today) / (1000 * 60 * 60 * 24));
              const fillPercent = (order.totalPreOrders / order.targetPreOrders) * 100;
              const formattedDate = order.createdAt?.toDate?.()?.toLocaleDateString('ta-IN') || '';

              return (
                <View key={order.harvestId} style={S.orderCard}>
                  <View style={S.orderTop}>
                    <Text style={S.orderId}>#{order.harvestId?.slice(-4)}</Text>
                    <View style={[S.statusBadge, { backgroundColor: COLORS.primaryGreen + '22' }]}>
                      <Text style={[S.statusText, { color: COLORS.primaryGreen }]}>
                        {t('harvestCalendar.preOrderBtn', { defaultValue: 'முன் Order' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={S.orderDate}>📅 {t('orders.preOrderedOn', { defaultValue: 'ஆர்டர் செய்த தேதி' })}: {formattedDate}</Text>
                  <Text style={[S.orderId, { fontSize: rs(FONTS.md), marginVertical: 4 }]}>{localName}</Text>
                  <Text style={S.orderItems}>👨‍🌾 {order.farmer} | 📦 {order.qty} {order.unit}</Text>

                  {/* Harvest Countdown */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                    <Text style={{ fontSize: rs(FONTS.xs), fontWeight: 'bold', color: COLORS.accentGold }}>
                      ⏳ {diffDays === 0
                            ? t('preOrder.harvestingToday', { defaultValue: 'அறுவடை இன்று!' })
                            : diffDays === 1
                              ? t('preOrder.harvestingTomorrow', { defaultValue: 'அறுவடை நாளை!' })
                              : t('preOrder.inDays', { defaultValue: '{{count}} நாட்களில்', count: diffDays })}
                    </Text>
                    <Text style={{ fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginLeft: 8 }}>
                      ({t('product.harvest', { defaultValue: 'அறுவடை' })}: {order.harvestDate})
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={{ marginTop: 8, marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: rs(FONTS.xs), color: COLORS.textSecondary }}>
                        {t('preOrder.peoplePreOrdered', { defaultValue: '{{count}} பேர் முன்கூட்டியே order பண்ணியுள்ளனர்', count: order.totalPreOrders })}
                      </Text>
                      <Text style={{ fontSize: rs(FONTS.xs), fontWeight: 'bold', color: COLORS.primaryGreen }}>{Math.round(fillPercent)}%</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: '#E0E0E0', borderRadius: RADIUS.full, overflow: 'hidden' }}>
                      <LinearGradient colors={COLORS.gradientButton} style={{ height: '100%', borderRadius: RADIUS.full, width: `${Math.min(fillPercent, 100)}%` }} start={{x: 0, y: 0}} end={{x: 1, y: 0}} />
                    </View>
                  </View>

                  <View style={[S.orderBottom, { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.md }]}>
                    <Text style={S.orderTotal}>{t('orders.total', { defaultValue: 'மொத்தம்' })}: ₹{order.totalPrice}</Text>
                    <View style={[S.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={[S.statusText, { color: COLORS.primaryGreen }]}>
                        {t('harvestCalendar.infoGuarantee', { defaultValue: 'Guaranteed Fresh' })}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ── CONSUMER PROFILE ──
export const ConsumerProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const uid = user?.id || user?.uid;
    if (!uid) return;
    getConsumerOrders(uid).then(r => {
      if (r?.success && Array.isArray(r.data)) setOrderCount(r.data.length);
    }).catch(() => { });
  }, [user]);

  return (
    <View style={S.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E', '#1565C0']} style={S.profileHeader}>
        <AvatarView uri={user?.avatar} name={user?.name} size={rs(80)} style={{ borderWidth: 3, borderColor: COLORS.white, marginBottom: 10 }} />
        <Text style={S.profileName}>{user?.name || 'F2C User'}</Text>
        <Text style={S.profileEmail}>{user?.email || ''}</Text>
        <View style={S.statsRow}>
          {[
            { num: totalItems || 0, lbl: t('nav.cart', { defaultValue: 'கார்ட்' }) },
            { num: wishlistCount || 0, lbl: t('profile.wishlistShort', { defaultValue: 'விருப்பம்' }) },
            { num: orderCount, lbl: t('nav.orders', { defaultValue: 'ஆர்டர்கள்' }) },
          ].map((s, i) => (
            <View key={i} style={S.statItem}>
              <Text style={S.statNum}>{s.num}</Text>
              <Text style={S.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }} showsVerticalScrollIndicator={false}>
        <View style={S.menuCard}>
          {[
            { icon: '❤️', label: t('profile.wishlist', { defaultValue: 'என் விருப்ப பட்டியல்' }), screen: 'Wishlist' },
            { icon: '📦', label: t('profile.myOrders', { defaultValue: 'என் ஆர்டர்கள்' }), screen: 'Orders' },
            { icon: '📷', label: t('profile.qrScan', { defaultValue: 'QR ஸ்கேன்' }), screen: 'QRScan' },
            { icon: '⚙️', label: t('profile.settings', { defaultValue: 'அமைப்புகள்' }), screen: 'Settings' },
          ].map((item, idx, arr) => (
            <TouchableOpacity key={idx} style={[S.menuItem, idx < arr.length - 1 && S.menuBorder]} onPress={() => navigation.navigate(item.screen)}>
              <Text style={S.menuIcon}>{item.icon}</Text>
              <Text style={S.menuLabel}>{item.label}</Text>
              <Text style={S.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={S.logoutBtn} onPress={() => Alert.alert(
          t('settings.logout', { defaultValue: 'வெளியேறு' }), '',
          [{ text: t('common.cancel', { defaultValue: 'இல்லை' }), style: 'cancel' }, { text: t('profile.logoutYes', { defaultValue: 'ஆமா' }), onPress: logout, style: 'destructive' }]
        )}>
          <Text style={S.logoutText}>🚪 {t('settings.logout', { defaultValue: 'வெளியேறு' })}</Text>
        </TouchableOpacity>
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

// ── FARMER PROFILE (consumer view) ──
export const FarmerProfileScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { farmer: routeFarmer } = route.params || {};
  const [farmer, setFarmer] = useState(routeFarmer);
  const [farmerProducts, setFarmerProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!routeFarmer?.id) return;
    (async () => {
      try {
        const { getFarmerProducts } = require('../../services/firebase');
        const r = await getFarmerProducts(routeFarmer.id);
        setFarmerProducts(Array.isArray(r?.data) ? r.data : []);
      } catch (e) { setFarmerProducts([]); }

      // ✅ Fetch live farmer data to get updated rating
      try {
        const firestore = require('@react-native-firebase/firestore').default;
        const farmerDoc = await firestore().collection('farmers').doc(routeFarmer.id).get();
        if (farmerDoc.exists) {
          setFarmer(prev => ({ ...prev, ...farmerDoc.data(), id: routeFarmer.id }));
        } else {
          // Try users collection
          const userDoc = await firestore().collection('users').doc(routeFarmer.id).get();
          if (userDoc.exists) {
            setFarmer(prev => ({ ...prev, ...userDoc.data(), id: routeFarmer.id }));
          }
        }
      } catch (e) { console.log('Farmer fetch error:', e.message); }
    })();
  }, [routeFarmer]);

  if (!farmer) return <View style={[S.container, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: COLORS.textMuted }}>{t('farmer.notFound', { defaultValue: 'விவசாயி தகவல் இல்லை' })}</Text></View>;

  return (
    <View style={S.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E', '#1565C0']} style={S.farmerProfileHdr}>
        <TouchableOpacity style={{ position: 'absolute', top: rs(50), left: SPACING.xl }} onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.white, fontSize: rs(22), fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <AvatarView uri={farmer.avatar || farmer.photoURL} name={farmer.name || farmer.nameTa} size={rs(80)} style={{ borderWidth: 3, borderColor: COLORS.white, marginBottom: 10 }} />
        <Text style={S.farmerName}>{farmer.nameTa || farmer.name}</Text>
        {farmer.isVerified && <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: rs(FONTS.xs) }}>✅ {t('farmer.verified', { defaultValue: 'சரிபார்க்கப்பட்ட விவசாயி' })}</Text>}
        <Text style={S.farmerLoc}>📍 {farmer.locationTa || farmer.location || ''}</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }} showsVerticalScrollIndicator={false}>
        {[{ label: `⭐ ${t('farmer.rating', { defaultValue: 'மதிப்பீடு' })}`, val: `${farmer.rating || '0'} / 5.0` }, { label: `🏡 ${t('farmer.farm', { defaultValue: 'பண்ணை' })}`, val: farmer.farmName || '-' }, { label: `📍 ${t('farmer.location', { defaultValue: 'இடம்' })}`, val: farmer.location || '-' }].map((s, i) => (
          <View key={i} style={S.farmerStatRow}>
            <Text style={S.farmerStatLabel}>{s.label}</Text>
            <Text style={S.farmerStatVal}>{s.val}</Text>
          </View>
        ))}
        <Text style={{ fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary, marginVertical: SPACING.md }}>🥬 {t('farmer.products', { defaultValue: 'தயாரிப்புகள்' })}</Text>
        {farmerProducts.length === 0 ? (
          <View style={S.emptyBox}><Text style={S.emptyEmoji}>🌱</Text><Text style={S.emptyText}>{t('farmer.noProducts', { defaultValue: 'இன்னும் தயாரிப்புகள் இல்லை' })}</Text></View>
        ) : farmerProducts.map(p => (
          <TouchableOpacity key={p.id} style={S.farmerProductCard} onPress={() => navigation.navigate('ProductDetail', { product: p })}>
            <FastImage source={{ uri: p.image }} style={S.farmerProductImg} resizeMode={FastImage.resizeMode.cover} />
            <View style={{ flex: 1, marginLeft: SPACING.md }}><Text style={S.farmerProductName}>{p.nameTa || p.name}</Text><Text style={S.farmerProductPrice}>₹{p.price}/{p.unit}</Text></View>
            <TouchableOpacity style={S.addCartBtn} onPress={() => addToCart(p)}><Text style={{ color: COLORS.white, fontWeight: 'bold' }}>+</Text></TouchableOpacity>
          </TouchableOpacity>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

// ── ALL PRODUCTS ──
export const AllProductsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    (async () => {
      try { const r = await getAllProducts(); const d = Array.isArray(r?.data) ? r.data : []; setProducts(d); setFiltered(d); }
      catch (e) { setProducts([]); setFiltered([]); }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    setFiltered(selectedCat === 'all' ? products : products.filter(p => p.category === selectedCat));
  }, [selectedCat, products]);

  return (
    <View style={S.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={S.headerTitle}>🌿 {t('home.allProducts', { defaultValue: 'அனைத்து தயாரிப்புகள்' })}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.catScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[S.catChip, selectedCat === cat.id && S.catChipActive]} onPress={() => setSelectedCat(cat.id)}>
            <Text style={{ fontSize: rs(14) }}>{cat.icon}</Text>
            <Text style={[S.catText, selectedCat === cat.id && S.catTextActive]}>{cat.nameTa}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {isLoading ? <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginTop: 40 }} /> :
        filtered.length === 0 ? <View style={S.emptyBox}><Text style={S.emptyEmoji}>🌱</Text><Text style={S.emptyText}>{t('home.noProducts', { defaultValue: 'இன்னும் தயாரிப்புகள் இல்லை' })}</Text></View> :
          <FlatList data={filtered} keyExtractor={i => i.id} numColumns={2} contentContainerStyle={{ padding: SPACING.md }} columnWrapperStyle={{ gap: SPACING.md }}
            renderItem={({ item }) => (
              <TouchableOpacity style={S.gridCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                <FastImage source={{ uri: item.image }} style={S.gridImg} resizeMode={FastImage.resizeMode.cover} />
                <View style={S.gridInfo}>
                  <Text style={S.gridName} numberOfLines={2}>{item.nameTa || item.name}</Text>
                  <Text style={S.gridPrice}>₹{item.price}/{item.unit}</Text>
                  <TouchableOpacity style={S.gridAddBtn} onPress={() => addToCart(item)}><Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: rs(12) }}>+ {t('cart.addToCart', { defaultValue: 'கார்ட்' })}</Text></TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
      }
    </View>
  );
};

// ── ALL FARMERS ──
export const AllFarmersScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await getAllFarmers(); setFarmers(Array.isArray(r?.data) ? r.data : []); }
      catch (e) { setFarmers([]); }
      setIsLoading(false);
    })();
  }, []);

  return (
    <View style={S.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={S.headerTitle}>👨‍🌾 {t('home.topFarmers', { defaultValue: 'அனைத்து விவசாயிகள்' })}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      {isLoading ? <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginTop: 40 }} /> :
        farmers.length === 0 ? <View style={S.emptyBox}><Text style={S.emptyEmoji}>👨‍🌾</Text></View> :
          <FlatList data={farmers} keyExtractor={i => i.id} contentContainerStyle={{ padding: SPACING.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity style={S.farmerListCard} onPress={() => navigation.navigate('FarmerProfile', { farmer: item })}>
                <AvatarView uri={item.avatar || item.photoURL} name={item.name || item.nameTa} size={rs(56)} style={{ marginRight: SPACING.md }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={S.farmerListName}>{item.nameTa || item.name}</Text>
                    {item.isVerified && <Text style={{ fontSize: rs(12), marginLeft: 4 }}>✅</Text>}
                  </View>
                  <Text style={S.farmerListLoc}>📍 {item.location || ''}</Text>
                  <Text style={S.farmerListRating}>⭐ {item.rating || '0'}</Text>
                </View>
                <Text style={{ fontSize: rs(22), color: COLORS.textMuted }}>›</Text>
              </TouchableOpacity>
            )}
          />
      }
    </View>
  );
};

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: rs(50), paddingBottom: rs(16), paddingHorizontal: SPACING.xl },
  headerTitle: { fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white, textAlign: 'center', flex: 1 },
  headerRow: { paddingTop: rs(50), paddingBottom: rs(16), paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backTxt: { color: COLORS.white, fontSize: rs(22), fontWeight: 'bold', width: 40 },
  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: rs(FONTS.xs), fontWeight: 'bold' },
  orderDate: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginBottom: 4 },
  orderItems: { fontSize: rs(FONTS.sm), color: COLORS.textSecondary, marginBottom: SPACING.sm },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.primaryGreen },
  orderArrow: { fontSize: rs(FONTS.sm), color: COLORS.primaryBlue },
  profileHeader: { paddingTop: rs(50), paddingBottom: rs(30), alignItems: 'center' },
  profileName: { fontSize: rs(FONTS.xxl), fontWeight: 'bold', color: COLORS.white },
  profileEmail: { fontSize: rs(FONTS.sm), color: 'rgba(255,255,255,0.75)', marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', gap: SPACING.xl },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white },
  statLbl: { fontSize: rs(FONTS.xs), color: 'rgba(255,255,255,0.8)' },
  menuCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, marginBottom: SPACING.lg, ...SHADOWS.small, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: rs(16), paddingHorizontal: SPACING.lg },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuIcon: { fontSize: rs(22), marginRight: SPACING.md },
  menuLabel: { flex: 1, fontSize: rs(FONTS.md), color: COLORS.textPrimary },
  menuArrow: { fontSize: rs(22), color: COLORS.textMuted },
  logoutBtn: { backgroundColor: '#FFEBEE', borderRadius: RADIUS.xl, paddingVertical: rs(16), alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.accentRed },
  logoutText: { color: COLORS.accentRed, fontSize: rs(FONTS.md), fontWeight: 'bold' },
  farmerProfileHdr: { paddingTop: rs(80), paddingBottom: rs(30), alignItems: 'center' },
  farmerName: { fontSize: rs(FONTS.xxl), fontWeight: 'bold', color: COLORS.white },
  farmerLoc: { fontSize: rs(FONTS.sm), color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  farmerStatRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.small },
  farmerStatLabel: { fontSize: rs(FONTS.sm), color: COLORS.textMuted },
  farmerStatVal: { fontSize: rs(FONTS.sm), fontWeight: 'bold', color: COLORS.textPrimary },
  farmerProductCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.small },
  farmerProductImg: { width: rs(60), height: rs(60), borderRadius: RADIUS.md },
  farmerProductName: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary },
  farmerProductPrice: { fontSize: rs(FONTS.sm), color: COLORS.primaryGreen, marginTop: 2 },
  addCartBtn: { backgroundColor: COLORS.primaryGreen, borderRadius: RADIUS.round, width: rs(32), height: rs(32), alignItems: 'center', justifyContent: 'center' },
  catScroll: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, maxHeight: rs(56) },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, marginRight: SPACING.sm, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen },
  catText: { fontSize: rs(FONTS.xs), color: COLORS.textSecondary, marginLeft: 4 },
  catTextActive: { color: COLORS.white, fontWeight: 'bold' },
  gridCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.small, marginBottom: SPACING.md },
  gridImg: { width: '100%', height: rs(120) },
  gridInfo: { padding: SPACING.sm },
  gridName: { fontSize: rs(FONTS.sm), fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  gridPrice: { fontSize: rs(FONTS.sm), color: COLORS.primaryGreen, marginBottom: 6 },
  gridAddBtn: { backgroundColor: COLORS.primaryGreen, borderRadius: RADIUS.md, paddingVertical: 6, alignItems: 'center' },
  farmerListCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.small },
  farmerListName: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary },
  farmerListLoc: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: 2 },
  farmerListRating: { fontSize: rs(FONTS.xs), color: COLORS.textSecondary, marginTop: 2 },
  emptyBox: { alignItems: 'center', paddingVertical: rs(60) },
  emptyEmoji: { fontSize: rs(56), marginBottom: SPACING.md },
  emptyText: { fontSize: rs(FONTS.lg), color: COLORS.textMuted, fontWeight: 'bold' },
  emptySubText: { fontSize: rs(FONTS.sm), color: COLORS.textGray, marginTop: 6, textAlign: 'center' },
});
