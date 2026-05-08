// ============================================================
// src/screens/shared/HelpAboutScreen.js
// ✅ Proper padding/neatness
// ✅ Contact info with real email
// ✅ i18n support
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const { width } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ✅ Change these to your real contact details:
const CONTACT_WHATSAPP = '919360425423'; // +91 9360425423
const CONTACT_PHONE = '9360425423';
const CONTACT_EMAIL = 'denishmartin1410@gmail.com'; // ← Your Gmail

const HelpAboutScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: t('help.faq1q', { defaultValue: 'F2C App என்றால் என்ன?' }),
      a: t('help.faq1a', { defaultValue: 'F2C என்பது "விவசாயியிடமிருந்து நுகர்வோருக்கு" என்பதைக் குறிக்கும். விவசாயியிடம் இருந்து நேரடியாக நுகர்வோருக்கு தரமான பொருட்கள் கிடைக்கும். இடைத்தரகர்கள் இல்லை, அதனால் விலை குறைவு, தரம் அதிகம்!' }),
    },
    {
      q: t('help.faq2q', { defaultValue: 'பொருட்களை எப்படி ஆர்டர் செய்வது?' }),
      a: t('help.faq2a', { defaultValue: 'முகப்பு திரையில் இருந்து பொருளைத் தேர்வு செய்து "கார்ட்டில் சேர்" என்பதை அழுத்தவும். பின்னர் கார்ட்டிற்கு சென்று "Checkout" என்பதைத் தேர்வு செய்து முகவரியை உள்ளிடவும். அவ்வளவுதான்!' }),
    },
    {
      q: t('help.faq3q', { defaultValue: 'பொருட்கள் வந்து சேர எவ்வளவு நேரம் ஆகும்?' }),
      a: t('help.faq3a', { defaultValue: 'பொதுவாக 24 மணி நேரத்திற்குள் பொருட்கள் கிடைக்கும். சில விவசாயிகள் குறைந்த நேரத்திலேயே டெலிவரியும் வழங்குகின்றனர். குறிப்பிட்ட டெலிவரி நேரத்தை பொருளின் விவரப் பக்கத்தில் பார்க்கலாம்!' }),
    },
    {
      q: t('help.faq4q', { defaultValue: 'முன்பதிவு என்றால் என்ன?' }),
      a: t('help.faq4a', { defaultValue: 'பொருட்கள் அறுவடை செய்யப்படும் முன்பே முன்பதிவு செய்யலாம். அறுவடை செய்யப்பட்ட நாளில் நேரடியாக புதிய பசுமைப் பொருட்கள் கிடைக்கும். மேலும், விலையும் 15-28% வரை குறைவாக இருக்கும்!' }),
    },
    {
      q: t('help.faq5q', { defaultValue: 'குழுவாக வாங்குதல் என்றால் என்ன?' }),
      a: t('help.faq5a', { defaultValue: '5 பேர் அல்லது அதற்கு மேற்பட்டோர் சேர்ந்து ஆர்டர் செய்தால் 15-25% வரை தள்ளுபடி மற்றும் இலவச டெலிவரி கிடைக்கும். உங்கள் அண்டை வீட்டாரையும் இதில் சேர்க்கலாம்!' }),
    },
    {
      q: t('help.faq6q', { defaultValue: 'பணம் செலுத்துவது எப்படி?' }),
      a: t('help.faq6a', { defaultValue: 'தற்போது Cash on Delivery (COD) மட்டுமே உள்ளது. விரைவில் UPI, PhonePe, GPay போன்ற ஆன்லைன் கட்டண வசதிகள் சேர்க்கப்படும்!' }),
    },
    {
      q: t('help.faq7q', { defaultValue: 'விவசாயி சரிபார்க்கப்பட்டது என்றால் என்ன?' }),
      a: t('help.faq7a', { defaultValue: 'F2C குழு நேரில் பண்ணைக்கு சென்று சரிபார்த்த விவசாயிகளுக்கு "சரிபார்க்கப்பட்டது" என்ற அடையாளம் வழங்கப்படுகிறது. இதை QR குறியீட்டை ஸ்கேன் செய்து உறுதிப்படுத்தலாம்!' }),
    },
    {
      q: t('help.faq8q', { defaultValue: 'பொருளை திருப்பி அளிக்க / பணத்தை திரும்ப பெறுவது எப்படி?' }),
      a: t('help.faq8a', { defaultValue: 'பொருளின் தரம் திருப்திகரமாக இல்லாவிட்டால், 24 மணி நேரத்திற்குள் ஆதரவு அணியை தொடர்புகொள்ளவும். முழு பணமும் திருப்பி வழங்கப்படும்!' }),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          ❓ {t('settings.help', { defaultValue: 'உதவி & FAQ' })}
        </Text>
        <View style={{ width: rs(40) }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* About App */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🌿 {t('help.aboutF2C', { defaultValue: 'F2C பற்றி' })}
          </Text>
          <Text style={styles.cardBody}>
            {t('help.aboutDesc', {
              defaultValue:
                '✅F2C (Farm to Consumer) - விவசாயியிடம் இருந்து நேரடியாக உங்களுக்கு.\n\n' +
                '✅ 100% Fresh - நேரடி பண்ணையிலிருந்து\n' +
                '🌾 Harvest Calendar - வார அறுவடை அட்டவணை\n' +
                '💵 Fair Price - இடையிலர் இல்லாமல்\n' +
                '⏱ Freshness Tracker - நேரடி புதுமை நேரக் கணிப்பு\n' +
                '👨‍👩‍👧 Group Buy - கூட்டு வாங்கல் தள்ளுபடி\n' +
                '📅 Pre-Order - முன்கூட்டியே ஆர்டர்\n' +
                '🥗 Nutrition Report - வார ஊட்டச்சத்து அறிக்கை\n' +
                '🗺️ Farm Visit - பண்ணைக்கு நேரில் வருகை\n' +
                '💬 Farmer Chat - நேரடி விவசாயி அரட்டை\n' +
                '📷 QR Verification - விவசாயி சரிபார்ப்பு\n' +
                '🌍 3 மொழிகள் - தமிழ், ஆங்கிலம், மலையாளம்\n' +
                '✅ 100% Natural & Organic options\n\n' +
                'Version 1.0.0 | Made with ❤️ for Tamil Nadu Farmers'
            })}
          </Text>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            💬 {t('help.faqTitle', { defaultValue: 'அடிக்கடி கேட்கப்படும் கேள்விகள்' })}
          </Text>
          {faqs.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.faqItem, idx < faqs.length - 1 && styles.faqBorder]}
              onPress={() => setOpenFaq(openFaq === idx ? null : idx)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQ} numberOfLines={openFaq === idx ? 10 : 2}>
                  {faq.q}
                </Text>
                <Text style={styles.faqArrow}>{openFaq === idx ? '▲' : '▼'}</Text>
              </View>
              {openFaq === idx && (
                <Text style={styles.faqA}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact - ✅ Proper padding */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📞 {t('help.contact', { defaultValue: 'தொடர்பு / Contact Us' })}
          </Text>

          <Text style={styles.contactNote}>
            {t('help.contactNote', { defaultValue: 'ஏதேனும் பிரச்சனை வந்தால் எங்களை தொடர்பு கொள்ளுங்கள்:' })}
          </Text>

          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(`https://wa.me/${CONTACT_WHATSAPP}?text=Hi F2C Support`)}>
            <View style={[styles.contactIcon, { backgroundColor: '#25D366' }]}>
              <Text style={styles.contactIconTxt}>💬</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValue}>+91 {CONTACT_PHONE}</Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)}>
            <View style={[styles.contactIcon, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.contactIconTxt}>📞</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>
                {t('help.phone', { defaultValue: 'தொலைபேசி / Phone' })}
              </Text>
              <Text style={styles.contactValue}>+91 {CONTACT_PHONE}</Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[styles.contactRow, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=F2C App Support`)}>
            <View style={[styles.contactIcon, { backgroundColor: COLORS.primaryGreen }]}>
              <Text style={styles.contactIconTxt}>✉️</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Working hours */}
        <View style={styles.hoursCard}>
          <Text style={styles.hoursTitle}>
            🕐 {t('help.workingHours', { defaultValue: 'Working Hours' })}
          </Text>
          <Text style={styles.hoursText}>
            {t('help.hoursDetail', { defaultValue: 'Monday - Saturday: 8 AM - 8 PM\nSunday: 9 AM - 5 PM' })}
          </Text>
        </View>

        <View style={{ height: rs(40) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: rs(50), paddingBottom: rs(16),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { width: rs(40) },
  backTxt: { color: COLORS.white, fontSize: rs(22), fontWeight: 'bold' },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white,
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
    fontSize: rs(FONTS.lg), fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  cardBody: {
    fontSize: rs(FONTS.sm), color: COLORS.textSecondary,
    lineHeight: rs(22),
  },

  faqItem: { paddingVertical: SPACING.md },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  faqQ: {
    flex: 1,
    fontSize: rs(FONTS.md), fontWeight: '600',
    color: COLORS.textPrimary, lineHeight: rs(22),
  },
  faqArrow: {
    fontSize: rs(12), color: COLORS.textMuted,
    marginLeft: SPACING.sm, marginTop: 4,
  },
  faqA: {
    fontSize: rs(FONTS.sm), color: COLORS.textSecondary,
    lineHeight: rs(20), marginTop: SPACING.sm,
    paddingLeft: SPACING.sm,
    borderLeftWidth: 3, borderLeftColor: COLORS.primaryGreen,
  },

  // ✅ Contact rows - proper padding
  contactNote: {
    fontSize: rs(FONTS.sm), color: COLORS.textMuted,
    marginBottom: SPACING.md, lineHeight: rs(20),
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  contactIcon: {
    width: rs(44), height: rs(44), borderRadius: rs(22),
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contactIconTxt: { fontSize: rs(20) },
  contactInfo: { flex: 1 },
  contactLabel: {
    fontSize: rs(FONTS.xs), color: COLORS.textMuted,
  },
  contactValue: {
    fontSize: rs(FONTS.md), fontWeight: '600',
    color: COLORS.textPrimary, marginTop: 2,
  },
  contactArrow: {
    fontSize: rs(18), color: COLORS.primaryGreen,
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
    fontSize: rs(FONTS.md), fontWeight: 'bold',
    color: COLORS.primaryGreen, marginBottom: SPACING.sm,
  },
  hoursText: {
    fontSize: rs(FONTS.sm), color: COLORS.primaryGreenDark,
    lineHeight: rs(22),
  },
});

export default HelpAboutScreen;
