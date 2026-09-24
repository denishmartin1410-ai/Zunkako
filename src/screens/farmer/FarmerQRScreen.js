// ============================================================
// src/screens/farmer/FarmerQRScreen.js
// ✅ Standalone file - FarmerScreens.js-ல் import பண்ணு
// ✅ QR library crash FIX - safe try/catch
// ✅ Library இல்லாதபோது ID text காட்டும்
// ============================================================

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../context/ThemeContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// Avatar with first letter fallback
const AvatarView = ({uri, name, size = 60, style}) => {
  const [imgError, setImgError] = useState(false);
  const letter = (name || 'F').charAt(0).toUpperCase();
  const bgColors = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'];
  const bg = bgColors[letter.charCodeAt(0) % bgColors.length];

  if (!uri || imgError) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}>
        <Text
          style={{
            color: COLORS.white,
            fontSize: size * 0.4,
            fontWeight: 'bold',
          }}>
          {letter}
        </Text>
      </View>
    );
  }
  return (
    <FastImage
      source={{uri, priority: FastImage.priority.normal}}
      style={[{width: size, height: size, borderRadius: size / 2}, style]}
      resizeMode={FastImage.resizeMode.cover}
      onError={() => setImgError(true)}
    />
  );
};

const FarmerQRScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const [QRCode, setQRCode] = useState(null);
  const [qrReady, setQrReady] = useState(false);
  const [qrError, setQrError] = useState(false);

  // QR value - unique per farmer
  const qrValue =
    user?.qrCode ||
    `ZUNKAKO-FARMER-${(user?.id || user?.uid || 'UNKNOWN')
      .slice(0, 8)
      .toUpperCase()}`;

  useEffect(() => {
    // ✅ Save QR code to Firestore so customers can look it up
    const saveQrCode = async () => {
      const farmerId = user?.id || user?.uid;
      if (!farmerId) {
        return;
      }
      try {
        const firestore = require('@react-native-firebase/firestore').default;
        await firestore()
          .collection('farmers')
          .doc(farmerId)
          .set({qrCode: qrValue}, {merge: true});
        await firestore()
          .collection('users')
          .doc(farmerId)
          .set({qrCode: qrValue}, {merge: true});
      } catch (e) {
        console.log('QR save error (non-critical):', e.message);
      }
    };
    saveQrCode();

    // ✅ Safe load QR component - crash இல்லாமல்
    const loadQR = async () => {
      try {
        const mod = require('react-native-qrcode-svg');
        const Component = mod?.default || mod?.QRCode || mod;
        if (Component && typeof Component === 'function') {
          setQRCode(() => Component);
          setQrReady(true);
        } else {
          setQrError(true);
        }
      } catch (e) {
        setQrError(true);
      }
    };
    loadQR();
  }, []);

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          📷 {t('farmer.qrCode', {defaultValue: 'My QR Code'})}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <View style={styles.center}>
        <LinearGradient
          colors={isDark ? ['#1A3028', '#14223A'] : ['#E8F5E9', '#E3F2FD']}
          style={styles.card}>
          {/* Avatar */}
          <AvatarView
            uri={user?.avatar}
            name={user?.name}
            size={rs(72)}
            style={{
              borderWidth: 3,
              borderColor: COLORS.primaryGreen,
              marginBottom: rs(12),
            }}
          />

          {/* Name + Farm */}
          <Text style={[styles.name, {color: themeColors.text}]}>
            {user?.name || 'விவசாயி'}
          </Text>
          <Text style={[styles.farm, {color: themeColors.subText}]}>
            {user?.farmName || 'என் பண்ணை'}
          </Text>

          {/* QR Code or Fallback */}
          <View style={styles.qrBox}>
            {!qrReady && !qrError ? (
              <ActivityIndicator color={COLORS.primaryGreen} size="large" />
            ) : qrReady && QRCode ? (
              // ✅ QR Code render
              <QRCode
                value={qrValue}
                size={rs(190)}
                color="#0D5C32"
                backgroundColor={COLORS.white}
              />
            ) : (
              // ✅ Fallback: Library இல்லாதபோது
              <View style={styles.fallbackBox}>
                <Text style={styles.fallbackIcon}>📱</Text>
                <Text style={[styles.fallbackTitle, {color: COLORS.textMuted}]}>
                  உங்கள் ID:
                </Text>
                <Text
                  style={[
                    styles.fallbackId,
                    {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                  ]}>
                  {qrValue}
                </Text>
                <Text style={styles.fallbackNote} />
              </View>
            )}
          </View>

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>
              🏆 {t('farmer.zunkakoFarmer', {defaultValue: 'Zunkako விவசாயி'})}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    paddingTop: rs(50),
    paddingBottom: rs(16),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {width: rs(40)},
  backTxt: {color: COLORS.white, fontSize: rs(22), fontWeight: 'bold'},
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    borderRadius: RADIUS.xxl || 24,
    padding: rs(SPACING.xxl || 24),
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.large,
  },
  name: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  farm: {fontSize: rs(FONTS.sm), color: COLORS.textMuted, marginBottom: rs(20)},
  qrBox: {
    backgroundColor: COLORS.white,
    padding: rs(16),
    borderRadius: RADIUS.xl || 16,
    ...SHADOWS.small,
    marginBottom: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: rs(220),
    minHeight: rs(220),
  },
  fallbackBox: {alignItems: 'center', padding: rs(10)},
  fallbackIcon: {fontSize: rs(48), marginBottom: 8},
  fallbackTitle: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  fallbackId: {
    fontSize: rs(FONTS.sm),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: rs(20),
  },
  fallbackNote: {
    fontSize: rs(10),
    color: COLORS.textGray || '#999',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: rs(16),
  },
  instruction: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: rs(20),
    marginBottom: rs(16),
  },
  badge: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.full || 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeTxt: {color: COLORS.white, fontSize: rs(FONTS.sm), fontWeight: 'bold'},
});

export default FarmerQRScreen;
