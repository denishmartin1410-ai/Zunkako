// ============================================================
// src/screens/auth/RegisterScreen.js
// BUG FIX: Field component → Component-க்கு வெளியே move
// இதனால் type பண்ணும்போது focus போகாது!
// ============================================================

import React, { useState, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
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
        autoCapitalize='none'
        autoCorrect={false}
        spellCheck={false}
        autoComplete={autoCompleteType}
        textContentType={textContentType}
        importantForAutofill='no'
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
const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { register, logout } = useAuth();
  const [userType, setUserType] = useState('consumer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const togglePass = useCallback(() => setShowPass(p => !p), []);

  const validate = () => {
    const e = {};
    // Name validation
    if (!name.trim()) {
      e.name = '⚠ பெயர் உள்ளிடவும் / Enter your name';
    } else if (name.trim().length < 2) {
      e.name = '⚠ பெயர் குறைந்தது 2 எழுத்துக்கள் இருக்க வேண்டும் / Name must be at least 2 characters';
    }

    // Email validation - strict format check
    if (!email.trim()) {
      e.email = '⚠ மின்னஞ்சல் உள்ளிடவும் / Enter email';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      e.email = '⚠ சரியான மின்னஞ்சல் வடிவம் உள்ளிடவும்\n  எ.கா: example@gmail.com\n  Valid email format needed';
    }

    // Phone validation
    if (!phone.trim()) {
      e.phone = '⚠ தொலைபேசி எண் உள்ளிடவும் / Enter phone number';
    } else if (phone.length !== 10) {
      e.phone = '⚠ சரியான 10 இலக்க எண் உள்ளிடவும் / Enter valid 10-digit number';
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      e.phone = '⚠ சரியான இந்திய மொபைல் எண் உள்ளிடவும் / Valid Indian mobile number needed';
    }

    // Location validation - mandatory
    if (!location.trim()) {
      e.location = '⚠ இடம் உள்ளிடவும் / Enter your location/city';
    }

    // Password validation - strong password rules
    if (!password) {
      e.password = '⚠ கடவுச்சொல் உள்ளிடவும் / Enter password';
    } else if (password.length < 6) {
      e.password = '⚠ குறைந்தது 6 எழுத்துக்கள் வேண்டும் / Min 6 characters';
    } else if (!/[A-Z]/.test(password)) {
      e.password = '⚠ ஒரு பெரிய எழுத்து வேண்டும் (A-Z) / Need at least 1 uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      e.password = '⚠ ஒரு சிறிய எழுத்து வேண்டும் (a-z) / Need at least 1 lowercase letter';
    } else if (!/[0-9]/.test(password)) {
      e.password = '⚠ ஒரு எண் வேண்டும் (0-9) / Need at least 1 number';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]/.test(password)) {
      e.password = '⚠ ஒரு சிறப்பு எழுத்து வேண்டும் (!@#$%^&*) / Need at least 1 special character';
    }

    // Confirm password validation
    if (!confirmPassword) {
      e.confirmPassword = '⚠ உறுதி கடவுச்சொல் உள்ளிடவும் / Enter confirm password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = '⚠ கடவுச்சொல் பொருந்தவில்லை! இரண்டும் ஒரே மாதிரி இருக்க வேண்டும்.\n  Passwords do not match!';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const result = await register(
      { name: name.trim(), email: email.trim().toLowerCase(), phone, location: location.trim(), password },
      userType,
    );
    setIsLoading(false);
    if (!result.success) {
      const errorType = result.errorType || 'generic';
      
      if (errorType === 'email-exists') {
        Alert.alert(
          '⚠️ மின்னஞ்சல் ஏற்கனவே உள்ளது / Email Already Exists',
          'இந்த Email Address ஏற்கனவே வேறொரு பெயரில் பதிவு செய்யப்பட்டுள்ளது!\n\nவேறு Email பயன்படுத்தவும் அல்லது Login செய்யவும்.\n\nThis email is already registered. Use a different email or login.',
          [
            { text: 'சரி / OK', style: 'cancel' },
            { text: '🔐 Login செய்ய', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else if (errorType === 'phone-exists') {
        Alert.alert(
          '📱 தொலைபேசி எண் ஏற்கனவே உள்ளது / Phone Already Registered',
          result.error,
          [
            { text: 'சரி / OK', style: 'cancel' },
            { text: '🔐 Login செய்ய', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else {
        Alert.alert(
          'பிழை / Error',
          result.error || 'பதிவு செய்வதில் பிழை\nRegistration failed',
        );
      }
    } else {
      // ✅ Registration successful - Show email verification alert
      Alert.alert(
        '✅ பதிவு வெற்றி! / Registration Successful!',
        '📧 உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!\n\nஉங்கள் மின்னஞ்சலுக்கு (Email) ஒரு Verification Link அனுப்பப்பட்டுள்ளது.\n\n👉 உங்கள் Email Inbox-ஐ திறந்து Verification Link-ஐ Click செய்யுங்கள்.\n👉 Spam/Junk folder-ஐயும் சரிபார்க்கவும்.\n👉 Verify செய்த பிறகு Login செய்யுங்கள்.\n\nA verification link has been sent to your email. Please verify before logging in.',
        [
          {
            text: 'சரி, Login பக்கம் செல் →',
            onPress: async () => {
              // Logout so user must verify email before accessing app
              try {
                await logout();
              } catch (e) { console.log('Auto signout after register:', e); }
              navigation.navigate('Login');
            }
          }
        ]
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
        <BackButton onPress={() => navigation.goBack()} style={styles.backBtn} />
        <Text style={styles.hEmoji}>🌱</Text>
        <Text style={styles.hTitle}>{t('register.title', { defaultValue: 'Create Account' })}</Text>
        <Text style={styles.hSub}>{t('register.subtitle', { defaultValue: 'Join F2C Today' })}</Text>
      </LinearGradient>

      {/* ════ WHITE CARD ════ */}
      <View style={styles.card}>

        {/* User type selector */}
        <Text style={styles.sLabel}>{t('login.whoAreYou', { defaultValue: 'Who are you?' })}</Text>
        <View style={styles.typeRow}>
          {[
            { type: 'consumer', emoji: '🛒', ta: t('login.consumer', { defaultValue: 'நுகர்வோர்' }), sub: t('login.buyFresh', { defaultValue: 'Buy fresh vegetables' }) },
            { type: 'farmer', emoji: '👨‍🌾', ta: t('login.farmer', { defaultValue: 'விவசாயி' }), sub: t('login.sellProducts', { defaultValue: 'Sell your products' }) },
            { type: 'delivery', emoji: '🚚', ta: t('login.delivery', { defaultValue: 'டெலிவரி' }), sub: t('login.deliverOrders', { defaultValue: 'Deliver orders' }) },
          ].map(item => (
            <TouchableOpacity
              key={item.type}
              style={[styles.typeCard, userType === item.type && styles.typeCardActive]}
              onPress={() => setUserType(item.type)}>
              <Text style={styles.typeEmoji}>{item.emoji}</Text>
              <Text style={[styles.typeLabel, userType === item.type && styles.typeLabelActive]} numberOfLines={1} adjustsFontSizeToFit>
                {item.ta}
              </Text>
              <Text style={styles.typeSub}>{item.sub}</Text>
              {userType === item.type && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Form Fields (state-ஐ individual set functions use பண்றோம்) ── */}
        <Field
          label={'👤 பெயர்\n    Full Name'}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCompleteType='name'
          textContentType='name'
        />
        <Field
          label={'📧 மின்னஞ்சல்\n    Email Address'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
          autoCompleteType='off'
          textContentType='none'
          autoCorrect={false}
        />
        <Field
          label={'📱 தொலைபேசி\n    Phone Number'}
          value={phone}
          onChangeText={text => setPhone(text.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          error={errors.phone}
          autoCompleteType='off'
          textContentType='none'
        />
        <Field
          label={'📍 இடம்\n    Location / City'}
          value={location}
          onChangeText={setLocation}
          error={errors.location}
          autoCompleteType='postal-code'
          textContentType='none'
        />
        <Field
          label={'🔒 கடவுச்சொல்\n    Password'}
          value={password}
          onChangeText={setPassword}
          secure
          showPass={showPass}
          onTogglePass={togglePass}
          error={errors.password}
          autoCompleteType='password-new'
          textContentType='newPassword'
        />
        <Field
          label={'🔒 கடவுச்சொல் உறுதி\n    Confirm Password'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
          showPass={showPass}
          onTogglePass={togglePass}
          error={errors.confirmPassword}
          autoCompleteType='password-new'
          textContentType='newPassword'
        />

        {/* Register Button */}
        <TouchableOpacity
          style={styles.regBtn}
          onPress={handleRegister}
          disabled={isLoading}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.regBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.regBtnText}>பதிவு செய்க / Register →</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>கணக்கு இருக்கிறதா? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>உள்நுழைக / Login</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingTop: 50, paddingBottom: 40, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: SPACING.xl },
  backText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
  },
  hEmoji: { fontSize: 44, marginBottom: 8 },
  hTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white },
  hSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

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

  typeRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  typeCard: {
    flex: 1, alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 2,
    borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  typeCardActive: { borderColor: COLORS.primaryGreen, backgroundColor: '#E8F5E9' },
  typeEmoji: { fontSize: 30, marginBottom: 4 },
  typeLabel: { fontSize: FONTS.md, fontWeight: FONTS.semiBold, color: COLORS.textSecondary },
  typeLabelActive: { color: COLORS.primaryGreen },
  typeSub: { fontSize: 9, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  checkBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.primaryGreen, alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: COLORS.white, fontSize: 10, fontWeight: FONTS.bold },

  fieldWrap: { marginBottom: SPACING.lg },
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
  fieldBoxErr: { borderColor: COLORS.error },
  fieldInput: { flex: 1, height: 50, fontSize: FONTS.md, color: COLORS.textPrimary },
  eyeIcon: { fontSize: 18, padding: 4 },
  errText: { fontSize: FONTS.xs, color: COLORS.error, marginTop: 4 },

  regBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  regBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  regBtnText: { color: COLORS.white, fontSize: FONTS.lg, fontWeight: FONTS.bold },

  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginPrompt: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  loginLink: { fontSize: FONTS.sm, color: COLORS.primaryGreen, fontWeight: FONTS.bold },
});

export default RegisterScreen;
