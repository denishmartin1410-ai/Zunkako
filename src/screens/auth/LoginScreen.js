// ============================================================
// src/screens/auth/LoginScreen.js
// ✅ Demo box REMOVED
// ✅ Login → Navigate fix
// ✅ Auto-login via Firebase auth state
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated,
  Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import BackButton from '../../utils/BackButton';

// ✅ InputField OUTSIDE component (no re-render/focus bug)
const InputField = ({ label, value, onChangeText, placeholder, secureEntry, error, rightIcon, keyboardType = 'default' }) => (
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

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { login, resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('consumer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const e = {};
    if (!email.trim()) {
      e.email = '⚠ மின்னஞ்சல் உள்ளிடவும் / Enter email';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      e.email = '⚠ சரியான மின்னஞ்சல் வடிவம் உள்ளிடவும்\n  எ.கா: example@gmail.com';
    }
    if (!password) {
      e.password = '⚠ கடவுச்சொல் உள்ளிடவும் / Enter password';
    } else if (password.length < 6) {
      e.password = '⚠ குறைந்தது 6 எழுத்துக்கள் வேண்டும் / Min 6 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) { shake(); return; }
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password, userType);
      if (!result.success) {
        shake();
        const errorType = result.errorType || 'generic';
        
        if (errorType === 'user-not-found') {
          // Email doesn't exist - guide to register
          Alert.alert(
            '❌ கணக்கு இல்லை / No Account Found',
            'இந்த மின்னஞ்சலில் எந்த கணக்கும் பதிவு செய்யப்படவில்லை!\n\nNo account exists with this email. Please register first.',
            [
              { text: 'சரி / OK', style: 'cancel' },
              { text: '📝 புதிய கணக்கு உருவாக்கு', onPress: () => navigation.navigate('Register') }
            ]
          );
        } else if (errorType === 'wrong-password') {
          // Wrong password - guide to forgot password
          Alert.alert(
            '🔑 தவறான தகவல் / Incorrect Details',
            'நீங்கள் உள்ளிட்ட மின்னஞ்சல் அல்லது கடவுச்சொல் தவறாக உள்ளது!\n\nசரியான தகவல்களை உள்ளிடவும் அல்லது புதிய கணக்கு உருவாக்கவும்.\n\nIncorrect email or password. Please try again or create an account.',
            [
              { text: 'சரி / OK', style: 'cancel' },
              { text: '🔑 கடவுச்சொல் மறந்தீர்களா?', onPress: () => navigation.navigate('ForgotPassword') }
            ]
          );
        } else if (errorType === 'account-disabled') {
          // Account disabled by admin
          Alert.alert(
            '🚫 கணக்கு முடக்கப்பட்டது / Account Disabled',
            'உங்கள் கணக்கு முடக்கப்பட்டுள்ளது.\nநிர்வாகியை தொடர்பு கொள்ளவும்.\n\nYour account has been disabled. Please contact the administrator.',
            [{ text: 'சரி / OK' }]
          );
        } else if (errorType === 'too-many-requests') {
          // Too many failed attempts
          Alert.alert(
            '⏳ அதிக முயற்சிகள் / Too Many Attempts',
            'பல முறை தவறான கடவுச்சொல் உள்ளிட்டதால் உங்கள் கணக்கு தற்காலிகமாக முடக்கப்பட்டுள்ளது.\n\nசிறிது நேரம் காத்திருந்து மீண்டும் முயற்சிக்கவும் அல்லது கடவுச்சொல்லை மீட்டமைக்கவும்.\n\nAccount temporarily locked due to too many failed attempts.',
            [
              { text: 'சரி / OK', style: 'cancel' },
              { text: '🔑 கடவுச்சொல் மீட்டமை', onPress: () => navigation.navigate('ForgotPassword') }
            ]
          );
        } else if (errorType === 'email-not-verified') {
          // Email not verified - offer to resend
          Alert.alert(
            '📧 மின்னஞ்சல் சரிபார்க்கப்படவில்லை / Email Not Verified',
            'உங்கள் மின்னஞ்சல் இன்னும் சரிபார்க்கப்படவில்லை!\n\nபதிவு செய்யும்போது அனுப்பிய Verification Link-ஐ உங்கள் Email Inbox-ல் பாருங்கள். அதை Click செய்து Verify செய்த பிறகு மீண்டும் Login செய்யுங்கள்.\n\nPlease verify your email first. Check your inbox for the verification link.',
            [
              { text: 'சரி / OK', style: 'cancel' },
              {
                text: '📩 மீண்டும் Verification Link அனுப்பு',
                onPress: async () => {
                  const res = await resendVerificationEmail();
                  if (res.success) {
                    Alert.alert(
                      '✅ அனுப்பப்பட்டது / Sent!',
                      'புதிய Verification Link உங்கள் Email-க்கு அனுப்பப்பட்டது!\n\nEmail Inbox-ல் பாருங்கள், Spam/Junk folder-ஐயும் சரிபார்க்கவும்.\n\nNew verification link sent! Check your inbox and spam folder.'
                    );
                  } else {
                    Alert.alert('பிழை / Error', 'மீண்டும் முயற்சிக்கவும் / Please try again later.');
                  }
                }
              }
            ]
          );
        } else if (errorType === 'network') {
          Alert.alert(
            '📶 இணைய இணைப்பு இல்லை / No Internet',
            'உங்கள் இணைய இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.\n\nPlease check your internet connection and try again.',
            [{ text: 'சரி / OK' }]
          );
        } else if (errorType === 'wrong-dashboard') {
          Alert.alert(
            '🚫 தவறான பக்கம் / Wrong Dashboard',
            result.error,
            [{ text: 'சரி / OK', style: 'default' }]
          );
        } else {
          // Generic error with both options
          Alert.alert(
            '⚠️ பிழை / Login Error',
            result.error || 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.\n\nIncorrect email or password.',
            [
              { text: 'சரி / OK', style: 'cancel' },
              { text: '🔑 கடவுச்சொல் மறந்தீர்களா?', onPress: () => navigation.navigate('ForgotPassword') },
              { text: '📝 புதிய கணக்கு', onPress: () => navigation.navigate('Register') }
            ]
          );
        }
      }
      // ✅ Success: AuthContext onAuthStateChanged → RootNavigator auto-navigate
    } catch (e) {
      shake();
      Alert.alert('பிழை / Error', e.message);
    }
    setIsLoading(false);
  };

  const handleOTPLogin = () => {
    if (!phone || phone.length < 10) {
      Alert.alert('பிழை', 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்');
      return;
    }
    navigation.navigate('OTP', { phone, userType });
  };

  const togglePassword = useCallback(() => setShowPassword(p => !p), []);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 50, left: SPACING.xl }} />
        <Text style={styles.headerEmoji}>👋</Text>
        <Text style={styles.headerTitle}>{t('login.welcome', { defaultValue: 'Welcome Back!' })}</Text>
        <Text style={styles.headerSub}>{t('login.subtitle', { defaultValue: 'Login to your F2C account' })}</Text>
      </LinearGradient>

      {/* Card */}
      <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

        {/* User type toggle */}
        <Text style={styles.sectionLabel}>{t('login.whoAreYou', { defaultValue: 'Who are you?' })}</Text>
        <View style={styles.toggleRow}>
          {[
            { type: 'consumer', emoji: '🛒', label: t('login.consumer', { defaultValue: 'Consumer' }) },
            { type: 'farmer', emoji: '👨‍🌾', label: t('login.farmer', { defaultValue: 'Farmer' }) },
            { type: 'delivery', emoji: '🚚', label: t('login.delivery', { defaultValue: 'Delivery' }) },
          ].map(item => (
            <TouchableOpacity
              key={item.type}
              style={[styles.toggleBtn, userType === item.type && styles.toggleBtnActive]}
              onPress={() => setUserType(item.type)}>
              {userType === item.type ? (
                <LinearGradient colors={COLORS.gradientButton} style={styles.toggleGrad}>
                  <Text style={styles.toggleEmoji}>{item.emoji}</Text>
                  <Text style={styles.toggleLabelActive}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.toggleInactive}>
                  <Text style={styles.toggleEmoji}>{item.emoji}</Text>
                  <Text style={styles.toggleLabel}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Email */}
        <InputField
          label={t('login.emailLabel', { defaultValue: 'Email' })}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
        />

        {/* Password */}
        <InputField
          label={t('login.passwordLabel', { defaultValue: 'Password' })}
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

        {/* Phone (for OTP) */}
        <InputField
          label={t('login.phoneLabel', { defaultValue: 'Phone Number (For OTP Login)' })}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>
            {t('login.forgotPassword', { defaultValue: 'Forgot Password?' })}
          </Text>
        </TouchableOpacity>

        {/* ✅ Demo box REMOVED - no dummy login */}

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={isLoading}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.loginBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {isLoading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.loginBtnText}>{t('login.loginButton', { defaultValue: 'Login →' }).replace(/[-=]*>+/, '➔')}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t('login.or', { defaultValue: 'OR' })}</Text>
          <View style={styles.divider} />
        </View>

        {/* OTP Login */}
        <TouchableOpacity style={styles.otpBtn} onPress={handleOTPLogin}>
          <Text style={styles.otpBtnText}>
            📱 {t('login.otpLogin', { defaultValue: 'OTP Login' })}
          </Text>
        </TouchableOpacity>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>{t('login.noAccount', { defaultValue: 'No account? ' })}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>{t('login.registerLink', { defaultValue: 'Register' })}</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 40, paddingHorizontal: SPACING.xxl, alignItems: 'center' },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)' },
  card: {
    backgroundColor: COLORS.white, borderRadius: 28,
    margin: SPACING.lg, padding: SPACING.xxl,
    marginTop: -20, ...SHADOWS.large,
  },
  sectionLabel: { fontSize: FONTS.md, fontWeight: FONTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  toggleRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  toggleBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  toggleGrad: { alignItems: 'center', paddingVertical: 14 },
  toggleInactive: { alignItems: 'center', paddingVertical: 14, backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border },
  toggleEmoji: { fontSize: 24 },
  toggleLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 4, fontWeight: FONTS.medium },
  toggleLabelActive: { fontSize: FONTS.sm, color: COLORS.white, marginTop: 4, fontWeight: FONTS.bold },
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONTS.sm, fontWeight: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 6, lineHeight: 18 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.borderLight },
  inputBoxError: { borderColor: COLORS.error },
  textInput: { flex: 1, height: 52, fontSize: FONTS.md, color: COLORS.textPrimary },
  eyeBtn: { fontSize: 18, padding: 4 },
  errorText: { fontSize: FONTS.xs, color: COLORS.error, marginTop: 4 },
  forgotBtn: { alignSelf: 'center', marginBottom: SPACING.lg },
  forgotText: { fontSize: FONTS.sm, color: COLORS.primaryBlue, fontWeight: FONTS.medium },
  loginBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.lg },
  loginBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  loginBtnText: { color: COLORS.white, fontSize: FONTS.lg, fontWeight: FONTS.bold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  dividerText: { marginHorizontal: SPACING.md, fontSize: FONTS.xs, color: COLORS.textMuted },
  otpBtn: { borderWidth: 2, borderColor: COLORS.primaryBlue, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginBottom: SPACING.xl, backgroundColor: '#EDF4FF' },
  otpBtnText: { color: COLORS.primaryBlue, fontSize: FONTS.md, fontWeight: FONTS.semiBold },
  registerRow: { flexDirection: 'row', justifyContent: 'center' },
  registerPrompt: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  registerLink: { fontSize: FONTS.sm, color: COLORS.primaryGreen, fontWeight: FONTS.bold },
});

export default LoginScreen;
