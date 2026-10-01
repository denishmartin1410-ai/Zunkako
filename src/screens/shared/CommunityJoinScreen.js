// ============================================================
// src/screens/shared/CommunityJoinScreen.js
// Registration complete ஆனதும் காட்டும் screen
// WhatsApp Community join + Firebase user count
// ============================================================

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';

// WhatsApp Community Links (உன்னுடைய real links இங்கே போடு)
const COMMUNITY_LINKS = {
  farmer: 'https://chat.whatsapp.com/YOUR_FARMER_GROUP_INVITE_CODE',
  consumer: 'https://chat.whatsapp.com/YOUR_CONSUMER_GROUP_INVITE_CODE',
};

const CommunityJoinScreen = ({userType, userName, onContinue}) => {
  const [joining, setJoining] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleJoinWhatsApp = async () => {
    setJoining(true);
    const link = COMMUNITY_LINKS[userType] || COMMUNITY_LINKS.consumer;

    try {
      const canOpen = await Linking.canOpenURL(link);
      if (canOpen) {
        await Linking.openURL(link);
      } else {
        Alert.alert(
          'WhatsApp இல்லை',
          'WhatsApp பதிவிறக்கம் செய்த பிறகு சேரலாம்!\nWhatsApp not installed.',
          [{text: 'சரி / OK'}],
        );
      }
    } catch (error) {
      console.log('WhatsApp error:', error);
    }
    setJoining(false);
  };

  const isFarmer = userType === 'farmer';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={styles.bg}>
        <Animated.View
          style={[
            styles.content,
            {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
          ]}>
          {/* Success check */}
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>

          <Text style={styles.title}>வரவேற்கிறோம், {userName}!</Text>
          <Text style={styles.titleEn}>Welcome to Zunkako!</Text>

          <Text style={styles.subtitle}>
            நீங்கள் Zunkako-வில் சேர்ந்துவிட்டீர்கள்!{'\n'}
            You've successfully joined Zunkako!
          </Text>

          {/* Community join card */}
          <View style={styles.communityCard}>
            <Text style={styles.communityEmoji}>{isFarmer ? '👨‍🌾' : '🛒'}</Text>
            <Text style={styles.communityTitle}>
              {isFarmer
                ? 'Zunkako விவசாயிகள் குழுவில் சேரவும்!'
                : 'Zunkako நுகர்வோர் குழுவில் சேரவும்!'}
            </Text>
            <Text style={styles.communitySubtitle}>
              {isFarmer
                ? 'Join Zunkako Farmers WhatsApp Group'
                : 'Join Zunkako Consumers WhatsApp Group'}
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsList}>
              {(isFarmer
                ? [
                    'New feature updates',
                    'Farming tips share',
                    'Other farmers nearby connect',
                    'Priority support available',
                  ]
                : [
                    'Fresh product alerts',
                    'Special offers & discounts',
                    'Farmer stories',
                    'Exclusive member benefits',
                  ]
              ).map((benefit, i) => (
                <Text key={i} style={styles.benefitItem}>
                  {benefit}
                </Text>
              ))}
            </View>

            {/* WhatsApp Join button */}
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleJoinWhatsApp}
              disabled={joining}>
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                style={styles.whatsappBtnGrad}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.whatsappEmoji}>💬</Text>
                <Text style={styles.whatsappBtnTxt}>
                  {joining
                    ? 'Opening WhatsApp...'
                    : 'WhatsApp குழுவில் சேர் / Join Group'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Continue button */}
          <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
            <Text style={styles.continueBtnTxt}>
              App-ஐ தொடங்கு → / Start Using App →
            </Text>
          </TouchableOpacity>

          <Text style={styles.skipTxt}>
            பிறகு Settings-ல் சேரலாம்{'\n'}
            Can join later from Settings
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {alignItems: 'center', width: '100%'},
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  successEmoji: {fontSize: 48},
  title: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  titleEn: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  communityCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: SPACING.lg,
  },
  communityEmoji: {fontSize: 44, marginBottom: SPACING.sm},
  communityTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  communitySubtitle: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: SPACING.md,
  },
  benefitsList: {width: '100%', marginBottom: SPACING.lg},
  benefitItem: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.9)',
    paddingVertical: 3,
    lineHeight: 20,
  },
  whatsappBtn: {width: '100%', borderRadius: RADIUS.lg, overflow: 'hidden'},
  whatsappBtnGrad: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  whatsappEmoji: {fontSize: 22},
  whatsappBtnTxt: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  continueBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  continueBtnTxt: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.semiBold,
  },
  skipTxt: {
    fontSize: FONTS.xs,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default CommunityJoinScreen;
