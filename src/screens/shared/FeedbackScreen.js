// ============================================================
// src/screens/shared/FeedbackScreen.js
// ============================================================

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../context/ThemeContext';
import firestore from '@react-native-firebase/firestore';
import {useAuth} from '../../context/AuthContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const FeedbackScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);

  const [activeTab, setActiveTab] = useState(null); // 'voice' | 'write' | null
  const [writtenText, setWrittenText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [hasVoiceRecorded, setHasVoiceRecorded] = useState(false);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [attachmentUri, setAttachmentUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  // Pulsing animation for active recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, pulseAnim]);

  const handleRecordPress = () => {
    if (!isRecording) {
      // Start recording simulation
      setIsRecording(true);
      setRecordDuration(0);
      setHasVoiceRecorded(false);
    } else {
      // Stop recording simulation
      setIsRecording(false);
      if (recordDuration > 0) {
        setHasVoiceRecorded(true);
      }
    }
  };

  const handleAttachmentToggle = () => {
    if (hasAttachment) {
      Alert.alert(
        t('feedback.attachmentOptions', {defaultValue: 'Attachment Options'}),
        t('feedback.attachmentAction', {
          defaultValue: 'What would you like to do with the attached file?',
        }),
        [
          {
            text: t('feedback.remove', {defaultValue: 'Remove'}),
            onPress: () => {
              setHasAttachment(false);
              setAttachmentUri(null);
              Alert.alert(
                t('common.success', {defaultValue: 'Success'}),
                t('feedback.removedAttachment', {
                  defaultValue: 'Attachment removed.',
                }),
              );
            },
            style: 'destructive',
          },
          {
            text: t('feedback.replace', {defaultValue: 'Replace'}),
            onPress: pickImage,
          },
          {
            text: t('common.cancel', {defaultValue: 'Cancel'}),
            style: 'cancel',
          },
        ],
      );
    } else {
      pickImage();
    }
  };

  const pickImage = async () => {
    try {
      const {launchImageLibrary} = require('react-native-image-picker');
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      setAttachmentUri(asset.uri);
      setHasAttachment(true);

      Alert.alert(
        t('common.success', {defaultValue: 'Success'}),
        t('feedback.attachedSuccess', {
          defaultValue: 'Screenshot attached successfully!',
        }),
      );
    } catch (e) {
      console.log('Image pick error:', e);
      Alert.alert('Error', e.message);
    }
  };

  const formatDuration = sec => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let fileUrl = null;

      // 1. Upload attachment to Cloudinary if it exists
      if (hasAttachment && attachmentUri) {
        const {
          uploadImageToCloudinary,
        } = require('../../services/cloudinaryServices');
        const uploadRes = await uploadImageToCloudinary(
          attachmentUri,
          'feedbacks',
        );
        if (uploadRes.success) {
          fileUrl = uploadRes.url;
        } else {
          Alert.alert(
            t('common.error', {defaultValue: 'Error'}),
            t('feedback.uploadFailed', {
              defaultValue: 'Failed to upload screenshot.',
            }) +
              '\n' +
              uploadRes.error,
          );
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Submit feedback to Firestore
      await firestore()
        .collection('feedbacks')
        .add({
          userId: user?.id || user?.uid || 'anonymous',
          userName: user?.name || 'Anonymous User',
          userEmail: user?.email || '',
          userPhone: user?.phone || '',
          userType: user?.userType || 'consumer',
          type: activeTab, // 'voice' | 'write'
          content: activeTab === 'write' ? writtenText : 'Voice Feedback',
          voiceDuration: activeTab === 'voice' ? recordDuration : null,
          attachmentUrl: fileUrl || null,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setIsSubmitting(false);
      Alert.alert(
        t('common.success', {defaultValue: 'Success'}),
        t('feedback.success', {
          defaultValue: 'Thank you for your feedback! Submitted to Admin.',
        }),
        [
          {
            text: t('common.ok', {defaultValue: 'OK'}),
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (e) {
      setIsSubmitting(false);
      console.log('Feedback submission error:', e);
      Alert.alert(
        t('common.error', {defaultValue: 'Error'}),
        e.message || 'Failed to submit feedback',
      );
    }
  };

  const isSubmitDisabled = !writtenText.trim() && !hasVoiceRecorded;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          {t('feedback.title', {defaultValue: 'Give Feedback'})}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.mainTitle, {color: themeColors.text}]}>
          {t('feedback.title', {
            defaultValue: "We'd love to hear your feedback",
          })}
        </Text>
        <Text style={[styles.subtitle, {color: themeColors.subText || '#666'}]}>
          {t('feedback.subtitle', {
            defaultValue: 'Tell us more by recording or writing your feedback',
          })}
        </Text>

        {/* Tab Selection */}
        <View style={styles.tabsRow}>
          {/* Voice Feedback Tab */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor:
                  activeTab === 'voice'
                    ? COLORS.primaryGreen
                    : themeColors.border,
              },
            ]}
            onPress={() => {
              setActiveTab('voice');
              setIsRecording(false);
            }}>
            <Text style={styles.tabIcon}>🎙️</Text>
            <Text style={[styles.tabLabel, {color: themeColors.text}]}>
              {t('feedback.record', {defaultValue: 'Record Your Feedback'})}
            </Text>
          </TouchableOpacity>

          {/* Write Feedback Tab */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor:
                  activeTab === 'write'
                    ? COLORS.primaryGreen
                    : themeColors.border,
              },
            ]}
            onPress={() => {
              setActiveTab('write');
              setIsRecording(false);
            }}>
            <Text style={styles.tabIcon}>📝</Text>
            <Text style={[styles.tabLabel, {color: themeColors.text}]}>
              {t('feedback.write', {defaultValue: 'Write Your Feedback'})}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENTS */}
        {activeTab === 'voice' && (
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}>
            <View style={styles.recordSection}>
              {isRecording ? (
                <Animated.View
                  style={[
                    styles.pulseCircle,
                    {transform: [{scale: pulseAnim}]},
                  ]}
                />
              ) : null}
              <TouchableOpacity
                style={[
                  styles.recordBtn,
                  {
                    backgroundColor: isRecording
                      ? '#E57373'
                      : COLORS.primaryGreen,
                  },
                ]}
                onPress={handleRecordPress}>
                <Text style={styles.recordBtnText}>
                  {isRecording ? '⏹️' : '🎙️'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.durationText, {color: themeColors.text}]}>
                {isRecording
                  ? formatDuration(recordDuration)
                  : hasVoiceRecorded
                  ? '✅ ' + t('common.success')
                  : '0:00'}
              </Text>
              <Text style={[styles.statusText, {color: themeColors.subText}]}>
                {isRecording
                  ? t('feedback.recording', {defaultValue: 'Recording...'})
                  : hasVoiceRecorded
                  ? t('feedback.recordedSuccess', {
                      defaultValue: 'Voice recording captured.',
                    })
                  : t('feedback.tapToRecord', {
                      defaultValue: 'Tap to start recording',
                    })}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'write' && (
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: isDark ? '#222' : '#F9F9F9',
                  borderColor: themeColors.border,
                },
              ]}
              multiline
              numberOfLines={6}
              placeholder={t('feedback.placeholder', {
                defaultValue: 'Write your feedback here...',
              })}
              placeholderTextColor={isDark ? '#777' : '#999'}
              value={writtenText}
              onChangeText={setWrittenText}
            />
          </View>
        )}

        {/* Attachment Optional (Available if a tab is chosen) */}
        {activeTab && (
          <TouchableOpacity
            style={[
              styles.attachmentRow,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: hasAttachment
                  ? COLORS.primaryGreen
                  : themeColors.border,
              },
            ]}
            onPress={handleAttachmentToggle}>
            <Text style={styles.attachmentIcon}>
              {hasAttachment ? '✅' : '📎'}
            </Text>
            <Text style={[styles.attachmentText, {color: themeColors.text}]}>
              {t('feedback.attach', {
                defaultValue: 'Attach Screenshot / Document (Optional)',
              })}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Submit Button */}
      {activeTab && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: themeColors.cardBg,
              borderTopColor: themeColors.border,
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              isSubmitDisabled && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled || isSubmitting}>
            <Text style={styles.submitBtnText}>
              {isSubmitting
                ? t('common.loading', {defaultValue: 'Loading...'})
                : t('feedback.submit', {defaultValue: 'Submit Feedback'})}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollBody: {
    padding: SPACING.lg,
    paddingBottom: rs(100),
  },
  mainTitle: {
    fontSize: rs(20),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: rs(14),
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: rs(20),
  },
  tabsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  tabCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  tabIcon: {
    fontSize: rs(32),
    marginBottom: SPACING.sm,
  },
  tabLabel: {
    fontSize: rs(13),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  recordSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: 'rgba(229, 115, 115, 0.4)',
    top: SPACING.lg - 4,
  },
  recordBtn: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    marginBottom: SPACING.md,
  },
  recordBtnText: {
    fontSize: rs(24),
    color: COLORS.white,
  },
  durationText: {
    fontSize: rs(18),
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: rs(FONTS.sm),
    textAlign: 'center',
  },
  textInput: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: rs(14),
    textAlignVertical: 'top',
    minHeight: rs(140),
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  attachmentIcon: {
    fontSize: rs(18),
    marginRight: SPACING.sm,
  },
  attachmentText: {
    fontSize: rs(13),
    fontWeight: '500',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.lg,
  },
  submitBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.lg,
    paddingVertical: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: rs(16),
    fontWeight: 'bold',
  },
});

export default FeedbackScreen;
