// ============================================================
// src/screens/auth/LoginScreen.js
// ✅ Demo box REMOVED
// ✅ Login → Navigate fix
// ✅ Auto-login via Firebase auth state
// ============================================================

import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import BackButton from '../../utils/BackButton';

// ✅ InputField OUTSIDE component (no re-render/focus bug)
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureEntry,
  error,
  rightIcon,
  keyboardType = 'default',
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputBox, error && styles.inputBoxError]}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textGray}
        secureTextEntry={secureEntry}
        autoCapitalize="none"
        keyboardType={keyboardType}
        autoCorrect={false}
        spellCheck={false}
      />
      {rightIcon}
    </View>
    {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
  </View>
);

const LoginScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const {login, resendVerificationEmail} = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState(route.params?.role || 'consumer');

  useEffect(() => {
    if (route.params?.role) {
      setUserType(route.params.role);
    }
    if (route.params?.registeredEmail) {
      setEmail(route.params.registeredEmail);
    }
  }, [route.params?.role, route.params?.registeredEmail]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validate = () => {
    const e = {};
    if (!email.trim()) {
      e.email = t('validation.emailRequired');
      Alert.alert(t('common.error'), t('validation.emailRequired'), [
        {text: t('common.ok')},
      ]);
      return false;
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())
    ) {
      e.email = t('validation.emailInvalid');
      Alert.alert(t('common.error'), t('validation.emailInvalid'), [
        {text: t('common.ok')},
      ]);
      return false;
    }
    if (!password) {
      e.password = t('validation.passwordRequired');
      Alert.alert(t('common.error'), t('validation.passwordRequired'), [
        {text: t('common.ok')},
      ]);
      return false;
    } else if (password.length < 6) {
      e.password = t('validation.passwordMin');
      Alert.alert(t('common.error'), t('validation.passwordMin'), [
        {text: t('common.ok')},
      ]);
      return false;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (phone.trim()) {
      handleOTPLogin();
      return;
    }

    if (!validate()) {
      shake();
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password, userType);
      if (!result.success) {
        shake();
        const errorType = result.errorType || 'generic';

        if (errorType === 'user-not-found') {
          // Email doesn't exist - guide to register
          Alert.alert(
            t('authAlerts.noAccountTitle'),
            t('authAlerts.noAccountMsg'),
            [
              {
                text: t('common.ok'),
                style: 'cancel',
              },
              {
                text: t('authAlerts.createAccountBtn'),
                onPress: () =>
                  navigation.navigate('Register', {role: userType}),
              },
            ],
          );
        } else if (errorType === 'wrong-password') {
          // Wrong password - guide to forgot password
          Alert.alert(
            t('authAlerts.wrongPasswordTitle'),
            t('authAlerts.wrongPasswordMsg'),
            [
              {
                text: t('common.ok'),
                style: 'cancel',
              },
              {
                text: t('authAlerts.forgotPasswordBtn'),
                onPress: () => navigation.navigate('ForgotPassword'),
              },
            ],
          );
        } else if (errorType === 'account-disabled') {
          // Account disabled by admin
          Alert.alert(
            t('authAlerts.accountDisabledTitle'),
            t('authAlerts.accountDisabledMsg'),
            [{text: t('common.ok')}],
          );
        } else if (errorType === 'too-many-requests') {
          // Too many failed attempts
          Alert.alert(
            t('authAlerts.tooManyRequestsTitle'),
            t('authAlerts.tooManyRequestsMsg'),
            [
              {text: t('common.ok'), style: 'cancel'},
              {
                text: t('authAlerts.resetPasswordBtn'),
                onPress: () => navigation.navigate('ForgotPassword'),
              },
            ],
          );
        } else if (errorType === 'email-not-verified') {
          // Email not verified - offer to resend
          Alert.alert(
            t('authAlerts.emailNotVerifiedTitle', {
              defaultValue: 'மின்னஞ்சல் சரிபார்ப்பு தேவை!',
            }),
            t('authAlerts.emailNotVerifiedMsg', {
              defaultValue:
                `உங்கள் மின்னஞ்சல் (${email.trim()}) இன்னும் உறுதிப்படுத்தப்படவில்லை.\n\n` +
                'குறிப்பு: உறுதிப்படுத்தல் லிங்க் உங்கள் மின்னஞ்சல் Inbox அல்லது Spam / Junk Folder-ல் அனுப்பப்பட்டுள்ளது. அதை கிளிக் செய்து சரிபார்த்த பின் உள்நுழையவும்.',
            }),
            [
              {text: t('common.ok', {defaultValue: 'சரி'}), style: 'cancel'},
              {
                text: t('authAlerts.resendLinkBtn', {
                  defaultValue: 'லிங்க் மீண்டும் அனுப்பு',
                }),
                onPress: async () => {
                  const res = await resendVerificationEmail(
                    email.trim(),
                    password,
                  );
                  if (res.success) {
                    Alert.alert(
                      t('authAlerts.linkSentTitle', {
                        defaultValue: 'லிங்க் அனுப்பப்பட்டது!',
                      }),
                      t('authAlerts.linkSentMsg', {
                        defaultValue:
                          'மின்னஞ்சல் உறுதிப்படுத்தல் லிங்க் மீண்டும் அனுப்பப்பட்டது! தயவுசெய்து உங்கள் Inbox மற்றும் Spam Folder-ஐ சரிபார்க்கவும்.',
                      }),
                    );
                  } else {
                    Alert.alert(
                      t('common.error', {defaultValue: 'பிழை'}),
                      res.error || t('authAlerts.resendErrorMsg'),
                    );
                  }
                },
              },
            ],
          );
        } else if (errorType === 'network') {
          Alert.alert(
            t('authAlerts.networkTitle'),
            t('authAlerts.networkMsg'),
            [{text: t('common.ok')}],
          );
        } else if (errorType === 'wrong-dashboard') {
          Alert.alert(t('authAlerts.wrongDashboardTitle'), result.error, [
            {text: t('common.ok'), style: 'default'},
          ]);
        } else {
          // Generic error with both options
          Alert.alert(
            t('authAlerts.loginErrorTitle'),
            result.error || t('authAlerts.loginErrorMsg'),
            [
              {text: t('common.ok'), style: 'cancel'},
              {
                text: t('authAlerts.forgotPasswordBtn'),
                onPress: () => navigation.navigate('ForgotPassword'),
              },
              {
                text: t('authAlerts.createAccountBtn'),
                onPress: () =>
                  navigation.navigate('Register', {role: userType}),
              },
            ],
          );
        }
      }
      // ✅ Success: AuthContext onAuthStateChanged → RootNavigator auto-navigate
    } catch (e) {
      shake();
      Alert.alert(t('common.error'), e.message);
    }
    setIsLoading(false);
  };

  const handleOTPLogin = () => {
    if (!phone || phone.length < 10) {
      Alert.alert(t('common.error'), t('validation.phoneLength'));
      return;
    }
    navigation.navigate('OTP', {phone, userType});
  };

  const togglePassword = useCallback(() => setShowPassword(p => !p), []);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          style={{position: 'absolute', top: 50, left: SPACING.xl}}
        />
        <Text style={styles.headerEmoji}></Text>
        <Text style={styles.headerTitle}>
          {t('login.welcome', {defaultValue: 'Welcome Back!'})}
        </Text>
        <Text style={styles.headerSub}>
          {t('login.subtitle', {defaultValue: 'Login to your Zunkako account'})}
        </Text>
      </LinearGradient>

      {/* Card */}
      <Animated.View
        style={[styles.card, {transform: [{translateX: shakeAnim}]}]}>
        {/* User type display - Single wide card for selected role */}
        <Text style={styles.sectionLabel}>
          {t('login.whoAreYou', {defaultValue: 'Who are you?'})}
        </Text>

        {(() => {
          const roleConfig = {
            farmer: {
              label: t('login.farmer', {defaultValue: 'Farmer'}),
              emoji: '',
              colors: ['#E8F5E9', '#C8E6C9'],
              borderColor: '#A5D6A7',
              textColor: '#1B5E20',
            },
            consumer: {
              label: t('login.consumer', {defaultValue: 'Consumer'}),
              emoji: '',
              colors: ['#E3F2FD', '#BBDEFB'],
              borderColor: '#90CAF9',
              textColor: '#0D47A1',
            },
            delivery: {
              label: t('login.delivery', {defaultValue: 'Delivery'}),
              emoji: '',
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
                <Text
                  style={[
                    styles.singleRoleLabel,
                    {color: currentRole.textColor},
                  ]}>
                  {currentRole.label}
                </Text>
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

        {/* 1. Email */}
        <InputField
          label={t('login.emailLabel', {defaultValue: 'Email'})}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
        />

        {/* 2. Password */}
        <InputField
          label={t('login.passwordLabel', {defaultValue: 'Password'})}
          value={password}
          onChangeText={setPassword}
          secureEntry={!showPassword}
          error={errors.password}
          rightIcon={
            <TouchableOpacity onPress={togglePassword}>
              <Text style={styles.eyeBtn}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          }
        />

        {/* 3. Forgot password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>
            {t('login.forgotPassword', {defaultValue: 'Forgot Password?'})}
          </Text>
        </TouchableOpacity>

        {/* 4. Login Button */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={isLoading}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.loginBtnGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginBtnText}>
                {t('login.loginButton', {defaultValue: 'Login →'}).replace(
                  /[-=]*>+/,
                  '➔',
                )}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* 5. Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>
            {t('login.or', {defaultValue: 'OR'})}
          </Text>
          <View style={styles.divider} />
        </View>

        {/* 6. Phone (for OTP) - Under OR divider */}
        <InputField
          label={t('login.phoneLabel', {
            defaultValue: 'Phone Number',
          })}
          value={phone}
          onChangeText={text => {
            if (text.includes('@') || /[a-zA-Z]/.test(text)) {
              return;
            }
            setPhone(text.replace(/[^0-9]/g, ''));
          }}
          keyboardType="phone-pad"
        />

        {/* Footnote Agreement */}
        <View style={styles.footnoteRow}>
          <Text style={styles.footnoteText}>
            {t('legal.footnote1', {
              defaultValue: 'By continuing, you agree to our ',
            })}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Legal', {type: 'terms'})}>
            <Text style={styles.footnoteLink}>
              {t('legal.terms', {defaultValue: 'Terms & Conditions'})}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footnoteText}>
            {t('legal.footnote2', {defaultValue: ' & '})}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Legal', {type: 'privacy'})}>
            <Text style={styles.footnoteLink}>
              {t('legal.privacy', {defaultValue: 'Privacy Policy'})}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>
            {t('login.noAccount', {defaultValue: 'No account? '})}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register', {role: userType})}>
            <Text style={styles.registerLink}>
              {t('login.registerLink', {defaultValue: 'Register'})}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  },
  headerEmoji: {fontSize: 48, marginBottom: 8},
  headerTitle: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSub: {fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)'},
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    margin: SPACING.lg,
    padding: SPACING.xxl,
    marginTop: -20,
    ...SHADOWS.large,
  },
  sectionLabel: {
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
    fontSize: 28,
    marginRight: 14,
  },
  singleRoleLabel: {
    flex: 1,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
  },
  selectedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.bold,
  },
  inputWrapper: {marginBottom: SPACING.lg},
  inputLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  inputBoxError: {borderColor: COLORS.error},
  textInput: {
    flex: 1,
    height: 52,
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
  },
  eyeBtn: {fontSize: 18, padding: 4},
  errorText: {fontSize: FONTS.xs, color: COLORS.error, marginTop: 4},
  forgotBtn: {alignSelf: 'center', marginBottom: SPACING.lg},
  forgotText: {
    fontSize: FONTS.sm,
    color: COLORS.primaryBlue,
    fontWeight: FONTS.medium,
  },
  loginBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  loginBtnGrad: {paddingVertical: 16, alignItems: 'center'},
  loginBtnText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  divider: {flex: 1, height: 1, backgroundColor: COLORS.borderLight},
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  otpBtn: {
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: '#EDF4FF',
  },
  otpBtnText: {
    color: COLORS.primaryBlue,
    fontSize: FONTS.md,
    fontWeight: FONTS.semiBold,
  },
  registerRow: {flexDirection: 'row', justifyContent: 'center'},
  registerPrompt: {fontSize: FONTS.sm, color: COLORS.textSecondary},
  registerLink: {
    fontSize: FONTS.sm,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.bold,
  },
  footnoteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  footnoteText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footnoteLink: {
    fontSize: 11,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.bold,
  },
});

export default LoginScreen;
