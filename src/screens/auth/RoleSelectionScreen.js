import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, FONTS, SPACING, RADIUS} from '../../utils/theme';

const {width, height} = Dimensions.get('window');

const TRANSLATIONS = {
  ta: {
    title: 'நீங்கள் யார்?',
    tagline: 'தொடர உங்கள் சுயவிவரத்தைத் தேர்ந்தெடுக்கவும்',
    consumer: 'நுகர்வோர்',
    farmer: 'விவசாயி',
    delivery: 'டெலிவரி முகவர்',
    back: 'பின்னால்',
  },
  en: {
    title: 'Who are you?',
    tagline: 'Choose your profile to continue',
    consumer: 'Consumer',
    farmer: 'Farmer',
    delivery: 'Delivery Partner',
    back: 'Back',
  },
  ml: {
    title: 'നിങ്ങൾ ആരാണ്?',
    tagline: 'തുടരാൻ നിങ്ങളുടെ പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക',
    consumer: 'ഉപഭോക്താവ്',
    farmer: 'കർഷകൻ',
    delivery: 'ഡെലിവറി പാർട്ണർ',
    back: 'തിരികെ',
  },
};

const RoleSelectionScreen = ({navigation, route}) => {
  const {i18n} = useTranslation();
  const currentLang = i18n.language || 'ta';
  const langText = TRANSLATIONS[currentLang] || TRANSLATIONS.ta;
  const mode = route.params?.mode || 'login';

  const handleRoleSelect = role => {
    if (mode === 'login') {
      navigation.navigate('Login', {role});
    } else {
      navigation.navigate('Register', {role});
    }
  };

  const RoleCard = ({role, label, subtitle, colors, accentColor}) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => handleRoleSelect(role)}>
      <LinearGradient
        colors={colors}
        style={styles.cardGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <View style={[styles.badgeDot, {backgroundColor: accentColor}]} />
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {role === 'consumer'
              ? 'Buy fresh produce directly'
              : role === 'farmer'
              ? 'Sell crops & harvests'
              : 'Deliver fresh orders'}
          </Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={styles.headerGradient}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}>
          <Text style={styles.backTxt}>← {langText.back}</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            {langText.title}
          </Text>
          <Text style={styles.tagline} numberOfLines={2}>
            {langText.tagline}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <RoleCard
          role="consumer"
          label={langText.consumer}
          colors={['#FFFFFF', '#F0F7FF']}
          accentColor="#2196F3"
        />
        <RoleCard
          role="farmer"
          label={langText.farmer}
          colors={['#FFFFFF', '#F0FFF5']}
          accentColor="#27AE60"
        />
        <RoleCard
          role="delivery"
          label={langText.delivery}
          colors={['#FFFFFF', '#FFF8F0']}
          accentColor="#FF7043"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    height: height * 0.3,
    paddingHorizontal: SPACING.xl,
    paddingTop: 45,
    justifyContent: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    position: 'absolute',
    top: 45,
    left: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backTxt: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semiBold,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  title: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.extraBold,
    color: COLORS.white,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    marginTop: -25,
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    height: 90,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  badgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
});

export default RoleSelectionScreen;
