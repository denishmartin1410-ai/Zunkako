// ============================================================
// src/screens/auth/OTPScreen.js
// Real Firebase Phone OTP Authentication
// ============================================================

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../context/AuthContext';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

const OTPScreen = ({navigation, route}) => {
  const {phone, userType, name} = route.params;
  const {verifyOTP, sendOTP} = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmation, setConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(true); // Initially sending OTP
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  const inputs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ── App திறக்கும்போது OTP அனுப்பு ──
  useEffect(() => {
    handleSendOTP();
  }, []);

  // ── Timer countdown ──
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, canResend]);

  // ── OTP அனுப்பு ──
  const handleSendOTP = async () => {
    setIsSending(true);
    setError('');

    const result = await sendOTP(phone);
    setIsSending(false);

    if (result.success) {
      setConfirmation(result.confirmation);
      setTimer(30);
      setCanResend(false);
    } else {
      setError(result.error || 'OTP அனுப்ப முடியவில்லை');
      Alert.alert(
        'OTP பிழை',
        result.error || 'OTP அனுப்ப முடியவில்லை. மீண்டும் முயற்சி செய்யுங்கள்',
        [{text: 'சரி', onPress: () => navigation.goBack()}],
      );
    }
  };

  // ── OTP Box input handle ──
  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, ''); // Numbers மட்டும்
    setOtp(newOtp);
    setError('');

    // அடுத்த box-க்கு jump
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // 6 digits full → Auto verify
    if (newOtp.every(d => d !== '') && text) {
      handleVerify(newOtp.join(''));
    }
  };

  // ── Backspace handle ──
  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // ── Shake animation (wrong OTP-க்கு) ──
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

  // ── OTP Verify ──
  const handleVerify = async otpCode => {
    const code = otpCode || otp.join('');

    if (code.length < 6) {
      setError('6 இலக்க OTP உள்ளிடவும்');
      shake();
      return;
    }

    if (!confirmation) {
      setError('OTP உறுதிப்படுத்தப்படவில்லை. மீண்டும் அனுப்பவும்');
      return;
    }

    setIsLoading(true);
    setError('');

    // Real Firebase OTP verify
    const result = await verifyOTP(confirmation, code, userType, name);

    setIsLoading(false);

    if (!result.success) {
      shake();
      setError(result.error || 'தவறான OTP');
      // OTP boxes clear
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
    // Success: AuthContext automatically navigate பண்ணும் (auth state change)
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
    await handleSendOTP();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1565C0']} style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
        <View style={{alignItems: 'center', marginBottom: 8}}>
          <Feather name="smartphone" size={36} color={COLORS.white} />
        </View>
        <Text style={styles.title}>OTP சரிபார்ப்பு</Text>
        <Text style={styles.titleEn}>OTP Verification</Text>
        <Text style={styles.phoneTxt}>+91 {phone}</Text>
      </LinearGradient>

      <View style={styles.card}>
        {/* Sending indicator */}
        {isSending ? (
          <View style={styles.sendingBox}>
            <ActivityIndicator color={COLORS.primaryGreen} size="large" />
            <Text style={styles.sendingTxt}>OTP அனுப்புகிறோம்...</Text>
            <Text style={styles.sendingTxtEn}>Sending OTP...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.instruction}>6 இலக்க OTP-ஐ உள்ளிடவும்</Text>
            <Text style={styles.instructionEn}>
              Enter the 6-digit OTP sent to your phone
            </Text>

            {/* OTP Boxes */}
            <Animated.View
              style={[styles.otpRow, {transform: [{translateX: shakeAnim}]}]}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (inputs.current[index] = ref)}
                  style={[
                    styles.otpBox,
                    digit && styles.otpBoxFilled,
                    error && styles.otpBoxError,
                  ]}
                  value={digit}
                  onChangeText={text => handleOtpChange(text, index)}
                  onKeyPress={({nativeEvent}) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  caretHidden
                />
              ))}
            </Animated.View>

            {/* Error message */}
            {error ? (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8}}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.accentRed} style={{marginRight: 4}} />
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            ) : null}

            {/* Timer / Resend */}
            <View style={styles.timerBox}>
              {!canResend ? (
                <Text style={styles.timerTxt}>
                  மீண்டும் அனுப்ப: {timer} seconds / Resend in {timer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendTxt}>
                    OTP மீண்டும் அனுப்பு / Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => handleVerify()}
              disabled={isLoading || otp.some(d => !d)}>
              <LinearGradient
                colors={
                  otp.every(d => d)
                    ? COLORS.gradientButton
                    : ['#BDBDBD', '#9E9E9E']
                }
                style={styles.verifyGrad}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.verifyTxt}>
                    சரிபார்க்க / Verify OTP
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTxt}>
                OTP உங்கள் phone-க்கு SMS வரும்{'\n'}
                OTP will arrive via SMS
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  header: {
    paddingTop: 56,
    paddingBottom: 36,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  backBtn: {position: 'absolute', top: 52, left: SPACING.xl},
  backTxt: {color: COLORS.white, fontSize: FONTS.xxl, fontWeight: FONTS.bold},
  headerEmoji: {fontSize: 52, marginBottom: 8},
  title: {fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white},
  titleEn: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  phoneTxt: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semiBold,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    margin: SPACING.lg,
    padding: SPACING.xxl,
    marginTop: -20,
    ...SHADOWS.large,
  },

  sendingBox: {alignItems: 'center', paddingVertical: SPACING.xl},
  sendingTxt: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  sendingTxtEn: {fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 4},

  instruction: {
    fontSize: FONTS.md,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  instructionEn: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  otpBox: {
    width: 48,
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    fontSize: FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primaryGreen,
    backgroundColor: '#E8F5E9',
  },
  otpBoxError: {borderColor: COLORS.error},

  errorTxt: {
    fontSize: FONTS.sm,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontWeight: FONTS.semiBold,
  },

  timerBox: {alignItems: 'center', marginBottom: SPACING.xl},
  timerTxt: {fontSize: FONTS.sm, color: COLORS.textMuted},
  resendTxt: {
    fontSize: FONTS.md,
    color: COLORS.primaryBlue,
    fontWeight: FONTS.semiBold,
  },

  verifyBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  verifyGrad: {paddingVertical: 16, alignItems: 'center'},
  verifyTxt: {color: COLORS.white, fontSize: FONTS.lg, fontWeight: FONTS.bold},

  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryGreen,
  },
  infoTxt: {
    fontSize: FONTS.sm,
    color: COLORS.primaryGreenDark,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default OTPScreen;
