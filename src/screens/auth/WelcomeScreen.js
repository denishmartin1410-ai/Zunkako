import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, FONTS, SPACING, RADIUS} from '../../utils/theme';

const {width, height} = Dimensions.get('window');

const WelcomeScreen = ({navigation}) => {
  const {t} = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const card1Anim = useRef(new Animated.Value(width)).current;
  const card2Anim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(150, [
        Animated.spring(card1Anim, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(card2Anim, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, card1Anim, card2Anim]);

  const FloatingCard = ({emoji, label, sublabel, style, anim}) => (
    <Animated.View
      style={[styles.floatingCard, style, {transform: [{translateX: anim}]}]}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardSub}>{sublabel}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Top gradient hero section */}
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={styles.heroSection}>
        {/* Decorative shapes */}
        <View style={styles.shapeTL} />
        <View style={styles.shapeBR} />

        <Animated.View
          style={[
            styles.heroContent,
            {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
          ]}>
          <Text style={styles.heroEmoji}>🌿</Text>
          <Text style={styles.heroTitle}>Zunkako</Text>
          <Text style={styles.heroSubtitle}>{t('welcome.heroSubtitle')}</Text>

          <View style={styles.tagRow}>
            {[t('welcome.tag1'), t('welcome.tag2'), t('welcome.tag3')].map(
              (tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ),
            )}
          </View>
        </Animated.View>

        {/* Floating info cards */}
        <FloatingCard
          emoji="🥦"
          label={t('welcome.card1Label')}
          sublabel={t('welcome.card1Sub')}
          anim={card1Anim}
          style={styles.card1}
        />
        <FloatingCard
          emoji="👨‍🌾"
          label={t('welcome.card2Label')}
          sublabel={t('welcome.card2Sub')}
          anim={card2Anim}
          style={styles.card2}
        />
      </LinearGradient>

      {/* Bottom white section */}
      <View style={styles.bottomSection}>
        <Text style={styles.welcomeTitle}>{t('welcome.title')}</Text>
        <Text style={styles.welcomeSubtitle}>{t('welcome.subtitle')}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            {num: '200+', label: t('welcome.statFarmers')},
            {num: '500+', label: t('welcome.statProducts')},
            {num: '10K+', label: t('welcome.statConsumers')},
          ].map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statNum}>{stat.num}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <TouchableOpacity
          style={styles.loginBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RoleSelection', {mode: 'login'})}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.loginBtnGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.loginBtnText}>{t('welcome.loginBtn')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('RoleSelection', {mode: 'register'})
          }>
          <Text style={styles.registerBtnText}>{t('welcome.registerBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.white},
  heroSection: {
    height: height * 0.58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    overflow: 'hidden',
  },
  shapeTL: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  shapeBR: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroContent: {alignItems: 'center', zIndex: 2},
  heroEmoji: {fontSize: 54, marginBottom: 4},
  heroTitle: {
    fontSize: 58,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 4,
  },
  heroSubtitle: {
    fontSize: FONTS.lg,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: FONTS.medium,
    lineHeight: 26,
    marginTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tagText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.semiBold,
  },
  floatingCard: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    alignItems: 'center',
    minWidth: 110,
  },
  card1: {bottom: 15, left: 16},
  card2: {bottom: 15, right: 16},
  cardEmoji: {fontSize: 28},
  cardLabel: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.semiBold,
    marginTop: 4,
  },
  cardSub: {color: 'rgba(255,255,255,0.7)', fontSize: 9},
  bottomSection: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: FONTS.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: SPACING.xl,
    backgroundColor: COLORS.gradientSoft[0],
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  statItem: {alignItems: 'center'},
  statNum: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.extraBold,
    color: COLORS.primaryGreen,
  },
  statLabel: {fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 2},
  loginBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  loginBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
  },
  registerBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
  },
  registerBtnText: {
    color: COLORS.primaryGreen,
    fontSize: FONTS.md,
    fontWeight: FONTS.semiBold,
  },
});

export default WelcomeScreen;
