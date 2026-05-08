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
  const { login } = useAuth();
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
    if (!email.trim()) e.email = 'மின்னஞ்சல் உள்ளிடவும்';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'சரியான மின்னஞ்சல் உள்ளிடவும்';
    if (!password) e.password = 'கடவுச்சொல் உள்ளிடவும்';
    else if (password.length < 6) e.password = 'குறைந்தது 6 எழுத்துகள்';
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
        
        // If it's a generic invalid credential, show a helpful alert for first-time users
        const errorMsg = result.error?.includes('invalid-credential') || result.error?.includes('user-not-found') 
          ? 'தவறான மின்னஞ்சல்/கடவுச்சொல்.\n\nநீங்கள் புதிய பயனர் என்றால், முதலில் "புதிய கணக்கு உருவாக்கு" (Register) பட்டனை அழுத்தி கணக்கை உருவாக்கவும். அதன் பிறகு மட்டுமே இங்கு Login செய்ய முடியும்.'
          : (result.error || 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்');
          
        Alert.alert('பிழை / Login Error', errorMsg, [
          { text: 'OK' },
          { text: 'புதிய கணக்கு உருவாக்கு →', onPress: () => navigation.navigate('Register') }
        ]);
      }
      // ✅ Success: AuthContext onAuthStateChanged → RootNavigator auto-navigate
    } catch (e) {
      shake();
      Alert.alert('பிழை', e.message);
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
