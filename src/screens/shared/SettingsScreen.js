// ============================================================
// src/screens/shared/SettingsScreen.js
// ✅ Double icon FULLY FIXED - plain text chars
// ✅ Full app language (i18n.changeLanguage)
// ✅ Dark mode (ThemeContext)
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../context/ThemeContext';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import i18n from '../../locales/i18n';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const LANGUAGES = [
  {code: 'ta', label: 'தமிழ்', subLabel: 'Tamil', flag: '🇮🇳'},
  {code: 'en', label: 'English', subLabel: 'English', flag: '🇬🇧'},
  {code: 'ml', label: 'മലയാളം', subLabel: 'Malayalam', flag: '🇮🇳'},
];

const SettingsScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {logout} = useAuth();
  const {isDark, toggleTheme} = useTheme();
  const currentLang = i18n.language || 'ta';

  const handleLanguageChange = async langCode => {
    try {
      await i18n.changeLanguage(langCode);
    } catch (e) {
      console.log('Language change error:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout', {defaultValue: 'Logout'}),
      t('profile.logoutConfirm', {
        defaultValue: 'Are you sure you want to logout?',
      }),
      [
        {text: t('common.cancel', {defaultValue: 'No'}), style: 'cancel'},
        {
          text: t('common.yes', {defaultValue: 'Yes'}),
          onPress: logout,
          style: 'destructive',
        },
      ],
    );
  };

  const bg = isDark ? '#121212' : COLORS.background;
  const cardBg = isDark ? '#1E1E1E' : COLORS.white;
  const textColor = isDark ? '#FFFFFF' : COLORS.textPrimary;
  const subColor = isDark ? '#AAAAAA' : COLORS.textSecondary;
  const borderColor = isDark ? '#333333' : COLORS.borderLight;

  return (
    <View style={[styles.container, {backgroundColor: bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          {t('settings.title', {defaultValue: 'Settings'})}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* LANGUAGE */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, {color: subColor}]}>
            {'🌐  '}
            {t('language.select', {
              defaultValue: 'மொழி தேர்வு / Select Language',
            })}
          </Text>
          <View style={[styles.card, {backgroundColor: cardBg, borderColor}]}>
            {LANGUAGES.map((lang, i) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langRow,
                  i < LANGUAGES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: borderColor,
                  },
                  currentLang === lang.code && {
                    backgroundColor: isDark ? '#1A3028' : '#E8F5E9',
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}>
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langTexts}>
                  <Text style={[styles.langLabel, {color: textColor}]}>
                    {lang.label}
                  </Text>
                  <Text style={[styles.langSub, {color: subColor}]}>
                    {lang.subLabel}
                  </Text>
                </View>
                {currentLang === lang.code && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkTxt}>{'✓'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* APPEARANCE - plain text section label to avoid double render */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, {color: subColor}]}>
            {t('settings.appearanceSection', {defaultValue: 'Appearance'})}
          </Text>
          <View style={[styles.card, {backgroundColor: cardBg, borderColor}]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Text style={[styles.switchEmoji, {color: textColor}]}>
                  {isDark ? '🌙' : '☀️'}
                </Text>
                <View>
                  <Text style={[styles.switchLabel, {color: textColor}]}>
                    {t('settings.darkMode', {defaultValue: 'இருண்ட பயன்முறை'})}
                  </Text>
                  <Text style={[styles.switchSub, {color: subColor}]}>
                    {isDark ? 'Dark mode ON' : 'Light mode ON'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{false: '#E0E0E0', true: COLORS.primaryGreen}}
                thumbColor={isDark ? COLORS.white : '#F5F5F5'}
              />
            </View>
          </View>
        </View>

        {/* APP INFO - plain text icons only */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, {color: subColor}]}>
            {t('settings.infoSection', {defaultValue: 'பயன்பாடு பற்றி'})}
          </Text>
          <View style={[styles.card, {backgroundColor: cardBg, borderColor}]}>
            {[
              {
                icon: '✏',
                label: t('settings.editProfile', {
                  defaultValue: 'Edit Profile',
                }),
                screen: 'EditProfile',
              },
              {
                icon: '💬',
                label: t('feedback.title', {defaultValue: 'Give Feedback'}),
                screen: 'Feedback',
              },
              {
                icon: '?',
                label: t('settings.help', {defaultValue: 'Help & FAQ'}),
                screen: 'HelpAbout',
              },
              {
                icon: 'i',
                label: t('settings.about', {defaultValue: 'About App'}),
                screen: 'HelpAbout',
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.menuRow,
                  {borderBottomWidth: 1, borderBottomColor: borderColor},
                ]}
                onPress={() => navigation.navigate(item.screen)}>
                <Text style={[styles.menuIcon, {color: subColor}]}>
                  {item.icon}
                </Text>
                <Text style={[styles.menuLabel, {color: textColor}]}>
                  {item.label}
                </Text>
                <Text style={[styles.menuArrow, {color: subColor}]}>{'>'}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.menuRow}>
              <Text style={[styles.menuIcon, {color: subColor}]}>v</Text>
              <Text style={[styles.menuLabel, {color: subColor}]}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </View>

        {/* LOGOUT */}
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingBottom: rs(40),
            marginTop: SPACING.lg,
          }}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutTxt}>
              {t('settings.logout', {defaultValue: 'Logout'})}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
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
  sectionWrap: {paddingHorizontal: SPACING.lg, marginTop: SPACING.xl},
  sectionLabel: {
    fontSize: rs(FONTS.sm),
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.small,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(14),
    paddingHorizontal: SPACING.lg,
  },
  langFlag: {fontSize: rs(20), marginRight: SPACING.md},
  langTexts: {flex: 1},
  langLabel: {fontSize: rs(FONTS.md), fontWeight: '600'},
  langSub: {fontSize: rs(FONTS.xs), marginTop: 1},
  checkBadge: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: COLORS.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTxt: {color: COLORS.white, fontSize: rs(14), fontWeight: 'bold'},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(14),
    paddingHorizontal: SPACING.lg,
  },
  switchLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  switchEmoji: {fontSize: rs(22), marginRight: SPACING.md},
  switchLabel: {fontSize: rs(FONTS.md), fontWeight: '600'},
  switchSub: {fontSize: rs(FONTS.xs), marginTop: 1},
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(14),
    paddingHorizontal: SPACING.lg,
  },
  menuIcon: {
    fontSize: rs(16),
    marginRight: SPACING.md,
    width: rs(20),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuLabel: {flex: 1, fontSize: rs(FONTS.sm)},
  menuArrow: {fontSize: rs(18)},
  logoutBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: RADIUS.xl,
    paddingVertical: rs(16),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F44336',
  },
  logoutTxt: {color: '#F44336', fontSize: rs(FONTS.md), fontWeight: 'bold'},
});

export default SettingsScreen;
