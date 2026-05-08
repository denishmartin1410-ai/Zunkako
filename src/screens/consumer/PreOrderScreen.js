// ============================================================
// 📅 PRE-ORDER SCREEN
// விளைவதற்கு முன்பே Order பண்ணலாம்!
// Farmer-க்கு guaranteed income!
// Consumer-க்கு guaranteed fresh!
// எந்த app-லயும் இல்லாத UNIQUE Feature!
// ============================================================

import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import {useAuth} from '../../context/AuthContext';

import { listenToHarvests, createPreOrder } from '../../services/firebase';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');

const PreOrderCard = ({item, onPreOrder}) => {
  const [quantity, setQuantity] = useState(1);
  const fillPercent = (item.totalPreOrders / item.targetPreOrders) * 100;
  const daysColor = item.daysUntilHarvest <= 30 ? COLORS.accentGold : COLORS.primaryGreen;

  return (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.imgWrap}>
        <FastImage
          source={{uri: item.image, priority: FastImage.priority.normal}}
          style={styles.cardImg}
          resizeMode={FastImage.resizeMode.cover}
        />
        {/* Badges */}
        <View style={[styles.topBadge, {backgroundColor: item.badgeColor || COLORS.accentGold}]}>
          <Text style={styles.topBadgeTxt}>{item.badge || '⭐ Hot'}</Text>
        </View>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsTxt}>💰 ₹{item.originalPrice - item.price} சேமிப்பு</Text>
        </View>
        {/* Countdown */}
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownTxt}>⏳ {item.daysUntilHarvest} நாட்களில்</Text>
          <Text style={styles.countdownSubTxt}>In {item.daysUntilHarvest} days</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {/* Product info */}
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemNameEn}>{item.nameEn}</Text>

        {/* Farmer + Harvest date */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipTxt}>👨‍🌾 {item.farmer}</Text>
          </View>
          <View style={[styles.metaChip, {backgroundColor: '#E3F2FD'}]}>
            <Text style={[styles.metaChipTxt, {color: COLORS.primaryBlue}]}>
              📅 {item.harvestDate}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Pre-orders progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              🔥 {item.totalPreOrders} பேர் முன்கூட்டியே order பண்ணியுள்ளனர்
            </Text>
            <Text style={styles.progressCount}>
              {item.totalPreOrders}/{item.targetPreOrders}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={COLORS.gradientButton}
              style={[styles.progressFill, {width: `${Math.min(fillPercent, 100)}%`}]}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            />
          </View>
          {fillPercent >= 80 && (
            <Text style={styles.almostText}>
              ⚡ கிட்டத்தட்ட நிரம்பியது! / Almost full!
            </Text>
          )}
        </View>

        {/* Price row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>₹{item.price}
              <Text style={styles.unit}> /{item.unit}</Text>
            </Text>
            <Text style={styles.originalPrice}>
              வழக்கம்: ₹{item.originalPrice} | சேமிப்பு: {item.savings}
            </Text>
          </View>
          {/* Qty selector */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(q => Math.max(item.minOrder, q - 1))}>
              <Text style={styles.qtyBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnPlus]}
              onPress={() => setQuantity(q => Math.min(item.maxOrder, q + 1))}>
              <Text style={[styles.qtyBtnTxt, {color: COLORS.white}]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guarantee */}
        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeTxt}>✅ {item.guarantee}</Text>
        </View>

        {/* Total + Pre-order button */}
        <View style={styles.orderRow}>
          <View>
            <Text style={styles.totalLabel}>மொத்தம் / Total:</Text>
            <Text style={styles.totalValue}>₹{item.price * quantity}</Text>
          </View>
          <TouchableOpacity
            style={styles.preOrderBtn}
            onPress={() => onPreOrder(item, quantity)}>
            <LinearGradient colors={COLORS.gradientButton} style={styles.preOrderGrad}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              <Text style={styles.preOrderTxt}>📅 முன்கூட்டியே Order</Text>
              <Text style={styles.preOrderSubTxt}>Pre-Order Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const PreOrderScreen = ({navigation}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = listenToHarvests((res) => {
      if (res.success) {
        // Calculate days until harvest for each item
        const processed = res.data.map(h => {
          const harvestDate = new Date(h.harvestDate);
          const today = new Date();
          const diffTime = harvestDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            ...h,
            daysUntilHarvest: diffDays,
            guarantee: 'Fresh delivery within 24hrs of harvest',
            minOrder: 1,
            maxOrder: 10,
          };
        }).filter(h => h.daysUntilHarvest >= 0); // Show today and future harvests
        
        setHarvests(processed);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePreOrder = (item, qty) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to pre-order.');
      return;
    }

    Alert.alert(
      t('preOrder.confirmTitle', { defaultValue: '📅 முன்பணம் உறுதி / Pre-Order Confirm' }),
      `${item.nameTa || item.name} × ${qty} = ₹${item.price * qty}\n\n` +
      `அறுவடை தேதி: ${item.harvestDate}\n` +
      `Harvest date: ${item.harvestDate}\n\n` +
      `அறுவடையான 24 மணி நேரத்தில் டெலிவரி!\n` +
      `Delivered within 24hrs of harvest!`,
      [
        {text: t('common.cancel', { defaultValue: 'இல்லை / No' }), style: 'cancel'},
        {
          text: t('preOrder.confirmBtn', { defaultValue: '✅ உறுதி செய் (Confirm)' }),
          onPress: async () => {
            const res = await createPreOrder(
              item.id,
              user.uid || user.id,
              user.name || 'User',
              qty,
              item.price * qty
            );
            
            if (res.success) {
              Alert.alert(
                t('preOrder.successTitle', { defaultValue: '🎉 Pre-Order வெற்றி!' }),
                t('preOrder.successDesc', { defaultValue: 'உங்கள் முன் order உறுதி செய்யப்பட்டது! விவசாயிக்கு தகவல் அனுப்பப்பட்டது.\n\nPre-order confirmed successfully!' })
              );
            } else {
              Alert.alert('Error', res.error);
            }
          }
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E', '#1565C0']} style={styles.headerRow}>
        <View style={styles.headerTop}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>📅</Text>
          <Text style={styles.headerTitle}>{t('preOrder.title', { defaultValue: 'முன் Order' })}</Text>
          <Text style={styles.headerDesc}>
            {t('preOrder.desc', { defaultValue: 'விளைவதற்கு முன்பே order பண்ணுங்கள்!\nஅதிக சேமிப்பு + guaranteed fresh!' })}
          </Text>
        </View>
      </LinearGradient>

      {/* Benefits bar */}
      <View style={styles.benefitsBar}>
        {[
          {emoji: '💰', label: t('preOrder.benefit1', { defaultValue: 'Up to 28%\nதள்ளுபடி' })},
          {emoji: '🌿', label: t('preOrder.benefit2', { defaultValue: '100%\nFresh' })},
          {emoji: '🚚', label: t('preOrder.benefit3', { defaultValue: 'நேரடி\nDelivery' })},
          {emoji: '✅', label: t('preOrder.benefit4', { defaultValue: 'Guaranteed\nQuality' })},
        ].map((b, i) => (
          <View key={i} style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>{b.emoji}</Text>
            <Text style={styles.benefitLabel}>{b.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: 100}}>
        {loading ? (
          <Text style={{textAlign: 'center', marginTop: 50}}>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
        ) : harvests.length === 0 ? (
          <Text style={{textAlign: 'center', marginTop: 50, fontSize: 16, color: COLORS.textGray}}>{t('preOrder.noPreOrders', { defaultValue: 'தற்போது எந்த முன் ஆர்டரும் இல்லை.' })}</Text>
        ) : (
          harvests.map(item => (
            <PreOrderCard key={item.id} item={item} onPreOrder={handlePreOrder} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  headerRow: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: SPACING.xl },
  headerTop: { marginBottom: SPACING.md, alignSelf: 'flex-start' },
  headerContent: { alignItems: 'center' },
  headerEmoji: { fontSize: 44, marginBottom: 6 },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white, marginBottom: SPACING.sm },
  headerDesc: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACING.md },

  benefitsBar: {
    backgroundColor: COLORS.white, flexDirection: 'row',
    justifyContent: 'space-around', paddingVertical: SPACING.md,
    ...SHADOWS.small,
  },
  benefitItem: {alignItems: 'center'},
  benefitEmoji: {fontSize: 24, marginBottom: 2},
  benefitLabel: {fontSize: FONTS.xs, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 14},

  card: {backgroundColor: COLORS.white, borderRadius: RADIUS.xl, marginBottom: SPACING.lg, overflow: 'hidden', ...SHADOWS.medium},
  imgWrap: {position: 'relative'},
  cardImg: {width: '100%', height: 200},
  topBadge: {position: 'absolute', top: 12, left: 12, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5},
  topBadgeTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold},
  savingsBadge: {position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.accentGold, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5},
  savingsTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold},
  countdownBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  countdownTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold},
  countdownSubTxt: {color: 'rgba(255,255,255,0.8)', fontSize: FONTS.xs},

  cardBody: {padding: SPACING.lg},
  itemName: {fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.textPrimary},
  itemNameEn: {fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.sm},
  metaRow: {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md, flexWrap: 'wrap'},
  metaChip: {backgroundColor: '#E8F5E9', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5},
  metaChipTxt: {fontSize: FONTS.xs, color: COLORS.primaryGreen, fontWeight: FONTS.semiBold},
  description: {fontSize: FONTS.md, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md},

  progressSection: {marginBottom: SPACING.md},
  progressHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
  progressLabel: {flex: 1, fontSize: FONTS.sm, color: COLORS.textSecondary},
  progressCount: {fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.primaryGreen},
  progressBg: {height: 10, backgroundColor: '#E0E0E0', borderRadius: RADIUS.full, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: RADIUS.full},
  almostText: {fontSize: FONTS.xs, color: COLORS.accentGold, fontWeight: FONTS.semiBold, marginTop: 4},

  priceRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md},
  price: {fontSize: FONTS.xl, fontWeight: FONTS.extraBold, color: COLORS.primaryGreen},
  unit: {fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: FONTS.regular},
  originalPrice: {fontSize: FONTS.xs, color: COLORS.textGray, textDecorationLine: 'line-through'},
  qtyRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnPlus: {backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen},
  qtyBtnTxt: {fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.textPrimary},
  qtyNum: {fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, minWidth: 28, textAlign: 'center'},

  guaranteeBox: {
    backgroundColor: '#E8F5E9', borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
  },
  guaranteeTxt: {fontSize: FONTS.sm, color: COLORS.primaryGreen, fontWeight: FONTS.semiBold},

  orderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  totalLabel: {fontSize: FONTS.sm, color: COLORS.textMuted},
  totalValue: {fontSize: FONTS.xl, fontWeight: FONTS.extraBold, color: COLORS.primaryGreen},
  preOrderBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  preOrderGrad: {paddingVertical: 12, paddingHorizontal: SPACING.xl, alignItems: 'center'},
  preOrderTxt: {color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold},
  preOrderSubTxt: {color: 'rgba(255,255,255,0.8)', fontSize: FONTS.xs},
});

export default PreOrderScreen;
