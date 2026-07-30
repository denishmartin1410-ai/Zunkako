// src/screens/farmer/StoryVideoScreen.js
// ✅ default export - FarmerNavigator crash fix!
// ✅ Video upload via Cloudinary

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../context/ThemeContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const StoryVideoScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const [farmStories, setFarmStories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const uid = user?.id || user?.uid;

  const loadStories = useCallback(async () => {
    if (!uid) {
      return;
    }
    setIsLoading(true);
    try {
      const {getFarmerStories} = require('../../services/firebase');
      const res = await getFarmerStories(uid);
      if (res.success && res.data) {
        setFarmStories(res.data);
      }
    } catch (e) {
      console.log('Error loading farm stories:', e);
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  React.useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handlePickVideo = async () => {
    try {
      const {launchImageLibrary} = require('react-native-image-picker');
      const result = await launchImageLibrary({
        mediaType: 'video',
        videoQuality: 'medium',
        durationLimit: 120, // 2 minutes max
      });

      if (result.didCancel || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const sizeInMB = (asset.fileSize || 0) / (1024 * 1024);

      if (sizeInMB > 50) {
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          t('story.videoTooLarge', {
            defaultValue: 'வீடியோ 50MB-க்கு கீழே இருக்கணும்',
          }),
        );
        return;
      }

      setIsUploading(true);

      // Cloudinary video upload
      const {
        uploadVideoToCloudinary,
      } = require('../../services/cloudinaryServices');
      const uploadResult = await uploadVideoToCloudinary(asset.uri);

      if (uploadResult.success) {
        const {addFarmStory} = require('../../services/firebase');
        await addFarmStory(uid, user?.name, uploadResult.url);
        setIsUploading(false);
        await loadStories();
        Alert.alert(
          '✅',
          t('story.videoUploaded', {
            defaultValue:
              'வீடியோ பதிவேற்றம் ஆகிவிட்டது! வாடிக்கையாளர்கள் பார்க்கலாம்!',
          }),
        );
      } else {
        setIsUploading(false);
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          uploadResult.error || 'Video upload failed',
        );
      }
    } catch (e) {
      setIsUploading(false);
      console.log('Video pick error:', e);
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  const handleDeleteVideo = async storyId => {
    Alert.alert(
      t('common.confirm', {defaultValue: 'உறுதிப்படுத்து'}),
      t('story.deleteConfirm', {defaultValue: 'வீடியோவை நீக்க வேண்டுமா?'}),
      [
        {text: t('common.cancel', {defaultValue: 'Cancel'}), style: 'cancel'},
        {
          text: t('common.yes', {defaultValue: 'Yes'}),
          onPress: async () => {
            try {
              setIsUploading(true);
              const {deleteFarmStory} = require('../../services/firebase');
              const res = await deleteFarmStory(storyId, uid);
              if (res.success) {
                await loadStories();
                Alert.alert(
                  '✅',
                  t('story.videoDeleted', {
                    defaultValue: 'வீடியோ வெற்றிகரமாக நீக்கப்பட்டது!',
                  }),
                );
              } else {
                Alert.alert('Error', res.error || 'Failed to delete video');
              }
            } catch (err) {
              console.log('Video delete error:', err);
              Alert.alert('Error', err.message);
            } finally {
              setIsUploading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          🎬 {t('farmer.myStory', {defaultValue: 'என் கதை வீடியோ'})}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? '#14251B' : '#E8F5E9',
              borderLeftColor: isDark ? '#4CAF50' : COLORS.primaryGreen,
            },
          ]}>
          <Text
            style={[
              styles.infoTitle,
              {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
            ]}>
            📹{' '}
            {t('story.title', {defaultValue: 'உங்கள் பண்ணை கதையை பகிருங்கள்!'})}
          </Text>
          <Text style={[styles.infoBody, {color: themeColors.subText}]}>
            {t('story.info', {
              defaultValue:
                '• உங்கள் பண்ணையை வீடியோவில் காட்டுங்கள்\n' +
                '• வாடிக்கையாளர்கள் நம்பிக்கையுடன் வாங்குவார்கள்\n' +
                '• அதிகபட்சம் 2 நிமிடம், 50MB\n' +
                '• கேலரியில் இருந்து வீடியோ தேர்வு பண்ணவும்',
            })}
          </Text>
        </View>

        {isUploading ? (
          <View
            style={[
              styles.videoCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: 1,
              },
            ]}>
            <View style={styles.uploadingBox}>
              <ActivityIndicator color={COLORS.primaryGreen} size="large" />
              <Text
                style={[styles.uploadingText, {color: themeColors.subText}]}>
                {t('story.uploading', {
                  defaultValue:
                    'வீடியோ பதிவேற்றம் ஆகுது... கொஞ்சம் காத்திருங்கள்',
                })}
              </Text>
            </View>
          </View>
        ) : farmStories.length > 0 ? (
          farmStories.map((item, index) => {
            const dateStr = item.createdAt?.toDate?.()
              ? item.createdAt.toDate().toLocaleDateString('ta-IN')
              : '';
            return (
              <View
                key={item.id || index}
                style={[
                  styles.videoCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                    marginBottom: 14,
                  },
                ]}>
                <View style={styles.videoPreview}>
                  <Text style={styles.videoEmoji}>🎬</Text>
                  <Text
                    style={[
                      styles.videoText,
                      {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                    ]}>
                    {t('story.videoReady', {defaultValue: 'Video ready!'})} #
                    {index + 1}
                  </Text>
                  {dateStr ? (
                    <Text
                      style={{
                        fontSize: 12,
                        color: themeColors.subText,
                        marginVertical: 2,
                      }}>
                      📅 {dateStr}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={[
                      styles.deleteBtn,
                      {
                        backgroundColor: isDark ? '#3D1C1F' : '#FFEBEE',
                        borderColor: isDark ? '#EF5350' : COLORS.accentRed,
                        marginTop: 10,
                      },
                    ]}
                    onPress={() => handleDeleteVideo(item.id)}>
                    <Text
                      style={[
                        styles.deleteBtnTxt,
                        {color: isDark ? '#FF9E9E' : COLORS.accentRed},
                      ]}>
                      🗑️{' '}
                      {t('story.deleteVideo', {
                        defaultValue: 'வீடியோவை நீக்கவும்',
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.videoCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: 1,
              },
            ]}>
            <View style={styles.noVideoBox}>
              <Text style={styles.noVideoEmoji}>📹</Text>
              <Text
                style={[styles.noVideoText, {color: themeColors.textMuted}]}>
                {t('story.noVideo', {
                  defaultValue: 'இன்னும் வீடியோ பதிவேற்றம் ஆகவில்லை',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Upload Button */}
        {!isUploading && (
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickVideo}>
            <LinearGradient
              colors={COLORS.gradientButton}
              style={styles.uploadGrad}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.uploadGradTxt || styles.uploadBtnTxt}>
                📤{' '}
                {t('story.uploadVideo', {
                  defaultValue: 'கேலரியில் இருந்து வீடியோ தேர்வு பண்ணவும்',
                })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {/* Tips */}
        <View
          style={[
            styles.tipsCard,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
              borderWidth: 1,
            },
          ]}>
          <Text style={[styles.tipsTitle, {color: themeColors.text}]}>
            💡 {t('story.tips', {defaultValue: 'Tips'})}
          </Text>
          {[
            t('story.tip1', {
              defaultValue: '🌅 காலை நேரத்தில் பண்ணையை வீடியோ எடுக்கவும்',
            }),
            t('story.tip2', {
              defaultValue: '🌿 உங்கள் பயிர்கள், அறுவடை செயல்முறையை காட்டவும்',
            }),
            t('story.tip3', {
              defaultValue: '😊 நேரடியாக கேமராவை பார்த்து பேசவும்',
            }),
            t('story.tip4', {
              defaultValue: '📱 கிடைமட்ட முறையில் வீடியோ எடுக்கவும்',
            }),
          ].map((tip, i) => (
            <Text
              key={i}
              style={[styles.tipText, {color: themeColors.subText}]}>
              {tip}
            </Text>
          ))}
        </View>

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
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: {
    color: COLORS.white,
    fontSize: rs(20),
    fontWeight: 'bold',
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {padding: SPACING.lg},
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryGreen,
  },
  infoTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    marginBottom: SPACING.sm,
  },
  infoBody: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    lineHeight: rs(22),
  },
  videoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
    minHeight: rs(160),
  },
  uploadingBox: {alignItems: 'center', paddingVertical: rs(20)},
  uploadingText: {
    fontSize: rs(FONTS.md),
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  videoPreview: {alignItems: 'center'},
  videoEmoji: {fontSize: rs(56), marginBottom: SPACING.sm},
  videoText: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  videoSub: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  changeBtn: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  changeBtnTxt: {
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
    fontSize: rs(FONTS.sm),
  },
  noVideoBox: {alignItems: 'center', paddingVertical: rs(20)},
  noVideoEmoji: {fontSize: rs(56), marginBottom: SPACING.sm},
  noVideoText: {
    fontSize: rs(FONTS.md),
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  uploadBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  uploadGrad: {paddingVertical: rs(16), alignItems: 'center'},
  uploadBtnTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
  },
  tipsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.small,
  },
  tipsTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  tipText: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    lineHeight: rs(24),
    marginBottom: 4,
  },
  deleteBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnTxt: {
    fontWeight: 'bold',
    fontSize: rs(FONTS.sm),
  },
});

// ✅ IMPORTANT: default export
export default StoryVideoScreen;
