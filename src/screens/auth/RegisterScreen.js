// ============================================================
// src/screens/auth/RegisterScreen.js
// BUG FIX: Field component → Component-க்கு வெளியே move
// இதனால் type பண்ணும்போது focus போகாது!
// ============================================================

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import BackButton from '../../utils/BackButton';

// ══════════════════════════════════════════════════════
// ✅ FIX: Field-ஐ Component-க்கு வெளியே define பண்றோம்!
// ══════════════════════════════════════════════════════
const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  showPass,
  onTogglePass,
  keyboardType = 'default',
  error,
  autoCompleteType = 'off',
  textContentType = 'none',
  importantForAutofill = 'auto',
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldBox, error && styles.fieldBoxErr]}>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textGray}
        secureTextEntry={secure && !showPass}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete={autoCompleteType}
        textContentType={textContentType}
        importantForAutofill={importantForAutofill}
      />
      {secure && onTogglePass && (
        <TouchableOpacity onPress={onTogglePass}>
          <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      )}
    </View>
    {error ? <Text style={styles.errText}>⚠ {error}</Text> : null}
  </View>
);

// ══════════════════════════════════════════════════════
// RegisterScreen Component
// ══════════════════════════════════════════════════════
const RegisterScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const {register, logout} = useAuth();
  const [userType, setUserType] = useState(route.params?.role || 'consumer');

  useEffect(() => {
    if (route.params?.role) {
      setUserType(route.params.role);
    }
  }, [route.params?.role]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);

  const togglePass = useCallback(() => setShowPass(p => !p), []);

  const validate = () => {
    const e = {};
    // Name validation
    if (!name.trim()) {
      e.name = t('validation.nameRequired');
    } else if (name.trim().length < 2) {
      e.name = t('validation.nameMin');
    }

    // Email validation - strict format check
    if (!email.trim()) {
      e.email = t('validation.emailRequired');
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())
    ) {
      e.email = t('validation.emailInvalid');
    }

    // Phone validation
    if (!phone.trim()) {
      e.phone = t('validation.phoneRequired');
    } else if (phone.length !== 10) {
      e.phone = t('validation.phoneLength');
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      e.phone = t('validation.phoneInvalid');
    }

    // Location validation - mandatory
    if (!location.trim()) {
      e.location = t('validation.locationRequired');
    }

    // Password validation - strong password rules
    if (!password) {
      e.password = t('validation.passwordRequired');
    } else if (password.length < 6) {
      e.password = t('validation.passwordMin');
    } else if (!/[A-Z]/.test(password)) {
      e.password = t('validation.passwordUpper');
    } else if (!/[a-z]/.test(password)) {
      e.password = t('validation.passwordLower');
    } else if (!/[0-9]/.test(password)) {
      e.password = t('validation.passwordDigit');
    } else if (!/[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]/.test(password)) {
      e.password = t('validation.passwordSpecial');
    }

    // Confirm password validation
    if (!confirmPassword) {
      e.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      e.confirmPassword = t('validation.passwordsMatch');
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }
    if (!agree) {
      Alert.alert(
        t('common.error'),
        t('legal.mustAgree', {
          defaultValue:
            'விதிமுறைகள் மற்றும் தனியுரிமைக் கொள்கையை ஒப்புக்கொள்ள வேண்டும்!',
        }),
      );
      return;
    }
    setIsLoading(true);
    const result = await register(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone,
        location: location.trim(),
        password,
      },
      userType,
    );
    setIsLoading(false);
    if (!result.success) {
      const errorType = result.errorType || 'generic';

      if (errorType === 'email-exists') {
        Alert.alert(
          t('authAlerts.emailExistsTitle'),
          t('authAlerts.emailExistsMsg'),
          [
            {text: t('common.ok'), style: 'cancel'},
            {
              text: t('authAlerts.goToLoginBtn'),
              onPress: () => navigation.navigate('Login', {role: userType}),
            },
          ],
        );
      } else if (errorType === 'phone-exists') {
        Alert.alert(t('authAlerts.phoneExistsTitle'), result.error, [
          {text: t('common.ok'), style: 'cancel'},
          {
            text: t('authAlerts.goToLoginBtn'),
            onPress: () => navigation.navigate('Login', {role: userType}),
          },
        ]);
      } else {
        Alert.alert(
          t('common.error'),
          result.error || t('farmer.uploadFailed'),
        );
      }
    } else {
      // ✅ Registration successful - Show email verification alert with Spam note
      Alert.alert(
        t('authAlerts.regSuccessTitle', {
          defaultValue: '✅ பதிவு வெற்றிகரமாக முடிந்தது!',
        }),
        t('authAlerts.regSuccessMsg', {
          defaultValue:
            `📧 உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!\n\n` +
            `உங்கள் மின்னஞ்சல் முகவரிக்கு (${email.trim()}) சரிபார்ப்பு லிங்க் (Verification Link) அனுப்பப்பட்டுள்ளது.\n\n` +
            `👉 குறிப்பு: இந்த சரிபார்ப்பு லிங்க் உங்கள் Email Inbox அல்லது Spam / Junk Folder-ல் இருக்கும்.\n` +
            `👉 அந்த லிங்கை கிளிக் செய்து சரிபார்த்த பின் உள்நுழையவும்!`,
        }),
        [
          {
            text: t('authAlerts.goToLoginBtnMain', {
              defaultValue: 'உள்நுழைவுப் பக்கத்திற்குச் செல் ➔',
            }),
            onPress: () => {
              navigation.navigate('Login', {
                role: userType,
                registeredEmail: email.trim(),
              });
            },
          },
        ],
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {/* ════ HEADER ════ */}
      <LinearGradient colors={['#0D5C32', '#1565C0']} style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
        <Text style={styles.hEmoji}>🌱</Text>
        <Text style={styles.hTitle}>
          {t('register.title', {defaultValue: 'Create Account'})}
        </Text>
        <Text style={styles.hSub}>
          {t('register.subtitle', {defaultValue: 'Join F2C Today'})}
        </Text>
      </LinearGradient>

      {/* ════ WHITE CARD ════ */}
      <View style={styles.card}>
        {/* User type selector - Single wide card for selected role */}
        <Text style={styles.sLabel}>
          {t('login.whoAreYou', {defaultValue: 'Who are you?'})}
        </Text>

        {(() => {
          const roleConfig = {
            farmer: {
              label: t('login.farmer', {defaultValue: 'Farmer'}),
              taLabel: t('login.farmer', {defaultValue: 'விவசாயி'}),
              sub: t('login.sellProducts', {defaultValue: 'Sell your products'}),
              emoji: '👨‍🌾',
              colors: ['#E8F5E9', '#C8E6C9'],
              borderColor: '#A5D6A7',
              textColor: '#1B5E20',
            },
            consumer: {
              label: t('login.consumer', {defaultValue: 'Consumer'}),
              taLabel: t('login.consumer', {defaultValue: 'நுகர்வோர்'}),
              sub: t('login.buyFresh', {defaultValue: 'Buy fresh vegetables'}),
              emoji: '🛒',
              colors: ['#E3F2FD', '#BBDEFB'],
              borderColor: '#90CAF9',
              textColor: '#0D47A1',
            },
            delivery: {
              label: t('login.delivery', {defaultValue: 'Delivery'}),
              taLabel: t('login.delivery', {defaultValue: 'டெலிவரி'}),
              sub: t('login.deliverOrders', {defaultValue: 'Deliver orders'}),
              emoji: '🚚',
              colors: ['#FFF3E0', '#FFE0B2'],
              borderColor: '#FFCC80',
              textColor: '#E65100',
            },
          };
          const currentRole = roleConfig[userType] || roleConfig.consumer;

          return (
            <View style={styles.singleRoleCardWrapper}>
              <LinearGradient
                colors={currentRole.colors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[
                  styles.singleRoleCard,
                  {borderColor: currentRole.borderColor},
                ]}>
                <Text style={styles.singleRoleEmoji}>{currentRole.emoji}</Text>
                <View style={styles.singleRoleTextWrap}>
                  <Text
                    style={[
                      styles.singleRoleLabel,
                      {color: currentRole.textColor},
                    ]}>
                    {currentRole.label} ({currentRole.taLabel})
                  </Text>
                  <Text style={styles.singleRoleSub}>{currentRole.sub}</Text>
                </View>
                <View
                  style={[
                    styles.selectedBadge,
                    {backgroundColor: currentRole.textColor},
                  ]}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              </LinearGradient>
            </View>
          );
        })()}

        {/* ── Form Fields (state-ஐ individual set functions use பண்றோம்) ── */}
        <Field
          label={'👤 ' + t('profile.fullName')}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCompleteType="name"
          textContentType="name"
        />
        <Field
          label={'📧 ' + t('farmer.email')}
          value={email}
          onChangeText={text => setEmail(text.trim())}
          keyboardType="email-address"
          error={errors.email}
          autoCompleteType="email"
          textContentType="emailAddress"
          autoCorrect={false}
        />
        <Field
          label={'📱 ' + t('farmer.phone')}
          value={phone}
          onChangeText={text => {
            if (text.includes('@') || /[a-zA-Z]/.test(text)) {
              return;
            }
            setPhone(text.replace(/[^0-9]/g, ''));
          }}
          keyboardType="phone-pad"
          error={errors.phone}
          autoCompleteType="off"
          textContentType="none"
          importantForAutofill="no"
        />
        <Field
          label={'📍 ' + t('farmer.location')}
          value={location}
          onChangeText={setLocation}
          error={errors.location}
          autoCompleteType="postal-code"
          textContentType="none"
        />
        <Field
          label={t('login.passwordLabel')}
          value={password}
          onChangeText={setPassword}
          secure
          showPass={showPass}
          onTogglePass={togglePass}
          error={errors.password}
          autoCompleteType="password-new"
          textContentType="newPassword"
        />
        <Field
          label={'🔒 ' + t('validation.confirmPasswordRequired')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
          showPass={showPass}
          onTogglePass={togglePass}
          error={errors.confirmPassword}
          autoCompleteType="password-new"
          textContentType="newPassword"
        />

        {/* Consent Checkbox */}
        <View style={styles.agreeRow}>
          <TouchableOpacity
            style={[styles.checkbox, agree && styles.checkboxActive]}
            onPress={() => setAgree(!agree)}>
            {agree && <Text style={styles.checkboxTick}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.agreeTextContainer}>
            <Text style={styles.agreeText}>
              {t('legal.agreePrompt1', {defaultValue: 'I agree to the '})}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Legal', {type: 'terms'})}>
              <Text style={styles.agreeLink}>
                {t('legal.terms', {defaultValue: 'Terms & Conditions'})}
              </Text>
            </TouchableOpacity>
            <Text style={styles.agreeText}>
              {t('legal.agreePrompt2', {defaultValue: ' and '})}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Legal', {type: 'privacy'})}>
              <Text style={styles.agreeLink}>
                {t('legal.privacy', {defaultValue: 'Privacy Policy'})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={styles.regBtn}
          onPress={handleRegister}
          disabled={isLoading}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.regBtnGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.regBtnText}>
                {t('register.btnText', {defaultValue: 'Register →'})}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>
            {t('login.haveAccount', {defaultValue: 'கணக்கு இருக்கிறதா? '})}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login', {role: userType})}>
            <Text style={styles.loginLink}>
              {t('login.loginLink', {defaultValue: 'உள்நுழைக'})}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  header: {paddingTop: 50, paddingBottom: 40, alignItems: 'center'},
  backBtn: {position: 'absolute', top: 50, left: SPACING.xl},
  backText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
  },
  hEmoji: {fontSize: 44, marginBottom: 8},
  hTitle: {fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white},
  hSub: {fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4},

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    margin: SPACING.lg,
    padding: SPACING.xxl,
    marginTop: -20,
    ...SHADOWS.large,
    marginBottom: 40,
  },

  sLabel: {
    fontSize: FONTS.md,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  singleRoleCardWrapper: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  singleRoleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
  },
  singleRoleEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  singleRoleTextWrap: {
    flex: 1,
  },
  singleRoleLabel: {
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  singleRoleSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  selectedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.bold,
  },

  fieldWrap: {marginBottom: SPACING.lg},
  fieldLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  fieldBoxErr: {borderColor: COLORS.error},
  fieldInput: {
    flex: 1,
    height: 50,
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
  },
  eyeIcon: {fontSize: 18, padding: 4},
  errText: {fontSize: FONTS.xs, color: COLORS.error, marginTop: 4},

  regBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  regBtnGrad: {paddingVertical: 16, alignItems: 'center'},
  regBtnText: {color: COLORS.white, fontSize: FONTS.lg, fontWeight: FONTS.bold},

  loginRow: {flexDirection: 'row', justifyContent: 'center'},
  loginPrompt: {fontSize: FONTS.sm, color: COLORS.textSecondary},
  loginLink: {
    fontSize: FONTS.sm,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.bold,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    borderColor: COLORS.primaryGreen,
    backgroundColor: COLORS.primaryGreen,
  },
  checkboxTick: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: FONTS.bold,
  },
  agreeTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  agreeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  agreeLink: {
    fontSize: 12,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.semiBold,
  },
});

export default RegisterScreen;
