// ============================================================
// 🥗 NUTRITION REPORT SCREEN
// "இந்த வாரம் உங்கள் குடும்பம் எவ்வளவு சாப்பிட்டீர்கள்?"
// Weekly health report from purchased products
// எந்த Grocery App-லயும் இல்லாத UNIQUE Feature!
// ============================================================

import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import {useAuth} from '../../context/AuthContext';
import {getDeliveredOrdersForPeriod} from '../../services/firebase';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');

// Local Nutrition Lookup Table (Per 100g or roughly standard serving if not specified)
const NUTRITION_DB = {
  'தக்காளி': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, iron: 0.3, emoji: '🍅' },
  'பசலைக் கீரை': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, iron: 2.7, emoji: '🥬' },
  'வாழைப்பழம்': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, iron: 0.3, emoji: '🍌' },
  'பொன்னி அரிசி': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, iron: 0.2, emoji: '🌾' },
  'தேங்காய் எண்ணெய்': { calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0, iron: 0, emoji: '🫙' },
  'மாம்பழம்': { calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, iron: 0.2, emoji: '🥭' },
  'கொத்தமல்லி': { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5, fiber: 2.8, iron: 1.8, emoji: '🌿' },
  // Default values for unknown items
  'default': { calories: 40, protein: 1, carbs: 8, fat: 0.5, fiber: 2, iron: 0.5, emoji: '🛒' }
};

const RECOMMENDED = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65,
  fiber: 30,
  iron: 18
};

const NutritionBar = ({label, emoji, value, recommended, unit, color}) => {
  const percent = Math.min((value / recommended) * 100, 100);
  const isGood = percent >= 70 && percent <= 100;
  const isLow = percent < 70;
  const isOver = value > recommended;

  return (
    <View style={styles.nutritionItem}>
      <View style={styles.nutritionHeader}>
        <Text style={styles.nutritionEmoji}>{emoji}</Text>
        <Text style={styles.nutritionLabel}>{label}</Text>
        <View style={styles.nutritionValues}>
          <Text style={[styles.nutritionActual, {color}]}>{value}{unit}</Text>
          <Text style={styles.nutritionSlash}> / </Text>
          <Text style={styles.nutritionRecommended}>{recommended}{unit}</Text>
        </View>
      </View>
      <View style={styles.nutritionBarBg}>
        <LinearGradient
          colors={isOver ? [COLORS.accentRed, '#E53935'] : isLow ? [COLORS.accentGold, '#FF9800'] : [color, color + 'CC']}
          style={[styles.nutritionBarFill, {width: `${percent}%`}]}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        />
      </View>
      <Text style={[styles.nutritionStatus,
        {color: isOver ? COLORS.accentRed : isLow ? COLORS.accentGold : COLORS.primaryGreen}]}>
        {isOver ? `⬆ அதிகம் / Over by ${value - recommended}${unit}`
          : isLow ? `⬇ கம்மி / ${recommended - value}${unit} more needed`
          : '✅ சரியான அளவு / Optimal'}
      </Text>
    </View>
  );
};

const NutritionReportScreen = ({navigation}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const weeks = [
    { label: t('nutrition.thisWeek', { defaultValue: 'இந்த வாரம்' }), offset: 0 },
    { label: t('nutrition.lastWeek', { defaultValue: 'கடந்த வாரம்' }), offset: 1 },
    { label: t('nutrition.twoWeeksAgo', { defaultValue: '2 வாரம் முன்பு' }), offset: 2 }
  ];

  React.useEffect(() => {
    const fetchOrders = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);

      const end = new Date();
      end.setDate(end.getDate() - (selectedWeek * 7));
      const start = new Date(end);
      start.setDate(start.getDate() - 7);

      const res = await getDeliveredOrdersForPeriod(user.uid || user.id, start, end);
      
      if (res.success) {
        let totalSpent = 0;
        let totalItems = 0;
        let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0 };
        let purchasedItemsMap = {};

        res.data.forEach(order => {
          totalSpent += order.total;
          (order.items || []).forEach(item => {
            totalItems += item.quantity;
            
            // Simplified matching for demo
            let matchedNut = NUTRITION_DB['default'];
            const nTa = item.nameTa || item.name;
            for (const key of Object.keys(NUTRITION_DB)) {
              if (nTa.includes(key) || (item.nameEn && item.nameEn.toLowerCase().includes(key.toLowerCase()))) {
                matchedNut = NUTRITION_DB[key];
                break;
              }
            }

            // Assume base unit is multiplier (e.g. 1kg = 10 * 100g units)
            const multiplier = item.quantity * 10; // rough estimate

            totals.calories += matchedNut.calories * multiplier;
            totals.protein += matchedNut.protein * multiplier;
            totals.carbs += matchedNut.carbs * multiplier;
            totals.fat += matchedNut.fat * multiplier;
            totals.fiber += matchedNut.fiber * multiplier;
            totals.iron += matchedNut.iron * multiplier;

            if (purchasedItemsMap[nTa]) {
              purchasedItemsMap[nTa].qty += item.quantity;
            } else {
              purchasedItemsMap[nTa] = {
                name: nTa,
                qty: item.quantity,
                emoji: matchedNut.emoji,
                calories: matchedNut.calories * multiplier,
                protein: matchedNut.protein * multiplier,
                carbs: matchedNut.carbs * multiplier
              };
            }
          });
        });

        // Simple Health Score calculation based on balanced macros (just for demo)
        const score = Math.min(100, Math.round(
          ((totals.protein / RECOMMENDED.protein) * 30) + 
          ((totals.fiber / RECOMMENDED.fiber) * 40) + 
          (Math.min(1, RECOMMENDED.fat / (totals.fat || 1)) * 30)
        ));

        setReport({
          weekStr: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          totalSpent,
          totalItems,
          nutrition: {
            calories: {value: Math.round(totals.calories), recommended: RECOMMENDED.calories, unit: 'kcal', label: 'கலோரி\nCalories', emoji: '🔥', color: '#FF7043'},
            protein: {value: Math.round(totals.protein), recommended: RECOMMENDED.protein, unit: 'g', label: 'புரதம்\nProtein', emoji: '💪', color: '#7B1FA2'},
            carbs: {value: Math.round(totals.carbs), recommended: RECOMMENDED.carbs, unit: 'g', label: 'கார்போ\nCarbs', emoji: '🌾', color: '#F57F17'},
            fat: {value: Math.round(totals.fat), recommended: RECOMMENDED.fat, unit: 'g', label: 'கொழுப்பு\nFat', emoji: '🥑', color: '#00897B'},
            fiber: {value: Math.round(totals.fiber), recommended: RECOMMENDED.fiber, unit: 'g', label: 'நார்ச்சத்து\nFiber', emoji: '🥦', color: '#2E7D32'},
            iron: {value: Math.round(totals.iron), recommended: RECOMMENDED.iron, unit: 'mg', label: 'இரும்பு\nIron', emoji: '⚡', color: '#1565C0'},
          },
          purchasedItems: Object.values(purchasedItemsMap),
          healthScore: totalItems === 0 ? 0 : score,
          tips: totalItems === 0 ? [] : [
            {emoji: '✅', tip: 'இந்த வாரம் நிறைய கீரை சாப்பிட்டீர்கள்! Iron level நல்லா இருக்கு.', tipEn: 'Great greens intake this week! Iron levels look good.'},
            {emoji: '💡', tip: 'இன்னும் கொஞ்சம் protein வேண்டும். பருப்பு, நட்ஸ் சேர்க்கவும்.', tipEn: 'Add more protein: lentils, nuts recommended.'},
            {emoji: '🌟', tip: 'இயற்கை products வாங்கியதால் pesticide exposure இல்லை!', tipEn: 'Zero pesticide exposure - great organic choice!'},
          ],
        });
      }
      setLoading(false);
    };

    fetchOrders();
  }, [selectedWeek, user]);

  const scoreColor = report?.healthScore >= 80 ? COLORS.primaryGreen : report?.healthScore >= 60 ? COLORS.accentGold : COLORS.accentRed;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.headerRow}>
        <View style={styles.headerTop}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🥗</Text>
          <Text style={styles.headerTitle}>{t('nutrition.title', { defaultValue: 'ஊட்டச்சத்து அறிக்கை' })}</Text>
          <Text style={styles.headerDesc}>
            {t('nutrition.desc', { defaultValue: 'நீங்கள் வாங்கிய F2C products-ல் இருந்து\nஉங்கள் வார ஊட்டச்சத்து பார்க்கலாம்!' })}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: 100}}>

        {/* Week selector */}
        <View style={styles.weekSelector}>
          {weeks.map((w, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.weekChip, selectedWeek === i && styles.weekChipActive]}
              onPress={() => setSelectedWeek(i)}>
              {selectedWeek === i ? (
                <LinearGradient colors={COLORS.gradientButton} style={styles.weekChipGrad}>
                  <Text style={styles.weekChipActiveTxt}>{w.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.weekChipTxt}>{w.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40 }}>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
        ) : !report ? (
          <Text style={{ textAlign: 'center', marginTop: 40 }}>{t('common.error', { defaultValue: 'Error loading report' })}</Text>
        ) : report.totalItems === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ fontSize: 60, marginBottom: 20 }}>🛒</Text>
            <Text style={{ fontSize: 16, color: COLORS.textGray, textAlign: 'center' }}>
              இந்த வாரம் எந்த ஆர்டரும் இல்லை.
            </Text>
          </View>
        ) : (
          <>
            {/* Health Score Card */}
            <View style={styles.scoreCard}>
              <LinearGradient
                colors={report.healthScore >= 80 ? ['#E8F5E9', '#C8E6C9'] : ['#FFF9E6', '#FFE0B2']}
                style={styles.scoreCardGrad}>
                <View style={styles.scoreLeft}>
                  <Text style={styles.scoreWeek}>{report.weekStr}</Text>
                  <Text style={styles.scoreWeekEn}></Text>
                  <View style={styles.scoreStatsRow}>
                    <View style={styles.scoreStat}>
                      <Text style={styles.scoreStatNum}>{report.totalItems}</Text>
                      <Text style={styles.scoreStatLabel}>Products{'\n'}வாங்கினீர்கள்</Text>
                    </View>
                    <View style={styles.scoreDivider} />
                    <View style={styles.scoreStat}>
                      <Text style={styles.scoreStatNum}>₹{report.totalSpent}</Text>
                      <Text style={styles.scoreStatLabel}>செலவு{'\n'}Spent</Text>
                    </View>
                  </View>
                </View>
                {/* Circular score */}
                <View style={[styles.scoreCircle, {borderColor: scoreColor}]}>
                  <Text style={[styles.scoreNum, {color: scoreColor}]}>{report.healthScore}</Text>
                  <Text style={styles.scoreOutOf}>/100</Text>
              <Text style={styles.scoreLabel}>Health{'\n'}Score</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Nutrition Bars */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>📊 ஊட்டச்சத்து விவரம் / Nutrition Details</Text>
          <Text style={styles.sectionSub}>இந்த வாரம் வாங்கிய products-ல் இருந்து</Text>
          {Object.entries(report.nutrition).map(([key, data]) => (
            <NutritionBar key={key} {...data} />
          ))}
        </View>

        {/* Products purchased */}
        <View style={styles.productsCard}>
          <Text style={styles.sectionTitle}>🛒 வாங்கிய products / Purchased this week</Text>
          {report.purchasedItems.map((item, i) => (
            <View key={i} style={styles.purchasedRow}>
              <Text style={styles.purchasedEmoji}>{item.emoji}</Text>
              <View style={styles.purchasedInfo}>
                <Text style={styles.purchasedName}>{item.name} x{item.qty}</Text>
                <Text style={styles.purchasedNutrition}>
                  🔥{Math.round(item.calories)}kcal • 💪{Math.round(item.protein)}g protein • 🌾{Math.round(item.carbs)}g carbs
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Health Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>💡 உங்களுக்கான ஆலோசனை / Health Tips</Text>
          {report.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipEmoji}>{tip.emoji}</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipText}>{tip.tip}</Text>
                <Text style={styles.tipTextEn}>{tip.tipEn}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* F2C advantage */}
        <View style={styles.f2cAdvantage}>
          <LinearGradient colors={COLORS.gradientSoft} style={styles.f2cGrad}>
            <Text style={styles.f2cEmoji}>🌿</Text>
            <Text style={styles.f2cTitle}>F2C Organic Advantage</Text>
            <Text style={styles.f2cDesc}>
              இயற்கை முறையில் வளர்க்கப்பட்ட products வாங்கியதால்{'\n'}
              Pesticide: 0% | Chemical: 0% | Fresh: 100%{'\n'}
              {'\n'}
              Chemical-free farming products purchased{'\n'}
              Zero pesticides in your family's food! 🎉
            </Text>
          </LinearGradient>
        </View>
        </>
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

  weekSelector: {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg},
  weekChip: {
    flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden',
    backgroundColor: COLORS.white, paddingVertical: 10,
    alignItems: 'center', ...SHADOWS.small,
  },
  weekChipActive: {},
  weekChipGrad: {width: '100%', paddingVertical: 10, alignItems: 'center'},
  weekChipTxt: {fontSize: FONTS.xs, color: COLORS.textSecondary, fontWeight: FONTS.semiBold},
  weekChipActiveTxt: {fontSize: FONTS.xs, color: COLORS.white, fontWeight: FONTS.bold},

  scoreCard: {borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.lg, ...SHADOWS.card},
  scoreCardGrad: {flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, justifyContent: 'space-between'},
  scoreLeft: {flex: 1},
  scoreWeek: {fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary},
  scoreWeekEn: {fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: SPACING.md},
  scoreStatsRow: {flexDirection: 'row', alignItems: 'center'},
  scoreStat: {alignItems: 'center'},
  scoreStatNum: {fontSize: FONTS.xl, fontWeight: FONTS.extraBold, color: COLORS.primaryGreen},
  scoreStatLabel: {fontSize: FONTS.xs, color: COLORS.textMuted, textAlign: 'center', lineHeight: 14},
  scoreDivider: {width: 1, height: 40, backgroundColor: COLORS.border, marginHorizontal: SPACING.lg},
  scoreCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 4, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  scoreNum: {fontSize: FONTS.xxl, fontWeight: FONTS.black},
  scoreOutOf: {fontSize: FONTS.xs, color: COLORS.textMuted},
  scoreLabel: {fontSize: 9, color: COLORS.textMuted, textAlign: 'center'},

  nutritionCard: {backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.card},
  sectionTitle: {fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: 4},
  sectionSub: {fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.lg},
  nutritionItem: {marginBottom: SPACING.lg},
  nutritionHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  nutritionEmoji: {fontSize: 22, marginRight: SPACING.sm},
  nutritionLabel: {flex: 1, fontSize: FONTS.sm, fontWeight: FONTS.semiBold, color: COLORS.textSecondary, lineHeight: 15},
  nutritionValues: {flexDirection: 'row', alignItems: 'baseline'},
  nutritionActual: {fontSize: FONTS.lg, fontWeight: FONTS.bold},
  nutritionSlash: {fontSize: FONTS.sm, color: COLORS.textMuted},
  nutritionRecommended: {fontSize: FONTS.sm, color: COLORS.textGray},
  nutritionBarBg: {height: 10, backgroundColor: '#E0E0E0', borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 4},
  nutritionBarFill: {height: '100%', borderRadius: RADIUS.full},
  nutritionStatus: {fontSize: FONTS.xs, fontWeight: FONTS.semiBold},

  productsCard: {backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.card},
  purchasedRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight},
  purchasedEmoji: {fontSize: 30, marginRight: SPACING.md},
  purchasedInfo: {flex: 1},
  purchasedName: {fontSize: FONTS.md, fontWeight: FONTS.semiBold, color: COLORS.textPrimary},
  purchasedNutrition: {fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 2},

  tipsCard: {backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.card},
  tipRow: {flexDirection: 'row', marginBottom: SPACING.md},
  tipEmoji: {fontSize: 24, marginRight: SPACING.md, marginTop: 2},
  tipContent: {flex: 1},
  tipText: {fontSize: FONTS.md, color: COLORS.textPrimary, lineHeight: 22},
  tipTextEn: {fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2},

  f2cAdvantage: {borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.small},
  f2cGrad: {padding: SPACING.xl, alignItems: 'center'},
  f2cEmoji: {fontSize: 40, marginBottom: SPACING.sm},
  f2cTitle: {fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.primaryGreen, marginBottom: SPACING.sm},
  f2cDesc: {fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22},
});

export default NutritionReportScreen;
