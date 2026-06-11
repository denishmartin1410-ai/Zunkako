// ============================================================
// 🌾 HARVEST CALENDAR SCREEN
// மற்ற எந்த app-லயும் இல்லாத UNIQUE Feature!
// "இந்த வாரம் என்ன fresh-ஆ கிடைக்கும்?" - Calendar view
// ============================================================

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';
import {useTheme} from '../../context/ThemeContext';

import {listenToHarvests} from '../../services/firebase';
import {parseLocalDate} from '../../utils/dateHelper';
import {getLocalProductName} from '../../utils/translationHelper';

const {width} = Dimensions.get('window');

const DAYS = [
  {key: 'Sun', ta: 'ஞாயிறு', en: 'Sun', index: 0},
  {key: 'Mon', ta: 'திங்கள்', en: 'Mon', index: 1},
  {key: 'Tue', ta: 'செவ்வாய்', en: 'Tue', index: 2},
  {key: 'Wed', ta: 'புதன்', en: 'Wed', index: 3},
  {key: 'Thu', ta: 'வியாழன்', en: 'Thu', index: 4},
  {key: 'Fri', ta: 'வெள்ளி', en: 'Fri', index: 5},
  {key: 'Sat', ta: 'சனி', en: 'Sat', index: 6},
];

const TODAY_INDEX = new Date().getDay(); // 0=Sun, 1=Mon...
const TODAY_KEY = DAYS.find(d => d.index === TODAY_INDEX).key;

const HarvestCalendarScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);

  const [selectedDay, setSelectedDay] = useState(TODAY_KEY);
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToHarvests(res => {
      if (res.success) {
        setHarvests(res.data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter items for the selected day based on the harvestDate
  const getItemsForSelectedDay = () => {
    const selectedDayIndex = DAYS.find(d => d.key === selectedDay).index;

    return harvests.filter(h => {
      if (!h.harvestDate) {
        return false;
      }
      const date = parseLocalDate(h.harvestDate);
      return date.getDay() === selectedDayIndex;
    });
  };

  const items = getItemsForSelectedDay();

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>🌾</Text>
          <Text style={styles.headerTitle}>
            {t('home.harvestCalendar', {defaultValue: 'அறுவடை நாள்காட்டி'})}
          </Text>
          <Text style={styles.headerDesc}>
            {t('harvestCalendar.desc', {
              defaultValue: 'இந்த வாரம் என்ன fresh-ஆ கிடைக்கும்?',
            })}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Days Row ── */}
      <View
        style={[styles.daysContainer, {backgroundColor: themeColors.cardBg}]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}>
          {DAYS.map(day => {
            const isToday = day.key === TODAY_KEY;
            const isSelected = day.key === selectedDay;
            const count = harvests.filter(
              h => parseLocalDate(h.harvestDate).getDay() === day.index,
            ).length;
            return (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipActive,
                  isToday && !isSelected && styles.dayChipToday,
                ]}
                onPress={() => setSelectedDay(day.key)}>
                {isSelected ? (
                  <LinearGradient
                    colors={COLORS.gradientButton}
                    style={styles.dayChipGrad}>
                    <Text style={styles.dayActiveTxt}>
                      {t(`harvestCalendar.day_${day.key.toLowerCase()}`)}
                    </Text>
                    {count > 0 && (
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeTxt}>{count}</Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.dayChipInner,
                      {backgroundColor: themeColors.bg},
                    ]}>
                    <Text
                      style={[
                        styles.dayTxt,
                        {color: themeColors.subText},
                        isToday && styles.dayTxtToday,
                      ]}>
                      {t(`harvestCalendar.day_${day.key.toLowerCase()}`)}
                    </Text>
                    {isToday && <Text style={styles.todayDot}>●</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Selected Day Title ── */}
      <View style={styles.selectedDayHeader}>
        <Text style={[styles.selectedDayTitle, {color: themeColors.text}]}>
          {t(`harvestCalendar.day_${selectedDay.toLowerCase()}`, {
            defaultValue: DAYS.find(d => d.key === selectedDay)?.ta,
          })}{' '}
          -{' '}
          {selectedDay === TODAY_KEY
            ? t('harvestCalendar.todayBadge', {defaultValue: '📍 இன்று'})
            : t('harvestCalendar.thisDay', {defaultValue: 'இந்த நாள்'})}
        </Text>
        <View style={styles.freshBadgeRow}>
          <View
            style={[
              styles.freshBadge,
              {backgroundColor: isDark ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9'},
            ]}>
            <Text style={styles.freshBadgeTxt}>
              {t('harvestCalendar.freshBadgeText', {
                defaultValue: '🌿 புதியது = இன்று',
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Harvest Items List ── */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 100}}>
        {items.length === 0 ? (
          loading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color={COLORS.primaryGreen} size="large" />
            </View>
          ) : null
        ) : (
          items.map((item, idx) => {
            const localName = getLocalProductName(
              item.nameEn,
              item.name,
              i18n.language,
            );
            return (
              <View
                key={idx}
                style={[
                  styles.harvestCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                  },
                ]}>
                {/* Fresh indicator bar */}
                <View
                  style={[
                    styles.freshBar,
                    {
                      backgroundColor: item.fresh
                        ? COLORS.primaryGreen
                        : COLORS.primaryBlue,
                    },
                  ]}
                />

                <View style={styles.cardContent}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemNameRow}>
                      <Text
                        style={[styles.itemName, {color: themeColors.text}]}
                        numberOfLines={2}>
                        {localName}
                      </Text>
                      {item.fresh && (
                        <View style={styles.freshTag}>
                          <Text style={styles.freshTagTxt}>🌿 Fresh</Text>
                        </View>
                      )}
                    </View>
                    {localName !== item.nameEn && (
                      <Text
                        style={[
                          styles.itemNameEn,
                          {color: themeColors.textMuted},
                        ]}>
                        {item.nameEn}
                      </Text>
                    )}
                    <View style={styles.itemMetaRow}>
                      <Text
                        style={[
                          styles.itemFarmer,
                          {color: themeColors.subText},
                        ]}>
                        👨‍🌾 {item.farmer}
                      </Text>
                      <Text style={styles.itemQty}>
                        📦 {item.qty} {item.unit}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.preOrderBtn}
                    onPress={() =>
                      navigation.navigate('PreOrder', {
                        selectedHarvestId: item.id,
                      })
                    }>
                    <LinearGradient
                      colors={COLORS.gradientButton}
                      style={styles.preOrderGrad}>
                      <Text style={styles.preOrderTxt}>முன் Order</Text>
                      <Text style={styles.preOrderTxtEn}>Pre-order</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},

  // Header
  header: {paddingTop: 50, paddingBottom: 28, paddingHorizontal: SPACING.xl},
  backBtn: {marginBottom: SPACING.md},
  backTxt: {color: COLORS.white, fontSize: FONTS.xxl, fontWeight: FONTS.bold},
  headerCenter: {alignItems: 'center'},
  headerEmoji: {fontSize: 44, marginBottom: 6},
  headerTitle: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },
  headerSub: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  headerDesc: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Days row
  daysContainer: {
    paddingVertical: SPACING.md,
    ...SHADOWS.small,
  },
  daysRow: {paddingHorizontal: SPACING.lg, gap: SPACING.sm},
  dayChip: {borderRadius: RADIUS.lg, overflow: 'hidden', minWidth: 72},
  dayChipActive: {},
  dayChipToday: {
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
    borderRadius: RADIUS.lg,
  },
  dayChipGrad: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dayChipInner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  dayTxt: {fontSize: FONTS.sm, fontWeight: FONTS.semiBold},
  dayTxtToday: {color: COLORS.primaryGreen, fontWeight: FONTS.bold},
  dayActiveTxt: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
  dayBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  dayBadgeTxt: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
  todayDot: {fontSize: 8, color: COLORS.primaryGreen, marginTop: 2},

  // Selected day header
  selectedDayHeader: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDayTitle: {fontSize: FONTS.lg, fontWeight: FONTS.bold},
  freshBadgeRow: {flexDirection: 'row'},
  freshBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freshBadgeTxt: {
    fontSize: FONTS.xs,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.semiBold,
  },

  // Harvest card
  listContainer: {paddingHorizontal: SPACING.lg},
  harvestCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.card,
    borderWidth: 1,
  },
  freshBar: {width: 5},
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  itemEmoji: {fontSize: 40},
  itemInfo: {flex: 1},
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  itemName: {fontSize: FONTS.md, fontWeight: FONTS.bold, flexShrink: 1},
  freshTag: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  freshTagTxt: {
    fontSize: FONTS.xs,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.bold,
  },
  itemNameEn: {fontSize: FONTS.sm, marginBottom: 4},
  itemMetaRow: {flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap'},
  itemFarmer: {fontSize: FONTS.sm},
  itemQty: {fontSize: FONTS.sm, color: COLORS.primaryBlue},
  preOrderBtn: {borderRadius: RADIUS.md, overflow: 'hidden'},
  preOrderGrad: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  preOrderTxt: {
    fontSize: FONTS.xs,
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
  preOrderTxtEn: {fontSize: 10, color: 'rgba(255,255,255,0.8)'},

  // Empty
  emptyBox: {alignItems: 'center', paddingVertical: 60},
  emptyEmoji: {fontSize: 56, marginBottom: SPACING.md},
  emptyTxt: {
    fontSize: FONTS.lg,
    color: COLORS.textMuted,
    fontWeight: FONTS.semiBold,
  },
  emptySubTxt: {fontSize: FONTS.sm, color: COLORS.textGray, marginTop: 4},

  // Info
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accentGold,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  infoEmoji: {fontSize: 24},
  infoTxt: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});

export default HarvestCalendarScreen;
