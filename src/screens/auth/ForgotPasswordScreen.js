// ============================================================
// src/screens/auth/ForgotPasswordScreen.js
// ✅ Real Firebase password reset - WORKS!
// Email-க்கு reset link அனுப்பும்
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from '../../services/firebase';
import firestore from '@react-native-firebase/firestore';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import BackButton from '../../utils/BackButton';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert('⚠ பிழை / Error', '📧 மின்னஞ்சல் முகவரியை உள்ளிடவும்.\n\nPlease enter your email address.');
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      Alert.alert('⚠ பிழை / Error', '❌ சரியான மின்னஞ்சல் வடிவம் உள்ளிடவும்.\nஎ.கா: example@gmail.com\n\nPlease enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ CRITICAL: Check if email is registered in our Firestore users collection FIRST
      const trimmedEmail = email.trim().toLowerCase();
      const usersSnap = await firestore()
        .collection('users')
        .where('email', '==', trimmedEmail)
        .limit(1)
        .get();

      if (usersSnap.empty) {
        // Email NOT registered in our app - block reset
        setIsLoading(false);
        Alert.alert(
          '❌ கணக்கு இல்லை / No Account Found',
          'இந்த மின்னஞ்சலில் எந்த கணக்கும் பதிவு செய்யப்படவில்லை!\n\nமின்னஞ்சலை சரிபார்க்கவும் அல்லது புதிய கணக்கு உருவாக்கவும்.\n\nNo account found with this email. Please check or register a new account.',
          [
            { text: 'சரி / OK', style: 'cancel' },
            { text: '📝 புதிய கணக்கு', onPress: () => navigation.navigate('Register') }
          ]
        );
        return;
      }

      // Email EXISTS in our app - now send reset link
      const result = await sendPasswordResetEmail(trimmedEmail);
      setIsLoading(false);

      if (result.success) {
        setEmailSent(true);
      } else {
        Alert.alert('பிழை / Error', result.error);
      }
    } catch (e) {
      setIsLoading(false);
      Alert.alert('பிழை / Error', e.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      {/* Header */}
      <LinearGradient
        colors={['#0D5C32', '#1565C0']}
        style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 50, left: SPACING.xl }} />
        <Text style={styles.headerEmoji}>🔑</Text>
        <Text style={styles.headerTitle}>{t('forgot.title', { defaultValue: 'Reset Password' })}</Text>
        <Text style={styles.headerSub}>{t('forgot.subtitle', { defaultValue: 'We will send you a reset link' })}</Text>
      </LinearGradient>

      {/* Card */}
      <View style={styles.card}>
        {emailSent ? (
          // ✅ Success State
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>📧</Text>
            <Text style={styles.successTitle}>{t('forgot.successTitle', { defaultValue: 'Link Sent!' })}</Text>
            <Text style={styles.successSubTitle}>{t('forgot.successSub', { defaultValue: 'Email sent successfully!' })}</Text>
            <Text style={styles.successMsg}>
              <Text style={styles.boldEmail}>{email}</Text>
              {'\n\n'}என்ற மின்னஞ்சலுக்கு கடவுச்சொல் மீட்டமை லிங்க் அனுப்பப்பட்டது.{'\n\n'}
              Password reset link has been sent to your email.{'\n\n'}
              📌 Please check your spam folder as well!{'\n'}
            </Text>
            <TouchableOpacity
              style={styles.backToLoginBtn}
              onPress={() => navigation.navigate('Login')}>
              <LinearGradient
                colors={COLORS.gradientButton}
                style={styles.backToLoginGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.backToLoginTxt}>{t('forgot.backToLogin', { defaultValue: 'Back to Login' })}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // Email input form
          <>
            <Text style={styles.instruction}>
              {t('forgot.instruction', { defaultValue: 'Enter your registered email address. We will send you a password reset link.' })}
            </Text>

            {/* Email Field */}
            <Text style={styles.fieldLabel}>{t('login.emailLabel', { defaultValue: 'Email' })}</Text>
            <TextInput
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            {/* Send Button */}
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendLink}
              disabled={isLoading}>
              <LinearGradient
                colors={COLORS.gradientButton}
                style={styles.sendBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.sendBtnTxt}>{t('forgot.sendLink', { defaultValue: 'Send Reset Link' })}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.goBack()}>
              <Text style={styles.loginLinkTxt}>
                {t('forgot.backToLogin', { defaultValue: 'Back to Login' })}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50, paddingBottom: 40,
    paddingHorizontal: SPACING.xxl, alignItems: 'center',
  },
  backBtn: { position: 'absolute', top: 50, left: SPACING.xl },
  backTxt: { color: COLORS.white, fontSize: FONTS.xxl, fontWeight: FONTS.bold },
  headerEmoji: { fontSize: 52, marginBottom: 8 },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white },
  headerSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 28,
    margin: SPACING.lg, padding: SPACING.xxl,
    marginTop: -20, ...SHADOWS.large,
  },
  instruction: {
    fontSize: FONTS.sm, color: COLORS.textSecondary,
    lineHeight: 22, marginBottom: SPACING.xl, textAlign: 'center',
  },
  fieldLabel: {
    fontSize: FONTS.sm, fontWeight: FONTS.semiBold,
    color: COLORS.textSecondary, marginBottom: 8,
  },
  emailInput: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, height: 52,
    fontSize: FONTS.md, color: COLORS.textPrimary,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
    marginBottom: SPACING.xl,
  },
  sendBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.lg },
  sendBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  sendBtnTxt: { color: COLORS.white, fontSize: FONTS.lg, fontWeight: FONTS.bold },
  loginLink: { alignItems: 'center', paddingVertical: SPACING.md },
  loginLinkTxt: { color: COLORS.primaryBlue, fontSize: FONTS.md, fontWeight: FONTS.medium },
  // Success state
  successBox: { alignItems: 'center' },
  successEmoji: { fontSize: 72, marginBottom: SPACING.md },
  successTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.primaryGreen },
  successSubTitle: { fontSize: FONTS.md, color: COLORS.textMuted, marginBottom: SPACING.lg },
  successMsg: { fontSize: FONTS.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl },
  boldEmail: { fontWeight: FONTS.bold, color: COLORS.primaryGreen },
  backToLoginBtn: { borderRadius: RADIUS.md, overflow: 'hidden', width: '100%' },
  backToLoginGrad: { paddingVertical: 14, alignItems: 'center' },
  backToLoginTxt: { color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold },
});

export default ForgotPasswordScreen;
