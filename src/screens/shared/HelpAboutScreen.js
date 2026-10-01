// ============================================================
// src/screens/shared/HelpAboutScreen.js
// ✅ Proper padding/neatness
// ✅ Contact info with real email
// ✅ i18n support
// ✅ Separated Help & FAQ and About App modes
// ✅ Dynamic localized FAQ mapping (14 items)
// ✅ Premium BackButton integrated
// ============================================================

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Dimensions,
  Platform,
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

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ✅ Change these to your real contact details:
const CONTACT_WHATSAPP_1 = '919360425423';
const CONTACT_WHATSAPP_2 = '919585475247';
const CONTACT_PHONE_1 = '9360425423';
const CONTACT_PHONE_2 = '9585475247';
const CONTACT_EMAIL = 'zunkakoapp@gmail.com';

const FAQ_CATEGORIES = [
  {id: 'all', key: 'faqCategoryAll'},
  {id: 'orders', key: 'faqCategoryOrders'},
  {id: 'delivery', key: 'faqCategoryDelivery'},
  {id: 'price', key: 'faqCategoryPrice'},
  {id: 'quality', key: 'faqCategoryQuality'},
  {id: 'preorder', key: 'faqCategoryPreOrder'},
  {id: 'trust', key: 'faqCategoryTrust'},
  {id: 'farmers', key: 'faqCategoryFarmers'},
  {id: 'support', key: 'faqCategorySupport'},
];

const FAQ_ITEMS = [
  {id: 1, category: 'orders', iconName: 'package'},
  {id: 2, category: 'orders', iconName: 'shopping-cart'},
  {id: 3, category: 'orders', iconName: 'x-circle'},
  {id: 4, category: 'orders', iconName: 'clock'},
  {id: 5, category: 'farmers', iconName: 'grid'},
  {id: 6, category: 'delivery', iconName: 'truck'},
  {id: 7, category: 'delivery', iconName: 'zap'},
  {id: 8, category: 'delivery', iconName: 'clock'},
  {id: 9, category: 'delivery', iconName: 'navigation'},
  {id: 10, category: 'delivery', iconName: 'map'},
  {id: 11, category: 'delivery', iconName: 'map-pin'},
  {id: 12, category: 'price', iconName: 'dollar-sign'},
  {id: 13, category: 'price', iconName: 'credit-card'},
  {id: 14, category: 'price', iconName: 'refresh-cw'},
  {id: 15, category: 'quality', iconName: 'award'},
  {id: 16, category: 'quality', iconName: 'clock'},
  {id: 17, category: 'quality', iconName: 'sun'},
  {id: 18, category: 'quality', iconName: 'camera'},
  {id: 19, category: 'quality', iconName: 'check-circle'},
  {id: 20, category: 'quality', iconName: 'check-square'},
  {id: 21, category: 'preorder', iconName: 'calendar'},
  {id: 22, category: 'preorder', iconName: 'cloud-sun'},
  {id: 23, category: 'preorder', iconName: 'users'},
  {id: 24, category: 'preorder', iconName: 'user-check'},
  {id: 25, category: 'trust', iconName: 'lock'},
  {id: 26, category: 'trust', iconName: 'shield'},
  {id: 27, category: 'trust', iconName: 'image'},
  {id: 28, category: 'trust', iconName: 'message-square'},
  {id: 29, category: 'trust', iconName: 'cpu'},
  {id: 30, category: 'farmers', iconName: 'video'},
  {id: 31, category: 'farmers', iconName: 'globe'},
  {id: 32, category: 'farmers', iconName: 'user'},
  {id: 33, category: 'support', iconName: 'phone'},
  {id: 34, category: 'support', iconName: 'clock'},
  {id: 35, category: 'support', iconName: 'edit-3'},
];

const HelpAboutScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const mode = route.params?.mode || 'help';

  const allFaqs = useMemo(() => {
    return FAQ_ITEMS.map(item => ({
      id: item.id,
      category: item.category,
      iconName: item.iconName,
      q: t(`help.faq${item.id}q`),
      a: t(`help.faq${item.id}a`),
    }));
  }, [t]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allFaqs.filter(faq => {
      const matchesCategory =
        selectedCategory === 'all' || faq.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        faq.q.toLowerCase().includes(query) ||
        faq.a.toLowerCase().includes(query)
      );
    });
  }, [allFaqs, selectedCategory, searchQuery]);

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <Feather
            name={mode === 'about' ? 'info' : 'help-circle'}
            size={20}
            color={COLORS.white}
            style={{marginRight: 8}}
          />
          <Text style={styles.headerTitle}>
            {mode === 'about'
              ? t('settings.about', {defaultValue: 'About App'})
              : t('settings.help', {defaultValue: 'Help & FAQ'})}
          </Text>
        </View>
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
              {t('help.aboutZunkako', {defaultValue: '🌿 Zunkako பற்றி'})}
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
              <View style={styles.faqTitleRow}>
                <Text style={[styles.cardTitle, {color: themeColors.text, marginBottom: 0}]}>
                  💬{' '}
                  {t('help.faqTitle', {
                    defaultValue: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
                  })}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {backgroundColor: isDark ? '#1E3A24' : '#E8F5E9'},
                  ]}>
                  <Text
                    style={[styles.countBadgeTxt, {color: COLORS.primaryGreen}]}>
                    {filteredFaqs.length}
                  </Text>
                </View>
              </View>

              {/* Live Search Bar */}
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? '#1A2923' : '#F5F7F6',
                    borderColor: themeColors.border,
                  },
                ]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, {color: themeColors.text}]}
                  placeholder={t('help.faqSearchPlaceholder', {
                    defaultValue: 'Search questions & answers...',
                  })}
                  placeholderTextColor={isDark ? '#777' : '#999'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Text style={styles.clearIcon}>✖️</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}>
                {FAQ_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected
                            ? COLORS.primaryGreen
                            : isDark
                            ? '#24382E'
                            : '#F0F4F2',
                          borderColor: isSelected
                            ? COLORS.primaryGreen
                            : themeColors.border,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}>
                      <Text
                        style={[
                          styles.categoryChipTxt,
                          {
                            color: isSelected
                              ? COLORS.white
                              : themeColors.subText,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {t(`help.${cat.key}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* FAQ Accordion List */}
              {filteredFaqs.length === 0 ? (
                <View style={styles.noResultsBox}>
                  <Text style={styles.noResultsIcon}>🧐</Text>
                  <Text
                    style={[styles.noResultsTitle, {color: themeColors.text}]}>
                    {t('help.noFaqFound', {
                      defaultValue: 'No matching questions found',
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.noResultsSub,
                      {color: themeColors.subText},
                    ]}>
                    {t('help.noFaqFoundSub', {
                      defaultValue:
                        'Try searching with different keywords or contact our support below.',
                    })}
                  </Text>
                </View>
              ) : (
                filteredFaqs.map((faq, idx) => (
                  <TouchableOpacity
                    key={faq.id}
                    style={[
                      styles.faqItem,
                      idx < filteredFaqs.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: themeColors.border,
                      },
                    ]}
                    onPress={() =>
                      setOpenFaq(openFaq === faq.id ? null : faq.id)
                    }>
                    <View style={styles.faqHeader}>
                      <Feather
                        name={faq.iconName || 'help-circle'}
                        size={18}
                        color={COLORS.primaryGreen}
                        style={{marginRight: 10}}
                      />
                      <Text
                        style={[styles.faqQ, {color: themeColors.text, flex: 1}]}
                        numberOfLines={openFaq === faq.id ? 10 : 2}>
                        {faq.id}. {faq.q}
                      </Text>
                      <Feather
                        name={openFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={themeColors.textMuted}
                      />
                    </View>
                    {openFaq === faq.id && (
                      <View
                        style={[
                          styles.faqAnswerContainer,
                          {
                            borderLeftColor: isDark
                              ? '#4CAF50'
                              : COLORS.primaryGreen,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.faqA,
                            {
                              color: themeColors.subText,
                            },
                          ]}>
                          {faq.a}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
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
                    `https://wa.me/${CONTACT_WHATSAPP_1}?text=Hi Zunkako Support`,
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
                    `https://wa.me/${CONTACT_WHATSAPP_2}?text=Hi Zunkako Support`,
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
                    `mailto:${CONTACT_EMAIL}?subject=Zunkako App Support`,
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

  faqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  countBadgeTxt: {
    fontSize: rs(12),
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    fontSize: rs(14),
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: rs(FONTS.sm),
    paddingVertical: 6,
  },
  clearIcon: {
    fontSize: rs(12),
    padding: 4,
  },
  categoryScroll: {
    paddingVertical: 4,
    paddingBottom: SPACING.md,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryChipTxt: {
    fontSize: rs(12),
  },
  faqItem: {paddingVertical: SPACING.md},
  faqBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.borderLight},
  faqHeader: {flexDirection: 'row', alignItems: 'flex-start'},
  faqIcon: {
    fontSize: rs(16),
    marginRight: 8,
    marginTop: 2,
  },
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
  faqAnswerContainer: {
    marginTop: SPACING.sm,
    paddingLeft: SPACING.md,
    borderLeftWidth: 3,
    paddingVertical: 2,
  },
  faqA: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    lineHeight: rs(22),
  },
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  noResultsIcon: {
    fontSize: rs(36),
    marginBottom: SPACING.sm,
  },
  noResultsTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  noResultsSub: {
    fontSize: rs(FONTS.xs),
    textAlign: 'center',
    lineHeight: rs(18),
    paddingHorizontal: SPACING.md,
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
