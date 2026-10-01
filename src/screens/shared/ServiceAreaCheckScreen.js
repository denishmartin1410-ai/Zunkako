// ============================================================
// src/screens/shared/ServiceAreaCheckScreen.js
// User location service area-ல் இல்லாதபோது காட்டும் screen
// ============================================================

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import {isWithinServiceArea, LAUNCH_CONFIG} from '../../utils/locationConfig';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';

const ServiceAreaCheckScreen = ({onServiceAreaConfirmed, onSkip}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [pincode, setPincode] = useState('');
  const [checkMethod, setCheckMethod] = useState('auto'); // 'auto' | 'manual'

  // ── Auto Location Check ──
  const checkAutoLocation = () => {
    setIsChecking(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const result = isWithinServiceArea(latitude, longitude);

        setIsChecking(false);
        if (result.isWithin) {
          onServiceAreaConfirmed(true);
        } else {
          Alert.alert(
            'கவலைப்படாதீர்கள்!',
            `நீங்கள் இப்போது ${LAUNCH_CONFIG.cityName}-லிருந்து ${result.distance} km தூரத்தில் இருக்கிறீர்கள்.\n\nNot in our service area yet!\n\nஆனால் விரைவில் உங்கள் நகரத்திற்கும் வருகிறோம்! மின்னஞ்சல் மூலம் பதிவு செய்யுங்கள்`,
            [
              {
                text: 'எனக்கு அறிவிக்கவும்',
                onPress: () => onSkip('waitlist'),
              },
              {
                text: 'அஞ்சல் குறியீட்டை உள்ளிடவும்',
                onPress: () => setCheckMethod('manual'),
              },
            ],
          );
        }
      },
      error => {
        setIsChecking(false);
        console.log('Location error:', error);
        setCheckMethod('manual');
      },
      {enableHighAccuracy: false, timeout: 10000},
    );
  };

  // ── Manual Pincode Check ──
  const checkPincode = () => {
    if (pincode.length !== 6) {
      Alert.alert('பிழை', 'சரியான 6 இலக்க பின்கோடு உள்ளிடவும்');
      return;
    }

    const pin = parseInt(pincode, 10);
    // Coimbatore pincodes: 641001 - 641114
    const isCoimbatore = pin >= 641001 && pin <= 641114;

    if (isCoimbatore) {
      onServiceAreaConfirmed(true);
    } else {
      Alert.alert(
        'விரைவில் வருகிறோம்!',
        `Pincode ${pincode} தற்போது உங்கள் பகுதியில் எங்கள் சேவை கிடைக்கவில்லை.\n\nதற்போது ${LAUNCH_CONFIG.cityName} மட்டும்.\n\nஉங்கள் மின்னஞ்சல் தாருங்கள் - உங்கள் பகுதியில் தொடங்கும் போது அறிவிப்போம்! 🌿`,
        [
          {text: 'Waitlist', onPress: () => onSkip('waitlist')},
          {text: 'Browse', onPress: () => onSkip('browse')},
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={styles.bg}>
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.content}>
          {/* Logo */}
          <Text style={styles.logo}>🌿 Zunkako</Text>
          <Text style={styles.title}>உங்கள் இடம் சரிபார்க்கிறோம்</Text>
          <Text style={styles.subtitle}>Checking your location</Text>

          {/* Service area info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>📍</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>
                இப்போது {LAUNCH_CONFIG.cityName} மட்டும்
              </Text>
              <Text style={styles.infoSub}>
                Currently serving {LAUNCH_CONFIG.cityName} (
                {LAUNCH_CONFIG.radiusKm}km radius)
              </Text>
            </View>
          </View>

          {checkMethod === 'auto' ? (
            <>
              {/* Auto location button */}
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={checkAutoLocation}
                disabled={isChecking}>
                <LinearGradient
                  colors={['#27AE60', '#1976D2']}
                  style={styles.locationBtnGrad}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  {isChecking ? (
                    <>
                      <ActivityIndicator color={COLORS.white} />
                      <Text style={styles.locationBtnTxt}>
                        சரிபார்க்கிறோம்...
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.locationBtnTxt}>
                      என் இடம் சரிபார்க்க / Check My Location
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualBtn}
                onPress={() => setCheckMethod('manual')}>
                <Text style={styles.manualBtnTxt}>
                  பின்கோடு மூலம் சரிபார்க்க →
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Manual pincode */}
              <Text style={styles.pincodeLabel}>
                பின்கோடு உள்ளிடவும் / Enter Pincode
              </Text>
              <View style={styles.pincodeRow}>
                <TextInput
                  style={styles.pincodeInput}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="641001"
                  placeholderTextColor={COLORS.textGray}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.pincodeBtn}
                  onPress={checkPincode}>
                  <LinearGradient
                    colors={COLORS.gradientButton}
                    style={styles.pincodeBtnGrad}>
                    <Text style={styles.pincodeBtnTxt}>✓</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.manualBtn}
                onPress={() => setCheckMethod('auto')}>
                <Text style={styles.manualBtnTxt}>← GPS முறைக்கு திரும்பு</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Skip option */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => onSkip('browse')}>
            <Text style={styles.skipTxt}>
              தற்போது தவிர்த்து → உலாவலை தொடரலாம்
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  bg: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  circle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circle2: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    width: '100%',
  },
  logo: {
    fontSize: 36,
    color: COLORS.white,
    fontWeight: FONTS.black,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoEmoji: {fontSize: 32, marginRight: SPACING.md},
  infoText: {flex: 1},
  infoTitle: {fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.white},
  infoSub: {fontSize: FONTS.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  locationBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  locationBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  locationBtnTxt: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  manualBtn: {marginBottom: SPACING.md},
  manualBtnTxt: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONTS.sm,
    textDecorationLine: 'underline',
  },
  pincodeLabel: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semiBold,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  pincodeRow: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pincodeInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 52,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
  },
  pincodeBtn: {borderRadius: RADIUS.md, overflow: 'hidden'},
  pincodeBtnGrad: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pincodeBtnTxt: {
    color: COLORS.white,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
  },
  skipBtn: {marginTop: SPACING.md},
  skipTxt: {color: 'rgba(255,255,255,0.65)', fontSize: FONTS.sm},
});

export default ServiceAreaCheckScreen;
