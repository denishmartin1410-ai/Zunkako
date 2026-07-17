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
    delivery: 'டெலிவரி',
    back: '← பின்னால்',
  },
  en: {
    title: 'Who are you?',
    tagline: 'Choose your profile to continue',
    consumer: 'Consumer',
    farmer: 'Farmer',
    delivery: 'Delivery',
    back: '← Back',
  },
  ml: {
    title: 'നിങ്ങൾ ആരാണ്?',
    tagline: 'തുടരാൻ നിങ്ങളുടെ പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക',
    consumer: 'ഉപഭോക്താവ്',
    farmer: 'കർഷകൻ',
    delivery: 'ഡെലിവറി',
    back: '← തിരികെ',
  },
};

const RoleSelectionScreen = ({navigation, route}) => {
  const {i18n} = useTranslation();
  const currentLang = i18n.language || 'ta';
  const langText = TRANSLATIONS[currentLang] || TRANSLATIONS.ta;
  const mode = route.params?.mode || 'login'; // 'login' or 'register'

  const handleRoleSelect = role => {
    if (mode === 'login') {
      navigation.navigate('Login', {role});
    } else {
      navigation.navigate('Register', {role});
    }
  };

  const RoleCard = ({role, label, emoji, colors}) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => handleRoleSelect(role)}>
      <LinearGradient
        colors={colors}
        style={styles.cardGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
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
          style={styles.backBtn}>
          <Text style={styles.backTxt}>{langText.back}</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{langText.title}</Text>
          <Text style={styles.tagline}>{langText.tagline}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <RoleCard
          role="consumer"
          label={langText.consumer}
          emoji="🛒"
          colors={['#E3F2FD', '#BBDEFB']}
        />
        <RoleCard
          role="farmer"
          label={langText.farmer}
          emoji="👨‍🌾"
          colors={['#E8F5E9', '#C8E6C9']}
        />
        <RoleCard
          role="delivery"
          label={langText.delivery}
          emoji="🚚"
          colors={['#FFF3E0', '#FFE0B2']}
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
    height: height * 0.35,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backTxt: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  titleContainer: {
    marginTop: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -40,
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    height: height * 0.14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  cardEmoji: {
    fontSize: 48,
  },
  cardLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
});

export default RoleSelectionScreen;
