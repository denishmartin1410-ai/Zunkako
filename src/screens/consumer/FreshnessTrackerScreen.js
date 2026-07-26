// ============================================================
// 🌡️ FRESHNESS TRACKER SCREEN
// "அறுவடை ஆன நேரம் இப்போ இருக்கு" - Real-time countdown
// Zepto, Blinkit, BigBasket - எந்த app-லயும் இல்லாதது!
// ============================================================

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import {useTranslation} from 'react-i18next';
import BackButton from '../../utils/BackButton';
import {useCart} from '../../context/CartContext';
import {getConsumerPrice} from '../../utils/priceHelper';
import {listenToFreshProducts} from '../../services/firebase';
import {useTheme} from '../../context/ThemeContext';

const {width} = Dimensions.get('window');

// Read from Firestore instead of hardcoded data

// ── Helper: Time elapsed calculate ──
const getElapsedAndPercent = (harvestTime, freshHours) => {
  const now = new Date();
  const elapsedMs = now - harvestTime;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const elapsedMins = Math.floor(elapsedMs / (1000 * 60)) % 60;
  const elapsedHrsDisplay = Math.floor(elapsedHours);
  const percent = Math.min((elapsedHours / freshHours) * 100, 100);
  const remainingHours = Math.max(freshHours - elapsedHours, 0);
  const remainingHrsDisplay = Math.floor(remainingHours);
  const remainingMinsDisplay = Math.floor((remainingHours % 1) * 60);
  return {
    elapsedHrsDisplay,
    elapsedMins,
    remainingHrsDisplay,
    remainingMinsDisplay,
    percent,
    isFresh: percent < 50,
    isWarning: percent >= 50 && percent < 80,
    isExpiring: percent >= 80,
  };
};

// ── Freshness bar color ──
const getFreshnessColor = percent => {
  if (percent < 40) {
    return ['#27AE60', '#1B8A4E'];
  }
  if (percent < 70) {
    return ['#F4A61D', '#FF9800'];
  }
  return ['#E53935', '#C62828'];
};

const getFreshnessLabel = percent => {
  if (percent < 40) {
    return {ta: '🟢 மிகவும் புதிசு', en: 'Very Fresh'};
  }
  if (percent < 70) {
    return {ta: '🟡 இன்னும் நல்லது', en: 'Still Good'};
  }
  return {ta: '🔴 விரைவில் பழசாகும்', en: 'Expiring Soon'};
};

// ── Individual Product Freshness Card ──
const FreshnessCard = ({product, onAddToCart}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const [tick, setTick] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Live update every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for expiring items
  useEffect(() => {
    const info = getElapsedAndPercent(product.harvestTime, product.freshHours);
    if (info.isExpiring) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [product.harvestTime, product.freshHours, pulseAnim]);

  const parsedHarvestTime = new Date(product.harvestTime);
  const info = getElapsedAndPercent(
    parsedHarvestTime,
    product.freshHours || 24,
  );
  const colors = getFreshnessColor(info.percent);
  const getBadgeTranslation = () => {
    if (info.percent < 40) {
      return (
        '🟢 ' + t('freshness.veryFreshShort', {defaultValue: 'மிகவும் புதுசு'})
      );
    }
    if (info.percent < 70) {
      return '🟡 ' + t('freshness.stillGoodShort', {defaultValue: 'நல்லது'});
    }
    return (
      '🔴 ' + t('freshness.expiringShort', {defaultValue: 'விரைவில் பழசாகும்'})
    );
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
          borderWidth: isDark ? 1 : 0,
        },
        {transform: [{scale: pulseAnim}]},
      ]}>
      {/* Product image */}
      <FastImage
        source={{uri: product.image, priority: FastImage.priority.normal}}
        style={styles.cardImg}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* Freshness overlay badge */}
      <View
        style={[
          styles.freshnessBadge,
          {
            backgroundColor: info.isExpiring
              ? '#FFEBEE'
              : info.isWarning
              ? '#FFF9E6'
              : '#E8F5E9',
          },
        ]}>
        <Text style={styles.freshnessLabel}>{getBadgeTranslation()}</Text>
      </View>

      <View style={styles.cardBody}>
        {/* Product info */}
        <View style={styles.productRow}>
          <Text style={styles.productEmoji}>{product.emoji}</Text>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, {color: themeColors.text}]}>
              {product.name}
            </Text>
            <Text style={[styles.productNameEn, {color: themeColors.subText}]}>
              {product.nameEn}
            </Text>
            <Text style={[styles.farmerName, {color: themeColors.textMuted}]}>
              👨‍🌾 {product.farmer}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={[styles.price, {color: themeColors.text}]}>
              ₹{getConsumerPrice(product.price)}
            </Text>
            <Text style={[styles.unit, {color: themeColors.textMuted}]}>
              /{product.unit}
            </Text>
          </View>
        </View>

        {/* ── FRESHNESS BAR - Main unique feature ── */}
        <View
          style={[styles.freshnessSection, {backgroundColor: themeColors.bg}]}>
          <View style={styles.freshnessHeaderRow}>
            <Text style={[styles.freshnessTitle, {color: themeColors.text}]}>
              ⏱{' '}
              {t('freshness.timeSinceHarvest', {
                defaultValue: 'அறுவடை ஆன நேரம்',
              })}
            </Text>
            <Text style={styles.elapsedTime}>
              {info.elapsedHrsDisplay}
              {t('freshness.hoursShort', {defaultValue: 'மணி '})}
              {info.elapsedMins}
              {t('freshness.minsAgo', {defaultValue: 'நிமிடம் முன்பு'})}
            </Text>
          </View>

          {/* Progress bar */}
          <View
            style={[
              styles.progressBarBg,
              {backgroundColor: isDark ? '#333333' : '#E0E0E0'},
            ]}>
            <LinearGradient
              colors={colors}
              style={[styles.progressBarFill, {width: `${info.percent}%`}]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            />
          </View>

          {/* Remaining time */}
          <View style={styles.remainingRow}>
            <Text style={[styles.remainingLabel, {color: themeColors.subText}]}>
              {t('freshness.freshFor', {
                defaultValue: 'இன்னும் எத்தனை நேரம் நல்லது?',
              })}
            </Text>
            {info.remainingHrsDisplay > 0 || info.remainingMinsDisplay > 0 ? (
              <Text style={[styles.remainingTime, {color: colors[0]}]}>
                {info.remainingHrsDisplay > 0
                  ? `${info.remainingHrsDisplay}${t('freshness.hoursShort', {
                      defaultValue: 'மணி ',
                    })}`
                  : ''}
                {info.remainingMinsDisplay}
                {t('freshness.minsShort', {defaultValue: 'நிமிடம்'})}
              </Text>
            ) : (
              <Text style={[styles.remainingTime, {color: COLORS.accentRed}]}>
                {t('freshness.expired', {defaultValue: 'காலாவதியானது'})}
              </Text>
            )}
          </View>
        </View>

        {/* Stock warning */}
        {product.stock <= 10 && (
          <View style={styles.stockWarning}>
            <Text style={styles.stockWarningTxt}>
              ⚠ கையிருப்பு: {product.stock} மட்டும் / Only {product.stock} left!
            </Text>
          </View>
        )}

        {/* Add to cart */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onAddToCart(product)}>
          <LinearGradient
            colors={colors}
            style={styles.addBtnGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.addBtnTxt}>
              🛒 {t('product.addToCart', {defaultValue: 'கார்ட்டில் சேர்'})}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const FreshnessTrackerScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {addToCart} = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToFreshProducts(res => {
      if (res.success) {
        setProducts(res.data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddToCart = product => {
    addToCart({
      ...product,
      nameTa: product.nameTa || product.name,
      farmerName: product.farmerName || product.farmer,
      farmerNameTa:
        product.farmerNameTa || product.farmerName || product.farmer,
    });
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>⏱</Text>
          <Text style={styles.headerTitle}>
            {t('home.freshnessTracker', {defaultValue: 'Freshness Tracker'})}
          </Text>
          <Text style={styles.headerDesc}>
            {t('freshness.desc', {
              defaultValue:
                'அறுவடை ஆன நேரத்திலிருந்து இப்போது வரை எவ்வளவு நேரம் ஆனது என்று நேரடியாக தெரியும்!',
            })}
          </Text>
        </View>
      </LinearGradient>

      {/* Legend */}
      <View
        style={[
          styles.legend,
          {
            backgroundColor: themeColors.cardBg,
            borderBottomColor: themeColors.border,
            borderBottomWidth: 1,
          },
        ]}>
        {[
          {
            color: COLORS.primaryGreen,
            label: t('freshness.veryFresh', {
              defaultValue: 'மிகவும் புதிசு (0-40%)',
            }),
          },
          {
            color: COLORS.accentGold,
            label: t('freshness.stillGood', {defaultValue: 'நல்லது (40-70%)'}),
          },
          {
            color: COLORS.accentRed,
            label: t('freshness.expiring', {
              defaultValue: 'விரைவில் பழசாகும் (70%+)',
            }),
          },
        ].map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: item.color}]} />
            <Text style={[styles.legendTxt, {color: themeColors.subText}]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Products */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: 100}}>
        {loading ? (
          <Text style={{textAlign: 'center', marginTop: 50}}>Loading...</Text>
        ) : products.length === 0 ? (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 50,
              fontSize: 16,
              color: COLORS.textGray,
            }}>
            {t('freshness.noProducts', {
              defaultValue: 'தற்போது எந்த புதிய தயாரிப்புகளும் இல்லை.',
            })}
          </Text>
        ) : (
          products.map(product => (
            <FreshnessCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  // Header
  header: {paddingTop: 50, paddingBottom: 24, paddingHorizontal: SPACING.xl},
  backBtn: {marginBottom: SPACING.md},
  backTxt: {color: COLORS.white, fontSize: FONTS.xxl, fontWeight: FONTS.bold},
  headerContent: {alignItems: 'center'},
  headerEmoji: {fontSize: 44, marginBottom: 6},
  headerTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },
  headerTitleTa: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  headerDesc: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Legend
  legend: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.small,
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  legendDot: {width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm},
  legendTxt: {fontSize: FONTS.xs, color: COLORS.textSecondary},

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cardImg: {width: '100%', height: 160},
  freshnessBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freshnessLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  freshnessLabelEn: {fontSize: FONTS.xs, color: COLORS.textSecondary},
  cardBody: {padding: SPACING.lg},

  // Product row
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  productEmoji: {fontSize: 36, marginRight: SPACING.md},
  productInfo: {flex: 1},
  productName: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  productNameEn: {fontSize: FONTS.sm, color: COLORS.textMuted},
  farmerName: {fontSize: FONTS.sm, color: COLORS.textSecondary},
  priceBox: {alignItems: 'flex-end'},
  price: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.extraBold,
    color: COLORS.primaryGreen,
  },
  unit: {fontSize: FONTS.xs, color: COLORS.textMuted},

  // Freshness section
  freshnessSection: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  freshnessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  freshnessTitle: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.semiBold,
    flex: 1,
  },
  elapsedTime: {
    fontSize: FONTS.xs,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.bold,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBarFill: {height: '100%', borderRadius: RADIUS.full},
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingLabel: {fontSize: FONTS.xs, color: COLORS.textMuted, flex: 1},
  remainingTime: {fontSize: FONTS.sm, fontWeight: FONTS.bold},

  // Stock warning
  stockWarning: {
    backgroundColor: '#FFF9E6',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentGold,
  },
  stockWarningTxt: {
    fontSize: FONTS.sm,
    color: COLORS.warning,
    fontWeight: FONTS.semiBold,
  },

  // Add button
  addBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  addBtnGrad: {paddingVertical: 14, alignItems: 'center'},
  addBtnTxt: {color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold},
});

export default FreshnessTrackerScreen;
