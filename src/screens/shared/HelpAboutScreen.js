// ============================================================
// src/screens/shared/HelpAboutScreen.js
// ✅ Proper padding/neatness
// ✅ Contact info with real email
// ✅ i18n support
// ✅ Separated Help & FAQ and About App modes
// ✅ Dynamic localized FAQ mapping (14 items)
// ✅ Premium BackButton integrated
// ============================================================

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../context/ThemeContext';
import BackButton from '../../utils/BackButton';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ✅ Change these to your real contact details:
const CONTACT_WHATSAPP_1 = '919360425423';
const CONTACT_WHATSAPP_2 = '919585475247';
const CONTACT_PHONE_1 = '9360425423';
const CONTACT_PHONE_2 = '9585475247';
const CONTACT_EMAIL = 'f2cnow@gmail.com';

const HelpAboutScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const [openFaq, setOpenFaq] = useState(null);

  const mode = route.params?.mode || 'help';

  const faqs = Array.from({length: 14}, (_, i) => {
    const num = i + 1;
    return {
      q: t(`help.faq${num}q`),
      a: t(`help.faq${num}a`),
    };
  });

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          {mode === 'about'
            ? `ℹ️ ${t('settings.about', {defaultValue: 'About App'})}`
            : `❓ ${t('settings.help', {defaultValue: 'Help & FAQ'})}`}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {mode === 'about' ? (
          /* About App */
          <View
            style={[
              styles.card,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}>
            <Text style={[styles.cardTitle, {color: themeColors.text}]}>
              {t('help.aboutF2C', {defaultValue: '🌿 F2C பற்றி'})}
            </Text>
            <Text style={[styles.cardBody, {color: themeColors.subText}]}>
              {t('help.aboutDesc')}
            </Text>
          </View>
        ) : (
          /* Help & FAQ */
          <>
            {/* FAQ */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                  borderWidth: isDark ? 1 : 0,
                },
              ]}>
              <Text style={[styles.cardTitle, {color: themeColors.text}]}>
                💬{' '}
                {t('help.faqTitle', {
                  defaultValue: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
                })}
              </Text>
              {faqs.map((faq, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.faqItem,
                    idx < faqs.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: themeColors.border,
                    },
                  ]}
                  onPress={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  <View style={styles.faqHeader}>
                    <Text
                      style={[styles.faqQ, {color: themeColors.text}]}
                      numberOfLines={openFaq === idx ? 10 : 2}>
                      {faq.q}
                    </Text>
                    <Text
                      style={[styles.faqArrow, {color: themeColors.textMuted}]}>
                      {openFaq === idx ? '▲' : '▼'}
                    </Text>
                  </View>
                  {openFaq === idx && (
                    <Text
                      style={[
                        styles.faqA,
                        {
                          color: themeColors.subText,
                          borderLeftColor: isDark
                            ? '#4CAF50'
                            : COLORS.primaryGreen,
                        },
                      ]}>
                      {faq.a}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                  borderWidth: isDark ? 1 : 0,
                },
              ]}>
              <Text style={[styles.cardTitle, {color: themeColors.text}]}>
                {t('help.contact', {defaultValue: '📞 தொடர்பு / Contact Us'})}
              </Text>

              <Text
                style={[styles.contactNote, {color: themeColors.textMuted}]}>
                {t('help.contactNote', {
                  defaultValue:
                    'ஏதேனும் பிரச்சனை வந்தால் எங்களை தொடர்பு கொள்ளுங்கள்:',
                })}
              </Text>

              {/* WhatsApp 1 */}
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  {borderBottomColor: themeColors.border},
                ]}
                onPress={() =>
                  Linking.openURL(
                    `https://wa.me/${CONTACT_WHATSAPP_1}?text=Hi F2C Support`,
                  )
                }>
                <View
                  style={[styles.contactIcon, {backgroundColor: '#25D366'}]}>
                  <Text style={styles.contactIconTxt}>💬</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[styles.contactLabel, {color: themeColors.subText}]}>
                    WhatsApp 1
                  </Text>
                  <Text
                    style={[styles.contactValue, {color: themeColors.text}]}>
                    +91 {CONTACT_PHONE_1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.contactArrow,
                    {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                  ]}>
                  →
                </Text>
              </TouchableOpacity>

              {/* WhatsApp 2 */}
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  {borderBottomColor: themeColors.border},
                ]}
                onPress={() =>
                  Linking.openURL(
                    `https://wa.me/${CONTACT_WHATSAPP_2}?text=Hi F2C Support`,
                  )
                }>
                <View
                  style={[styles.contactIcon, {backgroundColor: '#25D366'}]}>
                  <Text style={styles.contactIconTxt}>💬</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[styles.contactLabel, {color: themeColors.subText}]}>
                    WhatsApp 2
                  </Text>
                  <Text
                    style={[styles.contactValue, {color: themeColors.text}]}>
                    +91 {CONTACT_PHONE_2}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.contactArrow,
                    {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                  ]}>
                  →
                </Text>
              </TouchableOpacity>

              {/* Phone 1 */}
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  {borderBottomColor: themeColors.border},
                ]}
                onPress={() => Linking.openURL(`tel:${CONTACT_PHONE_1}`)}>
                <View
                  style={[styles.contactIcon, {backgroundColor: '#2196F3'}]}>
                  <Text style={styles.contactIconTxt}>📞</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[styles.contactLabel, {color: themeColors.subText}]}>
                    {t('help.phone', {defaultValue: 'தொலைபேசி / Phone'})} 1
                  </Text>
                  <Text
                    style={[styles.contactValue, {color: themeColors.text}]}>
                    +91 {CONTACT_PHONE_1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.contactArrow,
                    {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                  ]}>
                  →
                </Text>
              </TouchableOpacity>

              {/* Phone 2 */}
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  {borderBottomColor: themeColors.border},
                ]}
                onPress={() => Linking.openURL(`tel:${CONTACT_PHONE_2}`)}>
                <View
                  style={[styles.contactIcon, {backgroundColor: '#2196F3'}]}>
                  <Text style={styles.contactIconTxt}>📞</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[styles.contactLabel, {color: themeColors.subText}]}>
                    {t('help.phone', {defaultValue: 'தொலைபேசி / Phone'})} 2
                  </Text>
                  <Text
                    style={[styles.contactValue, {color: themeColors.text}]}>
                    +91 {CONTACT_PHONE_2}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.contactArrow,
                    {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                  ]}>
                  →
                </Text>
              </TouchableOpacity>

              {/* Email */}
              <TouchableOpacity
                style={[styles.contactRow, {borderBottomWidth: 0}]}
                onPress={() =>
                  Linking.openURL(
                    `mailto:${CONTACT_EMAIL}?subject=F2C App Support`,
                  )
                }>
                <View
                  style={[
                    styles.contactIcon,
                    {backgroundColor: isDark ? '#1E3A24' : COLORS.primaryGreen},
                  ]}>
                  <Text style={styles.contactIconTxt}>✉️</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[styles.contactLabel, {color: themeColors.subText}]}>
                    Email
                  </Text>
                  <Text
                    style={[styles.contactValue, {color: themeColors.text}]}>
                    {CONTACT_EMAIL}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.contactArrow,
                    {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                  ]}>
                  →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Working hours */}
            <View
              style={[
                styles.hoursCard,
                {
                  backgroundColor: isDark ? '#14251B' : '#E8F5E9',
                  borderLeftColor: isDark ? '#4CAF50' : COLORS.primaryGreen,
                },
              ]}>
              <Text
                style={[
                  styles.hoursTitle,
                  {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                ]}>
                {t('help.workingHours', {defaultValue: '🕐 Working Hours'})}
              </Text>
              <Text
                style={[
                  styles.hoursText,
                  {color: isDark ? '#A1E9C5' : COLORS.primaryGreenDark},
                ]}>
                {t('help.hoursDetail', {
                  defaultValue:
                    'Monday - Saturday: 8 AM - 8 PM\nSunday: 9 AM - 5 PM',
                })}
              </Text>
            </View>
          </>
        )}

        <View style={{height: rs(40)}} />
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.white,
  },

  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.small,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  cardBody: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    lineHeight: rs(22),
  },

  faqItem: {paddingVertical: SPACING.md},
  faqBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.borderLight},
  faqHeader: {flexDirection: 'row', alignItems: 'flex-start'},
  faqQ: {
    flex: 1,
    fontSize: rs(FONTS.md),
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: rs(22),
  },
  faqArrow: {
    fontSize: rs(12),
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
    marginTop: 4,
  },
  faqA: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    lineHeight: rs(20),
    marginTop: SPACING.sm,
    paddingLeft: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryGreen,
  },

  // ✅ Contact rows - proper padding
  contactNote: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    lineHeight: rs(20),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  contactIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contactIconTxt: {fontSize: rs(20)},
  contactInfo: {flex: 1},
  contactLabel: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textMuted,
  },
  contactValue: {
    fontSize: rs(FONTS.md),
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  contactArrow: {
    fontSize: rs(18),
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },

  hoursCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryGreen,
    marginBottom: SPACING.md,
  },
  hoursTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    marginBottom: SPACING.sm,
  },
  hoursText: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryGreenDark,
    lineHeight: rs(22),
  },
});

export default HelpAboutScreen;
